# -----------------------------
# Stage 1: Build C++ binary
# -----------------------------
FROM ubuntu:22.04 AS builder

RUN apt-get update && \
    apt-get install -y cmake g++ openssl libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/ ./backend/

WORKDIR /app/backend
RUN cmake -S . -B build && cmake --build build

# -----------------------------
# Stage 2: Node.js Server
# -----------------------------
FROM node:18-slim

WORKDIR /app

# Copy ROOT package.json because your package.json is NOT inside backend
COPY package*.json ./

RUN npm install --omit=dev

# copy backend folder
COPY backend ./backend

# copy built C++ binary from stage 1
COPY --from=builder /app/backend/build ./backend/build

EXPOSE 3000

CMD ["node", "backend/index.js"]
