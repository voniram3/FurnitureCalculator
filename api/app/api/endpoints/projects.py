"""
Project API Endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from uuid import uuid4

from app.services.calculator import FurnitureCalculatorService
from app.schemas.cabinet import (
    ProjectRequest, ProjectCalculationResponse,
    CabinetRequest
)

router = APIRouter()
calculator_service = FurnitureCalculatorService()

# In-memory storage за проекти (за demonstration)
projects_storage: Dict[str, ProjectCalculationResponse] = {}


@router.post("/calculate", response_model=ProjectCalculationResponse)
async def calculate_project(request: ProjectRequest):
    """
    Изчислява цял проект (много шкафове)
    
    - **project_name**: Име на проекта
    - **cabinets**: Списък с шкафове за изчисление
    """
    try:
        if not request.cabinets:
            raise ValueError("Проектът трябва да съдържа поне един шкаф")
        
        if len(request.cabinets) > 50:
            raise ValueError("Проектът не може да съдържа повече от 50 шкафове")
        
        result = calculator_service.calculate_project(request)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.error)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при калкулация на проект: {str(e)}")


@router.post("/save")
async def save_project(request: ProjectRequest):
    """
    Запазва проект и връща ID за последваща достъпност
    """
    try:
        # Изчисляване на проекта
        result = calculator_service.calculate_project(request)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.error)
        
        # Генериране на ID и запазване
        project_id = str(uuid4())
        projects_storage[project_id] = result
        
        return {
            "success": True,
            "project_id": project_id,
            "message": "Проектът е запазен успешно",
            "total_cost": result.project_total_cost,
            "cabinets_count": result.total_cabinets
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при запазване на проект: {str(e)}")


@router.get("/{project_id}")
async def get_project(project_id: str):
    """
    Връща запазен проект по ID
    """
    try:
        if project_id not in projects_storage:
            raise HTTPException(status_code=404, detail="Проектът не е намерен")
        
        return projects_storage[project_id]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при зареждане на проект: {str(e)}")


@router.get("/")
async def list_projects():
    """
    Връща списък с всички запазени проекти
    """
    try:
        projects_summary = []
        for project_id, project in projects_storage.items():
            projects_summary.append({
                "project_id": project_id,
                "project_name": project.project_name,
                "total_cabinets": project.total_cabinets,
                "project_total_cost": project.project_total_cost,
                "success": project.success
            })
        
        return {
            "projects": projects_summary,
            "total_projects": len(projects_summary)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при списък с проекти: {str(e)}")


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """
    Изтрива запазен проект
    """
    try:
        if project_id not in projects_storage:
            raise HTTPException(status_code=404, detail="Проектът не е намерен")
        
        del projects_storage[project_id]
        
        return {
            "success": True,
            "message": "Проектът е изтрит успешно"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при изтриване на проект: {str(e)}")


@router.post("/quick-calculate")
async def quick_calculate(cabinets: List[CabinetRequest]):
    """
    Бърза калкулация без име на проект
    """
    try:
        if not cabinets:
            raise ValueError("Трябва да има поне един шкаф")
        
        # Създаваме project request с default име
        project_request = ProjectRequest(
            project_name="Бърза калкулация",
            cabinets=cabinets
        )
        
        result = calculator_service.calculate_project(project_request)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.error)
        
        return {
            "success": True,
            "total_cabinets": result.total_cabinets,
            "project_total_cost": result.project_total_cost,
            "cabinets": result.cabinets,
            "totals": result.totals
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при бърза калкулация: {str(e)}")


@router.get("/stats/summary")
async def get_projects_stats():
    """
    Връща статистика за всички проекти
    """
    try:
        if not projects_storage:
            return {
                "total_projects": 0,
                "total_cabinets": 0,
                "total_value": 0.0,
                "average_project_cost": 0.0,
                "most_common_type": "none"
            }
        
        total_cabinets = sum(p.total_cabinets for p in projects_storage.values())
        total_value = sum(p.project_total_cost for p in projects_storage.values())
        
        cabinet_type_counts = {}
        for project in projects_storage.values():
            for cabinet in project.cabinets:
                cabinet_type = cabinet.type.value
                cabinet_type_counts[cabinet_type] = cabinet_type_counts.get(cabinet_type, 0) + 1
        
        most_common_type = max(cabinet_type_counts.items(), key=lambda x: x[1])[0] if cabinet_type_counts else "none"
        
        return {
            "total_projects": len(projects_storage),
            "total_cabinets": total_cabinets,
            "total_value": total_value,
            "average_project_cost": total_value / len(projects_storage),
            "most_common_type": most_common_type,
            "cabinet_types_distribution": cabinet_type_counts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при статистика: {str(e)}")