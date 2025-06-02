import React, { useState } from 'react';
import { Upload, Button, message, Form, Select, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
// import { uploadDocument, addDocumentUrl } from '../../services/api'; // Uncomment

const { Dragger } = Upload;
const { Option } = Select;

const DocumentUpload = ({ productId, onUploadComplete }) => {
  const [fileList, setFileList] = useState([]);
  const [docType, setDocType] = useState('image'); // 'image', 'pdf', 'excel', 'other'
  const [label, setLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [url, setUrl] = useState('');


  const handleUpload = async () => {
    if (isUrlMode) {
        if (!url || !docType) {
            message.error('URL and Document Type are required.');
            return;
        }
        setUploading(true);
        try {
            // await addDocumentUrl(productId, url, docType, label); // Uncomment
            console.log(`Adding URL for product ${productId}:`, { url, docType, label }); // Placeholder
            message.success('URL added successfully.');
            onUploadComplete(); // Callback
            setUrl(''); setLabel(''); // Reset form fields
        } catch (error) {
            message.error('Failed to add URL.');
            console.error('URL add error:', error);
        } finally {
            setUploading(false);
        }
    } else {
        if (fileList.length === 0) {
            message.error('Please select a file to upload.');
            return;
        }
        setUploading(true);
        // const formData = new FormData(); // If API expects FormData
        // formData.append('file', fileList[0]);
        // formData.append('doc_type', docType);
        // if (label) formData.append('label', label);

        try {
            // await uploadDocument(productId, fileList[0], docType, label); // Pass raw file object
            console.log(`Uploading file for product ${productId}:`, { fileName: fileList[0].name, docType, label }); // Placeholder
            message.success(`${fileList[0].name} file uploaded successfully.`);
            onUploadComplete(); // Callback
            setFileList([]); setLabel(''); // Reset form fields
        } catch (error) {
            message.error(`${fileList[0].name} file upload failed.`);
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    }
  };

  const draggerProps = {
    onRemove: (file) => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      setFileList([file]);
      return false; // Prevent auto-upload
    },
    fileList,
    multiple: false,
  };

  return (
    <div>
      <Form layout="vertical" initialValues={{ docType: 'image' }}>
        <Form.Item label="Input Method">
            <Select value={isUrlMode ? "url" : "file"} onChange={(val) => setIsUrlMode(val === "url")}>
                <Option value="file">Upload File</Option>
                <Option value="url">Add from URL</Option>
            </Select>
        </Form.Item>

        {!isUrlMode && (
            <Form.Item label="File">
                <Dragger {...draggerProps} style={{ marginBottom: 16 }}>
                    <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">Support for a single file.</p>
                </Dragger>
            </Form.Item>
        )}

        {isUrlMode && (
            <Form.Item label="Document URL" required rules={[{ required: true, message: 'Please enter the document URL' }, { type: 'url', message: 'Please enter a valid URL'}]}>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/document.pdf" />
            </Form.Item>
        )}

        <Form.Item label="Document Type" name="docType" required rules={[{ required: true, message: 'Please select document type'}]}>
          <Select value={docType} onChange={(value) => setDocType(value)}>
            <Option value="image">Image</Option>
            <Option value="pdf">PDF</Option>
            <Option value="excel">Excel</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>
        <Form.Item label="Label (Optional)">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., Product Datasheet"/>
        </Form.Item>
        <Button
          type="primary"
          onClick={handleUpload}
          disabled={ (isUrlMode && !url) || (!isUrlMode && fileList.length === 0) || uploading}
          loading={uploading}
        >
          {uploading ? (isUrlMode ? 'Adding URL...' : 'Uploading...') : (isUrlMode ? 'Add URL' : 'Start Upload')}
        </Button>
      </Form>
    </div>
  );
};

export default DocumentUpload;
