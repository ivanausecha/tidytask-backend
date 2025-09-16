/**
 * @fileoverview Authentication Controller for TidyTask Application
 * @description Handles user authentication, registration, password recovery, and session management
 * @author TidyTask Team
 * @version 1.0.0
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import * as yup from "yup";
import User from "../models/user.model.js";
import EmailService from "../services/email.service.js";
import { requireAuth, validateRequest } from "../utils/decorators.js";

// Configure path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

/**
 * JWT secret key from environment variables
 * @type {string}
 * @description Secret key used for signing and verifying JWT tokens
 */
const secretKey = process.env.JWT_SECRET;

// Verify JWT secret key availability
console.log(
  "Auth Controller - JWT_SECRET:",
  secretKey ? "Available" : "Missing"
);

/**
 * Validation schema for user registration
 * @type {yup.ObjectSchema}
 * @description Ensures all required fields are present and valid for user signup
 */
const signupSchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  age: yup.number().min(0, 'Age must be a positive number').optional(),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

/**
 * Validation schema for user login
 * @type {yup.ObjectSchema}
 * @description Validates email format and password presence for authentication
 */
const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

/**
 * Validation schema for password recovery request
 * @type {yup.ObjectSchema}
 * @description Validates email format for password recovery
 */
const resetPasswordSchema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
});

/**
 * Validation schema for password reset
 * @type {yup.ObjectSchema}
 * @description Validates new password and reset token
 */
const newPasswordSchema = yup.object().shape({
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  token: yup.string().required('Reset token is required'),
});

/**
 * Authentication Controller Class
 * @class AuthController
 * @description Handles all authentication-related operations including registration, login, logout, and password recovery
 */
class AuthController {
  /**
   * Register a new user in the system
   * @async
   * @method signup
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing user registration data
   * @param {string} req.body.firstName - User's first name
   * @param {string} req.body.lastName - User's last name
   * @param {number} [req.body.age] - User's age (optional)
   * @param {string} req.body.email - User's email address
   * @param {string} req.body.password - User's password (min 6 characters)
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 201: User created successfully with JWT token, 409: Email already exists, 400: Validation error, 500: Server error
   * 
   * @example
   * // POST /api/auth/register
   * {
   *   "firstName": "John",
   *   "lastName": "Doe",
   *   "age": 25,
   *   "email": "john@example.com",
   *   "password": "securepassword"
   * }
   */
  async signup(req, res) {
    try {
      await signupSchema.validate(req.body);
      const { firstName, lastName, age, email, password } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res
          .status(409)
          .json({ message: "This email is already registered." });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user in database
      const newUser = new User({
        firstName,
        lastName,
        age,
        email,
        password: hashedPassword,
      });

      const savedUser = await newUser.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: savedUser._id, email: savedUser.email },
        secretKey,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        message: "User created successfully",
        userId: savedUser._id,
        token,
        user: {
          id: savedUser._id,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          email: savedUser.email,
          age: savedUser.age,
        },
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Signup error:", error);
      res
        .status(500)
        .json({ message: "Internal server error during registration" });
    }
  }

  /**
   * Authenticate user and generate JWT token
   * @async
   * @method login
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing login credentials
   * @param {string} req.body.email - User's email address
   * @param {string} req.body.password - User's password
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: Login successful with JWT token, 401: Invalid credentials, 500: Server error
   * 
   * @example
   * // POST /api/auth/login
   * {
   *   "email": "john@example.com",
   *   "password": "securepassword"
   * }
   */
  async login(req, res) {
    try {
      await loginSchema.validate(req.body);
      const { email, password } = req.body;

      // Find user in database
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      // Ensure JWT secret is configured
      if (!secretKey) {
        throw new Error("JWT_SECRET is not configured");
      }

      // Generate JWT token with user data
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        secretKey,
        { expiresIn: "24h" }
      );

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          age: user.age,
        },
      });
    } catch (error) {
      console.error("Login error:", error.message);
      res.status(500).json({ message: "Error during login process" });
    }
  }

  /**
   * Handle Google OAuth callback
   * @async
   * @method googleCallback
   * @param {Object} req - Express request object containing user from passport
   * @param {Object} req.user - User object from Google OAuth strategy
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Redirects to frontend with user data or error
   * @description Processes Google OAuth authentication result and redirects to frontend
   * @note Currently disabled - Google OAuth is commented out
   */
  async googleCallback(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication failed",
        });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
        },
        secretKey,
        { expiresIn: "24h" }
      );

      // Prepare user data and token
      const userData = {
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          age: user.age,
        },
      };

      // Redirect to frontend callback page with data as query params
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
      const callbackURL = `${frontendURL}/google-callback.html`;

      // Convert data to URL-safe string and send as parameter
      const userDataStr = encodeURIComponent(JSON.stringify(userData));

      res.redirect(`${callbackURL}?data=${userDataStr}`);
    } catch (error) {
      console.error("Google auth error:", error);
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(
        `${frontendURL}/login?error=${encodeURIComponent(
          "Error during authentication process"
        )}`
      );
    }
  }

  /**
   * End user session and clear authentication data
   * @async
   * @method logout
   * @param {Object} req - Express request object with authenticated user
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: Logout successful, 500: Server error
   * @description Clears user session and removes authentication cookies
   */
  async logout(req, res) {
    try {
      // Clear session
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Error during logout" });
        }
        // Destroy session
        req.session.destroy((err) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error destroying session" });
          }
          res.clearCookie("connect.sid");
          return res.status(200).json({ message: "Logout successful" });
        });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Error during logout process" });
    }
  }

  /**
   * Handle password recovery request
   * @async
   * @method recoverPassword
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing recovery data
   * @param {string} req.body.email - Email address for password recovery
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: Recovery email sent (generic message for security), 500: Server error
   * @description Generates password reset token and sends recovery email
   * 
   * @example
   * // POST /api/auth/recover-password
   * {
   *   "email": "john@example.com"
   * }
   */
  async recoverPassword(req, res) {
    try {
      await resetPasswordSchema.validate(req.body);
      const { email } = req.body;

      console.log("Password recovery request for:", email);

      // Generic message for security
      const genericMessage = {
        success: true,
        message:
          "Si existe una cuenta con este email, recibirás un correo con las instrucciones.",
      };

      const user = await User.findOne({ email });
      if (!user) {
        console.log("User not found for recovery:", email);
        return res.status(200).json(genericMessage);
      }

      console.log("User found, generating reset token");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(resetToken).digest("hex");

      user.resetPasswordToken = hash;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();
      console.log("Reset token saved to user");

      console.log("Sending reset email");
      try {
        const emailSent = await EmailService.sendPasswordResetEmail(
          email,
          resetToken
        );

        if (!emailSent) {
          console.error("Failed to send reset email");
          // Don't throw error, continue with generic response
          console.log("Responding with generic message despite email failure");
        } else {
          console.log("Reset email sent successfully");
        }
      } catch (emailError) {
        console.error("Email service error:", emailError);
        // Don't throw error, continue with generic response
      }

      // Always return generic message regardless of email success
      res.status(200).json(genericMessage);
    } catch (error) {
      console.error("Password recovery error:", error);
      res.status(500).json({
        success: false,
        message:
          "Error en el proceso de recuperación de contraseña: " + error.message,
      });
    }
  }

  /**
   * Reset user password using recovery token
   * @async
   * @method resetPassword
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing reset data
   * @param {string} req.body.token - Password reset token from email
   * @param {string} req.body.password - New password (min 6 characters)
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: Password reset successful with new JWT token, 400: Invalid/expired token, 500: Server error
   * @description Validates reset token and updates user password
   * 
   * @example
   * // POST /api/auth/reset-password
   * {
   *   "token": "abc123def456...",
   *   "password": "newSecurePassword"
   * }
   */
  async resetPassword(req, res) {
    try {
      await newPasswordSchema.validate(req.body);
      const { token, password } = req.body;

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Token inválido o expirado",
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Generate new access token after reset
      const newToken = jwt.sign(
        { userId: user._id, email: user.email },
        secretKey,
        { expiresIn: "24h" }
      );

      res.status(200).json({
        success: true,
        message: "Contraseña actualizada exitosamente",
        token: newToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          age: user.age,
        },
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        success: false,
        message: "Error al restablecer la contraseña",
      });
    }
  }
}

