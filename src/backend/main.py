import os
import shutil # For file operations
from typing import List, Optional

import aiofiles # For async file operations
from fastapi import APIRouter, FastAPI, File, HTTPException, UploadFile, Form, Query, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles # To serve media files
from fastapi.middleware.cors import CORSMiddleware # Added for CORS
from pydantic import BaseModel

from src.backend.import_utils import import_products_from_file_content # For bulk import

from tortoise.contrib.fastapi import register_tortoise
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.expressions import Q # Make sure Q is imported for search queries

# Import models and Pydantic schemas
from src.backend.models import Document, Product, Document_Pydantic, DocumentIn_Pydantic, Product_Pydantic, ProductIn_Pydantic
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def read_root():
    return {"Hello": "World"}
# Define base directory for media files
BASE_MEDIA_DIR = "media"
os.makedirs(BASE_MEDIA_DIR, exist_ok=True) # Ensure media directory exists

app = FastAPI(
    title="Product Data Manager API",
    description="API for managing products and their associated documents.",
    version="0.1.0"
)

# CORS Middleware Configuration
# This should be placed before routers and static file mounts if possible,
# though FastAPI is generally flexible.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Adjust to your frontend URL
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# Mount static directory to serve media files
app.mount("/media", StaticFiles(directory=BASE_MEDIA_DIR), name="media")

# Tortoise ORM Configuration (same as before)
TORTOISE_ORM = {
    "connections": {"default": "sqlite://db.sqlite3"},
    "apps": {
        "models": {
            "models": ["src.backend.models", "aerich.models"], # Ensure this path is correct for your project structure
            "default_connection": "default",
        }
    },
}

register_tortoise(
    app,
    config=TORTOISE_ORM,
    generate_schemas=True, # Set to False in production if using migrations
    # add_exception_handlers=True, # Useful for debugging
)

# --- Product CRUD Endpoints ---

product_router = APIRouter(prefix="/products", tags=["Products"])

@product_router.post("/", response_model=Product_Pydantic)
async def create_product(product_in: ProductIn_Pydantic):
    """
    Create a new product.
    """
    try:
        product = await Product.create(**product_in.model_dump(exclude_unset=True))
    except IntegrityError as e: # Catch potential unique constraint violations if any
        raise HTTPException(status_code=400, detail=f"Database integrity error: {e}")
    return await Product_Pydantic.from_tortoise_orm(product)

@product_router.get("/", response_model=List[Product_Pydantic])
async def list_products(
    search: Optional[str] = Query(None, description="Search term for product name or reference")
):
    """
    List all products, with optional search.
    """
    if search:
        products = await Product.filter(
            Q(name__icontains=search) | Q(ref__icontains=search)
        ).all()
    else:
        products = await Product.all()
    return [await Product_Pydantic.from_tortoise_orm(p) for p in products]

# Define a Pydantic model for the response that includes documents explicitly
class ProductWithDocuments(Product_Pydantic):
    documents: List[Document_Pydantic] = []

@product_router.get("/{product_id}", response_model=ProductWithDocuments)
async def get_product(product_id: int):
    """
    Retrieve a single product by its ID, including its associated documents.
    """
    try:
        product = await Product.get(id=product_id).prefetch_related('documents')
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    product_data = await Product_Pydantic.from_tortoise_orm(product)
    docs_data = [await Document_Pydantic.from_tortoise_orm(doc) for doc in product.documents]

    # Create the response using ProductWithDocuments
    response = ProductWithDocuments(
        **product_data.model_dump(),
        documents=[doc for doc in docs_data]
    )
    return response


@product_router.put("/{product_id}", response_model=Product_Pydantic)
async def update_product(product_id: int, product_in: ProductIn_Pydantic):
    """
    Update an existing product.
    """
    try:
        await Product.filter(id=product_id).update(**product_in.model_dump(exclude_unset=True))
        product = await Product.get(id=product_id) # Fetch the updated product
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    except IntegrityError as e:
        raise HTTPException(status_code=400, detail=f"Database integrity error: {e}")
    return await Product_Pydantic.from_tortoise_orm(product)

