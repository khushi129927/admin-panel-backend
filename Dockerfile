# ====== STAGE 1: Build React Frontend ======
FROM node:18-alpine AS frontend

WORKDIR /app/admin-panel-frontend

# ✅ Copy ONLY frontend package.json files FIRST
COPY admin-panel-frontend/package*.json ./

# ✅ Install dependencies
RUN npm install

# ✅ Now copy the rest of the frontend project
COPY admin-panel-frontend/ ./

# ✅ Build the React app
RUN npm run build


# ====== STAGE 2: Setup Backend (Node + Serve React) ======
FROM node:18-alpine

WORKDIR /app

# ✅ Copy backend package files and install
COPY package*.json ./
RUN npm install

# ✅ Copy entire backend project
COPY . ./

# ✅ Copy React build from frontend stage
COPY --from=frontend /app/admin-panel-frontend/build ./admin-panel-frontend/build

# ✅ Expose backend port
EXPOSE 8080

# ✅ Run Express server
CMD ["node", "index.js"]
