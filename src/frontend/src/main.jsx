import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'antd/dist/reset.css'; // Import Ant Design CSS reset
import './index.css' // Your global styles if any. Vite likely created this.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
