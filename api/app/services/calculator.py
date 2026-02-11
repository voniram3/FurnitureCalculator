"""
Furniture Calculator Service Layer
Интеграция със съществуващия калкулатор
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from typing import List, Dict, Any
from fastapi import HTTPException

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from models import Cabinet, CabinetType, BoardProduct, MaterialType, Money, Currency, ConstructionProfile
from cabinet_engine import FurnitureEngine
from app.schemas.cabinet import (
    CabinetRequest, CabinetCalculationResponse, 
    ProjectRequest, ProjectCalculationResponse,
    PanelResponse, HardwareItemResponse,
    CabinetTypeInfo, MaterialInfo,
    MaterialTypeEnum, CabinetTypeEnum
)


class FurnitureCalculatorService:
    """Service class for furniture calculations"""
    
    def __init__(self):
        self.engine = FurnitureEngine()
    
    def calculate_single_cabinet(self, request: CabinetRequest) -> CabinetCalculationResponse:
        """
        Изчислява единичен шкаф с поддръжка за новите и стари модели
        """
        try:
            print(f"🔧 Debug: Starting calculation for cabinet type: {request.type.value}")
            print(f"🔧 Debug: Request params: width={request.width}, height={request.height}, depth={request.depth}")
            
            # SINK шкафовете използват fallback към BaseCabinet за сега
            # TODO: Имплементиране на нов SinkCalculator с MaterialCostCalculator
            
            # За всички останали типове използваме стария engine с fallback
            cabinet = self._convert_request_to_cabinet(request)
            print(f"🔧 Debug: Converted to cabinet: type={cabinet.type.value}, dimensions={cabinet.width}x{cabinet.height}x{cabinet.depth}")
            
            # Изчисляване с engine
            result = self.engine.calculate_cabinet(cabinet)
            print(f"🔧 Debug: Engine result type: {type(result)}")
            
            # Конвертиране на резултата
            if hasattr(result, 'cabinet'):  # CalculationResult
                response = self._convert_result_to_response(result, success=True)
                print(f"🔧 Debug: Converted response: success={response.success}, total_cost={response.total_cost_bgn}")
                return response
            elif isinstance(result, dict):  # Директен dict резултат
                return CabinetCalculationResponse(
                    success=True,
                    cabinet_id=f"{request.type.value}_{request.width}",
                    type=request.type,
                    dimensions={"width": request.width, "height": request.height, "depth": request.depth},
                    panels=result.get("panels", []),
                    hardware=result.get("hardware", []),
                    used_boards=result.get("used_boards", {}),
                    used_edges_m=result.get("used_edges_m", {}),
                    labor_cost=result.get("labor_cost", 0.0),
                    installation_cost=result.get("installation_cost", 0.0),
                    total_cost_bgn=result.get("total_cost_bgn", result.get("compara_cost_bgn", 0.0)),
                    compara_cost_bgn=result.get("compara_cost_bgn", result.get("total_cost_bgn", 0.0)),
                    error=None
                )
            else:
                raise ValueError(f"Неочакван тип резултат: {type(result)}")
                
        except ValueError as e:
            print(f"🔧 Debug: ValueError: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            import traceback
            print(f"🔧 Debug: Exception in calculate_single_cabinet: {str(e)}")
            print(f"🔧 Debug: Traceback: {traceback.format_exc()}")
            return CabinetCalculationResponse(
                success=False,
                cabinet_id=request.cabinet_id or f"{request.type.value}_{request.width}",
                type=request.type,
                dimensions={"width": request.width, "height": request.height, "depth": request.depth},
                panels=[],
                hardware=[],
                used_boards={},
                used_edges_m={},
                labor_cost=0.0,
                installation_cost=0.0,
                total_cost_bgn=0.0,
                compara_cost_bgn=0.0,
                error=str(e)
            )
    
    def calculate_project(self, request: ProjectRequest) -> ProjectCalculationResponse:
        """
        Изчислява цял проект
        """
        try:
            if not request.cabinets:
                raise ValueError("Проектът трябва да съдържа поне един шкаф")
            
            if len(request.cabinets) > 50:
                raise ValueError("Проектът не може да съдържа повече от 50 шкафа")
            
            # Конвертиране на всички шкафове
            cabinets = [self._convert_request_to_cabinet(cab) for cab in request.cabinets]
            
            # Изчисляване на проекта
            project_result = self.engine.calculate_project(cabinets)
            
            # Конвертиране на резултатите
            cabinet_responses = []
            total_cost = 0.0
            
            for result in project_result.get("cabinets", []):
                if hasattr(result, 'cabinet'):  # Проверка дали е CalculationResult
                    response = self._convert_result_to_response(result, success=True)
                    cabinet_responses.append(response)
                    total_cost += response.total_cost_bgn
            
            # Общи стойности за проекта
            totals = project_result.get("totals", {})
            
            return ProjectCalculationResponse(
                success=True,
                project_name=request.project_name,
                total_cabinets=len(cabinets),
                cabinets=cabinet_responses,
                totals=totals,
                project_total_cost=total_cost,
                error=None
            )
            
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            return ProjectCalculationResponse(
                success=False,
                project_name=request.project_name or "Неименуван проект",
                total_cabinets=len(request.cabinets) if request.cabinets else 0,
                cabinets=[],
                totals={},
                project_total_cost=0.0,
                error=str(e)
            )
    
    def get_cabinet_types(self) -> List[CabinetTypeInfo]:
        """
        Връща информация за всички типове шкафове
        """
        types_info = [
            CabinetTypeInfo(
                type=CabinetTypeEnum.BASE,
                name="Долен шкаф",
                description="Стандартен долен кухненски шкаф с врати и рафтове",
                default_height=760,
                default_depth=560,
                requires_doors=True,
                requires_shelves=True
            ),
            CabinetTypeInfo(
                type=CabinetTypeEnum.UPPER,
                name="Горен шкаф",
                description="Горен кухненски шкаф с врати и рафтове",
                default_height=700,
                default_depth=320,
                requires_doors=True,
                requires_shelves=True
            ),
            CabinetTypeInfo(
                type=CabinetTypeEnum.DRAWER,
                name="Шкаф с чекмеджета",
                description="Долен шкаф с чекмеджета вместо рафтове",
                default_height=760,
                default_depth=560,
                requires_doors=False,
                requires_shelves=False
            ),
            CabinetTypeInfo(
                type=CabinetTypeEnum.SINK,
                name="Шкаф за мивка",
                description="Долен шкаф с изрязване за мивка и сифон",
                default_height=760,
                default_depth=560,
                requires_doors=True,
                requires_shelves=False
            ),
            CabinetTypeInfo(
                type=CabinetTypeEnum.OVEN,
                name="Шкаф за фурна",
                description="Шкаф за вграждане на фурна",
                default_height=760,
                default_depth=560,
                requires_doors=True,
                requires_shelves=True
            ),
            CabinetTypeInfo(
                type=CabinetTypeEnum.APPLIANCE,
                name="Шкаф за уред",
                description="Шкаф за вграждане на кухненски уреди",
                default_height=760,
                default_depth=560,
                requires_doors=True,
                requires_shelves=True
            ),
            CabinetTypeInfo(
                type=CabinetTypeEnum.BLIND,
                name="Сляп шкаф",
                description="Шкаф без врати, често използван за запълване",
                default_height=760,
                default_depth=560,
                requires_doors=False,
                requires_shelves=True
            ),
            CabinetTypeInfo(
                type=CabinetTypeEnum.FRIDGE,
                name="Шкаф за хладилник",
                description="Шкаф за вграждане на хладилник",
                default_height=2200,
                default_depth=560,
                requires_doors=True,
                requires_shelves=False
            ),
            CabinetTypeInfo(
                type=CabinetTypeEnum.COLUMN,
                name="Колона",
                description="Висока колона за съхранение",
                default_height=2200,
                default_depth=560,
                requires_doors=True,
                requires_shelves=True
            )
        ]
        
        return types_info
    
    def get_materials_info(self) -> List[MaterialInfo]:
        """
        Връща информация за наличните материали
        """
        materials_info = [
            MaterialInfo(
                type=MaterialTypeEnum.BODY,
                name="ПДЧ за корпус",
                description="Плътно дървесни плочи за шкафове",
                standard_thickness=18.0,
                available_colors=["Бял", "Сив", "Бежов", "Светло дъб"],
                price_per_sqm=45.0
            ),
            MaterialInfo(
                type=MaterialTypeEnum.DOOR,
                name="ПДЧ за врати",
                description="ПДЧ за врати и фасади",
                standard_thickness=18.0,
                available_colors=["Бял", "Сив", "Бежов", "Тъмно дъб"],
                price_per_sqm=55.0
            ),
            MaterialInfo(
                type=MaterialTypeEnum.BACK,
                name="Хартилен панел",
                description="ХDF задни панели",
                standard_thickness=3.0,
                available_colors=["Светло сив"],
                price_per_sqm=12.0
            )
        ]
        
        return materials_info
    
    def validate_cabinet_request(self, request: CabinetRequest) -> Dict[str, Any]:
        """
        Валидира заявката за изчисление на шкаф
        """
        errors = []
        warnings = []
        
        # Проверка на размерите
        if request.width < 200 or request.width > 1200:
            errors.append("Ширината трябва да е между 200mm и 1200mm")
        
        if request.height < 300 or request.height > 2500:
            errors.append("Височината трябва да е между 300mm и 2500mm")
        
        if request.depth < 200 or request.depth > 700:
            errors.append("Дълбочината трябва да е между 200mm и 700mm")
        
        # Проверки според типа
        if request.type in [CabinetTypeEnum.BASE, CabinetTypeEnum.UPPER]:
            if request.number_of_doors < 1:
                errors.append(f"{request.type.value} шкафът трябва да има поне една врата")
        
        if request.type == CabinetTypeEnum.DRAWER:
            if request.number_of_doors > 0:
                warnings.append("Шкафът с чекмеджета обикновено няма врати")
        
        # Стандартни размери
        standard_sizes = {
            CabinetTypeEnum.BASE: {"width": [300, 400, 500, 600, 800, 900, 1000, 1200], "height": [760, 820], "depth": [560]},
            CabinetTypeEnum.UPPER: {"width": [300, 400, 500, 600, 800, 900], "height": [700, 900], "depth": [320]},
        }
        
        if request.type in standard_sizes:
            standards = standard_sizes[request.type]
            if request.width not in standards["width"]:
                warnings.append(f"Ширината {request.width}mm не е стандартна за {request.type.value} шкаф")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "suggestions": self._get_size_suggestions(request.type)
        }
    
    def _convert_request_to_cabinet(self, request: CabinetRequest) -> Cabinet:
        """
        Конвертира CabinetRequest в Cabinet модел
        """
        # Конвертиране на enum типове
        from models import CabinetType
        cabinet_type = CabinetType(request.type.value)
        
        # Базов Cabinet обект
        cabinet = Cabinet(
            cabinet_id=request.cabinet_id or f"{request.type.value}_{request.width}",
            type=cabinet_type,
            width=request.width,
            height=request.height,
            depth=request.depth,
            shelf_count=request.number_of_shelves,
            door_count=request.number_of_doors,
            drawer_count=request.number_of_drawers,
            has_back=True,
            plinth_height_mm=100
        )
        
        # Добавяме construction поле за appliance типове
        if cabinet_type in [CabinetType.FRIDGE, CabinetType.COLUMN]:
            from models import ConstructionProfile
            cabinet.construction = ConstructionProfile(appliance_type=cabinet_type.value)
            cabinet.appliance_type = cabinet_type.value
        
        return cabinet
    
    def _convert_result_to_response(self, result, success: bool = True) -> CabinetCalculationResponse:
        """
        Конвертира резултат от калкулатора в CabinetCalculationResponse
        """
        if hasattr(result, 'cabinet') and hasattr(result, 'panels'):
            # CalculationResult обект
            cabinet = result.cabinet
            
            # Конвертиране на панели
            panels = []
            for panel in result.panels:
                panels.append(PanelResponse(
                    name=panel.name,
                    width_mm=panel.width_mm,
                    height_mm=panel.height_mm,
                    material=panel.material,
                    quantity=panel.quantity,
                    edge_front=panel.edge_front,
                    edge_back=panel.edge_back,
                    edge_left=panel.edge_left,
                    edge_right=panel.edge_right,
                    area_sqm=panel.area_sqm
                ))
            
            # Конвертиране наHardware
            hardware = []
            for hw in result.hardware:
                hardware.append(HardwareItemResponse(
                    name=hw.name,
                    quantity=hw.quantity,
                    notes=hw.notes
                ))
            
            return CabinetCalculationResponse(
                success=success,
                cabinet_id=cabinet.cabinet_id,
                type=CabinetTypeEnum(cabinet.type.value),
                dimensions={
                    "width": cabinet.width,
                    "height": cabinet.height,
                    "depth": cabinet.depth
                },
                panels=panels,
                hardware=hardware,
                used_boards=result.used_boards,
                used_edges_m=result.used_edges_m,
                labor_cost=result.labor_cost,
                installation_cost=result.installation_cost,
                total_cost_bgn=result.total_cost_bgn,
                compara_cost_bgn=result.total_cost_bgn,
                error=result.error if hasattr(result, 'error') else None
            )
        else:
            # Резултат от новия калкулатор (dict)
            return CabinetCalculationResponse(
                success=success,
                cabinet_id=result.get("cabinet_id", "unknown"),
                type=result.get("type", "base"),
                dimensions=result.get("dimensions", {}),
                panels=result.get("panels", []),
                hardware=result.get("hardware", []),
                used_boards=result.get("used_boards", {}),
                used_edges_m=result.get("used_edges_m", {}),
                labor_cost=result.get("labor_cost", 0.0),
                installation_cost=result.get("installation_cost", 0.0),
                total_cost_bgn=result.get("total_cost_bgn", result.get("compara_cost_bgn", 0.0)),
                compara_cost_bgn=result.get("compara_cost_bgn", result.get("total_cost_bgn", 0.0)),
                error=result.get("error")
            )
    
    def _get_size_suggestions(self, cabinet_type: CabinetTypeEnum) -> Dict[str, List[int]]:
        """
        Връща предложения за стандартни размери
        """
        suggestions = {
            CabinetTypeEnum.BASE: {
                "width": [300, 400, 500, 600, 800, 900, 1000, 1200],
                "height": [760, 820],
                "depth": [560]
            },
            CabinetTypeEnum.UPPER: {
                "width": [300, 400, 500, 600, 800, 900],
                "height": [700, 900],
                "depth": [320]
            },
            CabinetTypeEnum.DRAWER: {
                "width": [300, 400, 500, 600, 800, 900],
                "height": [760],
                "depth": [560]
            }
        }
        
        return suggestions.get(cabinet_type, {
            "width": [300, 400, 500, 600, 800, 900],
            "height": [760],
            "depth": [560]
        })