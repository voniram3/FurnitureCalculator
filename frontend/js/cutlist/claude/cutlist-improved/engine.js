export class CutListEngine {
    constructor() {
        this.parts = [];
        this.sheets = [];
        this.results = [];
        this.settings = {
            allowRotation: true,
            respectGrainDirection: true, // 🆕 Уважава посоката на фладера
            cuttingBladeWidth: 4, // mm
            minWasteArea: 10000, // mm²
            sortingMethod: 'area', // 'area', 'maxside', 'width', 'height', 'grain'
            grainPenalty: 1000 // Penalty score за нарушаване на grain direction
        };
        
        // 🆕 Grain direction преференции по материал
        this.grainPreferences = {
            'ПДЧ': 'any', // Без значение за ПДЧ
            'МДФ': 'any',
            'ХДЛ': 'horizontal', // ХДЛ обикновено има хоризонтален grain
            'Масив': 'horizontal', // Масив винаги има grain
            'Фурнир': 'horizontal',
            'Шперплат': 'any'
        };
    }

    /**
     * Добавяне на детайл с grain direction
     * @param {string} name - Име на детайла
     * @param {number} width - Ширина в mm
     * @param {number} height - Височина в mm
     * @param {number} quantity - Брой
     * @param {string} material - Материал
     * @param {object} options - Допълнителни опции
     * @param {string} options.grainDirection - 'horizontal', 'vertical', 'any', 'none'
     * @param {boolean} options.allowRotation - Може ли да се завърти този конкретен детайл
     * @param {number} options.priority - Приоритет (1-10, по-високо = по-важно)
     */
    addPart(name, width, height, quantity = 1, material = 'ПДЧ 18мм', options = {}) {
        const {
            grainDirection = this.detectGrainDirection(material, width, height),
            allowRotation = true,
            priority = 5,
            edgeBanding = { top: false, bottom: false, left: false, right: false }
        } = options;

        for (let i = 0; i < quantity; i++) {
            this.parts.push({
                id: `${name}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
                name,
                originalWidth: parseInt(width),
                originalHeight: parseInt(height),
                width: parseInt(width),
                height: parseInt(height),
                area: width * height,
                material,
                grainDirection, // 🆕
                allowRotation, // 🆕 Per-part rotation control
                priority, // 🆕
                edgeBanding, // 🆕 Информация за кантоване
                placed: false,
                rotated: false
            });
        }
        return this.parts;
    }

    /**
     * Добавяне на лист с grain direction
     */
    addSheet(name, width, height, cost = 0, materialType = 'ПДЧ 18мм', options = {}) {
        const {
            grainDirection = this.detectGrainDirection(materialType, width, height),
            maxUsagePercent = 95 // Максимално използване на листа (%)
        } = options;

        this.sheets.push({
            id: `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            originalWidth: parseInt(width),
            originalHeight: parseInt(height),
            width: parseInt(width),
            height: parseInt(height),
            area: width * height,
            cost: parseFloat(cost),
            materialType,
            grainDirection, // 🆕 Grain на листа
            maxUsagePercent,
            freeRects: [{ x: 0, y: 0, width: parseInt(width), height: parseInt(height) }],
            placedParts: [],
            usedArea: 0,
            efficiency: 0
        });
        return this.sheets;
    }

    /**
     * 🆕 Автоматично детектиране на grain direction базирано на материал и размери
     */
    detectGrainDirection(material, width, height) {
        // Проверяваме типа материал
        for (const [materialType, grainDir] of Object.entries(this.grainPreferences)) {
            if (material.includes(materialType)) {
                if (grainDir === 'any') {
                    return 'any';
                }
                // За материали с grain, определяме базирано на размерите
                // Обикновено grain е по дългата страна
                if (grainDir === 'horizontal') {
                    return width >= height ? 'horizontal' : 'vertical';
                }
                return grainDir;
            }
        }
        return 'any'; // По подразбиране
    }

    /**
     * 🆕 Проверка дали rotation е позволено с оглед на grain
     */
    canRotatePart(part, sheet) {
        // Ако не се уважава grain direction, всичко е позволено
        if (!this.settings.respectGrainDirection) {
            return part.allowRotation && this.settings.allowRotation;
        }

        // Ако детайлът не позволява rotation
        if (!part.allowRotation || !this.settings.allowRotation) {
            return false;
        }

        // Ако и двете са 'any', rotation е позволено
        if (part.grainDirection === 'any' || sheet.grainDirection === 'any') {
            return true;
        }

        // Ако grain direction са различни, rotation НЕ е позволено
        // Примерно: horizontal part не може да се завърти на vertical sheet
        return part.grainDirection === sheet.grainDirection;
    }

    /**
     * 🆕 Проверка дали grain се съвпада след поставяне
     */
    isGrainAligned(part, rotated, sheet) {
        if (!this.settings.respectGrainDirection) {
            return true; // Не ни интересува
        }

        if (part.grainDirection === 'any' || sheet.grainDirection === 'any') {
            return true;
        }

        // След rotation, grain се сменя
        const effectivePartGrain = rotated 
            ? (part.grainDirection === 'horizontal' ? 'vertical' : 'horizontal')
            : part.grainDirection;

        return effectivePartGrain === sheet.grainDirection;
    }

    // ПОДОБРЕН АЛГОРИТЪМ ЗА ОПТИМИЗАЦИЯ С GRAIN SUPPORT
    calculateOptimization() {
        if (this.parts.length === 0 || this.sheets.length === 0) {
            return [];
        }

        // 1. Клониране и сортиране
        const partsToPlace = this.parts
            .map(p => ({ ...p, placed: false }))
            .sort(this.getSortingFunction());

        const sheets = this.sheets.map(s => ({
            ...s,
            freeRects: [{ x: 0, y: 0, width: s.width, height: s.height }],
            placedParts: [],
            usedArea: 0
        }));

        // 2. Разпределяне на детайлите
        for (const part of partsToPlace) {
            if (part.placed) continue;

            let bestSheet = null;
            let bestRect = null;
            let bestRotation = false;
            let bestScore = Infinity;

            // Търсене на най-доброто място
            for (const sheet of sheets) {
                // 🆕 Проверка дали материалите съвпадат
                if (!this.materialsMatch(part.material, sheet.materialType)) {
                    continue;
                }

                for (const freeRect of sheet.freeRects) {
                    // Вариант 1: Без завъртане
                    if (this.fitsInRect(part, freeRect, false)) {
                        const grainAligned = this.isGrainAligned(part, false, sheet);
                        const score = this.calculatePlacementScore(part, freeRect, false, grainAligned, sheet);
                        
                        if (score < bestScore) {
                            bestScore = score;
                            bestSheet = sheet;
                            bestRect = freeRect;
                            bestRotation = false;
                        }
                    }

                    // Вариант 2: Със завъртане (ако е позволено)
                    if (this.canRotatePart(part, sheet)) {
                        const rotatedPart = { ...part, width: part.height, height: part.width };
                        if (this.fitsInRect(rotatedPart, freeRect, true)) {
                            const grainAligned = this.isGrainAligned(part, true, sheet);
                            const score = this.calculatePlacementScore(rotatedPart, freeRect, true, grainAligned, sheet);
                            
                            if (score < bestScore) {
                                bestScore = score;
                                bestSheet = sheet;
                                bestRect = freeRect;
                                bestRotation = true;
                            }
                        }
                    }
                }
            }

            // Поставяне
            if (bestSheet && bestRect) {
                this.placePartInSheet(bestSheet, part, bestRect, bestRotation);
                part.placed = true;
            } else {
                // Създаване на нов лист ако е необходимо
                if (this.canCreateNewSheet()) {
                    const templateSheet = this.findBestSheetTemplateForPart(part);
                    if (templateSheet) {
                        const newSheet = this.createNewSheetFromTemplate(templateSheet);
                        sheets.push(newSheet);
                        
                        const firstRect = newSheet.freeRects[0];
                        this.placePartInSheet(newSheet, part, firstRect, false);
                        part.placed = true;
                    }
                }
            }
        }

        // 3. Изчисляване на ефективност
        sheets.forEach(sheet => {
            if (sheet.placedParts.length > 0) {
                sheet.efficiency = (sheet.usedArea / sheet.area) * 100;
                
                // 🆕 Grain compliance rate
                const grainCompliantParts = sheet.placedParts.filter(p => 
                    this.isGrainAligned(p, p.rotated, sheet)
                ).length;
                sheet.grainCompliance = sheet.placedParts.length > 0
                    ? (grainCompliantParts / sheet.placedParts.length) * 100
                    : 100;
            }
        });

        // 4. Филтриране и сортиране
        this.results = sheets
            .filter(s => s.placedParts.length > 0)
            .sort((a, b) => b.efficiency - a.efficiency);

        return this.results;
    }

    /**
     * 🆕 Проверка дали материалите съвпадат
     */
    materialsMatch(partMaterial, sheetMaterial) {
        // Извличаме основния тип материал
        const extractType = (material) => {
            const types = ['ПДЧ', 'МДФ', 'ХДЛ', 'Масив', 'Фурнир'];
            for (const type of types) {
                if (material.includes(type)) {
                    return type;
                }
            }
            return material;
        };

        return extractType(partMaterial) === extractType(sheetMaterial);
    }

    /**
     * 🆕 Подобрен placement score с grain penalty
     */
    calculatePlacementScore(part, rect, rotated, grainAligned, sheet) {
        const width = rotated ? part.originalHeight : part.originalWidth;
        const height = rotated ? part.originalWidth : part.originalHeight;

        const remainingWidth = rect.width - width;
        const remainingHeight = rect.height - height;

        // Базов score
        let score = (remainingWidth * remainingHeight) + (remainingWidth + remainingHeight) * 100;

        // 🆕 Grain penalty
        if (!grainAligned && this.settings.respectGrainDirection) {
            score += this.settings.grainPenalty;
        }

        // 🆕 Priority bonus (по-важните детайли се поставят първи на по-добри места)
        if (part.priority) {
            score -= (part.priority * 50);
        }

        // 🆕 Edge waste penalty (ако е близо до ръба но не го използва напълно)
        const edgeWaste = Math.min(remainingWidth, remainingHeight);
        if (edgeWaste > 0 && edgeWaste < 50) {
            score += edgeWaste * 10;
        }

        return score;
    }

    fitsInRect(part, rect, rotated) {
        const width = rotated ? part.originalHeight : part.originalWidth;
        const height = rotated ? part.originalWidth : part.originalHeight;
        return width <= rect.width && height <= rect.height;
    }

    placePartInSheet(sheet, part, rect, rotated) {
        const width = rotated ? part.originalHeight : part.originalWidth;
        const height = rotated ? part.originalWidth : part.originalHeight;

        const placedPart = {
            ...part,
            x: rect.x,
            y: rect.y,
            rotated,
            placedWidth: width,
            placedHeight: height,
            sheetId: sheet.id,
            grainAligned: this.isGrainAligned(part, rotated, sheet) // 🆕
        };

        sheet.placedParts.push(placedPart);
        sheet.usedArea += width * height;

        // Guillotine cut logic
        const rectIndex = sheet.freeRects.indexOf(rect);
        if (rectIndex > -1) {
            sheet.freeRects.splice(rectIndex, 1);
        }

        const remainingWidth = rect.width - width;
        const remainingHeight = rect.height - height;

        if (remainingWidth > 0 && remainingHeight > 0) {
            if (remainingWidth >= remainingHeight) {
                sheet.freeRects.push(
                    { x: rect.x + width, y: rect.y, width: remainingWidth, height: rect.height },
                    { x: rect.x, y: rect.y + height, width: width, height: remainingHeight }
                );
            } else {
                sheet.freeRects.push(
                    { x: rect.x + width, y: rect.y, width: remainingWidth, height: height },
                    { x: rect.x, y: rect.y + height, width: rect.width, height: remainingHeight }
                );
            }
        } else if (remainingWidth > 0) {
            sheet.freeRects.push({
                x: rect.x + width,
                y: rect.y,
                width: remainingWidth,
                height: rect.height
            });
        } else if (remainingHeight > 0) {
            sheet.freeRects.push({
                x: rect.x,
                y: rect.y + height,
                width: rect.width,
                height: remainingHeight
            });
        }

        sheet.freeRects = sheet.freeRects.filter(r =>
            (r.width * r.height) >= this.settings.minWasteArea
        );
    }

    /**
     * 🆕 Намиране на най-подходящ template за нов лист
     */
    findBestSheetTemplateForPart(part) {
        return this.sheets.find(s => this.materialsMatch(part.material, s.materialType));
    }

    /**
     * 🆕 Създаване на нов лист от template
     */
    createNewSheetFromTemplate(template) {
        return {
            ...template,
            id: `new_sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            freeRects: [{ x: 0, y: 0, width: template.width, height: template.height }],
            placedParts: [],
            usedArea: 0,
            efficiency: 0
        };
    }

    canCreateNewSheet() {
        return true; // Може да се добави ограничение
    }

    getSortingFunction() {
        switch(this.settings.sortingMethod) {
            case 'area':
                return (a, b) => b.area - a.area;
            case 'maxside':
                return (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height);
            case 'width':
                return (a, b) => b.width - a.width;
            case 'height':
                return (a, b) => b.height - a.height;
            case 'grain':
                // 🆕 Сортиране по grain direction и после по размер
                return (a, b) => {
                    if (a.grainDirection !== b.grainDirection) {
                        if (a.grainDirection === 'horizontal') return -1;
                        if (b.grainDirection === 'horizontal') return 1;
                    }
                    return b.area - a.area;
                };
            case 'priority':
                // 🆕 Сортиране по приоритет
                return (a, b) => {
                    if (a.priority !== b.priority) {
                        return b.priority - a.priority;
                    }
                    return b.area - a.area;
                };
            default:
                return (a, b) => b.area - a.area;
        }
    }

    // ПОДОБРЕНИ СТАТИСТИКИ
    getStatistics() {
        if (this.results.length === 0 && this.parts.length > 0) {
            this.calculateOptimization();
        }

        if (this.results.length === 0) {
            return this.getEmptyStatistics();
        }

        let totalSheetArea = 0;
        let totalUsedArea = 0;
        let totalCost = 0;
        let placedPartsCount = 0;
        let grainViolations = 0;
        let totalParts = 0;

        this.results.forEach(sheet => {
            totalSheetArea += sheet.area;
            totalUsedArea += sheet.usedArea;
            totalCost += sheet.cost;
            placedPartsCount += sheet.placedParts.length;
            
            // 🆕 Броене на grain violations
            sheet.placedParts.forEach(part => {
                totalParts++;
                if (!part.grainAligned) {
                    grainViolations++;
                }
            });
        });

        const efficiency = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;
        const wasteArea = totalSheetArea - totalUsedArea;
        const placementRate = this.parts.length > 0 ? (placedPartsCount / this.parts.length) * 100 : 0;
        const grainCompliance = totalParts > 0 ? ((totalParts - grainViolations) / totalParts) * 100 : 100;

        return {
            totalSheets: this.results.length,
            totalParts: this.parts.length,
            placedParts: placedPartsCount,
            placementRate: placementRate.toFixed(1) + '%',
            totalSheetArea,
            totalUsedArea,
            totalWasteArea: wasteArea,
            materialEfficiency: efficiency.toFixed(2) + '%',
            estimatedCost: totalCost.toFixed(2) + ' лв.',
            avgSheetEfficiency: (this.results.reduce((sum, s) => sum + s.efficiency, 0) / this.results.length).toFixed(1) + '%',
            grainCompliance: grainCompliance.toFixed(1) + '%', // 🆕
            grainViolations // 🆕
        };
    }

    getEmptyStatistics() {
        return {
            totalSheets: 0,
            totalParts: this.parts.length,
            placedParts: 0,
            placementRate: '0%',
            totalSheetArea: 0,
            totalUsedArea: 0,
            totalWasteArea: 0,
            materialEfficiency: '0%',
            estimatedCost: '0.00 лв.',
            avgSheetEfficiency: '0%',
            grainCompliance: '100%',
            grainViolations: 0
        };
    }

    // ЕКСПОРТ/ИМПОРТ
    exportProject() {
        return {
            version: '3.0',
            date: new Date().toISOString(),
            settings: this.settings,
            grainPreferences: this.grainPreferences,
            parts: this.parts,
            sheets: this.sheets,
            results: this.results
        };
    }

    importProject(data) {
        if (data.version === '3.0' || data.version === '2.0' || data.version === '1.0') {
            this.settings = { ...this.settings, ...(data.settings || {}) };
            this.grainPreferences = data.grainPreferences || this.grainPreferences;
            this.parts = data.parts || [];
            this.sheets = data.sheets || [];
            this.results = data.results || [];
            return true;
        }
        return false;
    }

    /**
     * 🆕 Генериране на cutting list с grain информация
     */
    generateCuttingList() {
        const list = {
            byMaterial: {},
            bySheet: [],
            summary: this.getStatistics()
        };

        // Групиране по материал
        this.parts.forEach(part => {
            if (!list.byMaterial[part.material]) {
                list.byMaterial[part.material] = [];
            }
            list.byMaterial[part.material].push({
                name: part.name,
                width: part.width,
                height: part.height,
                grainDirection: part.grainDirection,
                placed: part.placed
            });
        });

        // Информация по листове
        this.results.forEach((sheet, index) => {
            list.bySheet.push({
                sheetNumber: index + 1,
                material: sheet.materialType,
                dimensions: `${sheet.width}×${sheet.height}mm`,
                grainDirection: sheet.grainDirection,
                efficiency: sheet.efficiency.toFixed(1) + '%',
                grainCompliance: sheet.grainCompliance?.toFixed(1) + '%',
                parts: sheet.placedParts.map(p => ({
                    name: p.name,
                    dimensions: `${p.placedWidth}×${p.placedHeight}mm`,
                    position: `(${p.x}, ${p.y})`,
                    rotated: p.rotated,
                    grainAligned: p.grainAligned
                }))
            });
        });

        return list;
    }
}
