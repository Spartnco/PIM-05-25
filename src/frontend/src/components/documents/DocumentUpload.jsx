import React, { useState } from 'react';
import { Upload, Button, message, Form, Select, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadDocument, addDocumentUrl } from '../../services/api';

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
            await addDocumentUrl(productId, url, docType, label || undefined); // Pass undefined if label is empty
            message.success(`URL "${label || url}" added successfully.`);
            onUploadComplete(); // Callback to refresh parent component (e.g., product details)
            setUrl('');
            setLabel('');
            // setDocType('image'); // Optionally reset docType
        } catch (error) {
            message.error(error.message || 'Failed to add URL.');
            console.error('URL add error:', error);
        } finally {
            setUploading(false);
        }
    } else {
        if (fileList.length === 0) {
            message.error('Please select a file to upload.');
            return;
        }
        const file = fileList[0].originFileObj; // Get the actual File object
        if (!file) {
            message.error('File object is not available. Please re-select the file.');
            return;
        }

        setUploading(true);
        try {
            await uploadDocument(productId, file, docType, label || undefined); // Pass raw file object, undefined if label empty

            if (docType === 'excel') {
                message.info(`File "${file.name}" uploaded. Excel content will be processed in the background.`);
            } else {
                message.success(`File "${file.name}" uploaded successfully.`);
            }

            onUploadComplete(); // Callback
            setFileList([]);
            setLabel('');
            // setDocType('image'); // Optionally reset docType
        } catch (error) {
            message.error(error.message || `${file.name} file upload failed.`);
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
