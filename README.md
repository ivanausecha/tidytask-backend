# TidyTask Backend - API REST

Este repositorio contiene la API REST del proyecto TidyTask, desarrollada con Node.js y Express.

## Características

- **Autenticación de Usuarios**: Sistema seguro con JWT y opciones para OAuth.
- **API RESTful**: Endpoints para gestión completa de tareas.
- **Base de Datos**: Conexión con MongoDB.
- **Seguridad**: Implementación de CORS, validación de datos y manejo de errores.

## Stack Tecnológico

- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: MongoDB Atlas
- **Autenticación**: JWT, Passport.js
- **Validación**: Yup

## Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn
- MongoDB (local o en la nube)

## Instalación

1. Clona el repositorio:

   ```
   git clone <url-del-repositorio-backend>
   cd tidytask-backend
   ```

2. Instala las dependencias:

   ```
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` basado en `.env.example`

## Ejecución

### Desarrollo

```
npm run dev
```

### Producción

```
npm start
```

## Estructura del Proyecto

```
tidytask-backend/
├── config/          # Configuración de DB, auth, etc.
├── controllers/     # Controladores de la API
├── models/          # Modelos de datos
├── routes/          # Definición de rutas
├── services/        # Servicios (email, etc.)
├── utils/           # Utilidades y helpers
├── app.js           # Configuración de Express
├── index.js         # Punto de entrada
└── package.json
```

## Endpoints de la API

La API está disponible en `http://localhost:3001/api` en desarrollo.

### Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Información del usuario actual

### Tareas

- `GET /api/tasks` - Obtener todas las tareas del usuario
- `GET /api/tasks/:id` - Obtener una tarea específica
- `POST /api/tasks` - Crear una nueva tarea
- `PUT /api/tasks/:id` - Actualizar una tarea
- `DELETE /api/tasks/:id` - Eliminar una tarea

## Despliegue

Para desplegar en producción:

1. Configura las variables de entorno para producción
2. Construye la aplicación con `npm run build`
3. Inicia el servidor con `npm start`

## Variables de Entorno

| Variable     | Descripción                      | Requerida          |
| ------------ | -------------------------------- | ------------------ |
| PORT         | Puerto del servidor              | No (Default: 3001) |
| MONGODB_URI  | URL de conexión a MongoDB        | Sí                 |
| JWT_SECRET   | Clave secreta para JWT           | Sí                 |
| FRONTEND_URL | URL del frontend para CORS       | Sí                 |
| NODE_ENV     | Entorno (development/production) | No                 |
