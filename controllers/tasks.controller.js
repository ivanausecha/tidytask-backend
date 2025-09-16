// Import required middleware and validation library
import { requireAuth, validateRequest } from '../utils/decorators.js';
import * as yup from 'yup';
import Task from '../models/task.model.js';
import User from '../models/user.model.js';

// Define validation schema for task creation
// Ensures all required fields are present and valid
const createTaskSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  detail: yup.string().nullable(),
  date: yup.date().required('Date is required'),
  time: yup.string()
    .nullable()
    .test('valid-time-format', 'Time must be in HH:MM format (24-hour)', function(value) {
      // Si no hay valor, es válido (nullable)
      if (!value || value === null || value === '') return true;
      
      // Verificar formato estricto HH:MM
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(value)) {
        return false;
      }
      
      // Verificar que las horas y minutos sean válidos
      const [hours, minutes] = value.split(':').map(Number);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    })
    .test('time-with-date', 'Time requires a valid date', function(value) {
      // Si hay time, debe haber date válida
      if (value && !this.parent.date) {
        return false;
      }
      return true;
    }),
  status: yup.string().oneOf(['Por hacer', 'Haciendo', 'Hecho']).default('Por hacer')
});

// Define validation schema for task updates
// All fields are optional since it's a partial update
const updateTaskSchema = yup.object().shape({
  title: yup.string(),
  detail: yup.string().nullable(),
  date: yup.date(),
  time: yup.string()
    .nullable()
    .test('valid-time-format', 'Time must be in HH:MM format (24-hour)', function(value) {
      // Si no hay valor, es válido (nullable)
      if (!value || value === null || value === '') return true;
      
      // Verificar formato estricto HH:MM
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(value)) {
        return false;
      }
      
      // Verificar que las horas y minutos sean válidos
      const [hours, minutes] = value.split(':').map(Number);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    }),
  status: yup.string().oneOf(['Por hacer', 'Haciendo', 'Hecho'])
});

/**
 * Task Controller Class
 * Handles all task-related operations
 */
class TaskController {
  /**
   * Creates a new task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Created task or error message
   */
  async createTask(req, res) {
    try {
      // Manual validation to ensure it works
      console.log('📝 Validating request body:', req.body);
      
      // Validate request body against schema
      await createTaskSchema.validate(req.body, { abortEarly: false });
      
      const userId = req.user.userId;
      const { title, detail, date, time, status } = req.body;

      console.log('✅ Validation passed, creating task with time:', time);

      // Create new task in database
      const newTask = new Task({
        title,
        detail,
        date,
        time: time || null, // Permitir null si no se proporciona
        status: status || 'Por hacer',
        user: userId
      });

      const savedTask = await newTask.save();
      const populatedTask = await Task.findById(savedTask._id).populate('user', 'firstName lastName email');

      res.status(201).json({
        message: "Task created successfully",
        task: populatedTask
      });

    } catch (error) {
      console.error('❌ Create task error:', error);
      
      if (error.name === 'ValidationError' || error.errors) {
        // Yup validation error
        const message = error.errors ? error.errors.join(', ') : error.message;
        return res.status(400).json({ 
          message: `Validation failed: ${message}`,
          errors: error.errors || [error.message]
        });
      }
      
      if (error.name === 'MongoError' || error.name === 'CastError') {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Internal server error creating task" });
    }
  }

  /**
   * Retrieves all tasks for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Array} List of user's tasks
   */
  async getTasks(req, res) {
    try {
      const userId = req.user.userId;
      const userTasks = await Task.find({ user: userId }).populate('user', 'firstName lastName email');
      
      res.status(200).json({
        message: "Tasks retrieved successfully",
        tasks: userTasks
      });

    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ message: "Internal server error retrieving tasks" });
    }
  }

  /**
   * Retrieves a specific task by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Task details or error message
   */
  async getTaskById(req, res) {
    try {
      const userId = req.user.userId;
      const taskId = req.params.id;
      
      // Find task that belongs to the authenticated user
      const task = await Task.findOne({ _id: taskId, user: userId }).populate('user', 'firstName lastName email');
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.status(200).json({
        message: "Task retrieved successfully",
        task
      });

    } catch (error) {
      console.error('Get task by ID error:', error);
      res.status(500).json({ message: "Internal server error retrieving task" });
    }
  }

  /**
   * Updates an existing task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Updated task or error message
   */
  async updateTask(req, res) {
    try {
      // Manual validation to ensure it works
      console.log('📝 Validating update request body:', req.body);
      
      // Validate update data
      await updateTaskSchema.validate(req.body, { abortEarly: false });
      
      const userId = req.user.userId;
      const taskId = req.params.id;
      const updateData = req.body;

      console.log('✅ Update validation passed, updating task with time:', updateData.time);

      // Find and update task that belongs to the authenticated user
      const updatedTask = await Task.findOneAndUpdate(
        { _id: taskId, user: userId },
        updateData,
        { new: true, runValidators: true }
      ).populate('user', 'firstName lastName email');
      
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }

      res.status(200).json({
        message: "Task updated successfully",
        task: updatedTask
      });

    } catch (error) {
      console.error('❌ Update task error:', error);
      
      if (error.name === 'ValidationError' || error.errors) {
        // Yup validation error
        const message = error.errors ? error.errors.join(', ') : error.message;
        return res.status(400).json({ 
          message: `Validation failed: ${message}`,
          errors: error.errors || [error.message]
        });
      }
      
      if (error.name === 'MongoError' || error.name === 'CastError') {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Internal server error updating task" });
    }
  }

  /**
   * Deletes a task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Success status or error message
   */
  async deleteTask(req, res) {
    try {
      const userId = req.user.userId;
      const taskId = req.params.id;

      // Find and delete task that belongs to the authenticated user
      const deletedTask = await Task.findOneAndDelete({ _id: taskId, user: userId });
      
      if (!deletedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }

      res.status(200).json({
        message: "Task deleted successfully"
      });

    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ message: "Internal server error deleting task" });
    }
  }
}

// Create single instance of controller
const controller = new TaskController();

// Export controller methods wrapped with authentication middleware only
// Validation is now handled manually inside each method
export default {
  createTask: [
    requireAuth, // Ensures user is authenticated
    (req, res) => controller.createTask(req, res)
  ],
  getTasks: [
    requireAuth,
    (req, res) => controller.getTasks(req, res)
  ],
  getTaskById: [
    requireAuth,
    (req, res) => controller.getTaskById(req, res)
  ],
  updateTask: [
    requireAuth,
    (req, res) => controller.updateTask(req, res)
  ],
  deleteTask: [
    requireAuth,
    (req, res) => controller.deleteTask(req, res)
  ]
};