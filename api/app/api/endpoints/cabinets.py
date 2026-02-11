"""
Cabinet API Endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List

from app.services.calculator import FurnitureCalculatorService
from app.schemas.cabinet import (
    CabinetRequest, CabinetCalculationResponse,
    ProjectRequest, ProjectCalculationResponse,
    CabinetTypeInfo
)

router = APIRouter()
calculator_service = FurnitureCalculatorService()


@router.post("/calculate", response_model=CabinetCalculationResponse)
async def calculate_cabinet(request: CabinetRequest):
    """
    Изчислява един шкаф
    
    - **type**: Тип на шкафа (base, upper, drawer, oven, etc.)
    - **width**: Ширина в мм
    - **height**: Височина в мм  
    - **depth**: Дълбочина в мм
    - **shelf_count**: Брой рафтове (по подразбиране 1)
    - **door_count**: Брой врати (по подразбиране автоматично)
    - **drawer_count**: Брой чекмеджета (по подразбиране 0)
    - **has_back**: Има ли гръб (по подразбиране True)
    """
    try:
        result = calculator_service.calculate_single_cabinet(request)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.error)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при калкулация: {str(e)}")


@router.get("/types", response_model=List[CabinetTypeInfo])
async def get_cabinet_types():
    """
    Връща информация за всички налични типове шкафове
    """
    try:
        return calculator_service.get_cabinet_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при зареждане на типовете: {str(e)}")


@router.get("/default-configs")
async def get_default_configs():
    """
    Връща стандартни конфигурации за различните типове шкафове
    """
    try:
        return {
            "base": {
                "height": 760,
                "depth": 560,
                "shelf_count": 1,
                "has_back": True
            },
            "upper": {
                "height": 700,
                "depth": 320,
                "shelf_count": 2,
                "has_back": True
            },
            "drawer": {
                "height": 760,
                "depth": 560,
                "drawer_count": 3,
                "has_back": True
            },
            "oven": {
                "height": 760,
                "depth": 560,
                "has_back": False,
                "door_count": 1
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при зареждане на конфигурациите: {str(e)}")


@router.post("/test-conversion")
async def test_cabinet_conversion(request: CabinetRequest):
    """
    Тества само конверсията на request в Cabinet
    """
    try:
        from app.services.calculator import FurnitureCalculatorService
        service = FurnitureCalculatorService()
        
        cabinet = service._convert_request_to_cabinet(request)
        
        return {
            "success": True,
            "message": "Конверсията е успешна",
            "cabinet": {
                "cabinet_id": cabinet.cabinet_id,
                "type": cabinet.type.value,
                "width": cabinet.width,
                "height": cabinet.height,
                "depth": cabinet.depth,
                "has_back": cabinet.has_back,
                "has_body_board": cabinet.body_board is not None,
                "has_door_board": cabinet.door_board is not None,
                "has_back_board": cabinet.back_board is not None
            }
        }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


@router.post("/validate")
async def validate_cabinet_request(request: CabinetRequest):
    """
    Валидира заявка за шкаф без да изпълнява калкулация
    """
    try:
        # Проверки за валидност
        if request.width <= 0 or request.width > 3000:
            raise ValueError("Ширината трябва да е между 1 и 3000 мм")
        
        if request.height <= 0 or request.height > 3000:
            raise ValueError("Височината трябва да е между 1 и 3000 мм")
        
        if request.depth <= 0 or request.depth > 1000:
            raise ValueError("Дълбочината трябва да е между 1 и 1000 мм")
        
        # Проверки специфични за типове
        if request.type == "upper" and request.depth > 500:
            raise ValueError("Горните шкафове обикновено са с дълбочина до 500 мм")
        
        if request.type == "drawer" and request.drawer_count == 0 and request.door_count == 0:
            raise ValueError("Шкафът чекмедже трябва да има чекмеджета")
        
        return {
            "valid": True,
            "message": "Заявката е валидна",
            "estimated_complexity": "medium" if request.width > 800 else "low"
        }
        
    except ValueError as e:
        return {
            "valid": False,
            "message": str(e),
            "estimated_complexity": "unknown"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при валидация: {str(e)}")