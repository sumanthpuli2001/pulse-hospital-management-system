# ==========================================
# Hospital Management System - Frontend Dockerfile
# Multi-stage production build (Node.js / Nginx Alpine)
# ==========================================

# Stage 1: Build Static Assets
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package descriptors and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and run production build
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx Alpine
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Clean default assets and copy build output
RUN rm -rf ./*
COPY --from=builder /app/dist .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
