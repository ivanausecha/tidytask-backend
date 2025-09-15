FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Crear directorio para uploads si no existe
RUN mkdir -p uploads

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar permisos del directorio uploads
RUN chown -R nodejs:nodejs /app/uploads
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer el puerto que usa tu aplicación (debería coincidir con tu server.js)
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["npm", "start"]