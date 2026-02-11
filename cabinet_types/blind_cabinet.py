# cabinet_types/blind_cabinet.py
from typing import List
from cabinet_types.cabinet_calculator import CabinetCalculator
from models import *


class BlindCabinetCalculator(CabinetCalculator):
    """Калкулатор за глух шкаф – врата + затварящ панел"""

    @staticmethod
    def calculate(cabinet: Cabinet) -> CalculationResult:
        # Временно използваме BaseCabinet като fallback
        # TODO: Да се имплементира пълна логика за blind шкаф
        from cabinet_types.base_cabinet import BaseCabinetCalculator
        return BaseCabinetCalculator.calculate(cabinet)
