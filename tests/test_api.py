import pytest
import pytest_asyncio # For async fixtures
from httpx import AsyncClient
from tortoise import Tortoise

# Import the FastAPI app and TORTOISE_ORM config
# The app needs to be accessible for the AsyncClient
# Adjust path if your app instance is named differently or located elsewhere
from src.backend.main import app, TORTOISE_ORM
from src.backend.models import Product # To check data directly if needed

# Use a separate test database configuration
# This is crucial to avoid polluting the development database.
TEST_DATABASE_URL = "sqlite://:memory:"
# To use a file-based SQLite for inspection:
# TEST_DATABASE_URL = "sqlite://test_db.sqlite3"


@pytest_asyncio.fixture(scope="session")
def event_loop():
    # Ensures that all async tests in the session run in the same event loop.
    # pytest-asyncio usually handles this, but explicit definition can be useful for Tortoise.
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_db(event_loop): # event_loop fixture is injected
    """
    Initialize the test database before any tests run in the session.
    And clean up after all tests in the session are done.
    """
    original_db_url = TORTOISE_ORM["connections"]["default"]
    TORTOISE_ORM["connections"]["default"] = TEST_DATABASE_URL

    # Modify TORTOISE_ORM for tests: ensure we are not using aerich.models if it causes issues
    # and explicitly list only application models for schema generation in test context.
    test_orm_config = TORTOISE_ORM.copy()
    test_orm_config["apps"]["models"]["models"] = ["src.backend.models"] # Only app models for tests

    try:
        await Tortoise.init(
            config=test_orm_config, # Use the modified config
        )
        # generate_schemas=True will create tables based on models
        await Tortoise.generate_schemas(safe=True)
        print(f"Test database initialized at {TEST_DATABASE_URL} with schemas generated.")
        yield # This is where the tests will run
    finally:
        await Tortoise.close_connections()
        print("Test database connections closed.")

        TORTOISE_ORM["connections"]["default"] = original_db_url # Restore original URL

        # Optional: Clean up file-based test DB
        # import os
        # if TEST_DATABASE_URL.startswith("sqlite://") and ":memory:" not in TEST_DATABASE_URL:
        #     db_file = TEST_DATABASE_URL.split("sqlite://")[1]
        #     if os.path.exists(db_file):
        #         os.remove(db_file)
        #         print(f"Test database file {db_file} removed.")


@pytest_asyncio.fixture()
async def client() -> AsyncClient:
    """
    Provides an HTTPX AsyncClient for making requests to the FastAPI app.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_root_path(client: AsyncClient):
    """Test the root path to ensure the API is responsive."""
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Product Data Manager API. See /docs for API documentation."}


@pytest.mark.asyncio
async def test_create_product(client: AsyncClient):
    """
    Test creating a new product via the API.
    """
    await Product.all().delete() # Ensure clean state for this specific test logic

    product_data = {
        "name": "Test Product API",
        "ref": "TP-API-001",
        "description": "A product created via API test."
    }
    response = await client.post("/products/", json=product_data)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}"

    response_data = response.json()
    assert response_data["name"] == product_data["name"]
    assert response_data["ref"] == product_data["ref"]
    assert response_data["description"] == product_data["description"]
    assert "id" in response_data

    created_product_id = response_data["id"]
    db_product = await Product.get_or_none(id=created_product_id)
    assert db_product is not None
    assert db_product.name == product_data["name"]

@pytest.mark.asyncio
async def test_list_products_empty(client: AsyncClient):
    """
    Test listing products when the database is empty.
    """
    await Product.all().delete() # Clean products table specifically for this test

    response = await client.get("/products/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_products_with_data(client: AsyncClient):
    """
    Test listing products when there is data.
    """
    await Product.all().delete() # Clean before adding test-specific data

    p1_data = {"name": "Product A", "ref": "PA001"}
    p2_data = {"name": "Product B", "ref": "PB002", "description": "Desc B"}
    await Product.create(**p1_data)
    await Product.create(**p2_data)

    response = await client.get("/products/")
    assert response.status_code == 200
    products_list = response.json()
    assert len(products_list) == 2

    # Check for presence of products - order might not be guaranteed by default
    response_names = {p["name"] for p in products_list}
    assert p1_data["name"] in response_names
    assert p2_data["name"] in response_names


@pytest.mark.asyncio
async def test_get_product_not_found(client: AsyncClient):
    """
    Test retrieving a non-existent product.
    """
    response = await client.get("/products/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Product 99999 not found"

@pytest.mark.asyncio
async def test_get_existing_product(client: AsyncClient):
    """
    Test retrieving an existing product by its ID.
    """
    await Product.all().delete()
    product = await Product.create(name="Existing Product", ref="EP001", description="Details here")

    response = await client.get(f"/products/{product.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product.id
    assert data["name"] == "Existing Product"
    assert data["ref"] == "EP001"
    # By default, the /products/{product_id} endpoint should also return documents.
    # The ProductWithDocuments model is used.
    assert "documents" in data
    assert data["documents"] == [] # No documents created for this product yet

# TODO: Add more tests:
# - Test product update (PUT /products/{product_id})
# - Test product deletion (DELETE /products/{product_id})
# - Test product search functionality (GET /products/?search=...)
# - Test document upload (POST /documents/upload/product/{product_id}) - requires file mocking/handling
# - Test adding document URL (POST /documents/url/product/{product_id})
# - Test document deletion (DELETE /documents/{document_id})
# - Test import functionality (POST /import/products-file/) - requires file mocking

EOF