@product_router.delete("/{product_id}", response_model=dict)
async def delete_product(product_id: int):
    """
    Delete a product. Associated documents will also be deleted due to CASCADE.
    Files in media/ will NOT be automatically deleted by this basic setup.
    Consider implementing file deletion for associated documents if required.
    """
    # First, retrieve documents to find associated files that might need deletion
    try:
        product_with_docs = await Product.get(id=product_id).prefetch_related('documents')
        docs_to_delete = product_with_docs.documents
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    # Attempt to delete files associated with the product's documents
    for doc in docs_to_delete:
        if doc.path_or_url.startswith(BASE_MEDIA_DIR) and not doc.path_or_url.startswith(("http://", "https://")):
            if os.path.exists(doc.path_or_url):
                try:
                    os.remove(doc.path_or_url)
                    # Try to remove empty parent directories
                    parent_dir = os.path.dirname(doc.path_or_url)
                    if parent_dir != BASE_MEDIA_DIR and not os.listdir(parent_dir): # product_X/type
                        os.rmdir(parent_dir)
                        grandparent_dir = os.path.dirname(parent_dir) # product_X
                        if grandparent_dir != BASE_MEDIA_DIR and not os.listdir(grandparent_dir) and f"product_{product_id}" in grandparent_dir:
                            os.rmdir(grandparent_dir)
                except OSError as e:
                    print(f"Warning: Could not delete file {doc.path_or_url} or empty parent dir: {e}")
                    # Decide if this should be a hard error or just a warning

    # Delete the product (documents are cascade deleted by DB)
    deleted_count = await Product.filter(id=product_id).delete()
    if not deleted_count:
        # Should not happen if retrieval was successful
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found during deletion attempt")

    return {"message": f"Product {product_id} and its associated documents and files deleted successfully"}


# --- Document CRUD Endpoints ---

document_router = APIRouter(prefix="/documents", tags=["Documents"])

async def save_upload_file(upload_file: UploadFile, product_id: int, doc_type: str) -> str:
    """Saves an uploaded file to the media directory and returns its path relative to project root."""
    filename = os.path.basename(upload_file.filename or "unknown_file")
    # Sanitize filename further if needed, e.g., using a library like python-slugify for more robust sanitization.

    product_media_dir = os.path.join(BASE_MEDIA_DIR, f"product_{product_id}", doc_type)
    os.makedirs(product_media_dir, exist_ok=True)

    file_path = os.path.join(product_media_dir, filename)

    counter = 1
    original_filepath = file_path
    # Ensure unique filename by appending counter if file exists
    while os.path.exists(file_path):
        name, ext = os.path.splitext(original_filepath)
        file_path = f"{name}_{counter}{ext}"
        counter += 1

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await upload_file.read()
            await out_file.write(content)
    except Exception as e:
        if os.path.exists(file_path): # Clean up if partial write occurred
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    finally:
        await upload_file.close()

    return file_path # Path relative to project root, e.g., "media/product_1/pdf/report.pdf"

