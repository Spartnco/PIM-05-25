import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, Typography } from 'antd';
// import { createProduct, updateProduct } from '../../services/api'; // Uncomment

const { Title } = Typography;

const ProductForm = ({ visible, onCancel, onSubmit, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [initialData, form, visible]); // Added visible to re-initialize form when modal reopens

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      if (initialData && initialData.id) {
        // await updateProduct(initialData.id, values); // Uncomment
        console.log('Updating product:', initialData.id, values); // Placeholder
      } else {
        // await createProduct(values); // Uncomment
        console.log('Creating product:', values); // Placeholder
      }
      onSubmit(); // Callback to refresh list or close modal
      form.resetFields(); // Reset form after successful submission
    } catch (error) {
      console.error('Failed to save product:', error);
      // Add user notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4}>{initialData ? 'Edit Product' : 'Add New Product'}</Title>}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      destroyOnClose // Ensures form is reset when modal is closed and reopened
      footer={[
        <Button key="back" onClick={() => {
          form.resetFields();
          onCancel();
        }}>Cancel</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
          {initialData ? 'Save Changes' : 'Create Product'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Please enter product name' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="ref" label="Reference">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        {/* Add more fields as needed */}
      </Form>
    </Modal>
  );
};

export default ProductForm;
