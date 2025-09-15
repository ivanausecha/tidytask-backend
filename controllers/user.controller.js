/**
 * User Profile Controller
 * Handles user profile operations: view, update, delete, avatar upload
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

const secretKey = process.env.JWT_SECRET;

/**
 * Validation schema for profile update
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
 * Multer configuration for avatar uploads
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "uploads", "avatars");
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp.extension
    const uniqueName = `${req.user.userId}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

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

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * User Profile Controller Class
 */
class UserProfileController {
  /**
   * Get user profile
   * GET /api/users/me
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
   * Update user profile
   * PUT /api/users/me
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
   * PUT /api/users/me/password
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
   * DELETE /api/users/me
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
   * Upload user avatar
   * POST /api/users/me/avatar
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
 * Export controller methods wrapped with authentication middleware
 */
export default {
  getProfile: [requireAuth, (req, res) => controller.getProfile(req, res)],
  updateProfile: [
    requireAuth,
    validateRequest(updateProfileSchema),
    (req, res) => controller.updateProfile(req, res),
  ],
  changePassword: [
    requireAuth,
    validateRequest(changePasswordSchema),
    (req, res) => controller.changePassword(req, res),
  ],
  deleteAccount: [
    requireAuth,
    (req, res) => controller.deleteAccount(req, res),
  ],
  uploadAvatar: [
    requireAuth,
    upload.single("avatar"),
    (req, res) => controller.uploadAvatar(req, res),
  ],
};
