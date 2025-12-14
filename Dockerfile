# Multi-stage build for the frontend + API + Python embedding pipeline

# Build the React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html tsconfig*.json vite.config.ts postcss.config.js tailwind.config.ts components.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# Build the API (TypeScript -> dist)
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

# Copy built artifacts
COPY --from=builder /app/server/dist ./dist
COPY --from=frontend-builder /app/dist /app/dist
COPY server/src/pipeline.py ./src/pipeline.py

ENV NODE_ENV=production \
    PYTHON_BIN=/app/.venv/bin/python3 \
    PORT=4000

EXPOSE 4000
CMD ["node", "dist/index.js"]
