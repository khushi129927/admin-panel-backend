# ====== STAGE 1: Build React Frontend ======
FROM node:18-alpine AS frontend

# Set base working directory
WORKDIR /app

# ✅ Fix: Copy frontend package files correctly
COPY admin-panel-frontend/package*.json ./admin-panel-frontend/

# Move into frontend dir
WORKDIR /app/admin-panel-frontend

# Install dependencies
RUN npm install

# Copy rest of frontend code
COPY admin-panel-frontend/ ./

# Build production React app
RUN npm run build


# ====== STAGE 2: Setup Backend (Node + Serve React) ======
FROM node:18-alpine

# Set backend working directory
WORKDIR /app

# Copy backend dependencies
COPY package*.json ./
RUN npm install

# Copy backend source code
COPY . ./

# ✅ Copy built frontend into backend folder
COPY --from=frontend /app/admin-panel-frontend/build ./admin-panel-frontend/build

# Port to expose
EXPOSE 8080

# Start backend server
CMD ["node", "index.js"]
