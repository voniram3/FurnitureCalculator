"""
Основен API за мебелен калкулатор
"""
from typing import List, Dict, Optional
from models import *
from cabinet_engine import FurnitureEngine


class FurnitureAPI:
    """Основен API клас за калкулация на мебели"""

    def __init__(self, config: Optional[ConstructionProfile] = None):
        self.engine = FurnitureEngine(config)

    def calculate_cabinet(self, cabinet: Cabinet) -> CalculationResult:
        """Изчислява един шкаф"""
        return self.engine.calculate_cabinet(cabinet)

    def calculate_project(self, cabinets: List[Cabinet]) -> Dict:
        """Изчислява цял проект (много шкафове)"""
        return self.engine.calculate_project(cabinets)


# -------------------- Helper функции --------------------

def create_default_body_board() -> BoardProduct:
    """Създава стандартен корпусен материал"""
    return BoardProduct(
        name="Егер 18мм",
        manufacturer="Egger",
        width_mm=2800,
        height_mm=2070,
        thickness_mm=18,
        price=Money(120, Currency.BGN),
        material_type=MaterialType.BODY
    )


def create_default_door_board() -> BoardProduct:
    """Създава стандартен материал за врати"""
    return BoardProduct(
        name="МДФ врата 18мм",
        manufacturer="Local",
        width_mm=2800,
        height_mm=2070,
        thickness_mm=18,
        price=Money(180, Currency.BGN),
        material_type=MaterialType.DOOR
    )


def create_default_back_board() -> BoardProduct:
    """Създава стандартен гръб"""
    return BoardProduct(
        name="HDF 3мм",
        manufacturer="Local",
        width_mm=2800,
        height_mm=2070,
        thickness_mm=3,
        price=Money(45, Currency.BGN),
        material_type=MaterialType.BACK
    )


# -------------------- Factory функции --------------------

def create_base_cabinet(
    width: int,
    height: Optional[int] = None,
    depth: Optional[int] = None,
    cabinet_id: str = ""
) -> Cabinet:
    """Създава долен шкаф"""
    if height is None:
        height = 760
    if depth is None:
        depth = 560
        
    return Cabinet(
        width=width,
        height=height,
        depth=depth,
        type=CabinetType.BASE,
        body_board=create_default_body_board(),
        door_board=create_default_door_board(),
        back_board=create_default_back_board(),
        construction=ConstructionProfile(),
        cabinet_id=cabinet_id or f"base_{width}"
    )


def create_upper_cabinet(
    width: int,
    height: int,
    depth: int,
    cabinet_id: str = ""
) -> Cabinet:
    """Създава горен шкаф"""
    return Cabinet(
        width=width,
        height=height,
        depth=depth,
        type=CabinetType.UPPER,
        body_board=create_default_body_board(),
        door_board=create_default_door_board(),
        back_board=create_default_back_board(),
        construction=ConstructionProfile(),
        cabinet_id=cabinet_id or f"upper_{width}"
    )


def create_drawer_cabinet(
    width: int,
    height: Optional[int] = None,
    depth: Optional[int] = None,
    drawer_count: int = 3,
    cabinet_id: str = ""
) -> Cabinet:
    """Създава шкаф чекмедже"""
    if height is None:
        height = 760
    if depth is None:
        depth = 560
        
    return Cabinet(
        width=width,
        height=height,
        depth=depth,
        type=CabinetType.DRAWER,
        body_board=create_default_body_board(),
        door_board=None,
        back_board=create_default_back_board(),
        construction=ConstructionProfile(),
        drawer_count=drawer_count,
        cabinet_id=cabinet_id or f"drawer_{width}"
    )


def create_oven_cabinet(
    width: int = 600,
    height: Optional[int] = None,
    depth: Optional[int] = None,
    cabinet_id: str = ""
) -> Cabinet:
    """Създава шкаф за фурна"""
    if height is None:
        height = 760
    if depth is None:
        depth = 560
        
    return Cabinet(
        width=width,
        height=height,
        depth=depth,
        type=CabinetType.OVEN,
        body_board=create_default_body_board(),
        door_board=create_default_door_board(),
        back_board=create_default_back_board(),
        construction=ConstructionProfile(),
        cabinet_id=cabinet_id or f"oven_{width}"
    )


# -------------------- API Endpoints --------------------

def calculate_single_cabinet(cabinet_data: Dict) -> Dict:
    """API ендпойнт за изчисляване на един шкаф"""
    try:
        cabinet = parse_cabinet_from_dict(cabinet_data)
        api = FurnitureAPI()
        result = api.calculate_cabinet(cabinet)
        
        return {
            "success": True,
            "data": {
                "cabinet_id": result.cabinet.cabinet_id,
                "panels": [{"name": p.name, "width": p.width_mm, "height": p.height_mm, 
                           "material": p.material.value, "quantity": p.quantity} for p in result.panels],
                "hardware": [{"name": h.name, "quantity": h.quantity, "notes": h.notes} for h in result.hardware],
                "used_boards": result.used_boards,
                "used_edges_m": result.used_edges_m,
                "labor_cost": result.labor_cost,
                "total_cost_bgn": result.total_cost_bgn
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def calculate_project_cabinets(project_data: Dict) -> Dict:
    """API ендпойнт за изчисляване на проект"""
    try:
        cabinets = [parse_cabinet_from_dict(c) for c in project_data.get("cabinets", [])]
        api = FurnitureAPI()
        result = api.calculate_project(cabinets)
        
        return {
            "success": True,
            "data": {
                "total_cabinets": len(cabinets),
                "totals": result.get("totals", {}),
                "cabinets": [{"id": r.cabinet.cabinet_id, "type": r.cabinet.type.value} 
                           for r in result.get("cabinets", []) if isinstance(r, CalculationResult)]
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def parse_cabinet_from_dict(data: Dict) -> Cabinet:
    """Парсва Cabinet от dictionary"""
    return Cabinet(
        cabinet_id=data.get("cabinet_id", ""),
        type=CabinetType(data["type"]),
        width=data["width"],
        height=data["height"],
        depth=data["depth"],
        body_board=data.get("body_board", create_default_body_board()),
        door_board=data.get("door_board", create_default_door_board()),
        back_board=data.get("back_board", create_default_back_board()),
        construction=data.get("construction", ConstructionProfile()),
        shelf_count=data.get("shelf_count", 1),
        door_count=data.get("door_count"),
        drawer_count=data.get("drawer_count", 0),
        has_back=data.get("has_back", True)
    )


# -------------------- Примерна употреба --------------------

if __name__ == "__main__":
    # Пример за използване на API
    api = FurnitureAPI()
    
    # Създаваме стандартен долен шкаф
    cabinet = create_base_cabinet(width=600, cabinet_id="base_600")
    result = api.calculate_cabinet(cabinet)
    
    print(f"Шкаф ID: {result.cabinet.cabinet_id}")
    print(f"Брой панели: {len(result.panels)}")
    print(f"Обща цена: {result.total_cost_bgn:.2f} BGN")