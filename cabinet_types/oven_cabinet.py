"""
Модул за шкафове за фурна (Oven Cabinets)
Адаптиран за работа с новите модели (BoardProduct, ConstructionProfile)
"""
from typing import List, Dict
from cabinet_types.cabinet_calculator import CabinetCalculator
from models import *


class OvenCabinetCalculator(CabinetCalculator):
    @staticmethod
    def calculate(cabinet: Cabinet) -> CalculationResult:
        """Изчислява шкаф за фурна"""
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

        # Стандартни конфигурации за шкаф за фурна
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
        
        # === ДЪНО ЗА ФУРНА ===
        oven_bottom_width = cabinet.width - 2 * t
            
        oven_bottom = Panel(
            name="Дъно за фурна",
            width_mm=oven_bottom_width,
            height_mm=cabinet.depth,
            material=MaterialType.BODY,
            edge_front=1.0,
            quantity=2  # ДВЕ дъна - по-силна конструкция
        )
        result.add_panel(oven_bottom)
        
        # === СТРАНИЧНИ ПАНЕЛИ ЗА ФУРНАТА ===
        # Допълнителни укрепващи панели за фурната
        oven_side_panel = Panel(
            name="Страничен панел за фурна",
            width_mm=560,  # стандартна височина на фурна
            height_mm=cabinet.depth,
            material=MaterialType.BODY,
            edge_front=1.0,
            quantity=2
        )
        result.add_panel(oven_side_panel)
        
        # === ГРЪБ ===
        # Шкафът за фурна няма заден панел за вентилация
        # но ако се изисква:
        if cabinet.has_back and cabinet.back_board:
            back_panel = Panel(
                name="Гръб",
                width_mm=cabinet.width - 40,  # по-голям отвор за вентилация
                height_mm=cabinet.height - 40,
                material=MaterialType.BACK,
                quantity=1
            )
            result.add_panel(back_panel)
        
        # === ВРАТА ЗА ФУРНА ===
        oven_door_width = cabinet.width - gap
        oven_door_height = 560  # стандартна височина на фурна
        
        oven_door = Panel(
            name="Врата за фурна",
            width_mm=oven_door_width,
            height_mm=oven_door_height,
            material=MaterialType.DOOR,
            edge_front=2.0,  # 2мм кант за врати
            edge_back=2.0,
            edge_left=2.0,
            edge_right=2.0,
            quantity=1
        )
        result.add_panel(oven_door)
        
        # === ЧЕКМЕДЖЕ ПОД ФУРНАТА ===
        drawer_width = cabinet.width - 6  # 3мм от всяка страна
        drawer_height = cabinet.height - oven_door_height - 50  # оставяме място
        
        if drawer_height > 100:  # правим чекмедже само ако има достатъчно място
            drawer_facade = Panel(
                name="Фасада за чекмедже под фурна",
                width_mm=drawer_width,
                height_mm=145,  # стандартна височина
                material=MaterialType.DOOR,
                edge_front=2.0,
                edge_back=2.0,
                edge_left=2.0,
                edge_right=2.0,
                quantity=1
            )
            result.add_panel(drawer_facade)
            
            # Дъно за чекмеджето
            drawer_bottom = Panel(
                name="Дъно за чекмедже",
                width_mm=oven_bottom_width,
                height_mm=cabinet.depth - 40,
                material=MaterialType.BODY,
                edge_front=1.0,
                quantity=1
            )
            result.add_panel(drawer_bottom)
        
        # === ХАРДУЕР ===
        # Крака за шкаф за фурна
        leg_count = 6 if cabinet.width <= 600 else 8  # повече крака за по-голяма стабилност
        result.add_hardware(HardwareItem(
            name="Краче за фурна",
            quantity=leg_count,
            notes="100мм"
        ))
        
        result.add_hardware(HardwareItem(
            name="Щипка за краче",
            quantity=leg_count // 2
        ))
        
        # Панти за вратата на фурната
        hinges_per_door = 3  # фурната е тежка - 3 панти
        result.add_hardware(HardwareItem(
            name="Панта за фурна",
            quantity=hinges_per_door
        ))
        
        # Хардуер за чекмеджето
        if drawer_height > 100:
            result.add_hardware(HardwareItem(
                name="Водач за чекмедже",
                quantity=2  # по 2 водача
            ))
            
            result.add_hardware(HardwareItem(
                name="Ръкохватка за чекмедже",
                quantity=1
            ))
        
        # Конзоли за фурна
        result.add_hardware(HardwareItem(
            name="Конзола за фурна",
            quantity=4
        ))
        
        # === РАЗЧИТАНЕ НА МАТЕРИАЛИ И ЦЕНИ ===
        OvenCabinetCalculator._calculate_materials_and_costs(result)
        
        return result
    
    @staticmethod
    def create_standard_oven_cabinet(width: int = 600) -> Cabinet:
        """Създава стандартен шкаф за фурна"""
        from models import BoardProduct, MaterialType, Money, Currency
        
        return Cabinet(
            width=width,
            height=760,  # стандартна височина
            depth=560,  # стандартна дълбочина
            type=CabinetType.OVEN,
            body_board=BoardProduct('Егер 18мм', 'Egger', 2800, 2070, 18, Money(120, Currency.BGN), MaterialType.BODY),
            door_board=BoardProduct('МДФ врата', 'Local', 2800, 2070, 18, Money(180, Currency.BGN), MaterialType.DOOR),
            back_board=None,  # шкафът за фурна няма гръб
            construction=None,
            has_back=False,
            cabinet_id=f"oven_{width}"
        )
    
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
        
        # Приблизително време за монтаж (фурните са по-сложни)
        assembly_time = 0.8 + (len(result.panels) * 0.15)  # часове
        hardware_time = len(result.hardware) * 0.05  # часове
        edge_time = sum(edge_usage.values()) * 0.02  # часове
        
        result.labor_cost = (
            assembly_time * labor_rates["assembly"] +
            hardware_time * labor_rates["hardware"] +
            edge_time * labor_rates["edge"]
        )
        
        # Инсталация (фурните изискват по-прецизен монтаж)
        result.installation_cost = 50.0  # по-висока цена за монтаж на фурна
        
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
        
        edge_cost = sum(edge_usage.values()) * 15  # 15лв/м за кант
        
        result.total_cost_bgn = board_cost + edge_cost + result.labor_cost + result.installation_cost