"""
Materials API Endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List

from app.services.calculator import FurnitureCalculatorService
from app.schemas.cabinet import MaterialInfo

router = APIRouter()
calculator_service = FurnitureCalculatorService()


@router.get("/", response_model=List[MaterialInfo])
async def get_materials():
    """
    Връща списък с всички налични материали
    """
    try:
        return calculator_service.get_materials()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при зареждане на материалите: {str(e)}")


@router.get("/pricing")
async def get_material_pricing():
    """
    Връща ценова информация за материалите
    """
    try:
        materials = calculator_service.get_materials()
        
        pricing = {
            "boards": {},
            "edges": {
                "1mm": {"price_per_meter": 15.0, "currency": "BGN"},
                "2mm": {"price_per_meter": 25.0, "currency": "BGN"}
            },
            "labor": {
                "assembly_per_hour": 25.0,
                "hardware_per_hour": 8.0,
                "edge_per_hour": 12.0,
                "currency": "BGN"
            },
            "installation": {
                "base_cabinet": 35.0,
                "upper_cabinet": 25.0,
                "drawer_cabinet": 30.0,
                "oven_cabinet": 50.0,
                "currency": "BGN"
            }
        }
        
        for material in materials:
            if material.material_type.value in ["body", "door", "back", "plinth"]:
                pricing["boards"][material.material_type.value] = {
                    "name": material.name,
                    "thickness": material.thickness,
                    "price_per_sheet": material.price_per_sheet,
                    "currency": material.currency,
                    "available": material.available
                }
        
        return pricing
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при зареждане на цените: {str(e)}")


@router.get("/calculations")
async def get_material_calculations():
    """
    Връща информация за изчисления на материали
    """
    try:
        return {
            "standard_sheet_size": {
                "width_mm": 2800,
                "height_mm": 2070,
                "area_sqm": 5.796,
                "description": "Стандартен размер лист за ПДЧ и МДФ"
            },
            "waste_factor": 0.10,
            "edge_banding": {
                "standard_thicknesses": [0.4, 1.0, 2.0],
                "unit": "mm",
                "pricing_unit": "meter"
            },
            "hardware_categories": {
                "legs": "Крака",
                "hinges": "Панти",
                "handles": "Ръкохватки",
                "drawers": "Водачи за чекмеджета",
                "shelves": "Рафтодържатели",
                "connectors": "Конзоли и крепежи"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при зареждане на информацията: {str(e)}")


@router.get("/types")
async def get_material_types():
    """
    Връща информация за типовете материали
    """
    try:
        return {
            "body": {
                "name": "Корпусен материал",
                "description": "ПДЧ или MDF за конструкцията на шкафа",
                "standard_thickness": 18.0,
                "common_materials": ["Egger", "Kronospan", "Classen"]
            },
            "door": {
                "name": "Материал за врати",
                "description": "МДФ или ПДЧ за фасади и врати",
                "standard_thickness": 18.0,
                "common_materials": ["МДФ боядисан", "МДФ фолиран", "ПДЧ с фурнир"]
            },
            "back": {
                "name": "Заден панел",
                "description": "HDF или тънък ПДЧ за гръб на шкафа",
                "standard_thickness": 3.0,
                "common_materials": ["HDF", "Перспекс", "ПДЧ 3мм"]
            },
            "plinth": {
                "name": "Цокъл",
                "description": "ПДЧ за цокъл на долни шкафове",
                "standard_thickness": 18.0,
                "common_materials": ["ПДЦ", "MDF", "Бук"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при зареждане на типовете материали: {str(e)}")


@router.get("/availability")
async def check_material_availability():
    """
    Проверява наличността на материали
    """
    try:
        materials = calculator_service.get_materials()
        
        availability_report = {
            "total_materials": len(materials),
            "available_materials": len([m for m in materials if m.available]),
            "unavailable_materials": len([m for m in materials if not m.available]),
            "materials": []
        }
        
        for material in materials:
            availability_report["materials"].append({
                "name": material.name,
                "type": material.material_type.value,
                "thickness": material.thickness,
                "available": material.available,
                "stock_status": "В наличност" if material.available else "Изчерпан"
            })
        
        return availability_report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при проверка на наличност: {str(e)}")