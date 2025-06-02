import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Default vite port, explicit for clarity
    proxy: {
      // Proxy /api requests to our backend server if you structure API calls like /api/products
      // '/api': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // },

      // If your API calls are made directly to http://localhost:8000 (as in current api.js)
      // Vite's proxy is NOT used for these full URL calls.
      // The proxy is useful if you use relative paths in your frontend API calls, e.g., fetch('/products')
      // For media files served by FastAPI at /media, if they are referenced in <img> tags
      // or opened via window.open, CORS headers on the backend (FastAPI) are essential.
      // The CORSMiddleware added to FastAPI is the correct solution for direct calls to different ports.
      // This proxy config here is more of a "just in case" or for if api.js changes to relative paths.
      // For now, it won't actively proxy the current api.js calls.
    }
  }
})
