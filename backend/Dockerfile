# Backend Dockerfile for RentEase API
FROM node:20-alpine

# Install wget for health check
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --spider -q http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
