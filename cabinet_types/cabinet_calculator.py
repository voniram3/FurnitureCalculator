# cabinet_calculator.py
from abc import ABC, abstractmethod
from models import Cabinet, CalculationResult


class CabinetCalculator(ABC):
    """
    Абстрактен базов клас за всички калкулатори на шкафове.
    Гарантира единен интерфейс и подобрява архитектурата.
    """

    @staticmethod
    @abstractmethod
    def calculate(cabinet: Cabinet) -> CalculationResult:
        """
        Изчислява всички детайли, кант, хардуер и материали за даден шкаф.
        Всеки подклас ТРЯБВА да имплементира този метод.
        """
        pass
