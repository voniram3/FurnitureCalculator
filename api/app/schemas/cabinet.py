"""
Pydantic Schemas for Cabinet API
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class CabinetTypeEnum(str, Enum):
    """Enumeration of cabinet types"""
    BASE = "base"
    UPPER = "upper"
    DRAWER = "drawer"
    OVEN = "oven"
    APPLIANCE = "appliance"
    BLIND = "blind"
    SINK = "sink"
    FRIDGE = "fridge"
    COLUMN = "column"


class MaterialTypeEnum(str, Enum):
    """Enumeration of material types"""
    BODY = "body"
    DOOR = "door"
    BACK = "back"
    PLINTH = "plinth"


class BoardProductRequest(BaseModel):
    """Board product request schema"""
    name: str = Field(..., description="Име на материала")
    manufacturer: str = Field(..., description="Производител")
    width_mm: int = Field(default=2800, description="Ширина на листа в мм")
    height_mm: int = Field(default=2070, description="Височина на листа в мм")
    thickness_mm: float = Field(default=18.0, description="Дебелина в мм")
    price_amount: float = Field(..., description="Цена")
    currency: str = Field(default="BGN", description="Валута")
    material_type: MaterialTypeEnum = Field(..., description="Тип материал")


class CabinetRequest(BaseModel):
    """Request schema for cabinet calculation"""
    cabinet_id: Optional[str] = Field(default="", description="ID на шкафа")
    type: CabinetTypeEnum = Field(..., description="Тип шкафа")
    width: int = Field(..., gt=0, description="Ширина в мм")
    height: int = Field(..., gt=0, description="Височина в мм")
    depth: int = Field(..., gt=0, description="Дълбочина в мм")
    
    # Модернизирани полета за backward compatibility
    number_of_doors: Optional[int] = Field(default=1, ge=0, description="Брой врати")
    number_of_shelves: int = Field(default=1, ge=0, description="Брой рафтове")
    number_of_drawers: int = Field(default=0, ge=0, description="Брой чекмеджета")
    
    # Legacy полета (алиаси)
    door_count: Optional[int] = Field(None, ge=0, description="Брой врати (legacy)")
    shelf_count: int = Field(default=1, ge=0, description="Брой рафтове (legacy)")
    drawer_count: int = Field(default=0, ge=0, description="Брой чекмеджета (legacy)")
    
    body_board: Optional[BoardProductRequest] = Field(None, description="Корпусен материал")
    door_board: Optional[BoardProductRequest] = Field(None, description="Материал за врати")
    back_board: Optional[BoardProductRequest] = Field(None, description="Материал за гръб")
    
    has_back: bool = Field(default=True, description="Има ли гръб")
    karper: bool = Field(default=True, description="Има ли карпинери")
    furnira: bool = Field(default=False, description="Има ли фурнир")
    left_handed: bool = Field(default=False, description="Лява конфигурация")
    
    # Допълнителни конфигурации
    door_gap: float = Field(default=3.0, description="Фуга между вратите в мм")
    plinth_height: int = Field(default=100, description="Височина на цокъл в мм")
    
    class Config:
        """Pydantic configuration"""
        @classmethod
        def alias_generator(cls, field_name: str) -> str:
            """Generate aliases for backward compatibility"""
            return field_name


class PanelResponse(BaseModel):
    """Response schema for panel"""
    name: str = Field(..., description="Име на панела")
    width_mm: int = Field(..., description="Ширина в мм")
    height_mm: int = Field(..., description="Височина в мм")
    material: MaterialTypeEnum = Field(..., description="Тип материал")
    quantity: int = Field(..., description="Брой")
    edge_front: Optional[float] = Field(None, description="Кант преден в мм")
    edge_back: Optional[float] = Field(None, description="Кант заден в мм")
    edge_left: Optional[float] = Field(None, description="Кант ляв в мм")
    edge_right: Optional[float] = Field(None, description="Кант десен в мм")
    
    # Изчислени полета
    area_sqm: float = Field(..., description="Площ в м²")


class HardwareItemResponse(BaseModel):
    """Response schema for hardware item"""
    name: str = Field(..., description="Име на хардуера")
    quantity: int = Field(..., description="Брой")
    notes: Optional[str] = Field(None, description="Бележки")


class CabinetCalculationResponse(BaseModel):
    """Response schema for cabinet calculation"""
    success: bool = Field(..., description="Успешна ли е калкулацията")
    cabinet_id: str = Field(..., description="ID на шкафа")
    type: CabinetTypeEnum = Field(..., description="Тип шкафа")
    dimensions: Dict[str, int] = Field(..., description="Размери")
    
    panels: List[PanelResponse] = Field(..., description="Списък с панели")
    hardware: List[HardwareItemResponse] = Field(..., description="Списък с хардуер")
    
    # Материали
    used_boards: Dict[str, int] = Field(..., description="Използвани дъски (брой листове)")
    used_edges_m: Dict[str, float] = Field(..., description="Използван кант (метри)")
    
    # Ценообразуване
    labor_cost: float = Field(..., description="Цена на труд")
    installation_cost: float = Field(..., description="Цена на инсталация")
    total_cost_bgn: float = Field(..., description="Обща цена в лв")
    compara_cost_bgn: Optional[float] = Field(None, description="Цена по Компара (лв)")
    
    error: Optional[str] = Field(None, description="Съобщение за грешка")


class ProjectRequest(BaseModel):
    """Request schema for project calculation"""
    project_name: Optional[str] = Field("Нов проект", description="Име на проекта")
    cabinets: List[CabinetRequest] = Field(..., description="Списък с шкафове")


class ProjectCalculationResponse(BaseModel):
    """Response schema for project calculation"""
    success: bool = Field(..., description="Успешна ли е калкулацията")
    project_name: str = Field(..., description="Име на проекта")
    
    total_cabinets: int = Field(..., description="Общ брой шкафове")
    cabinets: List[CabinetCalculationResponse] = Field(..., description="Списък с калкулации")
    
    # Общо за проекта
    totals: Dict[str, Any] = Field(..., description="Общи стойности за проекта")
    project_total_cost: float = Field(..., description="Обща цена на проекта")
    
    error: Optional[str] = Field(None, description="Съобщение за грешка")


class CabinetTypeInfo(BaseModel):
    """Information about cabinet type"""
    type: CabinetTypeEnum = Field(..., description="Тип шкафа")
    name: str = Field(..., description="Име на типа")
    description: str = Field(..., description="Описание")
    default_height: Optional[int] = Field(None, description="Стандартна височина")
    default_depth: Optional[int] = Field(None, description="Стандартна дълбочина")
    requires_doors: bool = Field(True, description="Изисква ли врати")
    requires_shelves: bool = Field(True, description="Изисква ли рафтове")


class MaterialInfo(BaseModel):
    """Information about available materials"""
    name: str = Field(..., description="Име на материала")
    material_type: MaterialTypeEnum = Field(..., description="Тип материал")
    thickness: float = Field(..., description="Дебелина в мм")
    price_per_sheet: float = Field(..., description="Цена на лист")
    currency: str = Field(default="BGN", description="Валута")
    available: bool = Field(default=True, description="Достъпност")