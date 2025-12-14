# Multi-stage build for the API + Python embedding pipeline

# Build stage: compile TypeScript to dist
FROM node:20-slim AS builder
WORKDIR /app/server
COPY server/package*.json server/tsconfig*.json ./
RUN npm ci
COPY server/src ./src
RUN npm run build

# Runtime stage
FROM node:20-slim
WORKDIR /app/server

# Install Python + venv for the embedding pipeline
RUN apt-get update && apt-get install -y python3 python3-venv && rm -rf /var/lib/apt/lists/*
COPY server/src/requirements.txt /app/server/src/requirements.txt
RUN python3 -m venv /app/.venv && /app/.venv/bin/pip install -r /app/server/src/requirements.txt

# Install Node production deps
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy built server and pipeline script
COPY --from=builder /app/server/dist ./dist
COPY server/src/pipeline.py ./src/pipeline.py

ENV NODE_ENV=production \
    PYTHON_BIN=/app/.venv/bin/python3 \
    PORT=4000

EXPOSE 4000
CMD ["node", "dist/index.js"]
