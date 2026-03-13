"""
Pydantic schemas за CutList API.
Дефинират входящите и изходящите данни за /api/v1/cutlist/ endpoints.
"""

from __future__ import annotations
from typing import List, Optional, Dict
from enum import Enum
from pydantic import BaseModel, Field


# ─────────────────── Enums ───────────────────

class GrainDirectionSchema(str, Enum):
    horizontal = "horizontal"
    vertical = "vertical"
    any = "any"
    none = "none"


# ─────────────────── Request Models ───────────────────

class EdgeBandingSchema(BaseModel):
    top: bool = False
    bottom: bool = False
    left: bool = False
    right: bool = False


class PartRequest(BaseModel):
    """Едно парче за разкрояване."""
    name: str = Field(..., description="Име на детайла, напр. 'Страница долен'")
    width: int = Field(..., gt=0, description="Ширина в mm")
    height: int = Field(..., gt=0, description="Височина в mm")
    material: str = Field(..., description="Материал, напр. 'ПДЧ 18мм Бял'")
    grain: GrainDirectionSchema = Field(
        GrainDirectionSchema.none,
        description="Посока на шарката: horizontal, vertical, any, none"
    )
    allow_rotation: bool = Field(True, description="Може ли парчето да се завърти на 90°")
    priority: int = Field(5, ge=1, le=10, description="Приоритет 1-10 (10=най-важно)")
    quantity: int = Field(1, ge=1, description="Брой еднакви парчета")
    edge_banding: EdgeBandingSchema = Field(
        default_factory=EdgeBandingSchema,
        description="Кантиране по страни"
    )
    cabinet_id: str = Field("", description="ID на шкафа, от който идва парчето")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "Страница долен",
                "width": 560,
                "height": 870,
                "material": "ПДЧ 18мм Бял",
                "grain": "none",
                "quantity": 2
            }]
        }
    }


class SheetRequest(BaseModel):
    """Шаблон на лист материал."""
    name: str = Field(..., description="Име на листа, напр. 'ПДЧ 18мм Бял 2800x2070'")
    width: int = Field(..., gt=0, description="Ширина в mm")
    height: int = Field(..., gt=0, description="Височина в mm")
    material: str = Field(..., description="Материал, напр. 'ПДЧ 18мм Бял'")
    grain: GrainDirectionSchema = Field(
        GrainDirectionSchema.none,
        description="Grain на листа"
    )
    cost: float = Field(0.0, ge=0, description="Цена на лист в лв.")
    thickness_mm: float = Field(18.0, gt=0, description="Дебелина в mm")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "ПДЧ 18мм Бял",
                "width": 2800,
                "height": 2070,
                "material": "ПДЧ 18мм Бял",
                "grain": "none",
                "cost": 45.0,
                "thickness_mm": 18.0
            }]
        }
    }


class CutSettingsRequest(BaseModel):
    """Настройки на оптимизацията."""
    saw_kerf_mm: float = Field(4.0, ge=0, le=20, description="Ширина на реза в mm")
    allow_rotation: bool = Field(True, description="Позволи ротация на парчетата")
    respect_grain: bool = Field(True, description="Спазвай grain direction")
    min_usable_offcut_mm: float = Field(
        100.0, ge=0,
        description="Минимален размер за запазване на остатък (mm)"
    )
    min_waste_area_mm2: float = Field(
        10000.0, ge=0,
        description="Под тази площ (mm²) остатъкът е отпадък"
    )
    grain_penalty_factor: float = Field(
        0.5, ge=0, le=2.0,
        description="Penalty фактор за grain нарушения (0-2)"
    )
    multi_pass: bool = Field(
        True,
        description="Multi-pass оптимизация (по-бавно, по-добър резултат)"
    )


class CutListRequest(BaseModel):
    """Заявка за оптимизация на разкрояване."""
    parts: List[PartRequest] = Field(..., min_length=1, description="Списък от парчета")
    sheets: List[SheetRequest] = Field(..., min_length=1, description="Шаблони на листове")
    settings: CutSettingsRequest = Field(
        default_factory=CutSettingsRequest,
        description="Настройки на оптимизацията"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "parts": [
                    {"name": "Страница", "width": 560, "height": 870,
                     "material": "ПДЧ 18мм Бял", "grain": "none", "quantity": 2},
                    {"name": "Врата", "width": 597, "height": 867,
                     "material": "ПДЧ 18мм Бял", "grain": "horizontal", "quantity": 1},
                ],
                "sheets": [
                    {"name": "ПДЧ 18мм Бял", "width": 2800, "height": 2070,
                     "material": "ПДЧ 18мм Бял", "grain": "none", "cost": 45.0}
                ],
                "settings": {"saw_kerf_mm": 4, "multi_pass": True}
            }]
        }
    }


# ─────────────────── Response Models ───────────────────

class PlacedPartResponse(BaseModel):
    """Поставено парче върху лист."""
    name: str
    x: int
    y: int
    width: int = Field(description="Поставена ширина (може да е rotated)")
    height: int = Field(description="Поставена височина")
    rotated: bool
    grain_aligned: bool
    cabinet_id: str = ""
    material: str = ""


class ReusableOffcutResponse(BaseModel):
    """Остатък, достатъчно голям за повторна употреба."""
    width: int
    height: int
    material: str
    source_sheet_index: int


class UsedSheetResponse(BaseModel):
    """Използван лист с поставени парчета."""
    sheet_index: int
    name: str
    width: int
    height: int
    material: str
    grain: str
    cost: float
    placed_parts: List[PlacedPartResponse]
    used_area: int
    total_area: int
    efficiency_pct: float


class StatisticsResponse(BaseModel):
    """Статистика на оптимизацията."""
    total_sheets: int
    total_parts: int
    placed_parts: int
    unplaced_parts: int
    placement_rate_pct: float
    total_sheet_area_mm2: int
    total_used_area_mm2: int
    waste_area_mm2: int
    efficiency_pct: float
    estimated_cost_bgn: float
    grain_compliance_pct: float
    grain_violations: int


class UnplacedPartResponse(BaseModel):
    """Парче, което не е могло да бъде поставено."""
    name: str
    width: int
    height: int
    material: str


class CutListResponse(BaseModel):
    """Пълен отговор от оптимизацията."""
    success: bool = True
    used_sheets: List[UsedSheetResponse]
    unplaced_parts: List[UnplacedPartResponse]
    reusable_offcuts: List[ReusableOffcutResponse]
    statistics: StatisticsResponse

    # За директно подаване към frontend визуализатора
    visualizer_data: List[Dict] = Field(
        default_factory=list,
        description="Данни, готови за CutListVisualizer.generateSVG()"
    )
