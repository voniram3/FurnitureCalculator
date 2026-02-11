export class CutListVisualizer {
    static generateSVG(sheetData, options = {}) {
        const { width, height, placedParts, materialType } = sheetData;
        const {
            scale = 0.3,
            showLabels = true,
            showGrid = true,
            showDimensions = true
        } = options;

        const svgWidth = width * scale;
        const svgHeight = height * scale;

        let svg = `<svg width="${svgWidth}" height="${svgHeight}"
                        viewBox="0 0 ${width} ${height}"
                        xmlns="http://www.w3.org/2000/svg"
                        class="cutlist-svg">`;

        // Фон на листа с текстурa
        svg += `<rect x="0" y="0" width="${width}" height="${height}"
                     fill="${this.getSheetBackground(materialType)}"
                     stroke="#495057" stroke-width="3"/>`;

        // Мрежа (ако е активирана)
        if (showGrid) {
            svg += this.generateGrid(width, height, 100); // Мрежа на всеки 100mm
        }

        // Детайли
        if (placedParts && placedParts.length > 0) {
            placedParts.forEach((part, index) => {
                const partWidth = part.placedWidth || part.width || 100;
                const partHeight = part.placedHeight || part.height || 100;
                const color = this.getColorForMaterial(part.material);
                const isRotated = part.rotated || false;

                // Основен правоъгълник на детайла
                svg += `<rect x="${part.x}" y="${part.y}"
                             width="${partWidth}" height="${partHeight}"
                             fill="${color}" fill-opacity="0.8"
                             stroke="#212529" stroke-width="2"
                             class="cutlist-part"
                             data-index="${index}"
                             data-rotated="${isRotated}"/>

                        <title>${part.name} | ${partWidth}×${partHeight}mm${isRotated ? ' (завъртан)' : ''}</title>`;

                // Индикация за завъртане
                if (isRotated) {
                    svg += `<path d="M${part.x + 10},${part.y + 10} L${part.x + 30},${part.y + 10} L${part.x + 10},${part.y + 30} Z"
                             fill="#dc3545" fill-opacity="0.7"/>`;
                }

                // Размери на детайла (ако има достатъчно място)
                if (showLabels && partWidth > 80 && partHeight > 40) {
                    const label = this.truncateLabel(part.name, 12);

                    // Размери на страните
                    if (showDimensions) {
                        // Хоризонтална страна
                        svg += `<text x="${part.x + partWidth/2}" y="${part.y - 5}"
                                   text-anchor="middle" font-size="10" fill="#495057">
                                ${partWidth}mm
                              </text>`;

                        // Вертикална страна
                        svg += `<text x="${part.x - 5}" y="${part.y + partHeight/2}"
                                   text-anchor="end" font-size="10" fill="#495057"
                                   transform="rotate(-90, ${part.x - 5}, ${part.y + partHeight/2})">
                                ${partHeight}mm
                              </text>`;
                    }

                    // Име на детайла
                    svg += `<text x="${part.x + partWidth/2}" y="${part.y + partHeight/2}"
                               text-anchor="middle" dominant-baseline="middle"
                               font-size="12" fill="#212529" font-weight="bold">
                            ${label}
                          </text>`;
                }
            });
        } else {
            // Съобщение за празен лист
            svg += `<text x="${width/2}" y="${height/2}"
                       text-anchor="middle" dominant-baseline="middle"
                       font-size="16" fill="#6c757d" font-weight="bold">
                    Листът е празен
                  </text>`;
        }

        // Размери на листа
        if (showDimensions) {
            svg += `<text x="${width/2}" y="${height + 20}"
                       text-anchor="middle" font-size="12" fill="#495057">
                    ${width} × ${height} mm
                  </text>`;
        }

        svg += '</svg>';
        return svg;
    }

    static generateGrid(width, height, step) {
        let gridSVG = '';
        const gridColor = 'rgba(0, 0, 0, 0.1)';

        // Вертикални линии
        for (let x = step; x < width; x += step) {
            gridSVG += `<line x1="${x}" y1="0" x2="${x}" y2="${height}"
                          stroke="${gridColor}" stroke-width="0.5"/>`;
        }

        // Хоризонтални линии
        for (let y = step; y < height; y += step) {
            gridSVG += `<line x1="0" y1="${y}" x2="${width}" y2="${y}"
                          stroke="${gridColor}" stroke-width="0.5"/>`;
        }

        return gridSVG;
    }

    static getSheetBackground(materialType) {
        if (!materialType) return 'url(#wood-pattern)';

        // Градиентни фонове за различни материали
        const backgrounds = {
            'ПДЧ': 'linear-gradient(45deg, #f5f5f5 25%, #e0e0e0 25%, #e0e0e0 50%, #f5f5f5 50%, #f5f5f5 75%, #e0e0e0 75%)',
            'МДФ': 'linear-gradient(45deg, #e8e8e8 25%, #d6d6d6 25%, #d6d6d6 50%, #e8e8e8 50%, #e8e8e8 75%, #d6d6d6 75%)',
            'ХДЛ': 'linear-gradient(45deg, #d4b483 25%, #c19a65 25%, #c19a65 50%, #d4b483 50%, #d4b483 75%, #c19a65 75%)',
            'Масив': 'linear-gradient(45deg, #8B4513 25%, #A0522D 25%, #A0522D 50%, #8B4513 50%, #8B4513 75%, #A0522D 75%)'
        };

        for (const [key, value] of Object.entries(backgrounds)) {
            if (materialType.includes(key)) {
                return value;
            }
        }

        return '#f8f9fa';
    }

    static getColorForMaterial(material) {
        if (!material) return '#e9ecef';

        const materialLower = material.toLowerCase();
        const colors = {
            'пдч': ['#e9c46a', '#f4a261', '#e76f51'],
            'мдф': ['#2a9d8f', '#219ebc', '#126782'],
            'хдл': ['#588157', '#3a5a40', '#344e41'],
            'масив': ['#bc6c25', '#dda15e', '#fefae0'],
            'гръб': ['#a8dadc', '#457b9d', '#1d3557'],
            'стекло': ['#caf0f8', '#90e0ef', '#00b4d8']
        };

        for (const [key, palette] of Object.entries(colors)) {
            if (materialLower.includes(key)) {
                // Връщаме цвят базиран на размера на детайла за по-добра визуализация
                return palette[Math.floor(Math.random() * palette.length)];
            }
        }

        return '#adb5bd';
    }

    static truncateLabel(label, maxLength = 10) {
        if (label.length <= maxLength) return label;
        return label.substring(0, maxLength - 3) + '...';
    }

    // ГЕНЕРИРАНЕ НА ДЕТАЙЛЕН ОТЧЕТ
    static generateReport(engine, containerId) {
        const stats = engine.getStatistics();
        const results = engine.results;

        let report = `<div class="cutlist-report">`;

        // Заглавие
        report += `<h3>📊 Детайлен отчет за разкрояване</h3>`;

        // Обща статистика
        report += `<div class="report-section">
                    <h4>Обща статистика:</h4>
                    <table class="report-table">
                        <tr><td>Общо детайли:</td><td>${stats.totalParts}</td></tr>
                        <tr><td>Поставени детайли:</td><td>${stats.placedParts} (${stats.placementRate})</td></tr>
                        <tr><td>Използвани листове:</td><td>${stats.totalSheets}</td></tr>
                        <tr><td>Ефективност на материала:</td><td>${stats.materialEfficiency}</td></tr>
                        <tr><td>Приблизителна цена:</td><td>${stats.estimatedCost}</td></tr>
                    </table>
                   </div>`;

        // Детайли по листове
        report += `<div class="report-section">
                    <h4>Разпределение по листове:</h4>`;

        results.forEach((sheet, index) => {
            const sheetEfficiency = sheet.efficiency ? sheet.efficiency.toFixed(1) + '%' : '0%';
            const usedArea = sheet.usedArea ? (sheet.usedArea / 1000000).toFixed(3) : '0';
            const sheetArea = (sheet.area / 1000000).toFixed(3);

            report += `<div class="sheet-report">
                        <h5>Лист ${index + 1}: ${sheet.width} × ${sheet.height} mm (${sheet.materialType})</h5>
                        <table class="sheet-details">
                            <tr><td>Детайли:</td><td>${sheet.placedParts.length} бр.</td></tr>
                            <tr><td>Използвана площ:</td><td>${usedArea} m² (${sheetEfficiency})</td></tr>
                            <tr><td>Обща площ:</td><td>${sheetArea} m²</td></tr>
                            <tr><td>Цена на листа:</td><td>${sheet.cost} лв.</td></tr>
                        </table>
                       </div>`;
        });

        report += `</div></div>`;

        document.getElementById(containerId).innerHTML = report;
        return report;
    }
}
