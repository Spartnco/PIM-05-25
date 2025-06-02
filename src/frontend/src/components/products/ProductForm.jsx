import React, { useEffect } from 'react'; // Removed useState
import { Form, Input, Button, Modal, Typography } from 'antd';
// createProduct and updateProduct are not called directly by this component.
// App.jsx handles the submission via the onSubmit prop.

const { Title } = Typography;

// Added 'submitting' prop to control loading state from App.jsx
const ProductForm = ({ visible, onCancel, onSubmit, initialData, submitting }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) { // Only reset/set values if modal becomes visible
      if (initialData) {
        form.setFieldsValue(initialData);
      } else {
        form.resetFields();
      }
    }
  }, [initialData, form, visible]);

  const handleFinish = async (values) => {
    // setLoading(true) and setLoading(false) removed. App.jsx controls this.
    try {
      // The actual creation/update logic is handled by the onSubmit prop,
      // which should be an async function passed from App.jsx.
      await onSubmit(values);
      // form.resetFields(); // App.jsx can decide to close modal (which destroys form) or reset.
                           // Or, parent can clear initialData which would trigger reset here.
                           // For now, let parent handle modal visibility and data state.
                           // On successful submit, the modal usually closes, destroying the form.
    } catch (error) {
      // Error handling (e.g., message.error) should ideally be in App.jsx's onSubmit
      // or passed as a specific error callback if granular control here is needed.
      // For now, App.jsx handles messages.
      console.error('ProductForm: Failed to save product (error should be handled by onSubmit):', error);
    }
  };

  return (
    <Modal
      title={<Title level={4}>{initialData ? 'Edit Product' : 'Add New Product'}</Title>}
      open={visible}
      onCancel={() => {
        // form.resetFields(); // Resetting here might be redundant if destroyOnClose is true
        onCancel();
      }}
      destroyOnClose // Ensures form is reset when modal is closed (unmounted) and reopened
      footer={[
        <Button key="back" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={submitting} onClick={() => form.submit()}>
          {initialData ? 'Save Changes' : 'Create Product'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="Product Name"
          rules={[
            { required: true, message: 'Please enter product name' },
            { max: 100, message: 'Product name cannot exceed 100 characters' }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="ref"
          label="Reference"
          rules={[
            { required: true, message: 'Please enter product reference' },
            { max: 50, message: 'Reference cannot exceed 50 characters' }
            // Example pattern: { pattern: /^[a-zA-Z0-9-]+$/, message: 'Reference can only include letters, numbers, and hyphens' }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[
            { max: 500, message: 'Description cannot exceed 500 characters' }
          ]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        {/* Consider adding other fields like 'price', 'stock_quantity' if they are part of productData */}
      </Form>
    </Modal>
  );
};

export default ProductForm;
