#!/bin/bash

# Startup script за FastAPI Furniture Calculator API
echo "🚀 Стартиране на Furniture Calculator API..."

# Проверка дали сме в правилната директория
if [ ! -f "app/main.py" ]; then
    echo "❌ Грешка: Моля стартирайте скрипта от api директорията"
    exit 1
fi

# Проверка за виртуална среда
if [ -d "venv" ]; then
    echo "🔧 Активиране на виртуална среда..."
    source venv/bin/activate
else
    echo "⚠️  Виртуална среда не е намерена. Използваме системния Python."
fi

# Инсталиране на dependencies
echo "📦 Инсталиране на dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Добавяне на parent директория към PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."

echo ""
echo "🌐 Стартиране на API сървър:"
echo "   📚 API Documentation: http://localhost:8000/docs"
echo "   🏠 Frontend: http://localhost:8000/frontend/index.html"
echo "   🩺 Health Check: http://localhost:8000/health"
echo "   🧪 Test Imports: http://localhost:8000/test-imports"
echo ""
echo "Натиснете Ctrl+C за спиране"
echo ""

# Стартиране на uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000