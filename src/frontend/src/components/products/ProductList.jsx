import React, { useState, useEffect } from 'react';
import { List, Button, Input, Typography, Space } from 'antd';
// import { fetchProducts, deleteProduct } from '../../services/api'; // Uncomment when API service is ready

const { Search } = Input;
const { Title } = Typography;

const ProductList = ({ onEditProduct, onAddProduct, onSelectProduct }) => { // Added onSelectProduct
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // loadProducts(); // Uncomment when API service is ready
    setProducts([ // Placeholder data
      { id: 1, name: 'Sample Product 1', ref: 'REF001', description: 'Description 1', documents: [] },
      { id: 2, name: 'Sample Product 2', ref: 'REF002', description: 'Description 2', documents: [] },
    ]);
  }, [searchTerm]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // const data = await fetchProducts(searchTerm); // Uncomment
      // setProducts(data); // Uncomment
    } catch (error) {
      console.error('Failed to load products:', error);
      // Add user notification (e.g., Ant Design message or notification)
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      // await deleteProduct(productId); // Uncomment
      // loadProducts(); // Refresh list
      console.log(`Deleting product ${productId}`); // Placeholder
      setProducts(products.filter(p => p.id !== productId)); // Placeholder
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search products by name or ref"
          onSearch={(value) => setSearchTerm(value)} // Trigger search on enter
          onChange={(e) => !e.target.value && setSearchTerm(e.target.value)} // Trigger search on clear
          style={{ width: 300 }}
          allowClear
        />
        <Button type="primary" onClick={onAddProduct}>Add New Product</Button>
      </Space>
      <List
        loading={loading}
        bordered
        dataSource={products}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => onEditProduct(item)}>Edit</Button>,
              <Button type="link" danger onClick={() => handleDelete(item.id)}>Delete</Button>
            ]}
            onClick={() => onSelectProduct && onSelectProduct(item)} // Allow clicking item for details
            style={{ cursor: onSelectProduct ? 'pointer' : 'default' }}
          >
            <List.Item.Meta
              title={item.name}
              description={`Ref: ${item.ref} - ${item.description}`}
            />
            {/* TODO: Display document count or quick view */}
          </List.Item>
        )}
      />
    </div>
  );
};

export default ProductList;
