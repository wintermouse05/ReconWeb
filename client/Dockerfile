# ============================================
# ReconWeb Client Dockerfile
# Multi-stage build for React/Vite app
# ============================================

# Stage 1: Build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build arguments for API URL (can be overridden at build time)
ARG VITE_API_BASE_URL=http://localhost:5000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add non-root user
RUN addgroup -g 1001 -S reconweb && \
    adduser -S -D -H -u 1001 -h /usr/share/nginx/html -s /sbin/nologin -G reconweb reconweb && \
    chown -R reconweb:reconweb /usr/share/nginx/html && \
    chown -R reconweb:reconweb /var/cache/nginx && \
    chown -R reconweb:reconweb /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R reconweb:reconweb /var/run/nginx.pid

# Switch to non-root user
USER reconweb

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
