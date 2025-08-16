# Use a modern, small base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install only what's needed for production
COPY package*.json ./
# If a lockfile exists, prefer npm ci; fall back to npm install
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps

# Copy source
COPY . .

# App port (align with k8s service + ingress config)
ENV NODE_ENV=production
ENV PORT=3001

# If your app reads a different env var for Mongo, keep K8s env to match it.
# (Our manifests set MONGO_URI / MONGODB_URI / DATABASE_URL for safety.)

EXPOSE 3001

# Start the server (use your repo's entry; keep index.js or npm start)
CMD ["node", "index.js"]
