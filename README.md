# Product Data Manager

This project is a simple desktop or web-local application to manage product references, associated files (Excel, images, PDFs), and allow for offline work.

## Setup and Installation

**Python Backend (FastAPI)**

1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

2.  **Activate the virtual environment:**
    -   On Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    -   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Initialize the database (Run from project root or `src/backend` directory):**
    Before running the application for the first time, you need to initialize the database.
    The application is configured to use SQLite (`db.sqlite3`).

    **Option 1: Automatic Schema Generation (Development)**
    The FastAPI application is currently configured with `generate_schemas=True`. This means Tortoise ORM will attempt to create the database tables automatically when the application starts if they don't exist. This is suitable for development.

    **Option 2: Using Aerich for Migrations (Recommended for Production & Evolving Schema)**
    Aerich is a database migration tool for Tortoise ORM.
    a. Install Aerich:
       ```bash
       pip install aerich
       ```
    b. Initialize Aerich (run once from the project root directory):
       Ensure your `src/backend/main.py` has the `TORTOISE_ORM` config defined.
       ```bash
       aerich init -t src.backend.main.TORTOISE_ORM
       ```
       This will create a `migrations` folder and an `aerich.ini` file.
       If you encounter issues with the path to `TORTOISE_ORM`, you might need to adjust your Python path or run from `src/backend` using a slightly different command (e.g., `PYTHONPATH=. aerich init -t main.TORTOISE_ORM`).

    c. Create initial migration (after models are defined):
       ```bash
       aerich migrate initial
       ```
    d. Apply migrations to the database:
       ```bash
       aerich upgrade
       ```
    e. Whenever you change your models in `src/backend/models.py`:
       ```bash
       aerich migrate <give_a_meaningful_name_e.g_added_new_field>
       aerich upgrade
       ```
    *For this project, since `generate_schemas=True` is active, manual migration with Aerich is optional for initial setup but good practice for schema evolution.*

5.  **Run the FastAPI application (Run from project root):**
    ```bash
    uvicorn src.backend.main:app --reload --port 8000
    ```
    The application will be available at `http://localhost:8000`.

**React Frontend (Vite + Ant Design)**

The frontend is a single-page application built with React and Vite, using Ant Design for UI components.

1.  **Navigate to the frontend directory:**
    ```bash
    cd src/frontend
    ```

2.  **Install dependencies (if you haven't already):**
    The project initialization (`npm create vite@latest ...`) and Ant Design installation (`npm install antd ...`) should have already installed necessary packages. However, if you are setting up fresh or pulling changes, run:
    ```bash
    npm install
    ```

3.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:5173` (Vite will indicate the exact port).

4.  **Build for production (optional):**
    ```bash
    npm run build
    ```
    This will create a `dist` folder in `src/frontend` with optimized static assets.

## Seeding the Database (Optional)

A script is provided to pre-populate the database with product data from Excel (.xlsx) or CSV (.csv) files.

1.  **Place your data files:**
    Put your Excel or CSV files into the `data_to_import/` directory in the project root.
    The script expects columns like 'Product Name', 'Reference', 'Description'. The exact mapping can be configured in `src/backend/import_utils.py` (the `EXPECTED_COLUMNS` dictionary).

2.  **Run the seed script:**
    Execute the script from the **project root directory**:
    ```bash
    python src/backend/seed.py
    ```
    This will connect to the database defined in `src/backend/main.py` (default: `db.sqlite3`), parse the files, and import the products.
    Ensure your virtual environment is active if you installed dependencies there.

## Running Tests

The project uses `pytest` for running unit and integration tests. Tests are located in the `tests/` directory.

1.  **Ensure test dependencies are installed:**
    If you haven't already, install `pytest`, `pytest-asyncio`, `httpx`, and `pytest-cov` (they are in `requirements.txt`):
    ```bash
    pip install pytest pytest-asyncio httpx pytest-cov
    ```

2.  **Run tests:**
    Execute pytest from the **project root directory**:
    ```bash
    pytest
    ```
    Or, for more verbose output and coverage report (as configured in `pytest.ini`):
    ```bash
    pytest -v
    ```
    Tests will use an in-memory SQLite database (defined in `tests/test_api.py`) to avoid interfering with your development database. The test database is created and destroyed automatically during the test session.
    An HTML coverage report will be generated in the `htmlcov/` directory.

## Project Structure

```
.
├── media/                # Stores uploaded files (images, PDFs, Excel sheets)
├── src/
│   ├── backend/          # FastAPI application
│   │   ├── main.py       # Main application file, API endpoints
│   │   ├── models.py     # Tortoise ORM models
│   │   └── ...           # Other backend modules (e.g., routers, services)
│   └── frontend/         # React application (Vite + Ant Design)
│       ├── src/
│       └── ...           # Frontend components and logic
├── tests/                # Unit and integration tests
├── .gitignore            # Specifies intentionally untracked files that Git should ignore
├── README.md             # This file
├── requirements.txt      # Python dependencies for the backend
└── TODO.md               # Manual next steps and pending tasks
```

## Key Libraries

*   **Backend**:
    *   FastAPI: Modern, fast (high-performance) web framework for building APIs.
    *   Tortoise ORM: An easy-to-use asyncio ORM (Object Relational Mapper) inspired by Django.
    *   Uvicorn: ASGI server for running FastAPI.
    *   aiofiles: For asynchronous file operations.
    *   openpyxl: For reading/writing Excel 2010 xlsx/xlsm/xltx/xltm files.
    *   Pillow: For image manipulation (e.g., creating thumbnails).
    *   PyPDF2: For PDF manipulation (placeholder, might need pdf-js for previews).
*   **Frontend**:
    *   React: JavaScript library for building user interfaces.
    *   Vite: Next generation frontend tooling.
    *   Ant Design: UI component library.

## TODO

See `TODO.md` for a list of current tasks and future enhancements.
