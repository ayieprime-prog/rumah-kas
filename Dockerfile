# Build stage
FROM node:22-alpine

WORKDIR /app

# Copy backend
COPY backend ./backend

WORKDIR /app/backend

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
