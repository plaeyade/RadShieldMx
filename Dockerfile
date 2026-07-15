# RadShield-MX Dockerfile -- Multi-stage build for production
# Punto 3: Self-hosting con Docker

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

# Install serve for static files
RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/dist /app/dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start server
CMD ["serve", "-s", "dist", "-l", "3000"]
