/**
 * @fileoverview Test URL Generator Utility
 * @description Utility script for testing URL generation with environment variables
 * @version 1.0.0
 * @author TidyTask Backend Team
 * @since 2024-01-01
 * @usage node utils/test-urls.js
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Frontend URL from environment or default
 * @type {string}
 * @description Base URL for frontend application
 */
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Test password reset URL
 * @type {string}
 * @description Generated URL for testing password reset functionality
 */
const resetUrl = `${frontendUrl}/reset?token=testtoken123`;

/**
 * Test password recovery URL
 * @type {string}
 * @description Generated URL for testing password recovery functionality
 */
const recoveryUrl = `${frontendUrl}/recovery?token=testtoken123`;

// Log test URLs for verification
console.log("FRONTEND_URL:", frontendUrl);
console.log("URL de reset:", resetUrl);
console.log("URL de recovery:", recoveryUrl);
