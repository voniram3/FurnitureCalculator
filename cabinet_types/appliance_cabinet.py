# cabinet_types/appliance_cabinet.py
"""
Модул за вградени уреди – обновен с логика за хладилник и колона
"""
from typing import List
from cabinet_types.cabinet_calculator import CabinetCalculator
from models import *

class ApplianceCabinetCalculator(CabinetCalculator):
    @staticmethod
    def calculate(cabinet: Cabinet) -> CalculationResult:
        # Проверяваме дали е fridge или column
        if cabinet.type in [CabinetType.FRIDGE, CabinetType.COLUMN]:
            # За fridge/column: специализирана логика за врати
            return ApplianceCabinetCalculator._calculate_fridge_column(cabinet)
        else:
            # За други appliance типове: BaseCabinet
            from cabinet_types.base_cabinet import BaseCabinetCalculator
            return BaseCabinetCalculator.calculate(cabinet)

    @staticmethod
    def _calculate_fridge_column(cabinet: Cabinet) -> CalculationResult:
        """Калкулация за fridge/column с логика за панти според размер"""
        
        # Използваме BaseCabinet като основа
        from cabinet_types.base_cabinet import BaseCabinetCalculator
        result = BaseCabinetCalculator.calculate(cabinet)
        
        # Премахваме стабилизаторите (за fridge/column не трябва)
        stabilizers = [p for p in result.panels if "Стабилизатор" in p.name]
        for stabilizer in stabilizers:
            result.panels.remove(stabilizer)
        
        # Добавяме капак (идентичен с дъното)
        bottom_panels = [p for p in result.panels if "Дъно" in p.name]
        if bottom_panels:
            bottom_panel = bottom_panels[0]
            cap_panel = Panel(
                name="Капак (хладилник/колона)",
                width_mm=bottom_panel.width_mm,
                height_mm=bottom_panel.height_mm,
                material=MaterialType.BODY,
                edge_front=1.0,
                edge_back=None,
                edge_left=None,
                edge_right=None,
                quantity=1
            )
            result.add_panel(cap_panel)
        
        # Две врати с РАЗЛИЧНИ ВИСОЧИНИ И РАЗМЕРИ
        # Малка врата: 1200мм × (ширина/2 - 50) = 2 панти
        # Голяма врата: 1797мм × (ширина/2 + 50) = 4 панти
        
        # Премахваме старите врати от BaseCabinet
        old_doors = [p for p in result.panels if "Врата" in p.name]
        for door in old_doors:
            result.panels.remove(door)
        
        # Изчисляване на размери за вратите
        gap = 3  # фуга на вратите мм
        door_width_small = (cabinet.width // 2) - gap - 50  # по-тяска с 50мм
        door_height_small = cabinet.height - gap
        door_width_large = (cabinet.width // 2) - gap + 50  # по-широка с 50мм  
        door_height_large = cabinet.height - gap
        
        # Малка врата
        small_door = Panel(
            name="Врата 1 (мала)",
            width_mm=int(door_width_small),
            height_mm=int(door_height_small),
            material=MaterialType.DOOR,
            edge_front=2.0,
            quantity=1
        )
        result.add_panel(small_door)
        
        # Голяма врата
        large_door = Panel(
            name="Врата 2 (голяма)",
            width_mm=int(door_width_large),
            height_mm=int(door_height_large),
            material=MaterialType.DOOR,
            edge_front=2.0,
            quantity=1
        )
        result.add_panel(large_door)
        
        # Панти за всяка врата
        small_hinges = 2  # за малката врата
        large_hinges = 4  # за голямата врата
        
        # Премахваме старите панти и добавяме нови
        old_hardware = [hw for hw in result.hardware if "Панта" in hw.name]
        for old in old_hardware:
            result.hardware.remove(old)
        
        result.add_hardware(HardwareItem(name="Панта за мала врата", quantity=small_hinges))
        result.add_hardware(HardwareItem(name="Панта за голяма врата", quantity=large_hinges))
        result.add_hardware(HardwareItem(name="Панта за висок шкаф", quantity=small_hinges + large_hinges))
        
        return result