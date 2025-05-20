# ====== STAGE 1: Build React Frontend ======
FROM node:18-alpine AS frontend

# 👇 Start inside /app
WORKDIR /app

# ✅ Copy ONLY the frontend package.json files into /app
COPY admin-panel-frontend/package*.json ./

# ✅ Install deps BEFORE copying rest for cache efficiency
RUN npm install

# ✅ Now copy full frontend source into /app
COPY admin-panel-frontend/ ./

# ✅ Build the React app
RUN npm run build


# ====== STAGE 2: Setup Backend (Node + Serve React) ======
FROM node:18-alpine

WORKDIR /app

# ✅ Backend package files + install
COPY package*.json ./
RUN npm install

# ✅ Copy backend code
COPY . ./

# ✅ Copy built React app from stage 1
COPY --from=frontend /app/build ./admin-panel-frontend/build

# ✅ Expose backend port
EXPOSE 8080

# ✅ Start Express server
CMD ["node", "index.js"]
