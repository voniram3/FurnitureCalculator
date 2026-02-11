from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional


# -------------------- ВАЛУТА --------------------

class Currency(Enum):
    BGN = "BGN"
    EUR = "EUR"


@dataclass
class Money:
    amount: float
    currency: Currency = Currency.BGN

    def to_bgn(self) -> float:
        if self.currency == Currency.BGN:
            return self.amount
        return self.amount * 1.95583


# -------------------- ПРОДУКТИ --------------------

class MaterialType(Enum):
    BODY = "body"
    DOOR = "door"
    BACK = "back"
    PLINTH = "plinth"


@dataclass
class BoardProduct:
    name: str
    manufacturer: str
    width_mm: int
    height_mm: int
    thickness_mm: float
    price: Money
    material_type: MaterialType


@dataclass
class EdgeProduct:
    name: str
    thickness_mm: float   # 0.4 / 1 / 2
    price_per_meter: Money


# -------------------- ПРОФИЛ НА КОНСТРУКЦИЯ --------------------

class BackMountType(Enum):
    GROOVE = "groove"
    NAILED = "nailed"


class BottomMountType(Enum):
    BETWEEN = "between"
    UNDER = "under"


@dataclass
class ConstructionProfile:
    # Корпус
    bottom_mount: BottomMountType = BottomMountType.BETWEEN
    back_mount: BackMountType = BackMountType.GROOVE

    # Канал за гръб
    back_groove_depth_mm: int = 10
    back_face_offset_mm: int = 20   # лицето на гърба е на 20мм от края

    # Рафт
    shelf_front_offset_mm: int = 10
    shelf_back_offset_mm: int = 20   # заради гърба

    # Фуги
    door_gap_mm: int = 3   # 2 или 3

    # Кантиране
    body_edge_thickness_mm: float = 1.0
    door_edge_thickness_mm: float = 2.0

    # За горни шкафове – точка 3
    upper_row_heights: List[int] = None      # [800, 400] например
    upper_row_depths: List[int] = None       # [320, 350] например

    # Точка 1
    has_double_bottom: bool = True

    # Точка 2
    upper_mechanism: str = 'hinges'          # 'hinges' или 'aventos'

    # Точка 4
    bottom_from_door_material: bool = False

    # Точка 5
    body_edge_same_as_doors: bool = False

    # Точка 6
    hanger_type: str = 'rail'                # 'rail' или 'l_shape'

    # Точка 7
    add_end_closing_panels: bool = False
    
    # Additional fields for appliance cabinets
    appliance_type: str = "fridge"  # 🆕 Тип на уред
    no_stabilizers: bool = True       # 🆕 Без стабилизатори за fridge/column
    has_appliance_side_panel: bool = False  # 🆕 Optional странични панели

# -------------------- ЦЕНИ НА ТРУД --------------------

@dataclass
class LaborProfile:
    assemble_cabinet: float
    assemble_drawer: float
    mount_door: float
    edge_per_meter: float


@dataclass
class InstallationProfile:
    cabinet_mount: float
    countertop_mount: float
    sink_mount: float
    appliance_mount: float


# -------------------- ОСНОВНИ МОДЕЛИ --------------------

class CabinetType(Enum):
    BASE = "base"
    UPPER = "upper"
    DRAWER = "drawer"
    OVEN = "oven"
    APPLIANCE = "appliance"
    BLIND = "blind"
    SINK = "sink"
    FRIDGE = "fridge"
    COLUMN = "column"


@dataclass
class Cabinet:
    cabinet_id: str = ""
    width: int = 0
    height: int = 0
    depth: int = 0
    type: CabinetType = CabinetType.BASE

    body_board: BoardProduct = None
    back_board: Optional[BoardProduct] = None
    door_board: Optional[BoardProduct] = None

    construction: ConstructionProfile = None

    shelf_count: int = 0
    door_count: Optional[int] = None
    drawer_count: int = 0
    door_config: Optional[dict] = None
    has_back: bool = True
    plinth_height_mm: int = 100
    
    # Additional fields for appliance cabinets
    appliance_type: Optional[str] = None


@dataclass
class Panel:
    name: str
    width_mm: int
    height_mm: int
    material: MaterialType
    edge_front: Optional[float] = None
    edge_back: Optional[float] = None
    edge_left: Optional[float] = None
    edge_right: Optional[float] = None
    quantity: int = 1
    area_sqm: float = 0.0


@dataclass
class HardwareItem:
    name: str
    quantity: int
    notes: Optional[str] = None


@dataclass
class CalculationResult:
    cabinet: Cabinet
    panels: List[Panel] = field(default_factory=list)
    hardware: List[HardwareItem] = field(default_factory=list)

    # Ценообразуване
    used_boards: Dict[str, int] = field(default_factory=dict)   # product_name -> брой листа
    used_edges_m: Dict[str, float] = field(default_factory=dict)  # edge_name -> метри

    labor_cost: float = 0.0
    installation_cost: float = 0.0
    total_cost_bgn: float = 0.0
    plinth_length: float = 0.0

    def add_panel(self, panel: Panel):
        # Изчисляваме area_sqm ако не е зададено
        if panel.area_sqm == 0.0:
            panel.area_sqm = (panel.width_mm * panel.height_mm) / 1000000.0  # mm² → m²
        
        # Закръгляваме размерите до цели числа за Pydantic
        panel.width_mm = round(panel.width_mm)
        panel.height_mm = round(panel.height_mm)
        
        self.panels.append(panel)

    def add_hardware(self, item: HardwareItem):
        self.hardware.append(item)
