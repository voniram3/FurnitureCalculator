"""
CutList Optimization Engine v2.0
Хибриден 2D bin-packing: Guillotine + свободно разполагане в остатъци.

Основни подобрения спрямо JS версията:
- Saw kerf се приспада при всеки рез
- Multi-pass оптимизация (опит с различни стратегии, избор на най-добрата)
- Grain direction с explicit 'none' за плочи без шарка
- Минимален остатък за повторна употреба (reusable offcuts)
- Дебелина на материала се проверява при matching
"""

from __future__ import annotations

import math
import copy
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Tuple


# ─────────────────────────── Enums & Data Classes ───────────────────────────

class GrainDirection(Enum):
    HORIZONTAL = "horizontal"
    VERTICAL = "vertical"
    ANY = "any"       # материалът има grain но няма значение коя посока
    NONE = "none"     # материалът НЯМА grain (напр. едноцветно ПДЧ)


class SplitStrategy(Enum):
    """Как да разделим остатъчното пространство след guillotine cut."""
    LONGER_AXIS = "longer_axis"         # по-дългата остатъчна страна (класически)
    SHORTER_AXIS = "shorter_axis"       # по-късата страна
    MAXIMIZE_REMAINDER = "max_remainder"  # избира така че по-големият остатък да е по-полезен
    MINIMIZE_WASTE = "min_waste"         # минимизира безполезните ивици


class SortingMethod(Enum):
    AREA_DESC = "area"
    MAX_SIDE = "maxside"
    PERIMETER = "perimeter"
    GRAIN_FIRST = "grain"
    PRIORITY_FIRST = "priority"


class Heuristic(Enum):
    BAF = "baf"     # Best Area Fit
    BSSF = "bssf"   # Best Short Side Fit
    BLSF = "blsf"   # Best Long Side Fit
    COMBINED = "combined"  # Комбинирана (по подразбиране)


@dataclass
class CutSettings:
    saw_kerf_mm: float = 4.0
    allow_rotation: bool = True
    respect_grain: bool = True
    min_usable_offcut_mm: float = 100.0   # минимален размер за запазване на остатък
    min_waste_area_mm2: float = 10_000.0  # под тази площ = отпадък
    grain_penalty_factor: float = 0.5     # % от площта като penalty
    edge_waste_threshold_mm: float = 50.0
    sorting: SortingMethod = SortingMethod.AREA_DESC
    heuristic: Heuristic = Heuristic.COMBINED
    split_strategy: SplitStrategy = SplitStrategy.MAXIMIZE_REMAINDER
    multi_pass: bool = True  # опитай различни стратегии и вземи най-добрата


@dataclass
class Part:
    name: str
    width: int          # mm
    height: int         # mm
    material: str       # напр. "ПДЧ 18мм Бял"
    grain: GrainDirection = GrainDirection.NONE
    allow_rotation: bool = True
    priority: int = 5   # 1-10
    quantity: int = 1
    edge_banding: Dict[str, bool] = field(default_factory=lambda: {
        "top": False, "bottom": False, "left": False, "right": False
    })
    cabinet_id: str = ""   # от кой шкаф идва


@dataclass
class Sheet:
    name: str
    width: int           # mm
    height: int          # mm
    material: str
    grain: GrainDirection = GrainDirection.NONE
    cost: float = 0.0    # BGN
    thickness_mm: float = 18.0


@dataclass
class FreeRect:
    x: int
    y: int
    width: int
    height: int

    @property
    def area(self) -> int:
        return self.width * self.height

    def can_fit(self, w: int, h: int) -> bool:
        return w <= self.width and h <= self.height


@dataclass
class PlacedPart:
    part_name: str
    x: int
    y: int
    width: int           # placed width (може да е rotated)
    height: int          # placed height
    rotated: bool
    grain_aligned: bool
    cabinet_id: str = ""
    material: str = ""


@dataclass
class UsedSheet:
    sheet: Sheet
    sheet_index: int
    placed_parts: List[PlacedPart] = field(default_factory=list)
    free_rects: List[FreeRect] = field(default_factory=list)
    used_area: int = 0

    @property
    def total_area(self) -> int:
        return self.sheet.width * self.sheet.height

    @property
    def efficiency(self) -> float:
        return (self.used_area / self.total_area * 100) if self.total_area > 0 else 0.0


