/**
 * @fileoverview User Profile Controller for TidyTask Application
 * @description Handles user profile operations including view, update, delete, and avatar upload
 * @author TidyTask Team
 * @version 1.0.0
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import fs from "fs"; 
import multer from "multer";
import { fileURLToPath } from "url";
import * as yup from "yup";
import User from "../models/user.model.js";
import { requireAuth, validateRequest } from "../utils/decorators.js";

// Configure path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

/**
 * JWT secret key from environment variables
 * @type {string}
 * @description Secret key used for JWT operations
 */
const secretKey = process.env.JWT_SECRET;

/**
 * Validation schema for profile update
 * @type {yup.ObjectSchema}
 * @description Validates user profile update data
 */
const updateProfileSchema = yup.object().shape({
  firstName: yup
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .required("El nombre es requerido"),
  lastName: yup
    .string()
    .trim()
    .min(1, "El apellido es requerido")
    .required("El apellido es requerido"),
  age: yup
    .number()
    .integer("La edad debe ser un número entero")
    .min(13, "Debes tener al menos 13 años")
    .max(120, "Edad no válida")
    .required("La edad es requerida"),
  email: yup
    .string()
    .email("Formato de correo inválido")
    .required("El correo es requerido"),
});

/**
 * Validation schema for password change
 * @type {yup.ObjectSchema}
 * @description Validates password change request data
 */
const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required("La contraseña actual es requerida"),
  newPassword: yup
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres")
    .required("La nueva contraseña es requerida"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Las contraseñas no coinciden")
    .required("Confirma la nueva contraseña"),
});

/**
 * Multer storage configuration for avatar uploads
 * @type {multer.StorageEngine}
 * @description Configures file storage location and naming for avatar uploads
 */
