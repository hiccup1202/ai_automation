# Dockerfile for NestJS Backend
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for better compatibility
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    openssl-dev

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application code (excluding dist as per .dockerignore)
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Debug: Show what was actually created
RUN echo "=== Build completed, checking output ===" && \
    ls -la /app/ && \
    echo "=== /app/dist contents ===" && \
    ls -laR /app/dist/ && \
    echo "=== Searching for main.js ===" && \
    find /app -name "main.js" -type f

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/products', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command with delay to ensure MySQL is fully ready
# Auto-seed database on startup (perfect for POC/demo)
CMD ["sh", "-c", "sleep 5 && npx prisma migrate deploy && npm run prisma:seed && npm run start:prod"]
