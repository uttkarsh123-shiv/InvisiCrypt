# Build stage for C++ binary
FROM gcc:12 AS cpp-builder

WORKDIR /build

# Install CMake
RUN apt-get update && apt-get install -y cmake && rm -rf /var/lib/apt/lists/*

# Copy C++ source files
COPY backend/CMakeLists.txt backend/CMakeLists.txt
COPY backend/src backend/src

# Build C++ binary
WORKDIR /build/backend
RUN cmake . && make

# Final stage
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy application files
COPY backend/index.js backend/
COPY views views/
COPY public public/

# Copy built C++ binary from builder stage
COPY --from=cpp-builder /build/backend/textstego backend/textstego

# Make binary executable
RUN chmod +x backend/textstego

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
