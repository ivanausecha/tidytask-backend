/**
 * @fileoverview TidyTask Backend Server Entry Point
 * @description Main server file that starts the Express application with HTTP server
 * @version 1.0.0
 * @author TidyTask Backend Team
 * @since 2024-01-01
 */

import app from './app.js';
import http from 'http';

/**
 * Server port configuration
 * @type {number}
 * @description Port number from environment variable or default fallback
 */
const PORT = process.env.PORT || 3001;

/**
 * HTTP Server instance
 * @type {http.Server}
 * @description Creates HTTP server with Express application
 */
const server = http.createServer(app);

/**
 * CORS Header Interceptor
 * @description Ensures CORS headers are always present in production responses
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
server.on('request', (req, res) => {
  const originalEnd = res.end;
  
  // Reemplazar el método end para asegurar que los encabezados CORS siempre estén presentes
  res.end = function() {
    // Forzar encabezados CORS en todas las respuestas como último recurso
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Access-Control-Allow-Origin', 'https://tidytask-frontend.vercel.app/');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Accept,Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    // Llamar al método original
    return originalEnd.apply(this, arguments);
  };
});

/**
 * Start the server
 * @description Initializes the HTTP server and logs startup information
 * @listens {number} PORT - Server port number
 */
server.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
  console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`👉 Frontend URL: ${process.env.FRONTEND_URL || 'https://tidytasks-v1.onrender.com'}`);
  }
});