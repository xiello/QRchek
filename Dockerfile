FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY web/package*.json ./web/
COPY server/package*.json ./server/

# Install dependencies
RUN cd web && npm ci && \
    cd ../server && npm ci

# Copy source files
COPY web ./web
COPY server ./server

# Build web app
RUN cd web && npm run build

# Copy web build to server public directory
RUN mkdir -p server/public && \
    cp -r web/dist/* server/public/

# Build server
RUN cd server && npm run build

# Expose port
EXPOSE 3000

# Start server
WORKDIR /app/server
CMD ["npm", "start"]

