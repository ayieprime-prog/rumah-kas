# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY frontend ./
RUN npm run build

# Stage 2: Backend + serve frontend build
FROM node:22-alpine

WORKDIR /app

# Copy backend
COPY backend ./backend

WORKDIR /app/backend

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Seed dummy data (optional - will fail silently if DB not ready, that's ok)
RUN npm run seed:dummy || echo "⚠️ Seed skipped - database not yet ready, can run manually"

# Copy built frontend into place for Express to serve
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
