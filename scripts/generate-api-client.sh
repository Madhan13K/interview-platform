#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Auto-generate TypeScript API client from OpenAPI/Swagger spec
# ═══════════════════════════════════════════════════════════════

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
OUTPUT_DIR="interview-platform-frontend/src/generated"
SPEC_URL="$BACKEND_URL/v3/api-docs"

echo "═══════════════════════════════════════════════════"
echo "  OpenAPI TypeScript Client Generator"
echo "  Spec: $SPEC_URL"
echo "  Output: $OUTPUT_DIR"
echo "═══════════════════════════════════════════════════"

# Install openapi-typescript-codegen if not present
if ! command -v npx openapi-typescript-codegen &> /dev/null; then
  echo "Installing openapi-typescript-codegen..."
  npm install -g openapi-typescript-codegen
fi

# Fetch OpenAPI spec
echo "▶ Fetching OpenAPI spec from $SPEC_URL..."
curl -s "$SPEC_URL" -o /tmp/openapi-spec.json

if [ ! -s /tmp/openapi-spec.json ]; then
  echo "✗ Failed to fetch OpenAPI spec. Is the backend running?"
  exit 1
fi

# Generate TypeScript client
echo "▶ Generating TypeScript client..."
mkdir -p "$OUTPUT_DIR"

npx openapi-typescript-codegen \
  --input /tmp/openapi-spec.json \
  --output "$OUTPUT_DIR" \
  --client axios \
  --useUnionTypes \
  --exportSchemas true

echo ""
echo "✓ TypeScript API client generated at: $OUTPUT_DIR"
echo "  - Models: $OUTPUT_DIR/models/"
echo "  - Services: $OUTPUT_DIR/services/"
echo "  - Core: $OUTPUT_DIR/core/"
echo ""
echo "Usage in frontend:"
echo "  import { InterviewService } from '@/generated/services/InterviewService';"
echo "  const interviews = await InterviewService.getAll();"