const storage = multer.diskStorage({
  /**
   * Destination function for file uploads
   * @param {Object} req - Express request object
   * @param {Object} file - Multer file object
   * @param {Function} cb - Callback function
   */
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "uploads", "avatars");
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  /**
   * Filename function for file uploads
   * @param {Object} req - Express request object with authenticated user
   * @param {Object} file - Multer file object
   * @param {Function} cb - Callback function
   * @description Generates unique filename: userId-timestamp.extension
   */
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp.extension
    const uniqueName = `${req.user.userId}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter for avatar uploads
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 * @description Accepts only specific image formats (JPEG, PNG, GIF, WebP)
 */
const fileFilter = (req, file, cb) => {
  // Accept only specific image formats
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Formato de archivo no válido. Solo se permiten imágenes JPEG, PNG, GIF y WebP."
      ),
      false
    );
  }
};

/**
 * Multer upload configuration
 * @type {multer.Multer}
 * @description Configures file upload middleware with size limits and file filtering
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * User Profile Controller Class
 * @class UserProfileController
 * @description Handles all user profile-related operations including profile management and avatar uploads
 */
class UserProfileController {
  /**
   * Get user profile information
   * @async
   * @method getProfile
   * @param {Object} req - Express request object with authenticated user
   * @param {Object} req.user - Authenticated user data from JWT
   * @param {string} req.user.userId - User ID from JWT token
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: User profile data, 404: User not found, 500: Server error
   * @description Retrieves the authenticated user's profile information (excluding sensitive data)
   * 
   * @example
   * // GET /api/users/me
   * // Authorization: Bearer <jwt_token>
   * // Response:
   * {
   *   "success": true,
   *   "data": {
   *     "id": "user_id",
   *     "firstName": "John",
   *     "lastName": "Doe",
   *     "age": 25,
   *     "email": "john@example.com",
   *     "avatar": "/uploads/avatars/user-123.jpg",
   *     "createdAt": "2023-01-01T00:00:00.000Z",
   *     "updatedAt": "2023-01-01T00:00:00.000Z"
   *   }
   * }
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId).select(
        "-password -resetPasswordToken -resetPasswordExpires -googleId"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          age: user.age,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Update user profile information
   * @async
   * @method updateProfile
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user data from JWT
   * @param {string} req.user.userId - User ID from JWT token
   * @param {Object} req.body - Request body containing profile update data
   * @param {string} req.body.firstName - User's first name
   * @param {string} req.body.lastName - User's last name
   * @param {number} req.body.age - User's age (13-120)
   * @param {string} req.body.email - User's email address
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: Profile updated successfully, 409: Email already exists, 404: User not found, 400: Validation error, 500: Server error
   * @description Updates the authenticated user's profile information with validation
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
  async updateProfile(req, res) {
    try {
      await updateProfileSchema.validate(req.body);
      const userId = req.user.userId;
      const { firstName, lastName, age, email } = req.body;

      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Este correo electrónico ya está registrado",
        });
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          age,
          email: email.toLowerCase().trim(),
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).select("-password -resetPasswordToken -resetPasswordExpires -googleId");

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: {
          id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          age: updatedUser.age,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Change user password
   * @async
   * @method changePassword
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user data from JWT
   * @param {string} req.user.userId - User ID from JWT token
   * @param {Object} req.body - Request body containing password change data
   * @param {string} req.body.currentPassword - User's current password
   * @param {string} req.body.newPassword - New password (min 6 characters)
   * @param {string} req.body.confirmPassword - Confirmation of new password
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: Password changed successfully, 400: Invalid current password or validation error, 404: User not found, 500: Server error
   * @description Changes the authenticated user's password after verifying current password
   * 
   * @example
   * // PUT /api/users/me/password
   * {
   *   "currentPassword": "oldPassword123",
   *   "newPassword": "newPassword456",
   *   "confirmPassword": "newPassword456"
   * }
   */
  async changePassword(req, res) {
    try {
      await changePasswordSchema.validate(req.body);
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "La contraseña actual es incorrecta",
        });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await User.findByIdAndUpdate(userId, {
        password: hashedNewPassword,
        updatedAt: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Delete user account
   * @async
   * @method deleteAccount
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user data from JWT
   * @param {string} req.user.userId - User ID from JWT token
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: Account deleted successfully, 404: User not found, 500: Server error
   * @description Permanently deletes the authenticated user's account
   * @warning This action is irreversible
   * 
   * @example
   * // DELETE /api/users/me
   * // Authorization: Bearer <jwt_token>
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.userId;

      const deletedUser = await User.findByIdAndDelete(userId);
      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cuenta eliminada exitosamente",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Upload user avatar image
   * @async
   * @method uploadAvatar
   * @param {Object} req - Express request object with file upload
   * @param {Object} req.user - Authenticated user data from JWT
   * @param {string} req.user.userId - User ID from JWT token
   * @param {Object} req.file - Multer file object containing uploaded image
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} 200: Avatar updated successfully, 400: No file selected, 404: User not found, 500: Server error
   * @description Uploads and sets a new avatar image for the authenticated user
   * @note Accepts JPEG, PNG, GIF, WebP formats up to 5MB
   * @note Automatically deletes previous avatar file
   * 
   * @example
   * // POST /api/users/me/avatar
   * // Content-Type: multipart/form-data
   * // Body: FormData with 'avatar' field containing image file
   */
  async uploadAvatar(req, res) {
    try {
      const userId = req.user.userId;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No se ha seleccionado ningún archivo",
        });
      }

      // Get current user to check for existing avatar
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Delete old avatar file if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(
          __dirname,
          "..",
          "uploads",
          "avatars",
          path.basename(user.avatar)
        );
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Create avatar URL
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user with new avatar
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          avatar: avatarUrl,
          updatedAt: new Date(),
        },
        { new: true }
      ).select("-password -resetPasswordToken -resetPasswordExpires -googleId");

      res.status(200).json({
        success: true,
        message: "Avatar actualizado exitosamente",
        data: {
          avatar: updatedUser.avatar,
        },
      });
    } catch (error) {
      console.error("Upload avatar error:", error);

      // Delete uploaded file if error occurs
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

// Create single instance of controller
const controller = new UserProfileController();

/**
 * User Controller Routes Export
 * @namespace UserController
 * @description Exported user controller methods with authentication middleware and validation
 * Each route is pre-configured with required middleware for security and data validation
 * 
 * @exports {Object} UserController - Object containing user management routes
 * @example
 * // Import in routes file:
 * import userController from '../controllers/user.controller.js';
 * 
 * // Usage in router:
 * router.get('/me', userController.getProfile);
 * router.put('/me', userController.updateProfile);
 * router.put('/me/password', userController.changePassword);
 * router.delete('/me', userController.deleteAccount);
 * router.post('/me/avatar', userController.uploadAvatar);
 */
export default {
  /**
   * Get user profile with authentication
   * @route GET /api/users/me
   * @middleware requireAuth - JWT authentication required
   */
  getProfile: [requireAuth, (req, res) => controller.getProfile(req, res)],
  
  /**
   * Update user profile with authentication and validation
   * @route PUT /api/users/me
   * @middleware requireAuth - JWT authentication required
   * @middleware validateRequest - Profile data validation
   */
  updateProfile: [
    requireAuth,
    validateRequest(updateProfileSchema),
    (req, res) => controller.updateProfile(req, res),
  ],
  
  /**
   * Change user password with authentication and validation
   * @route PUT /api/users/me/password
   * @middleware requireAuth - JWT authentication required
   * @middleware validateRequest - Password validation
   */
  changePassword: [
    requireAuth,
    validateRequest(changePasswordSchema),
    (req, res) => controller.changePassword(req, res),
  ],
  
  /**
   * Delete user account with authentication
   * @route DELETE /api/users/me
   * @middleware requireAuth - JWT authentication required
   */
  deleteAccount: [
    requireAuth,
    (req, res) => controller.deleteAccount(req, res),
  ],
  
  /**
   * Upload user avatar with authentication and file handling
   * @route POST /api/users/me/avatar
   * @middleware requireAuth - JWT authentication required
   * @middleware upload.single - Multer file upload middleware
   */
  uploadAvatar: [
    requireAuth,
    upload.single("avatar"),
    (req, res) => controller.uploadAvatar(req, res),
  ],
};
