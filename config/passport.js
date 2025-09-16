/**
 * @fileoverview Passport.js Configuration for Google OAuth Authentication
 * @description Configures Passport.js strategies for social authentication in TidyTask application
 * @author TidyTask Team
 * @version 1.0.0
 * @note Currently commented out - Google OAuth functionality is disabled
 */

/**
 * @todo Enable Google OAuth authentication
 * @description The Google OAuth strategy is currently commented out.
 * Uncomment and configure when Google OAuth is needed.
 * 
 * Required environment variables:
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * 
 * @example
 * // To enable Google OAuth:
 * // 1. Uncomment all code below
 * // 2. Set up Google OAuth credentials in Google Cloud Console
 * // 3. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env
 * // 4. Update frontend to include Google login button
 */

// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import User from "../models/user.model.js";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load environment variables
// dotenv.config({ path: path.join(__dirname, "..", ".env") });

// // Debug log
// console.log("Google OAuth Config:", {
//   clientID: process.env.GOOGLE_CLIENT_ID ? "Set" : "Missing",
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Missing",
// });

/**
 * Google OAuth Strategy Configuration
 * @description Configures Google OAuth 2.0 strategy for Passport.js
 * @param {string} clientID - Google OAuth client ID from environment variables
 * @param {string} clientSecret - Google OAuth client secret from environment variables
 * @param {string} callbackURL - URL where Google redirects after authentication
 * @param {Function} verify - Verification callback function
 */
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/api/auth/google/callback",
//     },
//     /**
//      * Google OAuth verification callback
//      * @async
//      * @param {string} accessToken - Google access token
//      * @param {string} refreshToken - Google refresh token
//      * @param {Object} profile - User profile from Google
//      * @param {Function} done - Passport done callback
//      * @returns {Promise<void>} Calls done with user or error
//      * @description Handles user creation or retrieval after Google authentication
//      */
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Check if user already exists
//         let user = await User.findOne({ email: profile.emails[0].value });

//         if (!user) {
//           // Create new user if doesn't exist
//           user = await User.create({
//             email: profile.emails[0].value,
//             firstName: profile.name.givenName,
//             lastName: profile.name.familyName,
//             password: "google-auth-" + Math.random().toString(36).slice(-8),
//             age: 0, // Default value
//             googleId: profile.id,
//           });
//         }

//         return done(null, user);
//       } catch (error) {
//         return done(error, null);
//       }
//     }
//   )
// );

/**
 * Serialize user for session storage
 * @param {Object} user - User object to serialize
 * @param {Function} done - Passport done callback
 * @description Stores user ID in session
 */
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

/**
 * Deserialize user from session storage
 * @async
 * @param {string} id - User ID from session
 * @param {Function} done - Passport done callback
 * @returns {Promise<void>} Calls done with user or error
 * @description Retrieves user object from database using stored ID
 */
// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

/**
 * Passport instance
 * @exports passport
 * @type {Object}
 * @note Currently commented out - returns undefined
 */
// export default passport;
