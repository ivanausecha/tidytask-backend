import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
//import passport from "passport";
import "./config/passport.js";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/tasks.routes.js";
import userRoutes from "./routes/user.routes.js";

// Configurar path para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Definir orígenes permitidos para CORS
let allowedOrigins = [];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

// En producción, usar la URL del frontend definida en .env
if (process.env.NODE_ENV === "production") {
  allowedOrigins = [process.env.FRONTEND_URL];
} else {
  // En desarrollo, permitir localhost con varios puertos comunes
  allowedOrigins = [
    "http://localhost:5173", // Vite default
    "http://localhost:3000", // Common React port
    "http://localhost:8080", // Common dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
  ];
}

console.log("Allowed CORS origins:", allowedOrigins);

// Connect to database
connectDB();

// Debug environment variables
console.log("Environment Check:");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✓ Loaded" : "✗ Missing");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✓ Loaded" : "✗ Missing");
console.log("PORT:", process.env.PORT ? "✓ Loaded" : "✗ Missing");
console.log(
  "FRONTEND_URL:",
  process.env.FRONTEND_URL ? "✓ Loaded" : "✗ Missing"
);

// Verify environment variables are loaded
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Configuración CORS mejorada
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
      if (!origin) {
        return callback(null, true);
      }

      // Verificar si el origen está en la lista de permitidos
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // En desarrollo, permitir todos los orígenes para facilitar las pruebas
        if (process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(new Error(`Origen no permitido por CORS: ${origin}`));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Middleware
app.use(express.json());
// Serve static files for uploaded avatars
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(passport.initialize());
// app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Task Manager Backend is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

export default app;
