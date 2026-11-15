# Stage 1: Build the production frontend and setup dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including build tools)
RUN npm ci

# Copy application source code
COPY . .

# Build Vite frontend assets into dist/
RUN npm run build

# Remove development dependencies to keep image lean
RUN npm prune --production

# Stage 2: Minimalist Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Create persistent data directory
RUN mkdir -p /app/data

# Copy built distribution, server files, and production node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/tests ./tests

# Health check probe for Google Cloud Run container readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start AuraCare Healthcare Server
CMD ["node", "server/index.js"]
