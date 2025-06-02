import React from 'react';
import { List, Button, Image, Typography, Tag, Popconfirm, message } from 'antd'; // Added message
import { deleteDocument } from '../../services/api';

const { Text, Link } = Typography;
const API_BASE_URL = 'http://localhost:8000'; // Same as in api.js

const DocumentList = ({ documents, productId, onRefresh }) => {

  const handleDelete = async (docId) => {
    try {
      await deleteDocument(docId);
      message.success('Document deleted successfully');
      if (onRefresh) {
        onRefresh(); // Callback to refresh the product details in App.jsx
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      message.error(`Failed to delete document: ${error.message}`);
    }
  };

  const getFileUrl = (pathOrUrl) => {
    if (!pathOrUrl) return ''; // Handle null or undefined path
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    if (pathOrUrl.startsWith('data:image')) { // Check for data URIs
      return pathOrUrl;
    }
    // Assuming pathOrUrl from backend is like "media/product_X/type/filename.ext"
    // and FastAPI serves /media route
    return `${API_BASE_URL}/${pathOrUrl.startsWith('/') ? pathOrUrl.substring(1) : pathOrUrl}`;
  }

  return (
    <div>
      <Text strong>Associated Documents:</Text>
      <List
        itemLayout="horizontal"
        dataSource={documents || []}
        locale={{ emptyText: "No documents associated yet." }}
        renderItem={(doc) => (
          <List.Item
            actions={[
              <Link href={getFileUrl(doc.path_or_url)} target="_blank" rel="noopener noreferrer">
                Open
              </Link>,
              <Popconfirm
                title="Delete this document?"
                description="Are you sure you want to delete this document?"
                onConfirm={() => handleDelete(doc.id)}
                okText="Yes, Delete"
                cancelText="No"
              >
                <Button type="link" danger>Delete</Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={
                doc.type === 'image' && doc.path_or_url ? (
                  <Image width={60} height={60} src={getFileUrl(doc.path_or_url)} alt={doc.label || 'document'} preview={{src: getFileUrl(doc.path_or_url)}} />
                ) : <Tag>{doc.type}</Tag> // Fallback for non-images or if URL is missing
              }
              title={<Text>{doc.label || (doc.path_or_url ? doc.path_or_url.split('/').pop() : 'N/A')}</Text>}
              description={<Tag color="blue">{doc.type}</Tag>}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default DocumentList;