@dataclass
class ReusableOffcut:
    width: int
    height: int
    material: str
    source_sheet_index: int


@dataclass
class CutListResult:
    used_sheets: List[UsedSheet]
    unplaced_parts: List[Part]
    reusable_offcuts: List[ReusableOffcut]
    statistics: Dict


# ─────────────────────────── Helpers ────────────────────────────────────────

def parse_material(material_str: str) -> Tuple[str, Optional[float]]:
    """Извлича тип и дебелина: 'ПДЧ 18мм Бял' -> ('ПДЧ', 18.0)"""
    import re
    known = ["ПДЧ", "МДФ", "ХДЛ", "Масив", "Фурнир", "Шперплат"]
    mat_type = material_str
    for k in known:
        if k in material_str:
            mat_type = k
            break

    thickness = None
    m = re.search(r"(\d+(?:\.\d+)?)\s*мм", material_str)
    if m:
        thickness = float(m.group(1))
    return mat_type, thickness


def materials_match(part_material: str, sheet_material: str) -> bool:
    p_type, p_thick = parse_material(part_material)
    s_type, s_thick = parse_material(sheet_material)
    if p_type != s_type:
        return False
    if p_thick is not None and s_thick is not None and p_thick != s_thick:
        return False
    return True


def grain_compatible(part_grain: GrainDirection, sheet_grain: GrainDirection,
                     rotated: bool) -> bool:
    """Проверява дали grain-ът на парчето е съвместим с листа."""
    # Ако някой от двата няма grain — винаги ОК
    if part_grain == GrainDirection.NONE or sheet_grain == GrainDirection.NONE:
        return True
    if part_grain == GrainDirection.ANY or sheet_grain == GrainDirection.ANY:
        return True

    effective = part_grain
    if rotated:
        effective = (GrainDirection.VERTICAL if part_grain == GrainDirection.HORIZONTAL
                     else GrainDirection.HORIZONTAL)
    return effective == sheet_grain


# ─────────────────────────── Core Engine ────────────────────────────────────

