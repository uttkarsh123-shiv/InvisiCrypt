# ── Stage 1: Build C++ binary ─────────────────────────────────────────────────
FROM debian:bookworm-slim AS cpp-builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopencv-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY backend/CMakeLists.txt backend/CMakeLists.txt
COPY backend/src backend/src

WORKDIR /build/backend
RUN cmake -B build -S . -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --config Release

# ── Stage 2: Node.js runtime ──────────────────────────────────────────────────
FROM node:18-bookworm-slim

WORKDIR /app

# Install OpenCV runtime libraries (same base as builder — no version mismatch)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY backend/index.js backend/
COPY views views/
COPY public public/

COPY --from=cpp-builder /build/backend/build/textstego backend/textstego
RUN chmod +x backend/textstego

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "start"]
