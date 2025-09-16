/**
 * @fileoverview Authentication Routes
 * @description Defines all authentication-related API endpoints including signup, login, password recovery, and Google OAuth
 * @version 1.0.0
 * @author TidyTask Backend Team
 * @since 2024-01-01
 */

import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import passport from 'passport';

/**
 * Express router for authentication routes
 * @type {Router}
 * @description Handles all authentication-related HTTP requests
 */
const router = Router();

/**
 * User Registration Route
 * @route POST /auth/signup
 * @description Registers a new user account with email and password
 * @middleware AuthController.signup - Registration validation and user creation
 * @body {Object} userData - User registration data
 * @body {string} userData.firstName - User's first name
 * @body {string} userData.lastName - User's last name
 * @body {number} userData.age - User's age (13-120)
 * @body {string} userData.email - User's email address
 * @body {string} userData.password - User's password (min 6 characters)
 * @returns {Object} 201: User created successfully with JWT token
 * @returns {Object} 409: Email already exists
 * @returns {Object} 400: Validation error
 */
router.post('/signup', ...AuthController.signup);

/**
 * User Login Route
 * @route POST /auth/login
 * @description Authenticates user with email and password
 * @middleware AuthController.login - Login validation and authentication
 * @body {Object} credentials - User login credentials
 * @body {string} credentials.email - User's email address
 * @body {string} credentials.password - User's password
 * @returns {Object} 200: Login successful with JWT token and user data
 * @returns {Object} 401: Invalid credentials
 * @returns {Object} 400: Validation error
 */
router.post('/login', ...AuthController.login);

/**
 * Google OAuth Initiation Route
 * @route GET /auth/google
 * @description Initiates Google OAuth authentication flow
 * @middleware passport.authenticate - Google OAuth strategy
 * @query {string[]} scope - OAuth scopes: ['profile', 'email']
 * @returns {Redirect} Redirects to Google OAuth consent screen
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * Google OAuth Callback Route
 * @route GET /auth/google/callback
 * @description Handles Google OAuth callback after user consent
 * @middleware passport.authenticate - Google OAuth callback handler
 * @middleware AuthController.googleCallback - Processes OAuth response
 * @returns {Redirect} Success: Redirects to frontend with JWT token
 * @returns {Redirect} Failure: Redirects to login page
 */
router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login',
        session: true
    }),
    AuthController.googleCallback
);

/**
 * User Logout Route
 * @route POST /auth/logout
 * @description Logs out the authenticated user
 * @middleware AuthController.logout - Logout handler
 * @header {string} Authorization - Bearer JWT token
 * @returns {Object} 200: Logout successful
 * @returns {Object} 401: Authentication required
 */
router.post('/logout', ...AuthController.logout);

/**
 * Password Recovery Request Route
 * @route POST /auth/recover-password
 * @description Initiates password recovery process by sending reset email
 * @middleware AuthController.recoverPassword - Password recovery handler
 * @body {Object} recoveryData - Password recovery data
 * @body {string} recoveryData.email - User's email address
 * @returns {Object} 200: Recovery email sent successfully
 * @returns {Object} 404: Email not found
 * @returns {Object} 400: Validation error
 */
router.post('/recover-password', ...AuthController.recoverPassword);

/**
 * Password Reset Route
 * @route POST /auth/reset-password
 * @description Resets user password using recovery token
 * @middleware AuthController.resetPassword - Password reset handler
 * @body {Object} resetData - Password reset data
 * @body {string} resetData.token - Password reset token from email
 * @body {string} resetData.newPassword - New password (min 6 characters)
 * @returns {Object} 200: Password reset successful
 * @returns {Object} 400: Invalid or expired token
 * @returns {Object} 400: Validation error
 */
router.post('/reset-password', ...AuthController.resetPassword);

/**
 * Authentication Routes Export
 * @exports {Router} router - Express router with authentication endpoints
 * @description All routes are prefixed with '/auth' in the main application
 * 
 * @example
 * // In app.js:
 * import authRoutes from './routes/auth.routes.js';
 * app.use('/auth', authRoutes);
 * 
 * // Available endpoints:
 * // POST /auth/signup
 * // POST /auth/login
 * // GET /auth/google
 * // GET /auth/google/callback
 * // POST /auth/logout
 * // POST /auth/recover-password
 * // POST /auth/reset-password
 */
export default router;