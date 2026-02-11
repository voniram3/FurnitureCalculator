"""
Модул за долни шкафове (Base Cabinets)
Адаптиран за работа с новите модели (BoardProduct, ConstructionProfile)
"""
from typing import List, Dict
from cabinet_types.cabinet_calculator import CabinetCalculator
from models import *


class BaseCabinetCalculator(CabinetCalculator):
    @staticmethod
    def calculate(cabinet: Cabinet) -> CalculationResult:
        """Изчислява долен шкаф"""
        result = CalculationResult(
            cabinet=cabinet,
            panels=[],
            hardware=[],
            used_boards={},
            used_edges_m={},
            plinth_length=cabinet.width,
            labor_cost=0.0,
            installation_cost=0.0,
            total_cost_bgn=0.0
        )

        # Стандартни конфигурации
        t = 18  # дебелина на материала мм
        gap = 3  # фуга на вратите мм
        
        # === СТРАНИЧНИ ПАНЕЛИ (2 бр) ===
        side_panel_width = cabinet.height
        side_panel_height = cabinet.depth
        
        side_panel = Panel(
            name="Страничен панел",
            width_mm=side_panel_width,
            height_mm=side_panel_height,
            material=MaterialType.BODY,
            edge_left=1.0,  # 1мм кант
            edge_front=1.0,
            quantity=2
        )
        result.add_panel(side_panel)
        
        # === ДЪНО ===
        bottom_width = cabinet.width - 2 * t
            
        bottom_panel = Panel(
            name="Дъно",
            width_mm=bottom_width,
            height_mm=cabinet.depth,
            material=MaterialType.BODY,
            edge_front=1.0,
            quantity=1
        )
        result.add_panel(bottom_panel)
        
        # === СТАБИЛИЗАТОРИ ===
        stabilizer_count = 3 if cabinet.width > 600 else 2
        stabilizer_depth = 100  # мм стандартно
        
        stabilizer = Panel(
            name="Стабилизатор",
            width_mm=bottom_width,
            height_mm=stabilizer_depth,
            material=MaterialType.BODY,
            edge_front=1.0,
            quantity=stabilizer_count
        )
        result.add_panel(stabilizer)
        
        # === РАФТОВЕ ===
        if cabinet.shelf_count > 0:
            shelf_width = bottom_width - 1  # 1мм фуга
            shelf_depth = cabinet.depth - 30  # 30мм отстояние от задния ръб
            
            shelf = Panel(
                name="Рафт",
                width_mm=shelf_width,
                height_mm=shelf_depth,
                material=MaterialType.BODY,
                edge_front=1.0,
                quantity=cabinet.shelf_count
            )
            result.add_panel(shelf)
        
        # === ГРЪБ ===
        if cabinet.has_back and cabinet.back_board:
            back_width = cabinet.width - 20  # 10мм от всяка страна
            back_height = cabinet.height - 20  # 10мм отгоре и отдолу
            
            back_panel = Panel(
                name="Гръб",
                width_mm=back_width,
                height_mm=back_height,
                material=MaterialType.BACK,
                quantity=1
            )
            result.add_panel(back_panel)
        
        # === ВРАТИ ===
        door_count = cabinet.door_count or (2 if cabinet.width > 600 else 1)
        
        if door_count == 1:
            door_width = cabinet.width - gap
            door_height = cabinet.height - gap
            
            door = Panel(
                name="Врата",
                width_mm=door_width,
                height_mm=door_height,
                material=MaterialType.DOOR,
                edge_front=2.0,  # 2мм кант за врати
                edge_back=2.0,
                edge_left=2.0,
                edge_right=2.0,
                quantity=1
            )
            result.add_panel(door)
        else:  # 2 врати
            door_width = (cabinet.width / 2) - (gap / 2)
            door_height = cabinet.height - gap
            
            door = Panel(
                name="Врата",
                width_mm=door_width,
                height_mm=door_height,
                material=MaterialType.DOOR,
                edge_front=2.0,
                edge_back=2.0,
                edge_left=2.0,
                edge_right=2.0,
                quantity=2
            )
            result.add_panel(door)
        
        # === ХАРДУЕР ===
        # Крака за долни шкафове
        leg_count = 4
        if cabinet.width <= 600:
            leg_count = 4
        elif cabinet.width <= 1000:
            leg_count = 6
        else:
            leg_count = 8
            
        result.add_hardware(HardwareItem(
            name="Краче за долен шкаф",
            quantity=leg_count,
            notes="100мм"
        ))
        
        result.add_hardware(HardwareItem(
            name="Щипка за краче",
            quantity=leg_count // 2
        ))
        
        # Панти за врати
        hinges_per_door = 3 if cabinet.height > 600 else 2
        total_hinges = door_count * hinges_per_door
        result.add_hardware(HardwareItem(
            name="Панта",
            quantity=total_hinges
        ))
        
        # Рафтодържатели
        if cabinet.shelf_count > 0:
            result.add_hardware(HardwareItem(
                name="Рафтодържател",
                quantity=cabinet.shelf_count * 4  # по 4 на рафт
            ))
        
        # === РАЗЧИТАНЕ НА МАТЕРИАЛИ И ЦЕНИ ===
        BaseCabinetCalculator._calculate_materials_and_costs(result)
        
        return result
    
    @staticmethod
    def _calculate_materials_and_costs(result: CalculationResult):
        """Изчислява използваните материали и разходи"""
        
        # Изчисляване на използвани дъски
        board_usage = {}
        for panel in result.panels:
            board_name = f"{panel.material.value}_{18}мм"  # стандартна дебелина
            board_area = (panel.width_mm * panel.height_mm * panel.quantity) / 1_000_000  # м²
            
            if board_name not in board_usage:
                board_usage[board_name] = 0
            board_usage[board_name] += board_area
        
        # Преобразуване в брой листове (стандартен лист 2800x2070мм = 5.796м²)
        standard_sheet_area = 2.8 * 2.07
        for board_name, area in board_usage.items():
            sheets_needed = (area / standard_sheet_area) + 0.1  # 10% резерв
            result.used_boards[board_name] = int(sheets_needed) + 1
        
        # Изчисляване на кант
        edge_usage = {}
        for panel in result.panels:
            edges = [
                ("front", panel.width_mm, panel.edge_front),
                ("back", panel.width_mm, panel.edge_back),
                ("left", panel.height_mm, panel.edge_left),
                ("right", panel.height_mm, panel.edge_right)
            ]
            
            for edge_name, length, thickness in edges:
                if thickness:
                    edge_key = f"кант_{thickness}мм"
                    if edge_key not in edge_usage:
                        edge_usage[edge_key] = 0
                    edge_usage[edge_key] += (length * panel.quantity) / 1000  # в метри
        
        # Добавяне на кант към резултата
        result.used_edges_m = edge_usage
        
        # Цена на труд (базови ставки)
        labor_rates = {
            "assembly": 25.0,  # лв/час
            "hardware": 8.0,   # лв/час
            "edge": 12.0       # лв/час
        }
        
        # Приблизително време за монтаж
        assembly_time = 0.5 + (len(result.panels) * 0.1)  # часове
        hardware_time = len(result.hardware) * 0.05  # часове
        edge_time = sum(edge_usage.values()) * 0.02  # часове
        
        result.labor_cost = (
            assembly_time * labor_rates["assembly"] +
            hardware_time * labor_rates["hardware"] +
            edge_time * labor_rates["edge"]
        )
        
        # Инсталация
        result.installation_cost = 35.0  # фиксирана цена за стандартен монтаж
        
        # Обща цена
        board_cost = 0
        for board_name, sheets in result.used_boards.items():
            # Приблизителни цени
            if "body" in board_name:
                board_cost += sheets * 120
            elif "door" in board_name:
                board_cost += sheets * 180
            elif "back" in board_name:
                board_cost += sheets * 45
            elif "plinth" in board_name:
                board_cost += sheets * 100
        
        edge_cost = sum(edge_usage.values()) * 15  # 15лв/м за кант
        
        result.total_cost_bgn = board_cost + edge_cost + result.labor_cost + result.installation_cost