class CutListEngine:
    """
    Хибриден 2D bin-packing engine.

    Фаза 1 (Guillotine): Подрежда големите парчета с guillotine cuts.
    Фаза 2 (Free-rect fill): Запълва остатъчните зони с по-малки парчета.
    Multi-pass: Изпълнява с различни sorting/split стратегии и избира
                варианта с най-висока обща ефективност.
    """

    def __init__(self, settings: Optional[CutSettings] = None):
        self.settings = settings or CutSettings()

    # ──────────── Public API ────────────

    def optimize(self, parts: List[Part], sheets: List[Sheet]) -> CutListResult:
        """
        Основна точка на вход.
        parts: списък от парчета (quantity се разгъва вътрешно)
        sheets: шаблони на листове (ще се създават нови при нужда)
        """
        # Разгъване на quantity
        expanded = []
        for p in parts:
            for i in range(p.quantity):
                expanded.append(Part(
                    name=f"{p.name}" if p.quantity == 1 else f"{p.name} #{i+1}",
                    width=p.width, height=p.height,
                    material=p.material, grain=p.grain,
                    allow_rotation=p.allow_rotation, priority=p.priority,
                    quantity=1, edge_banding=p.edge_banding,
                    cabinet_id=p.cabinet_id,
                ))
            expanded[-1].name = p.name if p.quantity == 1 else expanded[-1].name

        if not expanded or not sheets:
            return CutListResult([], expanded, [], self._empty_stats())

        if self.settings.multi_pass:
            return self._multi_pass_optimize(expanded, sheets)
        else:
            return self._single_pass(expanded, sheets,
                                     self.settings.sorting,
                                     self.settings.split_strategy)

    # ──────────── Multi-pass ────────────

    def _multi_pass_optimize(self, parts: List[Part], sheets: List[Sheet]) -> CutListResult:
        """Опитва различни комбинации от sorting + split и избира най-добрата."""
        strategies = [
            (SortingMethod.AREA_DESC, SplitStrategy.MAXIMIZE_REMAINDER),
            (SortingMethod.AREA_DESC, SplitStrategy.LONGER_AXIS),
            (SortingMethod.MAX_SIDE, SplitStrategy.MAXIMIZE_REMAINDER),
            (SortingMethod.PERIMETER, SplitStrategy.MINIMIZE_WASTE),
            (SortingMethod.GRAIN_FIRST, SplitStrategy.MAXIMIZE_REMAINDER),
            (SortingMethod.PRIORITY_FIRST, SplitStrategy.LONGER_AXIS),
            # Добавяме и reversed варианти (на обратно подредени парчета)
            (SortingMethod.AREA_DESC, SplitStrategy.SHORTER_AXIS),
            (SortingMethod.MAX_SIDE, SplitStrategy.LONGER_AXIS),
        ]

        best_result: Optional[CutListResult] = None
        best_score = -1.0

        for sort_method, split_strat in strategies:
            result = self._single_pass(
                copy.deepcopy(parts), sheets, sort_method, split_strat
            )
            score = self._evaluate_result(result)
            if score > best_score:
                best_score = score
                best_result = result

        return best_result

    def _evaluate_result(self, result: CutListResult) -> float:
        """Scoring функция за сравнение на различни варианти."""
        stats = result.statistics
        # По-висок score = по-добре
        # Тегла: ефективност (60%), placement rate (30%), grain compliance (10%)
        eff = stats.get("efficiency_pct", 0)
        placement = stats.get("placement_rate_pct", 0)
        grain = stats.get("grain_compliance_pct", 100)
        return eff * 0.6 + placement * 0.3 + grain * 0.1

    # ──────────── Single pass ────────────

    def _single_pass(self, parts: List[Part], sheet_templates: List[Sheet],
                     sorting: SortingMethod, split_strategy: SplitStrategy) -> CutListResult:

        sorted_parts = self._sort_parts(parts, sorting)
        used_sheets: List[UsedSheet] = []
        unplaced: List[Part] = []
        kerf = int(self.settings.saw_kerf_mm)

        for part in sorted_parts:
            placed = False

            # Опит 1: Намери място в съществуващ лист
            best = self._find_best_placement(part, used_sheets, kerf)
            if best:
                sheet_idx, rect_idx, rotated, score = best
                self._place_part(used_sheets[sheet_idx], part, rect_idx, rotated, kerf, split_strategy)
                placed = True

            # Опит 2: Нов лист
            if not placed:
                template = self._find_template_for(part, sheet_templates)
                if template:
                    new_sheet = UsedSheet(
                        sheet=template,
                        sheet_index=len(used_sheets),
                        free_rects=[FreeRect(0, 0, template.width, template.height)],
                    )
                    used_sheets.append(new_sheet)
                    self._place_part(new_sheet, part, 0, False, kerf, split_strategy)
                    placed = True

            if not placed:
                unplaced.append(part)

        # Фаза 2: опитай да запълниш свободните rect-ове с неразпределени парчета
        if unplaced:
            still_unplaced = []
            for part in unplaced:
                best = self._find_best_placement(part, used_sheets, kerf)
                if best:
                    sheet_idx, rect_idx, rotated, score = best
                    self._place_part(used_sheets[sheet_idx], part, rect_idx, rotated, kerf, split_strategy)
                else:
                    still_unplaced.append(part)
            unplaced = still_unplaced

        # Събиране на reusable offcuts
        offcuts = self._collect_offcuts(used_sheets)
        stats = self._compute_statistics(used_sheets, parts, unplaced)

        return CutListResult(used_sheets, unplaced, offcuts, stats)

    # ──────────── Placement logic ────────────

    def _find_best_placement(self, part: Part, used_sheets: List[UsedSheet],
                             kerf: int) -> Optional[Tuple[int, int, bool, float]]:
        """
        Намира най-доброто (sheet_idx, rect_idx, rotated, score) за дадено парче.
        Връща None ако няма валидно място.
        """
        best = None
        best_score = math.inf

        for si, usheet in enumerate(used_sheets):
            if not materials_match(part.material, usheet.sheet.material):
                continue

            for ri, rect in enumerate(usheet.free_rects):
                # Без ротация
                score = self._try_fit(part, rect, False, usheet, kerf)
                if score is not None and score < best_score:
                    best_score = score
                    best = (si, ri, False, score)

                # С ротация
                if self._can_rotate(part, usheet):
                    score = self._try_fit(part, rect, True, usheet, kerf)
                    if score is not None and score < best_score:
                        best_score = score
                        best = (si, ri, True, score)

        return best

    def _try_fit(self, part: Part, rect: FreeRect, rotated: bool,
                 usheet: UsedSheet, kerf: int) -> Optional[float]:
        """Проверява дали парчето се побира и връща score, или None."""
        w = part.height if rotated else part.width
        h = part.width if rotated else part.height

        if not rect.can_fit(w, h):
            return None

        aligned = grain_compatible(part.grain, usheet.sheet.grain, rotated)
        return self._score(w, h, rect, aligned, part)

    def _score(self, w: int, h: int, rect: FreeRect,
               grain_aligned: bool, part: Part) -> float:
        """Изчислява placement score. По-нисък = по-добре."""
        rw = rect.width - w
        rh = rect.height - h
        area = w * h

        heuristic = self.settings.heuristic
        if heuristic == Heuristic.BAF:
            score = float(rw * rh)
        elif heuristic == Heuristic.BSSF:
            score = float(min(rw, rh))
        elif heuristic == Heuristic.BLSF:
            score = float(max(rw, rh))
        else:  # COMBINED
            # Комбинация: малка остатъчна площ + penalty за тънки ивици
            score = float(rw * rh) + float(rw + rh) * 10.0

        # Grain penalty
        if not grain_aligned and self.settings.respect_grain:
            score += area * self.settings.grain_penalty_factor

        # Priority bonus (по-висок priority = по-нисък score)
        score -= part.priority * 100.0

        # Edge waste penalty — тънки ивици под 50mm са безполезни
        edge_min = min(rw, rh)
        threshold = self.settings.edge_waste_threshold_mm
        if 0 < edge_min < threshold:
            score += (threshold - edge_min) * 20.0

        # Bonus за перфектен fit (една или две страни съвпадат точно)
        if rw == 0:
            score -= 500.0
        if rh == 0:
            score -= 500.0

        return score

    def _can_rotate(self, part: Part, usheet: UsedSheet) -> bool:
        if not self.settings.allow_rotation or not part.allow_rotation:
            return False
        # Ако grain е NONE — свободна ротация
        if part.grain == GrainDirection.NONE or usheet.sheet.grain == GrainDirection.NONE:
            return True
        if part.grain == GrainDirection.ANY or usheet.sheet.grain == GrainDirection.ANY:
            return True
        # Ако и двете имат конкретна посока — ротация обръща grain, проверяваме
        return True  # позволяваме, но grain_penalty ще натежи при scoring

    def _place_part(self, usheet: UsedSheet, part: Part,
                    rect_idx: int, rotated: bool, kerf: int,
                    split_strategy: SplitStrategy):
        """Поставя парче в лист и разделя свободното пространство."""
        rect = usheet.free_rects[rect_idx]
        w = part.height if rotated else part.width
        h = part.width if rotated else part.height

        placed = PlacedPart(
            part_name=part.name,
            x=rect.x, y=rect.y,
            width=w, height=h,
            rotated=rotated,
            grain_aligned=grain_compatible(part.grain, usheet.sheet.grain, rotated),
            cabinet_id=part.cabinet_id,
            material=part.material,
        )
        usheet.placed_parts.append(placed)
        usheet.used_area += w * h

        # Премахваме текущия rect
        usheet.free_rects.pop(rect_idx)

        # Guillotine split с kerf
        rw = rect.width - w - kerf   # остатък надясно
        rh = rect.height - h - kerf  # остатък надолу

        rw = max(0, rw)
        rh = max(0, rh)

        new_rects = self._split(rect, w, h, rw, rh, kerf, split_strategy)

        # Филтрираме малките безполезни остатъци
        min_area = self.settings.min_waste_area_mm2
        for nr in new_rects:
            if nr.area >= min_area:
                usheet.free_rects.append(nr)

    def _split(self, rect: FreeRect, pw: int, ph: int,
               rw: int, rh: int, kerf: int,
               strategy: SplitStrategy) -> List[FreeRect]:
        """
        Guillotine split. Връща до 2 нови FreeRect-а.

        След поставяне на парче (pw x ph) в rect, остават два варианта:
        A) Хоризонтален рез: right = (rw x rect.h), bottom = (pw x rh)
        B) Вертикален рез:   right = (rw x ph), bottom = (rect.w x rh)

        Стратегията определя кой вариант да изберем.
        """
        results = []

        if rw <= 0 and rh <= 0:
            return results

        if rw <= 0:
            # Само надолу
            results.append(FreeRect(
                rect.x, rect.y + ph + kerf,
                rect.width, rh
            ))
            return results

        if rh <= 0:
            # Само надясно
            results.append(FreeRect(
                rect.x + pw + kerf, rect.y,
                rw, rect.height
            ))
            return results

        # И двата остатъка съществуват — избираме стратегия
        # Вариант A: хоризонтален рез
        a_right = FreeRect(rect.x + pw + kerf, rect.y, rw, rect.height)
        a_bottom = FreeRect(rect.x, rect.y + ph + kerf, pw, rh)

        # Вариант B: вертикален рез
        b_right = FreeRect(rect.x + pw + kerf, rect.y, rw, ph)
        b_bottom = FreeRect(rect.x, rect.y + ph + kerf, rect.width, rh)

        if strategy == SplitStrategy.LONGER_AXIS:
            if rw >= rh:
                results = [a_right, a_bottom]
            else:
                results = [b_right, b_bottom]

        elif strategy == SplitStrategy.SHORTER_AXIS:
            if rw < rh:
                results = [a_right, a_bottom]
            else:
                results = [b_right, b_bottom]

        elif strategy == SplitStrategy.MAXIMIZE_REMAINDER:
            # Избираме варианта, който дава по-голям максимален rect
            a_max = max(a_right.area, a_bottom.area)
            b_max = max(b_right.area, b_bottom.area)
            if a_max >= b_max:
                results = [a_right, a_bottom]
            else:
                results = [b_right, b_bottom]

        elif strategy == SplitStrategy.MINIMIZE_WASTE:
            # Избираме варианта с по-малко тънки ивици
            a_thin = sum(1 for r in [a_right, a_bottom]
                         if min(r.width, r.height) < self.settings.edge_waste_threshold_mm)
            b_thin = sum(1 for r in [b_right, b_bottom]
                         if min(r.width, r.height) < self.settings.edge_waste_threshold_mm)
            if a_thin <= b_thin:
                results = [a_right, a_bottom]
            else:
                results = [b_right, b_bottom]
        else:
            results = [a_right, a_bottom]

        return results

    # ──────────── Sorting ────────────

    def _sort_parts(self, parts: List[Part], method: SortingMethod) -> List[Part]:
        if method == SortingMethod.AREA_DESC:
            return sorted(parts, key=lambda p: p.width * p.height, reverse=True)
        elif method == SortingMethod.MAX_SIDE:
            return sorted(parts, key=lambda p: max(p.width, p.height), reverse=True)
        elif method == SortingMethod.PERIMETER:
            return sorted(parts, key=lambda p: 2 * (p.width + p.height), reverse=True)
        elif method == SortingMethod.GRAIN_FIRST:
            def grain_key(p: Part):
                grain_rank = 0 if p.grain in (GrainDirection.HORIZONTAL, GrainDirection.VERTICAL) else 1
                return (grain_rank, -(p.width * p.height))
            return sorted(parts, key=grain_key)
        elif method == SortingMethod.PRIORITY_FIRST:
            return sorted(parts, key=lambda p: (-p.priority, -(p.width * p.height)))
        return parts

    # ──────────── Template matching ────────────

    def _find_template_for(self, part: Part, templates: List[Sheet]) -> Optional[Sheet]:
        """Намира лист-шаблон за дадено парче (по материал и размер)."""
        for t in templates:
            if materials_match(part.material, t.material):
                # Проверяваме дали парчето се побира в листа
                if (part.width <= t.width and part.height <= t.height):
                    return t
                if (self._can_rotate_basic(part) and
                        part.height <= t.width and part.width <= t.height):
                    return t
        return None

    def _can_rotate_basic(self, part: Part) -> bool:
        return self.settings.allow_rotation and part.allow_rotation

    # ──────────── Offcuts ────────────

    def _collect_offcuts(self, used_sheets: List[UsedSheet]) -> List[ReusableOffcut]:
        """Събира остатъци, достатъчно големи за повторна употреба."""
        offcuts = []
        min_dim = self.settings.min_usable_offcut_mm
        for usheet in used_sheets:
            for rect in usheet.free_rects:
                if rect.width >= min_dim and rect.height >= min_dim:
                    offcuts.append(ReusableOffcut(
                        width=rect.width,
                        height=rect.height,
                        material=usheet.sheet.material,
                        source_sheet_index=usheet.sheet_index,
                    ))
        return offcuts

    # ──────────── Statistics ────────────

    def _compute_statistics(self, used_sheets: List[UsedSheet],
                            all_parts: List[Part],
                            unplaced: List[Part]) -> Dict:
        total_sheet_area = sum(us.total_area for us in used_sheets)
        total_used_area = sum(us.used_area for us in used_sheets)
        total_cost = sum(us.sheet.cost for us in used_sheets)
        placed_count = sum(len(us.placed_parts) for us in used_sheets)
        total_count = len(all_parts)

        grain_violations = 0
        grain_total = 0
        for us in used_sheets:
            for pp in us.placed_parts:
                grain_total += 1
                if not pp.grain_aligned:
                    grain_violations += 1

        efficiency = (total_used_area / total_sheet_area * 100) if total_sheet_area > 0 else 0
        placement_rate = (placed_count / total_count * 100) if total_count > 0 else 0
        grain_compliance = ((grain_total - grain_violations) / grain_total * 100) if grain_total > 0 else 100
        waste_area = total_sheet_area - total_used_area

        return {
            "total_sheets": len(used_sheets),
            "total_parts": total_count,
            "placed_parts": placed_count,
            "unplaced_parts": len(unplaced),
            "placement_rate_pct": round(placement_rate, 1),
            "total_sheet_area_mm2": total_sheet_area,
            "total_used_area_mm2": total_used_area,
            "waste_area_mm2": waste_area,
            "efficiency_pct": round(efficiency, 2),
            "estimated_cost_bgn": round(total_cost, 2),
            "grain_compliance_pct": round(grain_compliance, 1),
            "grain_violations": grain_violations,
            "sheets_detail": [
                {
                    "index": us.sheet_index,
                    "material": us.sheet.material,
                    "dimensions": f"{us.sheet.width}x{us.sheet.height}",
                    "efficiency_pct": round(us.efficiency, 1),
                    "parts_count": len(us.placed_parts),
                    "cost_bgn": us.sheet.cost,
                }
                for us in used_sheets
            ],
        }

    def _empty_stats(self) -> Dict:
        return {
            "total_sheets": 0, "total_parts": 0, "placed_parts": 0,
            "unplaced_parts": 0, "placement_rate_pct": 0,
            "total_sheet_area_mm2": 0, "total_used_area_mm2": 0,
            "waste_area_mm2": 0, "efficiency_pct": 0,
            "estimated_cost_bgn": 0, "grain_compliance_pct": 100,
            "grain_violations": 0, "sheets_detail": [],
        }


# ─────────────────────────── Convenience / Integration ──────────────────────

def optimize_from_cabinet_engine(calculation_result: dict,
                                 sheet_templates: List[Sheet],
                                 settings: Optional[CutSettings] = None) -> CutListResult:
    """
    Интеграция с FurnitureEngine.calculate_project().
    Взема резултата от cabinet_engine и го подава директно към CutListEngine.
    """
    parts = []
    for cab_result in calculation_result.get("cabinets", []):
        cab_id = getattr(cab_result.cabinet, "cabinet_id", "")
        for panel in cab_result.panels:
            grain = GrainDirection.NONE
            if panel.material.value in ("door", "body"):
                grain = GrainDirection.ANY  # може да се настрои по-фино

            parts.append(Part(
                name=panel.name,
                width=panel.width_mm,
                height=panel.height_mm,
                material=str(panel.material.value),
                grain=grain,
                quantity=panel.quantity,
                cabinet_id=cab_id,
            ))

    engine = CutListEngine(settings)
    return engine.optimize(parts, sheet_templates)
