"""
FastAPI Furniture Calculator Application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import sys
import os

# Добавяме parent директорията към Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Furniture Calculator API...")
    yield
    # Shutdown
    print("🛑 Shutting down Furniture Calculator API...")

app = FastAPI(
    title="Furniture Calculator API",
    description="API за изчисляване на мебели и кухненски шкафове",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В production: конкретни домейни
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
try:
    from app.api.endpoints import cabinets, projects, materials
    app.include_router(cabinets.router, prefix="/api/v1/cabinets", tags=["cabinets"])
    app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
    app.include_router(materials.router, prefix="/api/v1/materials", tags=["materials"])
except ImportError as e:
    print(f"⚠️  Warning: Could not import routers: {e}")

# CutList router
try:
    from app.api.endpoints import cutlist as cutlist_endpoints
    app.include_router(cutlist_endpoints.router, prefix="/api/v1", tags=["cutlist"])
    print("✅ CutList router loaded")
except ImportError as e:
    print(f"⚠️  Warning: Could not import cutlist router: {e}")

# Static files for frontend
# Static files for frontend
try:
    from fastapi.staticfiles import StaticFiles
    import os

    # Изчисляваме пътя до frontend папката
    current_file_path = os.path.dirname(os.path.abspath(__file__))
    root_path = os.path.dirname(os.path.dirname(current_file_path))
    frontend_path = os.path.join(root_path, "frontend")

    if os.path.exists(frontend_path):
        # Това позволява на Render да отвори index.html на главния адрес
        app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
        print(f"✅ Frontend mounted successfully from: {frontend_path}")
    else:
        print(f"⚠️ Warning: Frontend directory NOT found at {frontend_path}")
except Exception as e:
    print(f"⚠️ Warning: Could not setup static files: {e}")

@app.get("/")
async def root():
    """
    Основен endpoint с информация за API
    """
    return {
        "message": "Furniture Calculator API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "service": "furniture-calculator"}


# Тестов endpoint за проверка на импортите
@app.get("/test-imports")
async def test_imports():
    """
    Тестов endpoint за проверка дали всички импорти работят
    """
    try:
        # Тестване на основните импорти
        from app.core.config import settings
        from app.services.calculator import FurnitureCalculatorService
        from app.schemas.cabinet import CabinetRequest
        
        return {
            "status": "success",
            "message": "All imports working",
            "settings_loaded": settings.PROJECT_NAME,
            "calculator_service": "loaded",
            "schemas": "loaded"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
