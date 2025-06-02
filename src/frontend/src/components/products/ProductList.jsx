import React from 'react'; // Removed useState, useEffect
import { List, Button, Input, Typography, Space } from 'antd';
// No direct API calls needed here if App.jsx handles them.
// import { fetchProducts, deleteProduct } from '../../services/api';

const { Search } = Input;
// const { Title } = Typography; // Title not used

// Props coming from App.jsx: products, loading, onEditProduct, onAddProduct, onSelectProduct, onDeleteProduct, onSearch
const ProductList = ({
  products,
  loading,
  onEditProduct,
  onAddProduct,
  onSelectProduct,
  onDeleteProduct,
  onSearch
}) => {

  // Removed local state for products, loading, searchTerm
  // Removed useEffect and loadProducts function
  // Removed local handleDelete function

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search products by name or ref"
          onSearch={onSearch} // Pass search term to App.jsx
          onChange={(e) => !e.target.value && onSearch(e.target.value)} // Trigger search on clear
          style={{ width: 300 }}
          allowClear
        />
        <Button type="primary" onClick={onAddProduct}>Add New Product</Button>
      </Space>
      <List
        loading={loading} // Use loading prop from App.jsx
        bordered
        dataSource={products} // Use products prop from App.jsx
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => onEditProduct(item)}>Edit</Button>,
              // Ensure onDeleteProduct is called, which is passed from App.jsx
              <Button type="link" danger onClick={() => onDeleteProduct(item.id)}>Delete</Button>
            ]}
            onClick={() => onSelectProduct && onSelectProduct(item)}
            style={{ cursor: onSelectProduct ? 'pointer' : 'default' }}
          >
            <List.Item.Meta
              title={item.name}
              description={`Ref: ${item.ref} - ${item.description}`}
            />
            {/* Optional: Display document count or quick view */}
          </List.Item>
        )}
      />
    </div>
  );
};

export default ProductList;
