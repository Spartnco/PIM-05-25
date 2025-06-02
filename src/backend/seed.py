import asyncio
import os
from pathlib import Path
from tortoise import Tortoise, run_async

# Adjust this import path if your TORTOISE_ORM config is elsewhere
# or if you need to define it directly here for the script.
from src.backend.main import TORTOISE_ORM # Using config from main app
from src.backend.import_utils import import_products_from_file_content # Re-use the import logic

# Define the directory containing files to import
# Assumes script is run from project root, or adjust path accordingly.
# If run from src/backend, this path would be ../../data_to_import
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data_to_import"

async def init_db():
    """Initializes database connection."""
    # Make sure the 'models' app in TORTOISE_ORM config points to the correct model locations
    # e.g., "src.backend.models"
    # TORTOISE_ORM['apps']['models']['models'] should include "src.backend.models"

    # Ensure Aerich models are not included if not using Aerich directly in seed script
    # or if it causes issues with schema generation outside of full app context.
    # A common setup for scripts is to list models explicitly if auto-discovery is an issue.
    db_config = TORTOISE_ORM.copy()
    # Ensure only app models are used for schema generation if aerich.models causes issues here
    db_config['apps']['models']['models'] = ["src.backend.models"] # Focus on app's models

    await Tortoise.init(config=db_config)
    # generate_schemas should ideally be False if migrations handle schema.
    # For a seed script, it can be True if you want it to create tables if they don't exist,
    # but this might conflict with a migration-managed schema.
    # If using migrations (e.g. Aerich), it's better to ensure migrations are applied before seeding.
    await Tortoise.generate_schemas(safe=True) # safe=True won't drop/alter existing tables

async def seed_data():
    """
    Scans the DATA_DIR for .xlsx or .csv files and imports them.
    """
    print(f"Starting data seeding process from directory: {DATA_DIR}")
    if not DATA_DIR.exists() or not DATA_DIR.is_dir():
        print(f"Error: Data directory {DATA_DIR} not found or is not a directory.")
        return

    await init_db() # Initialize DB connection and schemas

    processed_files = 0
    total_created = 0
    total_updated = 0
    total_skipped_other = 0


    for filepath in DATA_DIR.iterdir():
        if filepath.is_file() and (filepath.name.endswith(".xlsx") or filepath.name.endswith(".csv")):
            print(f"Processing file: {filepath.name}...")
            try:
                with open(filepath, 'rb') as f:
                    file_content = f.read()

                summary = await import_products_from_file_content(file_content, filepath.name)

                created_count = summary.get('created', 0)
                updated_count = summary.get('updated', 0)
                skipped_count = summary.get('skipped_due_to_error_or_no_change', 0)

                print(f"Import summary for {filepath.name}:")
                print(f"  Created new products: {created_count}")
                print(f"  Updated existing products: {updated_count}")
                print(f"  Skipped (no change, error, or missing name): {skipped_count}")

                total_created += created_count
                total_updated += updated_count
                total_skipped_other += skipped_count
                processed_files += 1

            except Exception as e:
                print(f"Error processing file {filepath.name}: {e}")
        else:
            print(f"Skipping non-Excel/CSV file or directory: {filepath.name}")

    if processed_files > 0:
        print(f"\nSeeding complete. Processed {processed_files} file(s).")
        print(f"Total new products created: {total_created}")
        print(f"Total products updated: {total_updated}")
        print(f"Total products/rows skipped (no change, error, etc.): {total_skipped_other}")
    else:
        print("No Excel (.xlsx) or CSV (.csv) files found in the data_to_import directory.")
        print("Please add some files there and re-run the script.")
        print(f"Example: Create a file like {DATA_DIR / 'my_products.xlsx'}")

    await Tortoise.close_connections() # Close DB connections

if __name__ == "__main__":
    print("Running seed script...")
    # run_async(seed_data()) # Use this if you prefer Tortoise's runner
    asyncio.run(seed_data())

EOF
