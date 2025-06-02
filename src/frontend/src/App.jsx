import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Card, Row, Col, Spin, Modal, Button, message } from 'antd';
import ProductList from './components/products/ProductList';
import ProductForm from './components/products/ProductForm';
import DocumentUpload from './components/documents/DocumentUpload';
import DocumentList from './components/documents/DocumentList';
import { fetchProducts, fetchProductById, createProduct, updateProduct, deleteProduct } from './services/api'; // Removed deleteDocument

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography; // Added Text

const App = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false); // For form loading state
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [isDocumentUploadModalVisible, setIsDocumentUploadModalVisible] = useState(false);
  const [productForDocumentUpload, setProductForDocumentUpload] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false); // State for new details modal

  const [detailedProductView, setDetailedProductView] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');


  const refreshProducts = async (searchTerm = currentSearchTerm) => {
    setLoadingProducts(true);
    setCurrentSearchTerm(searchTerm); // Keep track of current search term
    try {
      const data = await fetchProducts(searchTerm);
      setProducts(data);
    } catch (error) {
      message.error(error.message || "Failed to load products.");
      console.error("Failed to load products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []); // Empty dependency array means this runs once on mount


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
    setSubmittingForm(true);
    try {
      let updatedOrNewProduct;
      if (selectedProduct && selectedProduct.id) {
        updatedOrNewProduct = await updateProduct(selectedProduct.id, formData);
        message.success('Product updated successfully!');
      } else {
        updatedOrNewProduct = await createProduct(formData);
        message.success('Product created successfully!');
      }
      setIsProductModalVisible(false);
      setSelectedProduct(null);
      await refreshProducts(currentSearchTerm); // Refresh with the current search term

      // If the edited/created product was being viewed, or if it's a new product, refresh its details
      // For a new product, updatedOrNewProduct contains the ID from the backend.
      if (updatedOrNewProduct && updatedOrNewProduct.id) {
        if (detailedProductView && detailedProductView.id === updatedOrNewProduct.id) {
          handleSelectProductForDetails(updatedOrNewProduct); // Refresh details view
        } else if (!selectedProduct) { // If it was a new product, potentially make it the detailed view
          // handleSelectProductForDetails(updatedOrNewProduct); // Or simply let user click from list
        }
      }
    } catch (error) {
      message.error(error.message || 'Failed to save product.');
      console.error("Product form submit error:", error);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSelectProductForDetails = async (product) => {
    // Optional: If clicking the same product again, and it's already loaded, maybe do nothing or force refresh.
    // if (detailedProductView && detailedProductView.id === product.id && !loadingDetails) {
    //   return; // Already showing this one
    // }
    setLoadingDetails(true);
    // If modal isn't open yet, clear previous to avoid showing wrong data briefly
    // If modal is already open (e.g. clicking refresh inside), keep current data until new data loads or error.
    if (!isDetailModalVisible) {
        setDetailedProductView(null);
    }

    try {
        const detailedData = await fetchProductById(product.id);
        if (detailedData) {
            setDetailedProductView(detailedData);
            // setLoadingDetails(false) will be set before showing modal content or after error
            setIsDetailModalVisible(true); // Open the modal
        } else {
            message.error(`Could not load product details for ID: ${product.id}. Product not found.`);
            setDetailedProductView(null);
            setIsDetailModalVisible(false); // Ensure modal doesn't stay open/open empty
        }
    } catch (error) {
        message.error(error.message || "Error loading product details.");
        console.error("Failed to fetch product details:", error);
        setDetailedProductView(null);
        setIsDetailModalVisible(false);
    } finally {
        setLoadingDetails(false); // Set loading false after try/catch completes
    }
  };

  const openDocumentUploadModal = (product) => {
    setProductForDocumentUpload(product); // This is the product object, including its current documents
    setIsDocumentUploadModalVisible(true);
  };

  const handleDocumentUploadComplete = async () => {
    setIsDocumentUploadModalVisible(false);
    if (productForDocumentUpload) {
      message.success('Document operation successful. Refreshing product details...');
      try {
        // Re-fetch the product to get updated document list
        await handleSelectProductForDetails(productForDocumentUpload);
        // Also refresh the main product list if a document change might alter list-visible info (e.g. doc count)
        // For now, only refreshing details as per original logic.
      } catch (error) {
        message.error(error.message || "Failed to refresh product details after document operation.");
      }
    }
    setProductForDocumentUpload(null);
    // Consider if refreshProducts() is also needed if document changes affect summary in list
  };

  const handleDeleteProduct = (productId) => { // No longer async here, onOk is.
    Modal.confirm({
        title: 'Are you sure you want to delete this product?',
        content: 'This action cannot be undone.',
        okText: 'Yes, Delete',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
            try {
                await deleteProduct(productId);
                message.success(`Product ${productId} deleted successfully.`);
                await refreshProducts(currentSearchTerm); // Refresh list with current search term
                if (detailedProductView && detailedProductView.id === productId) {
                    setDetailedProductView(null);
                    setIsDetailModalVisible(false); // Close detail modal if deleted product was viewed
                }
            } catch (error) {
                message.error(error.message || 'Failed to delete product.');
                console.error("Delete product error:", error);
            }
        }
    });
  };

  // JSX for the new Product Details Modal
  const renderProductDetailModal = () => {
    if (!detailedProductView && !loadingDetails) return null; // Don't render if no product selected (and not loading one)

    // If loading, but we have a detailedProductView (e.g. refreshing an already open modal), show its title.
    // If loading and no detailedProductView (e.g. first click from list), title will be generic.
    const modalTitle = detailedProductView?.name ? `Details for: ${detailedProductView.name}` : 'Product Details';

    return (
        <Modal
            title={modalTitle}
            open={isDetailModalVisible}
            onCancel={() => {
                setIsDetailModalVisible(false);
                setDetailedProductView(null); // Clear data when closing
            }}
            footer={null}
            width={800}
            destroyOnClose
        >
            {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" /></div>
            ) : detailedProductView ? ( // Ensure detailedProductView is not null before trying to render its content
                <>
                    <Title level={4} style={{ marginBottom: '4px' }}>{detailedProductView.name}</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Ref: {detailedProductView.ref}</Text>
                    <p>{detailedProductView.description}</p>
                    <Button
                        type="dashed"
                        onClick={() => {
                            openDocumentUploadModal(detailedProductView);
                        }}
                        style={{ marginBottom: '16px' }}
                    >
                        Manage Documents
                    </Button>
                    <DocumentList
                        documents={detailedProductView.documents || []}
                        productId={detailedProductView.id}
                        onRefresh={() => handleSelectProductForDetails(detailedProductView)}
                    />
                </>
            ) : (
                 <div style={{textAlign: 'center', padding: '20px', color: '#888'}}>No details available.</div>
            )}
        </Modal>
    );
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
          <Col xs={24} lg={24}> {/* Changed lg span to 24 */}
            <Card title="Product Catalog" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              <ProductList
                products={products}
                loading={loadingProducts}
                onEditProduct={handleEditProduct}
                onAddProduct={handleAddProduct}
                onSelectProduct={handleSelectProductForDetails}
                onDeleteProduct={handleDeleteProduct}
                onSearch={refreshProducts}
              />
            </Card>
          </Col>
          {/* The Col for Product Details Card has been removed */}
        </Row>

        {/* Product Form Modal (existing) */}
        {isProductModalVisible && (
            <ProductForm
                visible={isProductModalVisible}
                onCancel={handleProductFormCancel}
                onSubmit={handleProductFormSubmit}
                initialData={selectedProduct}
                submitting={submittingForm}
            />
        )}

        {/* Document Upload Modal (existing) */}
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
                destroyOnClose
            >
                <DocumentUpload
                    productId={productForDocumentUpload.id}
                    onUploadComplete={handleDocumentUploadComplete}
                />
            </Modal>
        )}

        {/* Render the new Product Details Modal */}
        {renderProductDetailModal()}

      </Content>
      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.65)', padding: '10px 50px' }}>
        Product Data Manager ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
};

export default App;
