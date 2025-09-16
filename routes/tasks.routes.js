/**
 * @fileoverview Task Management Routes
 * @description Defines all task-related API endpoints for CRUD operations
 * @version 1.0.0
 * @author TidyTask Backend Team
 * @since 2024-01-01
 */

import { Router } from 'express';
import TaskController from '../controllers/tasks.controller.js';

/**
 * Express router for task routes
 * @type {Router}
 * @description Handles all task-related HTTP requests with authentication
 */
const router = Router();

/**
 * Create New Task Route
 * @route POST /tasks/
 * @description Creates a new task for the authenticated user
 * @middleware requireAuth - JWT authentication required
 * @middleware validateRequest - Task data validation
 * @body {Object} taskData - Task creation data
 * @body {string} taskData.title - Task title (required)
 * @body {string} [taskData.description] - Task description (optional)
 * @body {string} [taskData.time] - Task time in HH:MM format (optional)
 * @body {string} [taskData.status="pending"] - Task status: pending, in-progress, completed
 * @returns {Object} 201: Task created successfully
 * @returns {Object} 400: Validation error
 * @returns {Object} 401: Authentication required
 * 
 * @example
 * // POST /api/tasks
 * {
 *   "title": "Complete project documentation",
 *   "description": "Write comprehensive docs for the API",
 *   "time": "14:30",
 *   "status": "pending"
 * }
 */
router.post('/', ...TaskController.createTask);

/**
 * Get All User Tasks Route
 * @route GET /tasks/
 * @description Retrieves all tasks for the authenticated user with optional filtering
 * @middleware requireAuth - JWT authentication required
 * @query {string} [status] - Filter by task status: pending, in-progress, completed
 * @query {string} [search] - Search tasks by title or description
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=10] - Number of tasks per page
 * @query {string} [sortBy=createdAt] - Sort field: title, createdAt, updatedAt, status
 * @query {string} [sortOrder=desc] - Sort order: asc, desc
 * @returns {Object} 200: Array of user tasks with pagination info
 * @returns {Object} 401: Authentication required
 * 
 * @example
 * // GET /api/tasks?status=pending&page=1&limit=5&sortBy=createdAt&sortOrder=desc
 * // Response:
 * {
 *   "success": true,
 *   "data": [...tasks],
 *   "pagination": {
 *     "currentPage": 1,
 *     "totalPages": 3,
 *     "totalTasks": 15,
 *     "hasNext": true,
 *     "hasPrev": false
 *   }
 * }
 */
router.get('/', ...TaskController.getTasks);

/**
 * Get Single Task Route
 * @route GET /tasks/:id
 * @description Retrieves a specific task by ID for the authenticated user
 * @middleware requireAuth - JWT authentication required
 * @param {string} id - Task ID (MongoDB ObjectId)
 * @returns {Object} 200: Task data
 * @returns {Object} 404: Task not found
 * @returns {Object} 401: Authentication required
 * @returns {Object} 403: Task belongs to another user
 * 
 * @example
 * // GET /api/tasks/507f1f77bcf86cd799439011
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "title": "Complete project",
 *     "description": "Finish the task management system",
 *     "time": "14:30",
 *     "status": "in-progress",
 *     "userId": "507f1f77bcf86cd799439012",
 *     "createdAt": "2024-01-01T10:00:00.000Z",
 *     "updatedAt": "2024-01-01T12:00:00.000Z"
 *   }
 * }
 */
router.get('/:id', ...TaskController.getTaskById);

/**
 * Update Task Route
 * @route PUT /tasks/:id
 * @description Updates a specific task for the authenticated user
 * @middleware requireAuth - JWT authentication required
 * @middleware validateRequest - Task update validation
 * @param {string} id - Task ID (MongoDB ObjectId)
 * @body {Object} updateData - Task update data
 * @body {string} [updateData.title] - Updated task title
 * @body {string} [updateData.description] - Updated task description
 * @body {string} [updateData.time] - Updated task time in HH:MM format
 * @body {string} [updateData.status] - Updated task status
 * @returns {Object} 200: Task updated successfully
 * @returns {Object} 404: Task not found
 * @returns {Object} 400: Validation error
 * @returns {Object} 401: Authentication required
 * @returns {Object} 403: Task belongs to another user
 * 
 * @example
 * // PUT /api/tasks/507f1f77bcf86cd799439011
 * {
 *   "title": "Complete project documentation",
 *   "status": "completed",
 *   "time": "16:00"
 * }
 */
router.put('/:id', ...TaskController.updateTask);

/**
 * Delete Task Route
 * @route DELETE /tasks/:id
 * @description Deletes a specific task for the authenticated user
 * @middleware requireAuth - JWT authentication required
 * @param {string} id - Task ID (MongoDB ObjectId)
 * @returns {Object} 200: Task deleted successfully
 * @returns {Object} 404: Task not found
 * @returns {Object} 401: Authentication required
 * @returns {Object} 403: Task belongs to another user
 * 
 * @example
 * // DELETE /api/tasks/507f1f77bcf86cd799439011
 * // Response:
 * {
 *   "success": true,
 *   "message": "Tarea eliminada exitosamente"
 * }
 */
router.delete('/:id', ...TaskController.deleteTask);

/**
 * Task Routes Export
 * @exports {Router} router - Express router with task management endpoints
 * @description All routes are prefixed with '/tasks' and require authentication
 * 
 * @example
 * // In app.js:
 * import taskRoutes from './routes/tasks.routes.js';
 * app.use('/api/tasks', taskRoutes);
 * 
 * // Available endpoints:
 * // POST /api/tasks/           - Create new task
 * // GET /api/tasks/            - Get all user tasks
 * // GET /api/tasks/:id         - Get specific task
 * // PUT /api/tasks/:id         - Update specific task
 * // DELETE /api/tasks/:id      - Delete specific task
 */
export default router;