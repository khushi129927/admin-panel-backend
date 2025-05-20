# ============================
# STAGE 1: Build React frontend
# ============================
FROM node:18-alpine AS frontend

WORKDIR /app

# Copy only package files for better caching
COPY admin-panel-frontend/package*.json ./admin-panel-frontend/

# Set working directory to the frontend app
WORKDIR /app/admin-panel-frontend

# Install React dependencies
RUN npm install

# Copy rest of the frontend
COPY admin-panel-frontend/ ./

# Build the React app
RUN npm run build

# ============================
# STAGE 2: Build Node backend & inject React
# ============================
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy only backend package files & install
COPY package*.json ./
RUN npm install

# Copy rest of the backend
COPY . ./

# Inject React build into backend
COPY --from=frontend /app/admin-panel-frontend/build ./admin-panel-frontend/build

# Expose API port
EXPOSE 8080

# Run server
CMD ["node", "index.js"]
