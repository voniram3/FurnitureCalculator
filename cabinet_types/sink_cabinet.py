# cabinet_types/sink_cabinet.py
from typing import List
from cabinet_types.cabinet_calculator import CabinetCalculator
from models import *


class SinkCabinetCalculator(CabinetCalculator):
    """Калкулатор за шкаф за мивка – винаги 3 стабилизатора"""

    @staticmethod
    def calculate(cabinet: Cabinet) -> CalculationResult:
        from cabinet_types.base_cabinet import BaseCabinetCalculator
        result = BaseCabinetCalculator.calculate(cabinet)

        # Премахваме старите стабилизатори
        old_stabs = [p for p in result.panels if "Стабилизатор" in p.name]
        for p in old_stabs:
            result.panels.remove(p)

        # Добавяме нови – винаги 3
        t = 18  # дебелина на материала мм (като в base_cabinet)
        stab_width = cabinet.width - 2 * t
        stabilizer_depth = 100  # стандартна дълбочина
            
        new_stab = Panel(
            name="Стабилизатор (мивка)",
            width_mm=stab_width,
            height_mm=stabilizer_depth,
            material=MaterialType.BODY,
            edge_front=1.0,
            quantity=3
        )
        result.add_panel(new_stab)

        return result
