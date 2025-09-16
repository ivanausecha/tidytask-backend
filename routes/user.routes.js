/**
 * @fileoverview User Profile Management Routes
 * @description Defines all user profile-related API endpoints including profile CRUD, password management, and avatar uploads
 * @version 1.0.0
 * @author TidyTask Backend Team
 * @since 2024-01-01
 */

import { Router } from "express";
import UserController from "../controllers/user.controller.js";

/**
 * Express router for user profile routes
 * @type {Router}
 * @description Handles all user profile-related HTTP requests with authentication
 */
const router = Router();

/**
 * Get User Profile Route
 * @route GET /users/me
 * @description Retrieves the authenticated user's profile information
 * @middleware requireAuth - JWT authentication required
 * @returns {Object} 200: User profile data (excluding sensitive information)
 * @returns {Object} 404: User not found
 * @returns {Object} 401: Authentication required
 * 
 * @example
 * // GET /api/users/me
 * // Authorization: Bearer <jwt_token>
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "age": 25,
 *     "email": "john@example.com",
 *     "avatar": "/uploads/avatars/user-123.jpg",
 *     "createdAt": "2024-01-01T00:00:00.000Z",
 *     "updatedAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
router.get("/me", ...UserController.getProfile);

/**
 * Update User Profile Route
 * @route PUT /users/me
 * @description Updates the authenticated user's profile information
 * @middleware requireAuth - JWT authentication required
 * @middleware validateRequest - Profile data validation
 * @body {Object} profileData - Profile update data
 * @body {string} profileData.firstName - User's first name
 * @body {string} profileData.lastName - User's last name
 * @body {number} profileData.age - User's age (13-120)
 * @body {string} profileData.email - User's email address
 * @returns {Object} 200: Profile updated successfully
 * @returns {Object} 409: Email already exists
 * @returns {Object} 404: User not found
 * @returns {Object} 400: Validation error
 * @returns {Object} 401: Authentication required
 * 
 * @example
 * // PUT /api/users/me
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "age": 26,
 *   "email": "john.doe@example.com"
 * }
 */
router.put("/me", ...UserController.updateProfile);

/**
 * Change User Password Route
 * @route PUT /users/me/password
 * @description Changes the authenticated user's password
 * @middleware requireAuth - JWT authentication required
 * @middleware validateRequest - Password validation
 * @body {Object} passwordData - Password change data
 * @body {string} passwordData.currentPassword - User's current password
 * @body {string} passwordData.newPassword - New password (min 6 characters)
 * @body {string} passwordData.confirmPassword - Confirmation of new password
 * @returns {Object} 200: Password changed successfully
 * @returns {Object} 400: Invalid current password or validation error
 * @returns {Object} 404: User not found
 * @returns {Object} 401: Authentication required
 * 
 * @example
 * // PUT /api/users/me/password
 * {
 *   "currentPassword": "oldPassword123",
 *   "newPassword": "newPassword456",
 *   "confirmPassword": "newPassword456"
 * }
 */
router.put("/me/password", ...UserController.changePassword);

/**
 * Upload User Avatar Route
 * @route POST /users/me/avatar
 * @description Uploads and sets a new avatar image for the authenticated user
 * @middleware requireAuth - JWT authentication required
 * @middleware upload.single - Multer file upload middleware for 'avatar' field
 * @body {FormData} formData - Multipart form data
 * @body {File} formData.avatar - Image file (JPEG, PNG, GIF, WebP up to 5MB)
 * @returns {Object} 200: Avatar updated successfully
 * @returns {Object} 400: No file selected or invalid file format
 * @returns {Object} 404: User not found
 * @returns {Object} 401: Authentication required
 * 
 * @example
 * // POST /api/users/me/avatar
 * // Content-Type: multipart/form-data
 * // Body: FormData with 'avatar' field containing image file
 * // 
 * // Response:
 * {
 *   "success": true,
 *   "message": "Avatar actualizado exitosamente",
 *   "data": {
 *     "avatar": "/uploads/avatars/user-507f1f77bcf86cd799439011-1640995200000.jpg"
 *   }
 * }
 */
router.post("/me/avatar", ...UserController.uploadAvatar);

/**
 * Delete User Account Route
 * @route DELETE /users/me
 * @description Permanently deletes the authenticated user's account
 * @middleware requireAuth - JWT authentication required
 * @returns {Object} 200: Account deleted successfully
 * @returns {Object} 404: User not found
 * @returns {Object} 401: Authentication required
 * @warning This action is irreversible and will permanently delete all user data
 * 
 * @example
 * // DELETE /api/users/me
 * // Authorization: Bearer <jwt_token>
 * // Response:
 * {
 *   "success": true,
 *   "message": "Cuenta eliminada exitosamente"
 * }
 */
router.delete("/me", ...UserController.deleteAccount);

/**
 * User Routes Export
 * @exports {Router} router - Express router with user profile management endpoints
 * @description All routes are prefixed with '/users' and require authentication
 * 
 * @example
 * // In app.js:
 * import userRoutes from './routes/user.routes.js';
 * app.use('/api/users', userRoutes);
 * 
 * // Available endpoints:
 * // GET /api/users/me           - Get user profile
 * // PUT /api/users/me           - Update user profile
 * // PUT /api/users/me/password  - Change user password
 * // POST /api/users/me/avatar   - Upload user avatar
 * // DELETE /api/users/me        - Delete user account
 */
export default router;
