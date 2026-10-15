# ==========================================
# Hospital Management System - Backend Dockerfile
# Multi-stage production build (Java 21 / Maven)
# ==========================================

# Stage 1: Build JAR
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Install maven
RUN apk add --no-cache maven

# Copy POM and download dependencies for layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime Container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add non-root system user for security compliance (HIPAA / CIS benchmark)
RUN addgroup -S hmsgroup && adduser -S hmsuser -G hmsgroup
USER hmsuser

# Copy built artifact from builder stage
COPY --from=builder /workspace/target/hospital-management-system-*.jar app.jar

# Expose backend port
EXPOSE 8085

# Java memory and garbage collection tuning for containerized environment
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
