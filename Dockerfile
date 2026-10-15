# Production Container for PULSE Hospital Management System
FROM node:20-alpine

WORKDIR /app

# Copy all project files
COPY . .

# Install frontend dependencies and build production distribution
RUN cd frontend && npm install && npm run build

# Expose default port (Render will override via $PORT)
EXPOSE 10000
ENV PORT=10000

# Start production server
CMD ["node", "server.cjs"]
