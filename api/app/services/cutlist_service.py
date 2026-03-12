"""
CutList Service
Свързва API schemas с CutListEngine и генерира данни за визуализатора.
"""

from __future__ import annotations
from typing import List, Dict

from cutlist_engine import (
    CutListEngine, CutSettings, CutListResult,
    Part, Sheet, GrainDirection,
    SortingMethod, Heuristic, SplitStrategy,
)


# ─────────────── Schema → Engine conversion ───────────────

def _grain_from_str(value: str) -> GrainDirection:
    mapping = {
        "horizontal": GrainDirection.HORIZONTAL,
        "vertical": GrainDirection.VERTICAL,
        "any": GrainDirection.ANY,
        "none": GrainDirection.NONE,
    }
    return mapping.get(value, GrainDirection.NONE)


def _grain_to_str(value: GrainDirection) -> str:
    return value.value


def parts_from_request(parts_req) -> List[Part]:
    """Конвертира PartRequest списък към Part обекти."""
    result = []
    for p in parts_req:
        result.append(Part(
            name=p.name,
            width=p.width,
            height=p.height,
            material=p.material,
            grain=_grain_from_str(p.grain.value),
            allow_rotation=p.allow_rotation,
            priority=p.priority,
            quantity=p.quantity,
            edge_banding={
                "top": p.edge_banding.top,
                "bottom": p.edge_banding.bottom,
                "left": p.edge_banding.left,
                "right": p.edge_banding.right,
            },
            cabinet_id=p.cabinet_id,
        ))
    return result


def sheets_from_request(sheets_req) -> List[Sheet]:
    """Конвертира SheetRequest списък към Sheet обекти."""
    result = []
    for s in sheets_req:
        result.append(Sheet(
            name=s.name,
            width=s.width,
            height=s.height,
            material=s.material,
            grain=_grain_from_str(s.grain.value),
            cost=s.cost,
            thickness_mm=s.thickness_mm,
        ))
    return result


def settings_from_request(settings_req) -> CutSettings:
    """Конвертира CutSettingsRequest към CutSettings."""
    return CutSettings(
        saw_kerf_mm=settings_req.saw_kerf_mm,
        allow_rotation=settings_req.allow_rotation,
        respect_grain=settings_req.respect_grain,
        min_usable_offcut_mm=settings_req.min_usable_offcut_mm,
        min_waste_area_mm2=settings_req.min_waste_area_mm2,
        grain_penalty_factor=settings_req.grain_penalty_factor,
        multi_pass=settings_req.multi_pass,
    )


# ─────────────── Engine → Response conversion ───────────────

def result_to_response(result: CutListResult) -> dict:
    """
    Конвертира CutListResult към dict за CutListResponse.
    Включва и visualizer_data за директно подаване към JS визуализатора.
    """
    used_sheets = []
    visualizer_data = []

    for us in result.used_sheets:
        # Response формат
        placed = []
        for pp in us.placed_parts:
            placed.append({
                "name": pp.part_name,
                "x": pp.x,
                "y": pp.y,
                "width": pp.width,
                "height": pp.height,
                "rotated": pp.rotated,
                "grain_aligned": pp.grain_aligned,
                "cabinet_id": pp.cabinet_id,
                "material": pp.material,
            })

        used_sheets.append({
            "sheet_index": us.sheet_index,
            "name": us.sheet.name,
            "width": us.sheet.width,
            "height": us.sheet.height,
            "material": us.sheet.material,
            "grain": _grain_to_str(us.sheet.grain),
            "cost": us.sheet.cost,
            "placed_parts": placed,
            "used_area": us.used_area,
            "total_area": us.total_area,
            "efficiency_pct": round(us.efficiency, 1),
        })

        # Visualizer формат — съвместим с CutListVisualizer.generateSVG()
        vis_parts = []
        for pp in us.placed_parts:
            vis_parts.append({
                "name": pp.part_name,
                "x": pp.x,
                "y": pp.y,
                "placedWidth": pp.width,
                "placedHeight": pp.height,
                "width": pp.width,
                "height": pp.height,
                "rotated": pp.rotated,
                "grainAligned": pp.grain_aligned,
                "grainDirection": _grain_to_str(us.sheet.grain),
                "material": pp.material,
            })

        visualizer_data.append({
            "width": us.sheet.width,
            "height": us.sheet.height,
            "materialType": us.sheet.material,
            "grainDirection": _grain_to_str(us.sheet.grain),
            "placedParts": vis_parts,
            "efficiency": round(us.efficiency, 1),
            "cost": us.sheet.cost,
            "usedArea": us.used_area,
            "area": us.total_area,
            # За report compatibility
            "grainCompliance": _sheet_grain_compliance(us),
        })

    # Unplaced
    unplaced = []
    for p in result.unplaced_parts:
        unplaced.append({
            "name": p.name,
            "width": p.width,
            "height": p.height,
            "material": p.material,
        })

    # Offcuts
    offcuts = []
    for o in result.reusable_offcuts:
        offcuts.append({
            "width": o.width,
            "height": o.height,
            "material": o.material,
            "source_sheet_index": o.source_sheet_index,
        })

    # Statistics (flatten from engine)
    stats = result.statistics.copy()
    # Премахваме sheets_detail — вече е в used_sheets
    stats.pop("sheets_detail", None)

    return {
        "success": True,
        "used_sheets": used_sheets,
        "unplaced_parts": unplaced,
        "reusable_offcuts": offcuts,
        "statistics": stats,
        "visualizer_data": visualizer_data,
    }


def _sheet_grain_compliance(us) -> float:
    """Grain compliance за един лист."""
    if not us.placed_parts:
        return 100.0
    aligned = sum(1 for pp in us.placed_parts if pp.grain_aligned)
    return round(aligned / len(us.placed_parts) * 100, 1)


# ─────────────── Main service function ───────────────

def optimize_cutlist(request) -> dict:
    """
    Главна функция — приема CutListRequest, пуска engine, връща dict за response.
    """
    parts = parts_from_request(request.parts)
    sheets = sheets_from_request(request.sheets)
    settings = settings_from_request(request.settings)

    engine = CutListEngine(settings)
    result = engine.optimize(parts, sheets)

    return result_to_response(result)
