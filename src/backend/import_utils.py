import csv
import io
from typing import List, Dict, Any, AsyncGenerator
import openpyxl # For .xlsx files
from fastapi import HTTPException

from src.backend.models import Product, ProductIn_Pydantic # Assuming Pydantic model for creation

# Define expected column names (case-insensitive matching)
# These can be customized or made more flexible
EXPECTED_COLUMNS = {
    'name': ['product name', 'name', 'title', 'product title'],
    'ref': ['reference', 'ref', 'sku', 'product id'],
    'description': ['description', 'desc', 'details', 'product description']
}

def find_column_indices(header: List[str]) -> Dict[str, int]:
    """
    Identifies the indices of expected columns in the header row.
    Performs case-insensitive matching.
    """
    indices = {}
    normalized_header = [str(h).lower() if h is not None else '' for h in header] # Ensure h is string

    for key, potential_names in EXPECTED_COLUMNS.items():
        found = False
        for p_name in potential_names:
            try:
                indices[key] = normalized_header.index(p_name.lower())
                found = True
                break
            except ValueError:
                continue
        if not found:
            print(f"Warning: Column for '{key}' not found in header: {header}")
            indices[key] = -1

    if indices.get('name', -1) == -1:
        raise HTTPException(
            status_code=400,
            detail=f"Mandatory column 'Product Name' (or similar like {EXPECTED_COLUMNS['name']}) not found in Excel/CSV header."
        )
    return indices

async def parse_excel_file(file_content: bytes) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Parses an Excel file (.xlsx) content and yields rows as dictionaries.
    """
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(file_content), read_only=True)
        sheet = workbook.active

        if sheet is None:
            raise HTTPException(status_code=400, detail="No active sheet found in Excel file.")

        header_cells = sheet[1] # First row as header
        header = [cell.value for cell in header_cells]
        if not header or not any(h for h in header if h is not None): # Check if all header cells are None or empty
             raise HTTPException(status_code=400, detail="Excel file header row is empty or missing.")

        col_indices = find_column_indices(header)

        for row_idx, row_cells in enumerate(sheet.iter_rows(min_row=2)): # Skip header
            row = [cell.value for cell in row_cells]
            if not any(c for c in row if c is not None): # Skip if all cells in row are None
                continue

            product_data = {}
            # Use .get(col_indices['name']) to safely access, check if index is valid first
            name_val = row[col_indices['name']] if col_indices.get('name', -1) != -1 and col_indices['name'] < len(row) else None

            if not name_val:
                print(f"Skipping Excel row {row_idx + 2} due to missing product name.")
                continue

            product_data['name'] = str(name_val)
            if col_indices.get('ref', -1) != -1 and col_indices['ref'] < len(row) and row[col_indices['ref']] is not None:
                product_data['ref'] = str(row[col_indices['ref']])
            if col_indices.get('description', -1) != -1 and col_indices['description'] < len(row) and row[col_indices['description']] is not None:
                product_data['description'] = str(row[col_indices['description']])

            yield product_data

    except HTTPException: # Re-raise HTTPException
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing Excel file: {e}")


async def parse_csv_file(file_content: bytes) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Parses a CSV file content and yields rows as dictionaries.
    """
    try:
        try:
            content_str = file_content.decode('utf-8-sig') # UTF-8 with BOM
        except UnicodeDecodeError:
            try:
                content_str = file_content.decode('utf-8')
            except UnicodeDecodeError:
                content_str = file_content.decode('latin-1') # Fallback

        reader = csv.reader(io.StringIO(content_str))
        header = next(reader, None)

        if not header or not any(header):
            raise HTTPException(status_code=400, detail="CSV file header row is empty or missing.")

        col_indices = find_column_indices(header)

        for row_idx, row in enumerate(reader):
            if not any(row):
                continue

            product_data = {}
            name_val = row[col_indices['name']] if col_indices.get('name', -1) != -1 and col_indices['name'] < len(row) else None

            if not name_val:
                print(f"Skipping CSV row {row_idx + 2} due to missing product name.")
                continue

            product_data['name'] = str(name_val)
            if col_indices.get('ref', -1) != -1 and col_indices['ref'] < len(row) and row[col_indices['ref']] is not None:
                product_data['ref'] = str(row[col_indices['ref']])
            if col_indices.get('description', -1) != -1 and col_indices['description'] < len(row) and row[col_indices['description']] is not None:
                product_data['description'] = str(row[col_indices['description']])

            yield product_data

    except HTTPException: # Re-raise HTTPException
        raise
    except csv.Error as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV file: {e}")


async def import_products_from_file_content(file_content: bytes, filename: str) -> Dict[str, Any]:
    """
    Orchestrates parsing and importing products using get_or_create.
    Returns a summary of imported/created and updated/skipped products.
    """
    created_count = 0
    updated_count = 0
    skipped_count = 0 # For rows with errors or missing mandatory fields after header processing

    if filename.endswith('.xlsx'):
        parser = parse_excel_file(file_content)
    elif filename.endswith('.csv'):
        parser = parse_csv_file(file_content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only .xlsx and .csv are supported.")

    async for product_data in parser:
        try:
            # ProductIn_Pydantic might be useful here if you have complex validation/defaults
            # that are not directly mapped from columns or need pre-processing.
            # For simple cases, direct dict is fine.

            product_defaults = {
                'ref': product_data.get('ref'),
                'description': product_data.get('description')
            }
            # Filter out None values from defaults to avoid overwriting existing fields with None
            product_defaults = {k: v for k, v in product_defaults.items() if v is not None}

            obj, created = await Product.get_or_create(
                name=product_data['name'],
                defaults=product_defaults
            )

            if created:
                created_count += 1
            else:
                # If not created, it means product with this name already existed.
                # Update it with new data if provided, only if different.
                updated = False
                if product_defaults.get('ref') is not None and obj.ref != product_defaults['ref']:
                    obj.ref = product_defaults['ref']
                    updated = True
                if product_defaults.get('description') is not None and obj.description != product_defaults['description']:
                    obj.description = product_defaults['description']
                    updated = True

                if updated:
                    await obj.save()
                    updated_count += 1
                else:
                    # Name matched, and other fields were either not provided or same as existing.
                    # Consider this as "skipped" in terms of no change made.
                    skipped_count +=1

        except HTTPException as e: # If parser yields an error wrapped in HTTPException
            print(f"Skipping a row due to parsing error before DB: {e.detail}")
            skipped_count += 1
        except Exception as e:
            print(f"Error processing product {product_data.get('name', 'Unknown Name')}: {e}")
            skipped_count += 1

    return {"created": created_count, "updated": updated_count, "skipped_due_to_error_or_no_change": skipped_count}


