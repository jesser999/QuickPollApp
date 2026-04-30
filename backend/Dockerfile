# Stage 1: Build the backend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc

# Stage 2: Run the backend
FROM node:20-alpine AS runner

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

# Railway injects PORT dynamically; default to 3001 for local/docker-compose
ENV PORT=3001
EXPOSE $PORT
CMD ["node", "dist/server.js"]
