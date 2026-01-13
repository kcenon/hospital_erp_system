# Production Dockerfile for Frontend (Next.js)
# Multi-stage build for optimized image size

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ENABLE_PWA

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ENABLE_PWA=$NEXT_PUBLIC_ENABLE_PWA

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Set port
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001 || exit 1

# Start the application
CMD ["node", "server.js"]
