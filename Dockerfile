# Multi-stage Dockerfile for Cloud Run
# 1) Build stage
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat
COPY package*.json ./
# Use npm ci for deterministic install
RUN npm ci --include=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:client && npm run build:server

# 2) Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 nodegrp && adduser -D -u 1001 -G nodegrp nodeusr
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Remove dev deps (already pruned by using production env if needed)
RUN npm prune --production && npm cache clean --force

USER 1001

# Copy built artifacts
# Expose port and run server
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/server.js"]
