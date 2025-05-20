# ====== STAGE 1: Build React Frontend ======
FROM node:18-alpine AS frontend

WORKDIR /app

# Copy React package.json and install
COPY admin-panel-frontend/package*.json ./admin-panel-frontend/
WORKDIR /app/admin-panel-frontend
RUN npm install

# Copy and build frontend
COPY admin-panel-frontend/ ./
RUN npm run build


# ====== STAGE 2: Setup Backend (Node + Serve React) ======
FROM node:18-alpine

WORKDIR /app

# Copy backend package files and install
COPY package*.json ./
RUN npm install

# Copy backend files
COPY . ./

# Move built frontend from previous stage
COPY --from=frontend /app/admin-panel-frontend/build ./admin-panel-frontend/build

# Expose backend port
EXPOSE 8080

# Start Express server
CMD ["node", "index.js"]
