import { Router } from "express";
import UserController from "../controllers/user.controller.js";

const router = Router();

// GET /api/users/me - Get user profile
router.get("/me", ...UserController.getProfile);

// PUT /api/users/me - Update user profile
router.put("/me", ...UserController.updateProfile);

// PUT /api/users/me/password - Change user password
router.put("/me/password", ...UserController.changePassword);

// POST /api/users/me/avatar - Upload user avatar
router.post("/me/avatar", ...UserController.uploadAvatar);

// DELETE /api/users/me - Delete user account
router.delete("/me", ...UserController.deleteAccount);

export default router;
