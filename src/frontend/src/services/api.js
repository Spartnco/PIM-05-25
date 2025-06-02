// Placeholder for API service functions
// Base URL for the backend API
const API_BASE_URL = 'http://localhost:8000'; // Adjust if your backend runs elsewhere

// Example: Fetch products
export const fetchProducts = async (searchTerm) => {
  let url = `${API_BASE_URL}/products/`;
  if (searchTerm) {
    url += `?search=${encodeURIComponent(searchTerm)}`;
  }
  // const response = await fetch(url);
  // if (!response.ok) {
  //   throw new Error('Failed to fetch products');
  // }
  // return response.json();
  console.log(`Fetching products from: ${url}`);
  // Replace with actual fetch call
  return Promise.resolve([]); // Placeholder
};

// Example: Create a product
export const createProduct = async (productData) => {
  // const response = await fetch(`${API_BASE_URL}/products/`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(productData),
  // });
  // if (!response.ok) {
  //   const errorData = await response.json();
  //   throw new Error(errorData.detail || 'Failed to create product');
  // }
  // return response.json();
  console.log('Creating product:', productData);
  return Promise.resolve({ id: Date.now(), ...productData, documents: [] }); // Placeholder
};

// Add more functions for:
// - fetchProductById(id)
// - updateProduct(id, data)
// - deleteProduct(id)
// - uploadDocument(productId, file, docType, label)
// - addDocumentUrl(productId, url, docType, label)
// - deleteDocument(docId)
