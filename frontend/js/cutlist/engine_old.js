export class CutListEngine {
    constructor() {
        this.parts = [];
        this.sheets = [];
        this.results = [];
        this.settings = {
            allowRotation: true,
            cuttingBladeWidth: 4, // mm - дебелина на режещо острие
            minWasteArea: 10000, // mm² - минимална площ, под която отпадъците се пренебрегват
            sortingMethod: 'area' // 'area', 'maxside', 'width', 'height'
        };
    }

    addPart(name, width, height, quantity = 1, material = 'ПДЧ 18мм') {
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
                placed: false
            });
        }
        return this.parts;
    }

    addSheet(name, width, height, cost = 0, materialType = 'ПДЧ 18мм') {
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
            freeRects: [{ x: 0, y: 0, width: parseInt(width), height: parseInt(height) }],
            placedParts: [],
            usedArea: 0,
            efficiency: 0
        });
        return this.sheets;
    }

    // ПОДОБРЕН АЛГОРИТЪМ ЗА ОПТИМИЗАЦИЯ
    calculateOptimization() {
        if (this.parts.length === 0 || this.sheets.length === 0) {
            return [];
        }

        // 1. Клониране на данните за работа
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

            // Търсене на най-доброто място за детайла
            for (const sheet of sheets) {
                for (const freeRect of sheet.freeRects) {
                    // Без завъртане
                    if (this.fitsInRect(part, freeRect, false)) {
                        const score = this.calculatePlacementScore(part, freeRect, false);
                        if (score < bestScore) {
                            bestScore = score;
                            bestSheet = sheet;
                            bestRect = freeRect;
                            bestRotation = false;
                        }
                    }

                    // Със завъртане (ако е позволено)
                    if (this.settings.allowRotation) {
                        const rotatedPart = { ...part, width: part.height, height: part.width };
                        if (this.fitsInRect(rotatedPart, freeRect, true)) {
                            const score = this.calculatePlacementScore(rotatedPart, freeRect, true);
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

            // Поставяне на детайла, ако е намерено подходящо място
            if (bestSheet && bestRect) {
                this.placePartInSheet(bestSheet, part, bestRect, bestRotation);
                part.placed = true;
            } else {
                // Ако не е намерено място, създаваме нов лист (ако можем)
                if (this.canCreateNewSheet()) {
                    const newSheet = { ...sheets[0], id: `new_sheet_${Date.now()}` };
                    sheets.push(newSheet);
                    // Опитваме се да поставим в новия лист
                    const firstRect = newSheet.freeRects[0];
                    if (this.fitsInRect(part, firstRect, false) ||
                        (this.settings.allowRotation && this.fitsInRect(
                            { ...part, width: part.height, height: part.width },
                            firstRect, true
                        ))) {
                        this.placePartInSheet(newSheet, part, firstRect, false);
                        part.placed = true;
                    }
                }
            }
        }

        // 3. Изчисляване на ефективността за всеки лист
        sheets.forEach(sheet => {
            if (sheet.placedParts.length > 0) {
                sheet.efficiency = (sheet.usedArea / sheet.area) * 100;
            }
        });

        // 4. Филтриране само на използваните листове и сортиране по ефективност
        this.results = sheets
            .filter(s => s.placedParts.length > 0)
            .sort((a, b) => b.efficiency - a.efficiency);

        return this.results;
    }

    fitsInRect(part, rect, rotated) {
        const width = rotated ? part.originalHeight : part.originalWidth;
        const height = rotated ? part.originalWidth : part.originalHeight;
        return width <= rect.width && height <= rect.height;
    }

    calculatePlacementScore(part, rect, rotated) {
        const width = rotated ? part.originalHeight : part.originalWidth;
        const height = rotated ? part.originalWidth : part.originalHeight;

        // Изчисляване на оставащото пространство след поставяне
        const remainingWidth = rect.width - width;
        const remainingHeight = rect.height - height;

        // Приоритизираме поставяния, които оставят по-малко остатъчно пространство
        return (remainingWidth * remainingHeight) + (remainingWidth + remainingHeight) * 100;
    }

    placePartInSheet(sheet, part, rect, rotated) {
        const width = rotated ? part.originalHeight : part.originalWidth;
        const height = rotated ? part.originalWidth : part.originalHeight;

        // Създаване на поставения детайл
        const placedPart = {
            ...part,
            x: rect.x,
            y: rect.y,
            rotated,
            placedWidth: width,
            placedHeight: height,
            sheetId: sheet.id
        };

        // Добавяне към листа
        sheet.placedParts.push(placedPart);
        sheet.usedArea += width * height;

        // Премахване на използвания правоъгълник
        const rectIndex = sheet.freeRects.indexOf(rect);
        if (rectIndex > -1) {
            sheet.freeRects.splice(rectIndex, 1);
        }

        // Разделяне на оставащото пространство (Guillotine cut)
        const remainingWidth = rect.width - width;
        const remainingHeight = rect.height - height;

        if (remainingWidth > 0 && remainingHeight > 0) {
            // Два нови правоъгълника - отдясно и отдолу
            if (remainingWidth >= remainingHeight) {
                // По-широк остатък - разделяме хоризонтално
                sheet.freeRects.push(
                    { x: rect.x + width, y: rect.y, width: remainingWidth, height: rect.height },
                    { x: rect.x, y: rect.y + height, width: width, height: remainingHeight }
                );
            } else {
                // По-висок остатък - разделяме вертикално
                sheet.freeRects.push(
                    { x: rect.x + width, y: rect.y, width: remainingWidth, height: height },
                    { x: rect.x, y: rect.y + height, width: rect.width, height: remainingHeight }
                );
            }
        } else if (remainingWidth > 0) {
            // Остава само ширина
            sheet.freeRects.push({
                x: rect.x + width,
                y: rect.y,
                width: remainingWidth,
                height: rect.height
            });
        } else if (remainingHeight > 0) {
            // Остава само височина
            sheet.freeRects.push({
                x: rect.x,
                y: rect.y + height,
                width: rect.width,
                height: remainingHeight
            });
        }

        // Филтриране на твърде малки остатъци (по-малки от minWasteArea)
        sheet.freeRects = sheet.freeRects.filter(r =>
            (r.width * r.height) >= this.settings.minWasteArea
        );
    }

    canCreateNewSheet() {
        // Може да се добави логика за ограничаване на новите листове
        return true;
    }

    getSortingFunction() {
        switch(this.settings.sortingMethod) {
            case 'area':
                return (a, b) => b.area - a.area; // Най-големите първи
            case 'maxside':
                return (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height);
            case 'width':
                return (a, b) => b.width - a.width;
            case 'height':
                return (a, b) => b.height - a.height;
            default:
                return (a, b) => b.area - a.area;
        }
    }

    // ПОДОБРЕНИ СТАТИСТИКИ
    getStatistics() {
        if (this.results.length === 0 && this.parts.length > 0) {
            // Опит за изчисление, ако все още не е направено
            this.calculateOptimization();
        }

        if (this.results.length === 0) {
            return this.getEmptyStatistics();
        }

        let totalSheetArea = 0;
        let totalUsedArea = 0;
        let totalCost = 0;
        let placedPartsCount = 0;

        this.results.forEach(sheet => {
            totalSheetArea += sheet.area;
            totalUsedArea += sheet.usedArea;
            totalCost += sheet.cost * (sheet.usedArea / sheet.area);
            placedPartsCount += sheet.placedParts.length;
        });

        const efficiency = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;
        const wasteArea = totalSheetArea - totalUsedArea;
        const placementRate = this.parts.length > 0 ? (placedPartsCount / this.parts.length) * 100 : 0;

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
            avgSheetEfficiency: (this.results.reduce((sum, s) => sum + s.efficiency, 0) / this.results.length).toFixed(1) + '%'
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
            avgSheetEfficiency: '0%'
        };
    }

    // ЕКСПОРТ/ИМПОРТ
    exportProject() {
        return {
            version: '2.0',
            date: new Date().toISOString(),
            settings: this.settings,
            parts: this.parts,
            sheets: this.sheets,
            results: this.results
        };
    }

    importProject(data) {
        if (data.version === '2.0' || data.version === '1.0') {
            this.settings = data.settings || this.settings;
            this.parts = data.parts || [];
            this.sheets = data.sheets || [];
            this.results = data.results || [];
            return true;
        }
        return false;
    }
}
