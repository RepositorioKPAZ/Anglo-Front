# Imagen base con Node 20.11.0
FROM node:20.11.0

# Crear directorio de trabajo
WORKDIR /app

# Copiar los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar la app Next.js para producción
RUN npm run build

# Exponer puerto (Next.js usa 3000 por defecto)
EXPOSE 3000

# Comando para arrancar la app
CMD ["npm", "run", "start"]
