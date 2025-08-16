# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Backend API base URL for the React app (adjust if needed)
ARG REACT_APP_API_BASE_URL=http://lr.local/api
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}

# Install dependencies (handle peer dep quirks)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Build React app
COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginx:alpine
# Copy the compiled app to nginx web root
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
