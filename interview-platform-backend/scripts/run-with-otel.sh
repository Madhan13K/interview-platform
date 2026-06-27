#!/usr/bin/env bash
# =============================================================================
# Run the application locally with OpenTelemetry Java Agent
# =============================================================================
# This script:
# 1. Starts only the infrastructure services (DB, Redis, Kafka, OTel, etc.)
# 2. Downloads the OTel Java Agent if not present
# 3. Runs the Spring Boot app with the agent attached, pointing at localhost:4318
#
# Usage:
#   ./scripts/run-with-otel.sh
#
# Prerequisites:
#   - Docker & Docker Compose (for infrastructure)
#   - Java 21+ and Maven
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENT_VERSION="2.12.0"
AGENT_JAR="$PROJECT_DIR/opentelemetry-javaagent.jar"

echo "=== Interview Platform — Local Run with OpenTelemetry ==="
echo ""

# --- Step 1: Start infrastructure (skip the app container) ---
echo "[1/3] Starting infrastructure services..."
cd "$PROJECT_DIR"
docker compose up -d postgres redis kafka zookeeper localstack keycloak vault mailpit otel-collector jaeger loki

echo "      Waiting for services to be healthy..."
docker compose wait --down-on-failure postgres redis kafka localstack keycloak mailpit loki 2>/dev/null || {
    # Fallback for older Docker Compose without 'wait'
    sleep 10
    echo "      (waited 10s for services)"
}

# --- Step 2: Download OTel Java Agent if not present ---
echo ""
echo "[2/3] Checking OpenTelemetry Java Agent..."
if [ ! -f "$AGENT_JAR" ]; then
    echo "      Downloading v${AGENT_VERSION}..."
    curl -sL -o "$AGENT_JAR" \
        "https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${AGENT_VERSION}/opentelemetry-javaagent.jar"
    echo "      Downloaded: $AGENT_JAR"
else
    echo "      Already present: $AGENT_JAR"
fi

# --- Step 3: Run the app with OTel agent ---
echo ""
echo "[3/3] Starting application with OTel agent..."
echo ""
echo "      Dashboards:"
echo "        Jaeger  (traces):  http://localhost:16686"
echo "        Grafana (all):     http://localhost:3001"
echo "        Prometheus:        http://localhost:9091"
echo "        Loki (logs):       http://localhost:3100"
echo "        Mailpit (email):   http://localhost:8025"
echo ""
echo "      Application:         http://localhost:8080"
echo "      Swagger UI:          http://localhost:8080/swagger-ui.html"
echo ""
echo "-----------------------------------------------------------"
echo ""

export SPRING_PROFILES_ACTIVE=dev

exec ./mvnw spring-boot:run \
    -Dspring-boot.run.jvmArguments="\
        -javaagent:${AGENT_JAR} \
        -Dotel.service.name=interview-platform-backend \
        -Dotel.exporter.otlp.endpoint=http://localhost:4318 \
        -Dotel.exporter.otlp.protocol=http/protobuf \
        -Dotel.traces.sampler=parentbased_traceidratio \
        -Dotel.traces.sampler.arg=1.0 \
        -Dotel.metrics.exporter=otlp \
        -Dotel.logs.exporter=otlp \
        -Dotel.resource.attributes=service.namespace=interview-platform,deployment.environment=dev \
        -Dotel.instrumentation.common.db-statement-sanitizer.enabled=true \
        -Djava.net.preferIPv4Stack=true"
