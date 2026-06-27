# ===== Stage 1: Build =====
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Cache Maven dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Build application
COPY src/ src/
RUN ./mvnw package -DskipTests -B

# Extract layered JAR for efficient Docker layers
RUN java -Djarmode=layertools -jar target/*.jar extract --destination /app/extracted

# ===== Stage 2: Custom JRE (jlink) =====
FROM eclipse-temurin:21-jdk-alpine AS jre-builder
RUN $JAVA_HOME/bin/jlink \
    --add-modules java.base,java.logging,java.naming,java.net.http,java.security.jgss,java.sql,java.xml,java.desktop,java.management,java.instrument,jdk.crypto.ec,jdk.unsupported \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=zip-6 \
    --output /opt/custom-jre

# ===== Stage 3: Runtime =====
FROM alpine:3.20 AS runtime

# Install minimal dependencies
RUN apk add --no-cache curl tini

# Copy custom JRE
COPY --from=jre-builder /opt/custom-jre /opt/java
ENV JAVA_HOME=/opt/java
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Download OpenTelemetry Java Agent
ARG OTEL_AGENT_VERSION=2.12.0
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_AGENT_VERSION}/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar
RUN chmod 644 /app/opentelemetry-javaagent.jar

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

# Copy application layers (ordered by change frequency for caching)
COPY --from=builder /app/extracted/dependencies/ ./
COPY --from=builder /app/extracted/spring-boot-loader/ ./
COPY --from=builder /app/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/extracted/application/ ./

# Security: non-root
USER appuser

# Health check
HEALTHCHECK --interval=15s --timeout=10s --retries=5 --start-period=40s \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["tini", "--"]
CMD ["java", "-javaagent:/app/opentelemetry-javaagent.jar", "org.springframework.boot.loader.launch.JarLauncher"]
