# Stage 1: Build TypeScript
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Stage 2: Production Runtime
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# Run as non-privileged user for security
USER node

CMD ["node", "dist/index.js"]
