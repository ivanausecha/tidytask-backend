/**
 * @fileoverview Task Model Definition for TidyTask Application
 * @description Defines the MongoDB schema for task entities with validation rules
 * @author TidyTask Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';

/**
 * Task Schema Definition
 * @description Mongoose schema for task documents in the database
 * 
 * @typedef {Object} TaskSchema
 * @property {string} title - The task title (required, trimmed)
 * @property {string} detail - Optional task description (trimmed)
 * @property {Date} date - Task due date (required)
 * @property {string} time - Task time in HH:MM format (optional, validated)
 * @property {string} status - Task status with predefined values
 * @property {ObjectId} user - Reference to the user who owns this task (required)
 * @property {Date} createdAt - Timestamp when task was created (auto-generated)
 * @property {Date} updatedAt - Timestamp when task was last updated (auto-generated)
 */
const taskSchema = new mongoose.Schema({
    /**
     * Task title
     * @type {string}
     * @required
     * @description The main title or name of the task
     */
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    
    /**
     * Task description/details
     * @type {string}
     * @optional
     * @description Additional details or description for the task
     */
    detail: { 
        type: String, 
        trim: true 
    },
    
    /**
     * Task due date
     * @type {Date}
     * @required
     * @description The date when the task should be completed
     */
    date: { 
        type: Date, 
        required: true 
    },
    
    /**
     * Task time
     * @type {string}
     * @optional
     * @description Time in HH:MM format (24-hour). Validates format and time ranges.
     * @example "14:30", "09:15", "23:59"
     * @validation Must match HH:MM pattern with valid hours (0-23) and minutes (0-59)
     */
    time: { 
        type: String, 
        trim: true,
        validate: {
            /**
             * Custom validator for time format
             * @param {string} v - Time value to validate
             * @returns {boolean} True if valid or null/undefined, false otherwise
             * @description Validates time format as HH:MM (24-hour) with proper ranges
             */
            validator: function(v) {
                // Allow null/undefined for backward compatibility
                if (!v) return true;
                // Validate HH:MM format (24-hour)
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Time must be in HH:MM format (24-hour)'
        }
    },
    
    /**
     * Task status
     * @type {string}
     * @default "Por hacer"
     * @enum {string} "Por hacer" | "Haciendo" | "Hecho"
     * @description Current status of the task
     */
    status: { 
        type: String, 
        enum: ['Por hacer', 'Haciendo', 'Hecho'], 
        default: 'Por hacer' 
    },
    
    /**
     * Task owner
     * @type {ObjectId}
     * @required
     * @ref User
     * @description Reference to the user who owns this task
     */
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }
}, { 
    /**
     * Schema options
     * @description Automatically adds createdAt and updatedAt timestamps
     */
    timestamps: true 
});

/**
 * Task Model
 * @description Mongoose model for task documents
 * @type {mongoose.Model<TaskSchema>}
 * @exports Task
 */
export default mongoose.model('Task', taskSchema);