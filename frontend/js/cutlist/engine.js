export class CutListEngine {
    constructor() {
        this.parts = [];
        this.sheets = [];
        this.results = [];
        this.settings = {
            allowRotation: true,
            respectGrainDirection: true,
            cuttingBladeWidth: 4,          // mm
            minWasteArea: 10000,           // mm²
            sortingMethod: 'area',         // 'area','maxside','width','height','grain','priority'
            heuristic: 'BAF',              // 'BAF','BSSF','BLSF'
            grainPenaltyFactor: 0.5        // % от площта като penalty при нарушение
        };

        // Grain direction преференции по материал (по подразбиране)
        this.grainPreferences = {
            'ПДЧ': 'any',
            'МДФ': 'any',
            'ХДЛ': 'horizontal',
            'Масив': 'horizontal',
            'Фурнир': 'horizontal',
            'Шперплат': 'any'
        };
    }

    /**
     * Добавяне на детайл – обратно съвместимо.
     * @param {string} name - Име
     * @param {number} width - Ширина (mm)
     * @param {number} height - Височина (mm)
     * @param {number} quantity - Брой (по подразбиране 1)
     * @param {string} material - Материал (по подразбиране 'ПДЧ 18мм')
     * @param {object} options - Допълнителни опции (grainDirection, allowRotation, priority, edgeBanding)
     */
    addPart(name, width, height, quantity = 1, material = 'ПДЧ 18мм', options = {}) {
        // Обратна съвместимост: ако 5-ти аргумент е обект, значи е options
        if (typeof quantity === 'object') {
            options = quantity;
            quantity = 1;
            material = 'ПДЧ 18мм';
        } else if (typeof material === 'object') {
            options = material;
            material = 'ПДЧ 18мм';
        }

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
                grainDirection,
                allowRotation,
                priority,
                edgeBanding,
                placed: false,
                rotated: false
            });
        }
        return this.parts;
    }

    /**
     * Добавяне на лист материал – обратно съвместимо.
     * @param {string} name - Име
     * @param {number} width - Ширина (mm)
     * @param {number} height - Височина (mm)
     * @param {number} cost - Цена (лв.)
     * @param {string} materialType - Тип материал
     * @param {object} options - Опции (grainDirection, maxUsagePercent)
     */
    addSheet(name, width, height, cost = 0, materialType = 'ПДЧ 18мм', options = {}) {
        // Обратна съвместимост
        if (typeof cost === 'object') {
            options = cost;
            cost = 0;
            materialType = 'ПДЧ 18мм';
        } else if (typeof materialType === 'object') {
            options = materialType;
            materialType = 'ПДЧ 18мм';
        }

        const {
            grainDirection = this.detectGrainDirection(materialType, width, height),
            maxUsagePercent = 95
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
            grainDirection,
            maxUsagePercent,
            freeRects: [{ x: 0, y: 0, width: parseInt(width), height: parseInt(height) }],
            placedParts: [],
            usedArea: 0,
            efficiency: 0
        });
        return this.sheets;
    }

    // -------------------- GRAIN DIRECTION --------------------
    detectGrainDirection(material, width, height) {
        for (const [materialType, grainDir] of Object.entries(this.grainPreferences)) {
            if (material.includes(materialType)) {
                if (grainDir === 'any') return 'any';
                // За материали с фиксирана посока, определяме според дългата страна
                return grainDir === 'horizontal'
                    ? (width >= height ? 'horizontal' : 'vertical')
                    : grainDir;
            }
        }
        return 'any';
    }

    canRotatePart(part, sheet) {
        if (!this.settings.respectGrainDirection) {
            return part.allowRotation && this.settings.allowRotation;
        }
        if (!part.allowRotation || !this.settings.allowRotation) return false;
        if (part.grainDirection === 'any' || sheet.grainDirection === 'any') return true;
        return part.grainDirection === sheet.grainDirection;
    }

    isGrainAligned(part, rotated, sheet) {
        if (!this.settings.respectGrainDirection) return true;
        if (part.grainDirection === 'any' || sheet.grainDirection === 'any') return true;
        const effectivePartGrain = rotated
            ? (part.grainDirection === 'horizontal' ? 'vertical' : 'horizontal')
            : part.grainDirection;
        return effectivePartGrain === sheet.grainDirection;
    }

    // -------------------- СЪВПАДЕНИЕ НА МАТЕРИАЛИ --------------------
    materialsMatch(partMaterial, sheetMaterial) {
        // Извличане на основен тип и дебелина
        const extractTypeAndThickness = (mat) => {
            const typeMatch = mat.match(/^(ПДЧ|МДФ|ХДЛ|Масив|Фурнир|Шперплат)/);
            const thicknessMatch = mat.match(/(\d+)\s*мм/);
            return {
                type: typeMatch ? typeMatch[1] : mat,
                thickness: thicknessMatch ? parseInt(thicknessMatch[1]) : null
            };
        };
        const part = extractTypeAndThickness(partMaterial);
        const sheet = extractTypeAndThickness(sheetMaterial);
        // Типът трябва да съвпада; ако и двете имат дебелина, тя също трябва да е еднаква
        return part.type === sheet.type &&
               (part.thickness === null || sheet.thickness === null || part.thickness === sheet.thickness);
    }

    // -------------------- ОСНОВЕН АЛГОРИТЪМ (Guillotine + евристика) --------------------
    calculateOptimization() {
        if (this.parts.length === 0 || this.sheets.length === 0) return [];

        const partsToPlace = this.parts
            .map(p => ({ ...p, placed: false }))
            .sort(this.getSortingFunction());

        const sheets = this.sheets.map(s => ({
            ...s,
            freeRects: [{ x: 0, y: 0, width: s.width, height: s.height }],
            placedParts: [],
            usedArea: 0
        }));

        for (const part of partsToPlace) {
            if (part.placed) continue;

            let bestSheet = null, bestRect = null, bestRotation = false;
            let bestScore = Infinity;

            for (const sheet of sheets) {
                if (!this.materialsMatch(part.material, sheet.materialType)) continue;

                for (const freeRect of sheet.freeRects) {
                    // Без завъртане
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
                    // Със завъртане
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

            if (bestSheet && bestRect) {
                this.placePartInSheet(bestSheet, part, bestRect, bestRotation);
                part.placed = true;
            } else {
                if (this.canCreateNewSheet()) {
                    const template = this.findBestSheetTemplateForPart(part);
                    if (template) {
                        const newSheet = this.createNewSheetFromTemplate(template);
                        sheets.push(newSheet);
                        this.placePartInSheet(newSheet, part, newSheet.freeRects[0], false);
                        part.placed = true;
                    }
                }
            }
        }

        sheets.forEach(sheet => {
            if (sheet.placedParts.length > 0) {
                sheet.efficiency = (sheet.usedArea / sheet.area) * 100;
                const grainCompliant = sheet.placedParts.filter(p =>
                    this.isGrainAligned(p, p.rotated, sheet)
                ).length;
                sheet.grainCompliance = (grainCompliant / sheet.placedParts.length) * 100;
            }
        });

        this.results = sheets
            .filter(s => s.placedParts.length > 0)
            .sort((a, b) => b.efficiency - a.efficiency);

        return this.results;
    }

    fitsInRect(part, rect, rotated) {
        const w = rotated ? part.originalHeight : part.originalWidth;
        const h = rotated ? part.originalWidth : part.originalHeight;
        return w <= rect.width && h <= rect.height;
    }

    /**
     * Изчисляване на score според избраната евристика.
     */
    calculatePlacementScore(part, rect, rotated, grainAligned, sheet) {
        const w = rotated ? part.originalHeight : part.originalWidth;
        const h = rotated ? part.originalWidth : part.originalHeight;

        const remainingW = rect.width - w;
        const remainingH = rect.height - h;

        let score = 0;
        switch (this.settings.heuristic) {
            case 'BAF':  // Best Area Fit
                score = remainingW * remainingH;
                break;
            case 'BSSF': // Best Short Side Fit
                score = Math.min(remainingW, remainingH);
                break;
            case 'BLSF': // Best Long Side Fit
                score = Math.max(remainingW, remainingH);
                break;
            default:     // Guillotine standard
                score = (remainingW * remainingH) + (remainingW + remainingH) * 100;
        }

        // Grain penalty – пропорционален на площта
        if (!grainAligned && this.settings.respectGrainDirection) {
            score += part.area * this.settings.grainPenaltyFactor;
        }

        // Priority bonus (по-висок priority = по-нисък score)
        if (part.priority) {
            score -= part.priority * 50;
        }

        // Edge waste penalty – малки остатъци до 50mm
        const edgeWaste = Math.min(remainingW, remainingH);
        if (edgeWaste > 0 && edgeWaste < 50) {
            score += edgeWaste * 10;
        }

        return score;
    }

    placePartInSheet(sheet, part, rect, rotated) {
        const w = rotated ? part.originalHeight : part.originalWidth;
        const h = rotated ? part.originalWidth : part.originalHeight;

        const placedPart = {
            ...part,
            x: rect.x,
            y: rect.y,
            rotated,
            placedWidth: w,
            placedHeight: h,
            sheetId: sheet.id,
            grainAligned: this.isGrainAligned(part, rotated, sheet)
        };

        sheet.placedParts.push(placedPart);
        sheet.usedArea += w * h;

        const rectIndex = sheet.freeRects.indexOf(rect);
        if (rectIndex > -1) sheet.freeRects.splice(rectIndex, 1);

        const remainingW = rect.width - w;
        const remainingH = rect.height - h;

        // Guillotine split
        if (remainingW > 0 && remainingH > 0) {
            if (remainingW >= remainingH) {
                sheet.freeRects.push(
                    { x: rect.x + w, y: rect.y, width: remainingW, height: rect.height },
                    { x: rect.x, y: rect.y + h, width: w, height: remainingH }
                );
            } else {
                sheet.freeRects.push(
                    { x: rect.x + w, y: rect.y, width: remainingW, height: h },
                    { x: rect.x, y: rect.y + h, width: rect.width, height: remainingH }
                );
            }
        } else if (remainingW > 0) {
            sheet.freeRects.push({ x: rect.x + w, y: rect.y, width: remainingW, height: rect.height });
        } else if (remainingH > 0) {
            sheet.freeRects.push({ x: rect.x, y: rect.y + h, width: rect.width, height: remainingH });
        }

        // Филтър за малки остатъци
        sheet.freeRects = sheet.freeRects.filter(r =>
            (r.width * r.height) >= this.settings.minWasteArea
        );
    }

    findBestSheetTemplateForPart(part) {
        return this.sheets.find(s => this.materialsMatch(part.material, s.materialType));
    }

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
        return true;
    }

    getSortingFunction() {
        switch (this.settings.sortingMethod) {
            case 'area':      return (a, b) => b.area - a.area;
            case 'maxside':   return (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height);
            case 'width':     return (a, b) => b.width - a.width;
            case 'height':    return (a, b) => b.height - a.height;
            case 'grain':     return (a, b) => {
                if (a.grainDirection !== b.grainDirection) {
                    if (a.grainDirection === 'horizontal') return -1;
                    if (b.grainDirection === 'horizontal') return 1;
                }
                return b.area - a.area;
            };
            case 'priority':  return (a, b) => {
                if (a.priority !== b.priority) return b.priority - a.priority;
                return b.area - a.area;
            };
            default: return (a, b) => b.area - a.area;
        }
    }

    // -------------------- СТАТИСТИКИ --------------------
    getStatistics() {
        if (this.results.length === 0 && this.parts.length > 0) this.calculateOptimization();
        if (this.results.length === 0) return this.getEmptyStatistics();

        let totalSheetArea = 0, totalUsedArea = 0, totalCost = 0, placedPartsCount = 0, grainViolations = 0, totalParts = 0;
        this.results.forEach(sheet => {
            totalSheetArea += sheet.area;
            totalUsedArea += sheet.usedArea;
            totalCost += sheet.cost * (sheet.usedArea / sheet.area);
            placedPartsCount += sheet.placedParts.length;
            sheet.placedParts.forEach(p => {
                totalParts++;
                if (!p.grainAligned) grainViolations++;
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
            grainCompliance: grainCompliance.toFixed(1) + '%',
            grainViolations
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

    // -------------------- ЕКСПОРТ/ИМПОРТ --------------------
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

    generateCuttingList() {
        const list = { byMaterial: {}, bySheet: [], summary: this.getStatistics() };
        this.parts.forEach(part => {
            if (!list.byMaterial[part.material]) list.byMaterial[part.material] = [];
            list.byMaterial[part.material].push({
                name: part.name,
                width: part.width,
                height: part.height,
                grainDirection: part.grainDirection,
                placed: part.placed
            });
        });
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