@document_router.post("/upload/product/{product_id}", response_model=Document_Pydantic)
async def upload_document_for_product(
    product_id: int,
    file: UploadFile = File(...),
    doc_type: str = Form(...), # e.g., 'excel', 'image', 'pdf'
    label: Optional[str] = Form(None)
):
    try:
        product = await Product.get(id=product_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    allowed_doc_types = ["excel", "image", "pdf", "other"] # Add more specific types if needed
    if doc_type not in allowed_doc_types:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Allowed: {', '.join(allowed_doc_types)}")

    saved_file_path = await save_upload_file(file, product_id, doc_type)

    try:
        document = await Document.create(
            product=product,
            type=doc_type,
            path_or_url=saved_file_path, # Stored as "media/product_X/type/filename.ext"
            label=label or os.path.basename(saved_file_path)
        )
    except IntegrityError as e:
        if os.path.exists(saved_file_path): # Cleanup uploaded file if DB fails
            os.remove(saved_file_path)
        raise HTTPException(status_code=400, detail=f"DB error creating document: {e}")

    return await Document_Pydantic.from_tortoise_orm(document)

@document_router.post("/url/product/{product_id}", response_model=Document_Pydantic)
async def add_document_url_for_product(
    product_id: int,
    url: str = Form(...),
    doc_type: str = Form(...),
    label: Optional[str] = Form(None)
):
    try:
        product = await Product.get(id=product_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    if not (url.startswith("http://") or url.startswith("https://")): # Basic URL validation
        raise HTTPException(status_code=400, detail="Invalid URL. Must start with http:// or https://")

    try:
        document = await Document.create(
            product=product, type=doc_type, path_or_url=url, label=label or url
        )
    except IntegrityError as e:
        raise HTTPException(status_code=400, detail=f"DB error creating document URL: {e}")

    return await Document_Pydantic.from_tortoise_orm(document)

@document_router.get("/product/{product_id}", response_model=List[Document_Pydantic])
async def list_documents_for_product(product_id: int):
    if not await Product.exists(id=product_id):
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    documents = await Document.filter(product_id=product_id).all()
    return [await Document_Pydantic.from_tortoise_orm(doc) for doc in documents]

@document_router.get("/{document_id}", response_model=Document_Pydantic)
async def get_document(document_id: int):
    try:
        document = await Document.get(id=document_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")
    return await Document_Pydantic.from_tortoise_orm(document)

@document_router.delete("/{document_id}", response_model=dict)
async def delete_document(document_id: int):
    try:
        document = await Document.get(id=document_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")

    file_path_to_delete = None
    # Check if it's a local file path (not a URL) and construct full path
    if document.path_or_url.startswith(BASE_MEDIA_DIR) and not document.path_or_url.startswith(("http://", "https://")):
        file_path_to_delete = document.path_or_url

    deleted_count = await Document.filter(id=document_id).delete()
    if not deleted_count:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found for deletion")

    if file_path_to_delete and os.path.exists(file_path_to_delete):
        try:
            os.remove(file_path_to_delete)
            # Attempt to remove empty parent directories
            parent_dir = os.path.dirname(file_path_to_delete) # e.g. media/product_X/type
            if parent_dir != BASE_MEDIA_DIR and not os.listdir(parent_dir):
                os.rmdir(parent_dir)
                grandparent_dir = os.path.dirname(parent_dir) # e.g. media/product_X
                # Ensure it's a product-specific directory before removing
                if grandparent_dir != BASE_MEDIA_DIR and not os.listdir(grandparent_dir) and "product_" in os.path.basename(grandparent_dir):
                     os.rmdir(grandparent_dir)
        except OSError as e:
            print(f"Warning: Could not delete file {file_path_to_delete} or empty dir: {e}")
            return {"message": f"Document {document_id} deleted from DB, but file/dir cleanup failed for {file_path_to_delete}."}

    return {"message": f"Document {document_id} deleted successfully"}

app.include_router(product_router)
app.include_router(document_router)

# --- Import Router ---
import_router = APIRouter(prefix="/import", tags=["Import"])

@import_router.post("/products-file/", summary="Import Products from Excel/CSV File")
async def upload_products_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Excel (.xlsx) or CSV (.csv) file containing product data.")
):
    """
    Upload a file to import products. The import process runs in the background.
    The file should have columns like 'Product Name', 'Reference', 'Description'.
    (See `src/backend/import_utils.py` for column name variations).
    - **Name (Mandatory)**: Product's name.
    - **Reference (Optional)**: Product's reference or SKU.
    - **Description (Optional)**: Product's description.

    Products are identified by their 'Name'. If a product with the same name
    already exists, its Reference and Description will be updated if new values
    are provided in the file. New products will be created.
    """
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".csv")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .xlsx or .csv allowed.")

    file_content = await file.read()
    await file.close() # Close the file after reading its content

    # Add the import task to background
    background_tasks.add_task(import_products_from_file_content, file_content, file.filename)

    return {"message": f"File '{file.filename}' received. Products import is processing in the background. Results (created, updated, skipped) will be logged by the server."}

app.include_router(import_router)

@app.get("/")
async def read_root_message(): # Renamed to avoid conflict with router's root
    return {"message": "Welcome to the Product Data Manager API. See /docs for API documentation."}
