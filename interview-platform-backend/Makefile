# ==============================================================================
# Interview Platform — Infrastructure Services
# ==============================================================================
# Usage:
#   make up            — Start core infrastructure (DB, Redis, Kafka, etc.)
#   make up-otel       — + Observability (OTel Collector, Jaeger, Loki)
#   make up-monitoring — + Monitoring dashboards (Prometheus, Grafana)
#   make up-all        — All infrastructure services
#   make down          — Stop everything
#   make ps            — Show running services
#   make test-traces   — Generate test API traces
#   make clean         — Stop and remove all volumes (full reset)
# ==============================================================================

.PHONY: up up-all up-otel up-monitoring down ps test-traces clean help

help: ## Show this help
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""

up: ## Start core infrastructure (DB, Redis, Kafka, Keycloak, Mailpit)
	docker compose up -d
	@echo ""
	@echo "Infrastructure ready."
	@echo "  Postgres:   localhost:5433"
	@echo "  Redis:      localhost:6379"
	@echo "  Kafka:      localhost:9092"
	@echo "  Keycloak:   http://localhost:9090"
	@echo "  Mailpit:    http://localhost:8025"
	@echo ""

up-otel: ## Start infra + observability (OTel Collector, Jaeger, Loki)
	docker compose --profile observability up -d
	@echo ""
	@echo "Infrastructure + observability ready."
	@echo "  Jaeger:     http://localhost:16686"
	@echo "  Loki:       http://localhost:3100"
	@echo ""

up-monitoring: ## Start infra + monitoring (Prometheus, Grafana)
	docker compose --profile monitoring up -d
	@echo ""
	@echo "Infrastructure + monitoring ready."
	@echo "  Grafana:    http://localhost:3001 (admin/admin)"
	@echo "  Prometheus: http://localhost:9091"
	@echo ""

up-all: ## Start all infrastructure (observability + monitoring)
	docker compose --profile observability --profile monitoring up -d
	@echo ""
	@echo "Full infrastructure ready."
	@echo "  Jaeger:     http://localhost:16686"
	@echo "  Grafana:    http://localhost:3001 (admin/admin)"
	@echo "  Prometheus: http://localhost:9091"
	@echo "  Loki:       http://localhost:3100"
	@echo "  Mailpit:    http://localhost:8025"
	@echo ""

down: ## Stop all services (preserves data)
	docker compose --profile app --profile observability --profile monitoring down

ps: ## Show running services
	docker compose --profile app --profile observability --profile monitoring ps

test-traces: ## Generate test API traces for dashboards
	@TOKEN=$$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email":"admin@interview.local","password":"ChangeMe123!"}' \
		| python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])") && \
	curl -s -o /dev/null -w "  GET /users/me:        %{http_code}\n" -H "Authorization: Bearer $$TOKEN" http://localhost:8080/api/v1/users/me && \
	curl -s -o /dev/null -w "  GET /interviews:      %{http_code}\n" -H "Authorization: Bearer $$TOKEN" http://localhost:8080/api/v1/interviews && \
	curl -s -o /dev/null -w "  GET /dashboard/admin: %{http_code}\n" -H "Authorization: Bearer $$TOKEN" http://localhost:8080/api/v1/dashboard/admin && \
	curl -s -o /dev/null -w "  GET /notifications:   %{http_code}\n" -H "Authorization: Bearer $$TOKEN" http://localhost:8080/api/v1/notifications && \
	curl -s -o /dev/null -w "  GET /jobs:            %{http_code}\n" -H "Authorization: Bearer $$TOKEN" http://localhost:8080/api/v1/jobs
	@echo ""
	@echo "Done! View traces at http://localhost:16686"

clean: ## Stop everything and remove all volumes (full reset)
	docker compose --profile app --profile observability --profile monitoring down -v
	@echo "All containers stopped and volumes removed."
