# TODO List - Product Data Manager

This file lists potential next steps, improvements, and areas for further development for the Product Data Manager application.

## High Priority / Core Functionality
-   **Complete Frontend API Integration:**
    -   Uncomment and fully implement API calls in all frontend components within `src/frontend/src/services/api.js` and the respective components (`ProductList.jsx`, `ProductForm.jsx`, `DocumentUpload.jsx`, `DocumentList.jsx`, `App.jsx`).
    -   Implement robust error handling and user feedback (e.g., using Ant Design `message` or `notification`) for all API interactions.
    -   Ensure loading states are handled correctly in the UI during API calls.
-   **Refine Frontend UI/UX:**
    -   Improve the layout and styling of components.
    -   Enhance product detail view: currently basic, could be a dedicated panel or modal.
    -   Implement actual image previews for non-URL images in `DocumentList.jsx` (currently relies on direct URL).
    -   Consider client-side validation in forms in addition to backend validation.
-   **Test Excel/CSV Import Thoroughly:**
    -   Test with various file structures, edge cases, and large files.
    -   Provide clearer feedback to the user about the import progress/status on the frontend if possible (requires backend changes for status polling or WebSockets). The current background task is fire-and-forget from the client's perspective.

## Medium Priority / Enhancements
-   **Advanced Search & Filtering:**
    -   Implement more sophisticated search filters on the frontend for products (e.g., by date range, by document type presence).
    -   Backend might need new query parameters or endpoints for advanced search.
-   **PDF Previews:**
    -   Investigate and implement PDF previews in the frontend. `PyPDF2` on the backend is for manipulation, not direct web previews. Libraries like `react-pdf` or `pdf.js` (which is what `pdf-js` in your requirements refers to) can be used in the frontend. This might involve serving PDF files and then having the frontend render them.
-   **Image Thumbnails:**
    -   Backend: Use Pillow to generate thumbnails for uploaded images upon upload. Store path to thumbnail in `Document` model or use a naming convention.
    -   Frontend: Display thumbnails in lists/previews for better performance and UI.
-   **Configuration for Excel Import:**
    -   Allow users to map columns from their Excel/CSV files to product fields via the UI, instead of relying solely on the hardcoded `EXPECTED_COLUMNS` in `import_utils.py`.
-   **User Notifications for Background Tasks:**
    -   For the Excel import, implement a notification system (e.g., WebSockets, Server-Sent Events, or polling) to inform the user on the frontend when the background task is complete and the outcome.
-   **Export Functionality:**
    -   Implement CSV/PDF export for product listings or individual product details as mentioned in initial requirements.
        - CSV: Relatively straightforward by querying data and formatting.
        - PDF: More complex, may require libraries like ReportLab or WeasyPrint on the backend, or client-side PDF generation.

## Low Priority / Nice-to-Haves
-   **Detailed Logging:**
    -   Implement more comprehensive logging on the backend, especially for errors and important events.
-   **Customizable Document Types:**
    -   Allow users to define custom document types beyond the initial 'excel', 'image', 'pdf'.
-   **Bulk Operations:**
    -   Allow bulk deletion or modification of products/documents from the UI.
-   **Internationalization (i18n):**
    -   Prepare the frontend and potentially backend messages for translation if the app might be used in multiple languages.
-   **More Comprehensive Tests:**
    -   Expand unit and integration test coverage for both backend (especially `import_utils.py`, document handling, edge cases) and frontend (component tests, interaction tests).
    -   Consider end-to-end tests using tools like Cypress or Playwright.
-   **Desktop Packaging (If Required):**
    -   If a true desktop application is desired (beyond localhost web), investigate packaging with tools like PyInstaller (for Python backend + potentially simple frontend) or Electron (for React frontend + Node.js or Python backend).

## Documentation
-   **API Documentation Refinements:**
    -   Ensure all API endpoints in `src/backend/main.py` have clear OpenAPI documentation (summaries, descriptions, response models).
-   **Code Comments:**
    -   Review and improve code comments throughout the backend and frontend for clarity and maintainability.

## Housekeeping
-   **Dependency Review:**
    -   Periodically review and update dependencies.
-   **Code Linting and Formatting:**
    -   Enforce consistent code style using tools like Black and Flake8 for Python, and Prettier/ESLint for React/JS. (Setup not included in this automated generation).

---
*This TODO list is a starting point. Prioritize items based on your specific needs.*
