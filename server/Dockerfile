# ============================================
# ReconWeb Server Dockerfile
# Multi-stage build with security tools
# ============================================

# Stage 1: Build Nuclei from source
FROM golang:1.22-bookworm AS nuclei-builder
RUN go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Stage 2: Main application
FROM node:20-bookworm-slim AS base

WORKDIR /app

# Install system dependencies and security tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Basic tools
    curl \
    wget \
    git \
    ca-certificates \
    # Security scanners available in apt
    nikto \
    gobuster \
    sqlmap \
    wpscan \
    # Python for XSStrike
    python3 \
    python3-pip \
    python3-venv \
    # Ruby for WPScan (already included with wpscan)
    && rm -rf /var/lib/apt/lists/*

# Install XSStrike
RUN pip3 install --break-system-packages xsstrike || \
    (git clone https://github.com/s0md3v/XSStrike.git /opt/XSStrike && \
     chmod +x /opt/XSStrike/xsstrike.py && \
     ln -sf /opt/XSStrike/xsstrike.py /usr/local/bin/xsstrike)

# Copy Nuclei from builder stage
COPY --from=nuclei-builder /go/bin/nuclei /usr/local/bin/nuclei

# Update Nuclei templates
RUN nuclei -update-templates || true

# Create non-root user for security
RUN groupadd -r reconweb && useradd -r -g reconweb reconweb

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY src ./src

# Set ownership
RUN chown -R reconweb:reconweb /app

# Switch to non-root user
USER reconweb

# Environment
ENV NODE_ENV=production
ENV PATH="/usr/local/bin:$PATH"

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/index.js"]
