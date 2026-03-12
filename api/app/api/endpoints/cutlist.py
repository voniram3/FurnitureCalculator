"""
CutList API Endpoints
/api/v1/cutlist/

Предоставя оптимизация на разкрояване чрез REST API.
Imports са lazy (вътре във функциите) за да се избегнат circular imports.
"""

from fastapi import APIRouter, HTTPException
import time
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cutlist", tags=["cutlist"])


@router.post(
    "/optimize",
    summary="Оптимизиране на разкрояването",
    description="""
    Приема списък от парчета и листове, връща оптимално разпределение.
    
    **Характеристики:**
    - Guillotine cuts (от край до край) — стандарт за панелни циркуляри
    - Saw kerf (ширина на реза) се приспада при всеки рез
    - Grain direction с 4 варианта: horizontal, vertical, any, none
    - Multi-pass оптимизация — изпробва 8 стратегии и избира най-добрата
    - Reusable offcuts — маркира остатъци за повторна употреба
    - Visualizer-ready данни — директно подаване към CutListVisualizer.generateSVG()
    """,
    responses={
        200: {"description": "Успешна оптимизация"},
        400: {"description": "Невалидни входни данни"},
        422: {"description": "Validation error"},
    }
)
async def optimize(request: dict):
    """
    Оптимизира разкрояването на парчета върху листове.
    """
    from app.schemas.cutlist import CutListRequest
    from app.services.cutlist_service import optimize_cutlist

    start = time.time()

    try:
        # Парсваме и валидираме чрез Pydantic
        validated = CutListRequest(**request) if isinstance(request, dict) else request

        _validate_parts_fit_sheets(validated)
        result = optimize_cutlist(validated)

        elapsed_ms = round((time.time() - start) * 1000)
        logger.info(
            f"CutList optimization: {result['statistics']['placed_parts']}/"
            f"{result['statistics']['total_parts']} parts placed, "
            f"{result['statistics']['total_sheets']} sheets, "
            f"{result['statistics']['efficiency_pct']}% efficiency, "
            f"{elapsed_ms}ms"
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"CutList optimization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Грешка при оптимизация: {str(e)}")


@router.post(
    "/validate",
    summary="Валидиране на входните данни",
    description="Проверява дали всички парчета могат да се побират в поне един лист.",
)
async def validate(request: dict):
    """Бърза валидация без пълна оптимизация."""
    from app.schemas.cutlist import CutListRequest

    validated = CutListRequest(**request) if isinstance(request, dict) else request
    issues = []

    for part in validated.parts:
        fits_any = False
        for sheet in validated.sheets:
            if not _materials_compatible(part.material, sheet.material):
                continue
            if part.width <= sheet.width and part.height <= sheet.height:
                fits_any = True
                break
            if part.allow_rotation and part.height <= sheet.width and part.width <= sheet.height:
                fits_any = True
                break

        if not fits_any:
            issues.append({
                "part": part.name,
                "width": part.width,
                "height": part.height,
                "material": part.material,
                "issue": "Парчето не се побира в нито един лист от съвместим материал"
            })

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "parts_count": len(validated.parts),
        "total_pieces": sum(p.quantity for p in validated.parts),
        "sheets_count": len(validated.sheets),
        "materials": list(set(p.material for p in validated.parts)),
    }


@router.get(
    "/defaults",
    summary="Настройки по подразбиране",
    description="Връща настройките по подразбиране за оптимизация.",
)
async def get_defaults():
    """Връща default settings за frontend формата."""
    from app.schemas.cutlist import CutSettingsRequest

    defaults = CutSettingsRequest()
    return {
        "settings": defaults.model_dump(),
        "grain_options": [
            {"value": "none", "label": "Без шарка", "description": "Едноцветен материал"},
            {"value": "horizontal", "label": "Хоризонтална", "description": "Шарката е по дългата страна"},
            {"value": "vertical", "label": "Вертикална", "description": "Шарката е по късата страна"},
            {"value": "any", "label": "Без значение", "description": "Има шарка, но посоката не е важна"},
        ],
        "standard_sheets": [
            {"name": "ПДЧ 18мм", "width": 2800, "height": 2070, "thickness_mm": 18},
            {"name": "ПДЧ 36мм", "width": 2800, "height": 2070, "thickness_mm": 36},
            {"name": "МДФ 18мм", "width": 2800, "height": 2070, "thickness_mm": 18},
            {"name": "ХДЛ 3мм", "width": 2800, "height": 2070, "thickness_mm": 3},
            {"name": "ХДЛ 8мм", "width": 2800, "height": 2070, "thickness_mm": 8},
        ],
    }


# ─────────────── Helpers ───────────────

def _validate_parts_fit_sheets(request):
    """Проверява дали всяко парче може да се побере в поне един лист."""
    for part in request.parts:
        fits = False
        for sheet in request.sheets:
            if not _materials_compatible(part.material, sheet.material):
                continue
            if part.width <= sheet.width and part.height <= sheet.height:
                fits = True
                break
            if part.allow_rotation and part.height <= sheet.width and part.width <= sheet.height:
                fits = True
                break
        if not fits:
            raise ValueError(
                f"Парче '{part.name}' ({part.width}x{part.height}mm, {part.material}) "
                f"не се побира в нито един наличен лист"
            )


def _materials_compatible(part_material: str, sheet_material: str) -> bool:
    """Проста проверка за съвместимост на материали."""
    known_types = ["ПДЧ", "МДФ", "ХДЛ", "Масив", "Фурнир", "Шперплат"]

    p_type = part_material
    s_type = sheet_material
    for k in known_types:
        if k in part_material:
            p_type = k
            break
    for k in known_types:
        if k in sheet_material:
            s_type = k
            break

    return p_type == s_type