/**
 * Create single instance of authentication controller
 * @type {AuthController}
 * @description Singleton instance of the AuthController class
 */
const controller = new AuthController();

/**
 * Authentication Controller Routes Export
 * @description Export controller methods wrapped with appropriate middleware chains
 * Each route is protected by validation and/or authentication middleware as needed
 * 
 * @typedef {Object} AuthRoutes
 * @property {Array} signup - User registration endpoint with validation
 * @property {Array} login - User authentication endpoint with validation  
 * @property {Function} googleCallback - Google OAuth callback handler
 * @property {Array} logout - User logout endpoint with authentication
 * @property {Array} recoverPassword - Password recovery request endpoint
 * @property {Array} resetPassword - Password reset endpoint
 */
export default {
  /**
   * User registration route
   * @type {Array<Function>}
   * @description Validates signup data and creates new user account
   */
  signup: [
    validateRequest(signupSchema),
    (req, res) => controller.signup(req, res),
  ],
  
  /**
   * User authentication route
   * @type {Array<Function>}
   * @description Validates login credentials and returns JWT token
   */
  login: [
    validateRequest(loginSchema),
    (req, res) => controller.login(req, res),
  ],
  
  /**
   * Google OAuth callback route
   * @type {Function}
   * @description Handles Google OAuth authentication callback
   * @note Currently disabled - Google OAuth is commented out
   */
  googleCallback: (req, res) => controller.googleCallback(req, res),
  
  /**
   * User logout route
   * @type {Array<Function>}
   * @description Requires authentication and clears user session
   */
  logout: [requireAuth, (req, res) => controller.logout(req, res)],
  
  /**
   * Password recovery request route
   * @type {Array<Function>}
   * @description Handles password recovery email sending
   */
  recoverPassword: [(req, res) => controller.recoverPassword(req, res)],
  
  /**
   * Password reset route
   * @type {Array<Function>}
   * @description Handles password reset using recovery token
   */
  resetPassword: [(req, res) => controller.resetPassword(req, res)],
};
