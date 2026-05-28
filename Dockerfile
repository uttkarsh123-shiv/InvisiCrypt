```dockerfile
# ── Stage 1: Build C++ binary ────────────────────────────────────────────────
FROM debian:bookworm-slim AS cpp-builder

WORKDIR /build

# Install compiler + OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopencv-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy entire backend folder
COPY backend ./backend

# Move into backend
WORKDIR /build/backend

# Optional debug
RUN ls -R

# Build Linux executable
RUN cmake -B build -S . -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --config Release

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:18-bookworm-slim

WORKDIR /app

# Install OpenCV runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app files
COPY backend/index.js backend/
COPY views views/
COPY public public/

# Copy compiled C++ binary from builder stage
COPY --from=cpp-builder /build/backend/build/textstego backend/textstego

# Make executable
RUN chmod +x backend/textstego

# Expose app port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start app
CMD ["npm", "start"]
```
