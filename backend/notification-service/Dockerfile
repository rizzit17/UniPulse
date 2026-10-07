# Multi-stage Dockerfile for UniPulse Notification Service
# Stage 1: Build & Extract Layers
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

RUN apk add --no-cache bash

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY common common
COPY core-api core-api
COPY assignment-service assignment-service
COPY notification-service notification-service
COPY analytics-service analytics-service
COPY sla-watcher sla-watcher

RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

RUN ./mvnw -B clean package -DskipTests -pl notification-service -am

WORKDIR /workspace/extracted
RUN java -Djarmode=layertools -jar /workspace/notification-service/target/unipulse-notification-service-*.jar extract

# Stage 2: Minimal Runtime Environment
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 10001 appgroup && \
    adduser --system --uid 10001 --ingroup appgroup --no-create-home appuser

RUN apk add --no-cache curl

COPY --from=builder --chown=appuser:appgroup /workspace/extracted/dependencies/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/extracted/spring-boot-loader/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/extracted/snapshot-dependencies/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/extracted/application/ ./

USER appuser:appgroup

EXPOSE 8082

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8082/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
