import React from 'react';
import { List, Button, Image, Typography, Tag, Popconfirm } from 'antd';
// import { deleteDocument } from '../../services/api'; // Uncomment

const { Text, Link } = Typography;
const API_BASE_URL = 'http://localhost:8000'; // Same as in api.js

const DocumentList = ({ documents, productId, onRefresh }) => {

  const handleDelete = async (docId) => {
    try {
      // await deleteDocument(docId); // Uncomment
      console.log(`Deleting document ${docId} for product ${productId}`); // Placeholder
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to delete document:', error);
      // Add user notification
    }
  };

  const getFileUrl = (pathOrUrl) => {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
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
