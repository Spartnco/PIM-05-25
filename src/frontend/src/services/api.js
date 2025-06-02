// Placeholder for API service functions
// Base URL for the backend API
const API_BASE_URL = 'http://localhost:8000'; // Adjust if your backend runs elsewhere

// Example: Fetch products
export const fetchProducts = async (searchTerm) => {
  let url = `${API_BASE_URL}/products/`;
  if (searchTerm) {
    url += `?search=${encodeURIComponent(searchTerm)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    // Try to parse error details from the response body
    let errorMessage = 'Failed to fetch products';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore if response is not JSON or other parsing error
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Create a product
export const createProduct = async (productData) => {
  const response = await fetch(`${API_BASE_URL}/products/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!response.ok) {
    let errorMessage = 'Failed to create product';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore if response is not JSON or other parsing error
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Fetch a single product by its ID
export const fetchProductById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/`);
  if (!response.ok) {
    let errorMessage = `Failed to fetch product with ID ${id}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Update an existing product
export const updateProduct = async (id, productData) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!response.ok) {
    let errorMessage = `Failed to update product with ID ${id}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Delete a product by its ID
export const deleteProduct = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    let errorMessage = `Failed to delete product with ID ${id}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }
  // DELETE typically doesn't return a body, or returns an empty one.
  // For consistency, we can check if response.json() is callable or if there's content.
  // However, often a 204 No Content status means success without a body.
  if (response.status === 204) {
    return null; // Or return a success message/status
  }
  // If there is a body, try to parse it.
  try {
    return await response.json();
  } catch (e) {
    return null; // No content or non-JSON content
  }
};

// Upload a document for a product
export const uploadDocument = async (productId, file, docType, label) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);
  formData.append('label', label);

  const response = await fetch(`${API_BASE_URL}/products/${productId}/documents/upload/`, {
    method: 'POST',
    body: formData, // FormData sets the Content-Type header automatically, including boundary
  });
  if (!response.ok) {
    let errorMessage = `Failed to upload document for product ID ${productId}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Add a document URL to a product
export const addDocumentUrl = async (productId, url, docType, label) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/documents/add_url/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, doc_type: docType, label }),
  });
  if (!response.ok) {
    let errorMessage = `Failed to add document URL for product ID ${productId}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Delete a document by its ID
export const deleteDocument = async (docId) => {
  const response = await fetch(`${API_BASE_URL}/documents/${docId}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    let errorMessage = `Failed to delete document with ID ${docId}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
};
