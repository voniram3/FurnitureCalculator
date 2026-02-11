// js/cutlist.js
export class CutListEngine {
    constructor() {
        this.sheets = [];
        this.parts = [];
    }
    
    // Алгоритъм за разкрояване (First-Fit Decreasing Height)
    calculateCutList(parts, sheetWidth, sheetHeight) {
        // Сортираме детайлите по височина (намаляващо)
        const sortedParts = [...parts].sort((a, b) => b.height - a.height);
        
        const sheets = [];
        let currentSheet = this.createNewSheet(sheetWidth, sheetHeight);
        
        sortedParts.forEach(part => {
            for (let i = 0; i < part.quantity; i++) {
                const placed = this.tryPlacePart(currentSheet, part);
                
                if (!placed) {
                    // Запазваме текущия лист и започваме нов
                    sheets.push(currentSheet);
                    currentSheet = this.createNewSheet(sheetWidth, sheetHeight);
                    this.tryPlacePart(currentSheet, part);
                }
            }
        });
        
        // Добавяме последния лист
        if (currentSheet.parts.length > 0) {
            sheets.push(currentSheet);
        }
        
        return this.calculateStats(sheets);
    }
    
    tryPlacePart(sheet, part) {
        // Намираме първата свободна позиция
        for (let y = 0; y <= sheet.height - part.height; y++) {
            for (let x = 0; x <= sheet.width - part.width; x++) {
                if (this.canPlace(sheet, part, x, y)) {
                    this.placePart(sheet, part, x, y);
                    return true;
                }
                
                // Опитаме с завъртане
                if (this.canPlace(sheet, part, x, y, true)) {
                    this.placePart(sheet, part, x, y, true);
                    return true;
                }
            }
        }
        return false;
    }
    
    canPlace(sheet, part, x, y, rotated = false) {
        const width = rotated ? part.height : part.width;
        const height = rotated ? part.width : part.height;
        
        // Проверка дали излиза извън границите
        if (x + width > sheet.width || y + height > sheet.height) {
            return false;
        }
        
        // Проверка за припокриване с други детайли
        for (const placedPart of sheet.parts) {
            if (!(x >= placedPart.x + placedPart.width ||
                  x + width <= placedPart.x ||
                  y >= placedPart.y + placedPart.height ||
                  y + height <= placedPart.y)) {
                return false;
            }
        }
        
        return true;
    }
    
    placePart(sheet, part, x, y, rotated = false) {
        sheet.parts.push({
            ...part,
            x,
            y,
            rotated,
            placedWidth: rotated ? part.height : part.width,
            placedHeight: rotated ? part.width : part.height
        });
    }
    
    createNewSheet(width, height) {
        return {
            width,
            height,
            parts: [],
            id: Date.now()
        };
    }
    
    calculateStats(sheets) {
        return sheets.map(sheet => {
            const usedArea = sheet.parts.reduce((sum, part) => 
                sum + (part.placedWidth * part.placedHeight), 0);
            const totalArea = sheet.width * sheet.height;
            const waste = totalArea - usedArea;
            const efficiency = (usedArea / totalArea * 100).toFixed(1);
            
            return {
                ...sheet,
                usedArea,
                totalArea,
                waste,
                efficiency: efficiency + '%',
                materialCost: (totalArea / 1000000) * 120 // Примерна цена на m²
            };
        });
    }
    
    // Генериране на визуализация (SVG)
    generateSVG(sheet, scale = 0.5) {
        const svgWidth = sheet.width * scale;
        const svgHeight = sheet.height * scale;
        
        let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${sheet.width} ${sheet.height}">`;
        
        // Лист
        svg += `<rect x="0" y="0" width="${sheet.width}" height="${sheet.height}" 
                fill="#f0f0f0" stroke="#333" stroke-width="2"/>`;
        
        // Детайли
        sheet.parts.forEach(part => {
            const fill = this.getColorForMaterial(part.material);
            svg += `<rect x="${part.x}" y="${part.y}" 
                    width="${part.placedWidth}" height="${part.placedHeight}"
                    fill="${fill}" stroke="#000" stroke-width="1"
                    data-name="${part.name}"/>
                   <text x="${part.x + 10}" y="${part.y + 20}" 
                    font-size="14" fill="#000">${part.name}</text>`;
        });
        
        svg += '</svg>';
        return svg;
    }
    
    getColorForMaterial(material) {
        const colors = {
            'ПДЧ': '#e6b8af',
            'МДФ': '#d7bde2',
            'ХДЛ': '#a9cce3',
            'Масив': '#a3e4d7',
            'Гръб': '#f9e79f'
        };
        return colors[material] || '#ddd';
    }
}