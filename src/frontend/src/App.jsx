import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Card, Row, Col, Spin, Modal, Button, message } from 'antd';
import ProductList from './components/products/ProductList';
import ProductForm from './components/products/ProductForm';
import DocumentUpload from './components/documents/DocumentUpload';
import DocumentList from './components/documents/DocumentList';
// import { fetchProducts, fetchProductById, createProduct, updateProduct, deleteProduct } from './services/api'; // Placeholder for actual API calls

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography; // Added Text

// Placeholder API functions (replace with actual calls from services/api.js)
const mockApi = {
  fetchProducts: async (searchTerm) => {
    console.log('API: Fetching products', searchTerm);
    await new Promise(r => setTimeout(r, 500));
    let data = [
      { id: 1, name: 'Laptop Pro X', ref: 'LPX-001', description: 'High performance laptop for professionals.', documents: [{id:101, type:'pdf', path_or_url:'media/product_1/pdf/specsheet.pdf', label:'Specsheet.pdf'}, {id:102, type:'image', path_or_url:'https://via.placeholder.com/150/0000FF/808080?Text=LaptopProX', label:'Laptop Image'}] },
      { id: 2, name: 'Eco Smartphone Y', ref: 'ESY-002', description: 'Eco-friendly smartphone with long battery life.', documents: [] },
      { id: 3, name: 'Wireless Headphones Z', ref: 'WHZ-003', description: 'Noise-cancelling wireless headphones.', documents: [{id:103, type:'image', path_or_url:'https://via.placeholder.com/150/FF0000/FFFFFF?Text=HeadphonesZ', label:'Headphones Image'}] },
    ];
    if (searchTerm) {
      data = data.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.ref.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return data;
  },
  fetchProductById: async (id) => {
    console.log('API: Fetching product by ID', id);
    await new Promise(r => setTimeout(r, 300));
    const products = await mockApi.fetchProducts(); // get all to find one
    let product = products.find(p => p.id === id);
    if (product) { // Create a copy to avoid modifying the "global" mock data directly
        product = JSON.parse(JSON.stringify(product));
    }

    // Simulate fetching more complete document details if needed
    if (product && (!product.documents || product.documents.length === 0)) {
        if (id === 1 && product.documents.length === 0) { // Check if documents are actually missing
             product.documents = [
                {id:101, type:'pdf', path_or_url:'media/product_1/pdf/specsheet.pdf', label:'Specsheet.pdf'},
                {id:102, type:'image', path_or_url:'https://via.placeholder.com/150/0000FF/808080?Text=LaptopProX', label:'Laptop Image'}
            ];
        } else if (id === 2 && product.documents.length === 0) {
            product.documents = [{id:201, type:'excel', path_or_url:'media/product_2/excel/compat_list.xlsx', label:'Compatibility List'}];
        }
    }
    return product || null;
  },
  createProduct: async (data) => {
    console.log('API: Creating product', data);
    await new Promise(r => setTimeout(r, 300));
    const newProduct = { ...data, id: Date.now(), documents: [] };
    // This part is tricky for mock: ideally add to the 'products' array used by fetchProducts
    message.info("Mock create: Product list won't update globally without more complex mock state management.");
    return newProduct;
  },
  updateProduct: async (id, data) => {
    console.log('API: Updating product', id, data);
    await new Promise(r => setTimeout(r, 300));
    message.info("Mock update: Product list won't update globally without more complex mock state management.");
    return { ...data, id };
  },
};


const App = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isDocumentUploadModalVisible, setIsDocumentUploadModalVisible] = useState(false);
  const [productForDocumentUpload, setProductForDocumentUpload] = useState(null);

  const [detailedProductView, setDetailedProductView] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');


  const refreshProducts = async (searchTerm = currentSearchTerm) => {
    setLoadingProducts(true);
    setCurrentSearchTerm(searchTerm);
    try {
      const data = await mockApi.fetchProducts(searchTerm);
      setProducts(data);
    } catch (error) {
      message.error("Failed to load products.");
      console.error("Failed to load products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);


  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsProductModalVisible(true);
  };

  const handleProductFormCancel = () => {
    setIsProductModalVisible(false);
    setSelectedProduct(null);
  };

  const handleProductFormSubmit = async (formData) => {
    setLoadingProducts(true); // Indicate loading state
    try {
      if (selectedProduct && selectedProduct.id) {
        await mockApi.updateProduct(selectedProduct.id, formData);
        message.success('Product updated successfully!');
      } else {
        await mockApi.createProduct(formData);
        message.success('Product created successfully!');
      }
      setIsProductModalVisible(false);
      setSelectedProduct(null);
      await refreshProducts();

      // If the edited/created product was being viewed, refresh its details
      // This logic might need adjustment based on how IDs are handled post-creation
      if (selectedProduct && detailedProductView && selectedProduct.id === detailedProductView.id) {
        handleSelectProductForDetails({ ...detailedProductView, ...formData });
      } else if (!selectedProduct) { // If it was a new product
        // Potentially select the new product for view, if ID is available
      }

    } catch (error) {
      message.error('Failed to save product.');
      console.error("Product form submit error:", error);
    } finally {
        setLoadingProducts(false);
    }
  };

  const handleSelectProductForDetails = async (product) => {
    if (detailedProductView && detailedProductView.id === product.id && !loadingDetails) {
         // Optional: If clicking the same product again, maybe force refresh or do nothing
         // For now, let's always refresh if selected.
    }
    setLoadingDetails(true);
    // setDetailedProductView(null); // Clear previous while loading new, or keep stale
    try {
        const detailedData = await mockApi.fetchProductById(product.id);
        if (detailedData) {
            setDetailedProductView(detailedData);
        } else {
            message.error("Could not load product details for ID: " + product.id);
            setDetailedProductView(null); // Clear if not found
        }
    } catch (error) {
        message.error("Error loading product details.");
        console.error("Failed to fetch product details:", error);
        setDetailedProductView(null);
    } finally {
        setLoadingDetails(false);
    }
  };

  const openDocumentUploadModal = (product) => {
    setProductForDocumentUpload(product); // This is the product object, including its current documents
    setIsDocumentUploadModalVisible(true);
  };

  const handleDocumentUploadComplete = async () => {
    setIsDocumentUploadModalVisible(false);
    if (productForDocumentUpload) {
      message.success('Document operation successful. Refreshing details...');
      // Re-fetch the product to get updated document list
      await handleSelectProductForDetails(productForDocumentUpload);
    }
    setProductForDocumentUpload(null);
  };

  const handleDeleteProduct = async (productId) => {
    Modal.confirm({
        title: 'Are you sure you want to delete this product?',
        content: 'This action cannot be undone.',
        okText: 'Yes, Delete',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
            try {
                // await mockApi.deleteProduct(productId); // Replace with actual API
                console.log("Mock Deleting product ID:", productId);
                message.success(`Product ${productId} deleted (mock).`);
                await refreshProducts(); // Refresh list
                if (detailedProductView && detailedProductView.id === productId) {
                    setDetailedProductView(null); // Clear details view if current product deleted
                }
            } catch (error) {
                message.error('Failed to delete product.');
                console.error("Delete product error:", error);
            }
        }
    });
  };


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px', position: 'fixed', zIndex: 1, width: '100%' }}>
        <Title level={3} style={{ color: 'white', lineHeight: '64px', float: 'left', margin: 0 }}>
          Product Data Manager
        </Title>
      </Header>
      <Content style={{ padding: '24px', marginTop: 64, background: '#f0f2f5' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Product Catalog" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              <ProductList
                products={products}
                loading={loadingProducts}
                onEditProduct={handleEditProduct}
                onAddProduct={handleAddProduct}
                onSelectProduct={handleSelectProductForDetails}
                onDeleteProduct={handleDeleteProduct} // Pass delete handler
                onSearch={refreshProducts} // Pass search handler (term comes from ProductList's input)
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Product Details" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              {loadingDetails && <div style={{textAlign: 'center', padding: '20px'}}><Spin size="large" /></div>}
              {!loadingDetails && !detailedProductView && (
                <div style={{textAlign: 'center', padding: '20px', color: '#888'}}>Select a product to view details.</div>
              )}
              {!loadingDetails && detailedProductView && (
                <div>
                  <Title level={4} style={{marginBottom: '4px'}}>{detailedProductView.name}</Title>
                  <Text type="secondary" style={{display: 'block', marginBottom: '8px'}}>Ref: {detailedProductView.ref}</Text>
                  <p>{detailedProductView.description}</p>
                  <Button
                    type="dashed" // Changed type for visual distinction
                    onClick={() => openDocumentUploadModal(detailedProductView)}
                    style={{marginBottom: '16px'}}
                  >
                    Manage Documents
                  </Button>
                  <DocumentList
                    documents={detailedProductView.documents}
                    productId={detailedProductView.id}
                    onRefresh={() => handleSelectProductForDetails(detailedProductView)}
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {isProductModalVisible && (
            <ProductForm
                visible={isProductModalVisible}
                onCancel={handleProductFormCancel}
                onSubmit={handleProductFormSubmit}
                initialData={selectedProduct}
            />
        )}

        {isDocumentUploadModalVisible && productForDocumentUpload && (
            <Modal
                title={`Manage Documents for: ${productForDocumentUpload.name}`}
                open={isDocumentUploadModalVisible}
                onCancel={() => {
                    setIsDocumentUploadModalVisible(false);
                    setProductForDocumentUpload(null);
                }}
                footer={null}
                width={600}
                destroyOnClose // Important to reset state of DocumentUpload form
            >
                <DocumentUpload
                    productId={productForDocumentUpload.id}
                    onUploadComplete={handleDocumentUploadComplete}
                />
            </Modal>
        )}

      </Content>
      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.65)', padding: '10px 50px' }}>
        Product Data Manager ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
};

export default App;
