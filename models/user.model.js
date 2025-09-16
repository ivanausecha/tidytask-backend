/**
 * @fileoverview User Model Definition for TidyTask Application
 * @description Defines the MongoDB schema for user entities with authentication and profile data
 * @author TidyTask Team
 * @version 1.0.0
 */

import mongoose from "mongoose";

/**
 * User Schema Definition
 * @description Mongoose schema for user documents in the database
 * 
 * @typedef {Object} UserSchema
 * @property {string} firstName - User's first name (required, trimmed)
 * @property {string} lastName - User's last name (required, trimmed)
 * @property {string} email - User's email address (required, unique, trimmed)
 * @property {string} password - User's hashed password (required)
 * @property {string} resetPasswordToken - Token for password reset functionality
 * @property {Date} resetPasswordExpires - Expiration date for password reset token
 * @property {number} age - User's age (required)
 * @property {string} googleId - Google OAuth ID for social login (sparse index)
 * @property {string} avatar - Path or URL to user's avatar image
 * @property {Date} createdAt - Timestamp when user was created (auto-generated)
 * @property {Date} updatedAt - Timestamp when user was last updated (auto-generated)
 */
const userSchema = new mongoose.Schema(
  {
    /**
     * User's first name
     * @type {string}
     * @required
     * @description The user's given name
     */
    firstName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    
    /**
     * User's last name
     * @type {string}
     * @required
     * @description The user's family name
     */
    lastName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    
    /**
     * User's email address
     * @type {string}
     * @required
     * @unique
     * @description Unique email address used for authentication and communication
     */
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    
    /**
     * User's password
     * @type {string}
     * @required
     * @description Hashed password for authentication (bcrypt)
     */
    password: { 
      type: String, 
      required: true 
    },
    
    /**
     * Password reset token
     * @type {string}
     * @optional
     * @description Temporary token generated for password reset functionality
     */
    resetPasswordToken: String,
    
    /**
     * Password reset token expiration
     * @type {Date}
     * @optional
     * @description Expiration timestamp for the password reset token
     */
    resetPasswordExpires: Date,
    
    /**
     * User's age
     * @type {number}
     * @required
     * @description The user's age in years
     */
    age: { 
      type: Number, 
      required: true 
    },
    
    /**
     * Google OAuth ID
     * @type {string}
     * @optional
     * @sparse
     * @description Unique identifier from Google OAuth for social login
     */
    googleId: { 
      type: String, 
      sparse: true 
    },
    
    /**
     * User avatar
     * @type {string}
     * @default null
     * @description File path or URL to the user's profile picture
     */
    avatar: { 
      type: String, 
      default: null 
    }
  },
  { 
    /**
     * Schema options
     * @description Automatically adds createdAt and updatedAt timestamps
     */
    timestamps: true 
  }
);

/**
 * User Model
 * @description Mongoose model for user documents
 * @type {mongoose.Model<UserSchema>}
 * @exports User
 */
export default mongoose.model("User", userSchema);
