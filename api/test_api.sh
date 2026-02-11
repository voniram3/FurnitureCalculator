#!/bin/bash

# Тестов скрипт за FastAPI API
echo "🧪 Тестове на FastAPI API..."

# Тестване на API endpoints
echo "1. Health check:"
curl -s http://localhost:8000/health | jq . 2>/dev/null || curl -s http://localhost:8000/health

echo ""
echo "2. Test imports:"
curl -s http://localhost:8000/test-imports | jq . 2>/dev/null || curl -s http://localhost:8000/test-imports

echo ""
echo "3. Cabinet types:"
curl -s http://localhost:8000/api/v1/cabinets/types | jq . 2>/dev/null || curl -s http://localhost:8000/api/v1/cabinets/types

echo ""
echo "4. Frontend test:"
curl -s -I http://localhost:8000/frontend/index.html | head -1

echo ""
echo "5. Materials:"
curl -s http://localhost:8000/api/v1/materials | jq .[0:2] 2>/dev/null || curl -s http://localhost:8000/api/v1/materials | head -c 200

echo ""
echo "✅ Тестове завършени!"