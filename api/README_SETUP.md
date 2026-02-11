# 🚀 Furniture Calculator API - Инструкции за стартиране

## ⚡ Бърз старт

### 1. Инсталиране на зависимости
```bash
cd Local_code/api
pip install -r requirements.txt
```

### 2. Стартиране на API
```bash
# Метод 1: Със скрипт (препоръчително)
./start.sh

# Метод 2: Ръчно
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Достъп до системата
- **API Documentation**: http://localhost:8000/docs
- **Frontend Interface**: http://localhost:8000/frontend/index.html
- **Health Check**: http://localhost:8000/health

## 🐛 Решаване на проблеми

### ModuleNotFoundError: No module named 'api'
**Проблем:** Python не намира module-ите
**Решение:** Уверете се, че сте в `api` директорията и изпълнете:
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### ImportError: No module named 'fastapi'
**Проблем:** FastAPI не е инсталиран
**Решение:**
```bash
pip install fastapi[all]
```

### ImportError: cannot import name 'BaseModel' from 'pydantic'
**Проблем:** Грешна версия на Pydantic
**Решение:**
```bash
pip install pydantic==2.5.0
```

## 📋 Проверка на инсталацията

След като стартирате API-то, проверете:

1. **Health check:**
```bash
curl http://localhost:8000/health
```
Трябва да върне: `{"status": "healthy", "service": "furniture-calculator"}`

2. **API endpoints:**
```bash
curl http://localhost:8000/api/v1/cabinets/types
```

3. **Swagger документация:**
Отворете http://localhost:8000/docs в браузър

## 🔧 Конфигурация

### Environment variables
Създайте `.env` файл в `api` директорията:

```env
HOST=0.0.0.0
PORT=8000
DEBUG=true
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Промяна на портове
За да стартирате на различен порт:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
```

## 🌐 Frontend

Frontend е статичен HTML файл с JavaScript:
- Намира се в `frontend/index.html`
- Достъпен на: http://localhost:8000/frontend/index.html
- Съдържа demo интерфейс за тестване на API-то

## 📚 API документация

Автоматична документация е достъпна на:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Тестове

Базови тестове са налични в `tests/` директорията:
```bash
python -m pytest tests/
```

## 🚀 Production deployment

За production използвайте:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Или с Docker:
```bash
docker build -t furniture-calculator .
docker run -p 8000:8000 furniture-calculator
```

## 📝 Логове

API-то логва на stdout/stderr. За production конфигурирайте:
```python
import logging
logging.basicConfig(level=logging.INFO)
```

## 🆘 Помощ

Ако имате проблеми:
1. Проверете дали сте в правилната директория (`Local_code/api`)
2. Проверете Python версией (`python --version` трябва да е 3.8+)
3. Използвайте виртуална среда: `python -m venv venv && source venv/bin/activate`
4. Проверете dependencies: `pip list | grep fastapi`