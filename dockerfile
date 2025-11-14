# -----------------------------
# Stage 1: Build C++ binary
# -----------------------------
FROM ubuntu:22.04 AS builder

RUN apt-get update && \
    apt-get install -y cmake g++ openssl libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copy the entire backend folder (contains CMakeLists, src/, public/, views/, index.js)
COPY backend/ .

# Build the C++ binary
RUN cmake -S . -B build && cmake --build build

# -----------------------------
# Stage 2: Run Node.js server
# -----------------------------
FROM node:18-slim

WORKDIR /app

# Install root-level Node dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend app files (Node.js + views + public)
COPY backend ./backend

# Copy compiled C++ binary produced in Stage 1
COPY --from=builder /app/backend/build/textstego ./backend/textstego

# Ensure binary is executable
RUN chmod +x ./backend/textstego

EXPOSE 3000

CMD ["node", "backend/index.js"]
