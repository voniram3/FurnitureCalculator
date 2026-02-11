"""
Основен двигател за мебелни калкулации - АКТУАЛИЗИРАН С ЦОКЪЛ
"""
from typing import List, Dict, Optional
from collections import defaultdict
from models import *
from cabinet_types.base_cabinet import BaseCabinetCalculator
from cabinet_types.upper_cabinet import UpperCabinetCalculator
from cabinet_types.drawer_cabinet import DrawerCabinetCalculator
from cabinet_types.oven_cabinet import OvenCabinetCalculator
from cabinet_types.sink_cabinet import SinkCabinetCalculator
from cabinet_types.blind_cabinet import BlindCabinetCalculator
from cabinet_types.appliance_cabinet import ApplianceCabinetCalculator

class FurnitureEngine:
    """Основен двигател за мебелни калкулации"""

    def __init__(self, config: Optional[ConstructionProfile] = None):
        self.config = config or ConstructionProfile()
        self.calculators = {
            CabinetType.BASE: BaseCabinetCalculator(),
            CabinetType.UPPER: UpperCabinetCalculator(),
            CabinetType.DRAWER: DrawerCabinetCalculator(),
            CabinetType.OVEN: OvenCabinetCalculator(),
            CabinetType.SINK: SinkCabinetCalculator(),
            CabinetType.BLIND: BlindCabinetCalculator(),
            CabinetType.FRIDGE: ApplianceCabinetCalculator(),
            CabinetType.COLUMN: ApplianceCabinetCalculator(),
        }

    def calculate_cabinet(self, cabinet: Cabinet) -> CalculationResult:
        """Изчислява един шкаф"""
        calculator = self.calculators.get(cabinet.type)
        if not calculator:
            print(f"Warning: No calculator for {cabinet.type}, using BaseCabinet")
            calculator = self.calculators[CabinetType.BASE]
        return calculator.calculate(cabinet)

    def calculate_project(self, cabinets: List[Cabinet]) -> Dict:
        """Изчислява цял проект + totals + цокъл (plinth_length от долни шкафове)"""
        results = []
        total_hardware = defaultdict(int)
        used_boards = defaultdict(int)
        used_edges_m = defaultdict(float)
        total_labor_cost = 0.0
        total_material_area = defaultdict(float)
        plinth_length = 0.0  # Обща дължина на цокъла в mm
        total_cost_bgn = 0.0

        for cabinet in cabinets:
            result = self.calculate_cabinet(cabinet)
            results.append(result)

            # Сумираме хардуер
            for item in result.hardware:
                total_hardware[item.name] += item.quantity

            # Сумираме дъски
            for board_name, count in result.used_boards.items():
                used_boards[board_name] += count

            # Сумираме кант
            for edge_name, meters in result.used_edges_m.items():
                used_edges_m[edge_name] += meters

            # Сумираме труд и обща цена
            total_labor_cost += result.labor_cost
            total_cost_bgn += result.total_cost_bgn

            # Сумираме материални площи
            for panel in result.panels:
                area = panel.area_sqm * panel.quantity
                total_material_area[panel.material] += area

            # Сумираме цокъл (само от долни шкафове)
            if cabinet.type in [CabinetType.BASE, CabinetType.SINK, CabinetType.OVEN, CabinetType.DRAWER, CabinetType.BLIND, CabinetType.APPLIANCE, CabinetType.FRIDGE]:
                plinth_length += cabinet.width

        # Опционално: добавяме общ цокъл като Panel в първия резултат
        if plinth_length > 0 and results:
            plinth_panel = Panel(
                name="Общ цокъл",
                width_mm=int(plinth_length),
                height_mm=150,
                material=MaterialType.PLINTH,
                edge_front=1.0,
                quantity=1,
                area_sqm=(plinth_length * 150) / 1_000_000
            )
            results[0].add_panel(plinth_panel)

        return {
            "cabinets": results,
            "totals": {
                "hardware": total_hardware,
                "used_boards": used_boards,
                "used_edges_m": used_edges_m,
                "total_labor_cost": total_labor_cost,
                "material_area": total_material_area,
                "plinth_length": plinth_length,
                "total_cost_bgn": total_cost_bgn
            }
        }
