# Multi-stage Dockerfile for UniPulse Core API
# Stage 1: Build & Extract Layers
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Install dos2unix in case Windows line endings exist
RUN apk add --no-cache bash

# Copy maven wrapper and parent POM hierarchy
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY unipulse-common unipulse-common
COPY unipulse-core-api unipulse-core-api
COPY assignment-service assignment-service
COPY notification-service notification-service
COPY analytics-service analytics-service
COPY unipulse-sla-watcher unipulse-sla-watcher

# Package unipulse-core-api
RUN ./mvnw -B clean package -DskipTests -pl unipulse-core-api -am

# Extract layered jar for optimized Docker caching
WORKDIR /workspace/extracted
RUN java -Djarmode=layertools -jar /workspace/unipulse-core-api/target/unipulse-core-api-*.jar extract

# Stage 2: Minimal Runtime Environment
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 10001 appgroup && \
    adduser --system --uid 10001 --ingroup appgroup --no-create-home appuser

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy extracted layers
COPY --from=builder --chown=appuser:appgroup /workspace/extracted/dependencies/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/extracted/spring-boot-loader/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/extracted/snapshot-dependencies/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/extracted/application/ ./

USER appuser:appgroup

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
