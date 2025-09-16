/**
 * @fileoverview MongoDB Database Connection Configuration
 * @description Handles MongoDB Atlas connection setup and management for TidyTask application
 * @author TidyTask Team
 * @version 1.0.0
 */

// MongoDB connection configuration for backend
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

/**
 * Establishes connection to MongoDB Atlas database
 * @async
 * @function connectDB
 * @description Connects to MongoDB using the connection string from environment variables
 * @throws {Error} Throws error if MONGODB_URI is not defined or connection fails
 * @returns {Promise<void>} Promise that resolves when connection is established
 * 
 * @example
 * ```javascript
 * import connectDB from './config/database.js';
 * 
 * // Connect to database
 * await connectDB();
 * ```
 */
const connectDB = async () => {
  try {
    const connectionString = process.env.MONGODB_URI;
    
    if (!connectionString) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(connectionString);
    
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('🗄️  Database:', mongoose.connection.name);
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

/**
 * Handle MongoDB disconnection events
 * @event mongoose.connection#disconnected
 * @description Logs when the database connection is lost
 */
mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

/**
 * Handle MongoDB connection errors
 * @event mongoose.connection#error
 * @description Logs database connection errors
 * @param {Error} err - The error object
 */
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

/**
 * Database connection function
 * @exports connectDB
 * @type {Function}
 */
export default connectDB;
