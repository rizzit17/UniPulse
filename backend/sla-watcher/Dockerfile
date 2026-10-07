# Multi-stage Dockerfile for UniPulse SLA Watcher (Lambda Container / Runner)
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

RUN ./mvnw -B clean package -DskipTests -pl sla-watcher -am

FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 10001 appgroup && \
    adduser --system --uid 10001 --ingroup appgroup --no-create-home appuser

COPY --from=builder --chown=appuser:appgroup /workspace/sla-watcher/target/unipulse-sla-watcher-*.jar /app/sla-watcher.jar

USER appuser:appgroup

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/sla-watcher.jar"]
