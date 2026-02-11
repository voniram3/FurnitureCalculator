# FastAPI Furniture Calculator API

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API Documentation: http://localhost:8000/docs
```

## 📁 Project Structure

```
api/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── cabinets.py
│   │   │   ├── materials.py
│   │   │   └── projects.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── models/
│   │   └── furniture.py
│   ├── schemas/
│   │   ├── cabinet.py
│   │   ├── material.py
│   │   └── project.py
│   ├── services/
│   │   └── calculator.py
│   └── main.py
├── tests/
└── requirements.txt
```

## 🔗 API Endpoints

### Cabinets
- `POST /api/v1/cabinets/calculate` - Calculate single cabinet
- `GET /api/v1/cabinets/types` - Get available cabinet types
- `GET /api/v1/cabinets/configs` - Get default configurations

### Projects  
- `POST /api/v1/projects/calculate` - Calculate entire project
- `POST /api/v1/projects` - Save project
- `GET /api/v1/projects/{id}` - Get project

### Materials
- `GET /api/v1/materials` - Get available materials
- `GET /api/v1/materials/pricing` - Get pricing info

## 🛠 Tech Stack

- **Backend:** FastAPI + Uvicorn
- **Validation:** Pydantic v2  
- **Database:** SQLAlchemy + PostgreSQL (optional)
- **CORS:** Built-in middleware
- **Docs:** Auto-generated Swagger/OpenAPI