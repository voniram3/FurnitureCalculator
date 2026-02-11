export class CutListVisualizer {
    static generateSVG(sheetData, options = {}) {
        const { width, height, placedParts, materialType, grainDirection } = sheetData;
        const {
            scale = 0.3,
            showLabels = true,
            showGrid = true,
            showDimensions = true,
            showGrain = true, // 🆕
            showGrainViolations = true // 🆕
        } = options;

        const svgWidth = width * scale;
        const svgHeight = height * scale;

        let svg = `<svg width="${svgWidth}" height="${svgHeight}"
                        viewBox="0 0 ${width} ${height}"
                        xmlns="http://www.w3.org/2000/svg"
                        class="cutlist-svg">`;

        // Дефиниции за patterns
        svg += this.generateSVGDefinitions(grainDirection);

        // Фон на листа с текстура и grain
        svg += `<rect x="0" y="0" width="${width}" height="${height}"
                     fill="${this.getSheetBackground(materialType, grainDirection, showGrain)}"
                     stroke="#495057" stroke-width="3"/>`;

        // 🆕 Grain direction indicator за листа
        if (showGrain && grainDirection && grainDirection !== 'any') {
            svg += this.generateSheetGrainIndicator(width, height, grainDirection);
        }

        // Мрежа
        if (showGrid) {
            svg += this.generateGrid(width, height, 100);
        }

        // Детайли
        if (placedParts && placedParts.length > 0) {
            placedParts.forEach((part, index) => {
                const partWidth = part.placedWidth || part.width || 100;
                const partHeight = part.placedHeight || part.height || 100;
                const color = this.getColorForMaterial(part.material, part.grainAligned);
                const isRotated = part.rotated || false;
                const grainAligned = part.grainAligned !== false;

                // 🆕 Специален стил за grain violations
                const strokeColor = !grainAligned && showGrainViolations ? '#dc3545' : '#212529';
                const strokeWidth = !grainAligned && showGrainViolations ? 3 : 2;

                // Основен правоъгълник на детайла
                svg += `<rect x="${part.x}" y="${part.y}"
                             width="${partWidth}" height="${partHeight}"
                             fill="${color}" fill-opacity="0.8"
                             stroke="${strokeColor}" stroke-width="${strokeWidth}"
                             class="cutlist-part ${!grainAligned ? 'grain-violation' : ''}"
                             data-index="${index}"
                             data-rotated="${isRotated}"
                             data-grain-aligned="${grainAligned}"/>`;

                // Tooltip
                const grainStatus = grainAligned ? '✓ Grain OK' : '⚠ Grain нарушение';
                svg += `<title>${part.name} | ${partWidth}×${partHeight}mm${isRotated ? ' (завъртан)' : ''}
${part.grainDirection ? 'Grain: ' + part.grainDirection : ''}
${grainStatus}</title>`;

                // 🆕 Grain direction lines в детайла
                if (showGrain && part.grainDirection && part.grainDirection !== 'any') {
                    svg += this.generatePartGrainLines(
                        part.x, part.y, partWidth, partHeight,
                        part.grainDirection, isRotated
                    );
                }

                // Индикация за завъртане
                if (isRotated) {
                    svg += `<path d="M${part.x + 10},${part.y + 10} 
                                   L${part.x + 30},${part.y + 10} 
                                   L${part.x + 10},${part.y + 30} Z"
                             fill="#ffc107" fill-opacity="0.9"/>`;
                }

                // 🆕 WARNING за grain violation
                if (!grainAligned && showGrainViolations) {
                    svg += `<text x="${part.x + partWidth - 25}" y="${part.y + 25}"
                               font-size="20" fill="#dc3545" font-weight="bold">⚠</text>`;
                }

                // Labels и размери
                if (showLabels && partWidth > 80 && partHeight > 40) {
                    const label = this.truncateLabel(part.name, 12);

                    if (showDimensions) {
                        // Хоризонтална страна
                        svg += `<text x="${part.x + partWidth/2}" y="${part.y - 5}"
                                   text-anchor="middle" font-size="10" fill="#495057" font-weight="bold">
                                ${partWidth}mm
                              </text>`;

                        // Вертикална страна
                        svg += `<text x="${part.x - 5}" y="${part.y + partHeight/2}"
                                   text-anchor="end" font-size="10" fill="#495057" font-weight="bold"
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
            svg += `<text x="${width/2}" y="${height/2}"
                       text-anchor="middle" dominant-baseline="middle"
                       font-size="16" fill="#6c757d" font-weight="bold">
                    Листът е празен
                  </text>`;
        }

        // Размери на листа
        if (showDimensions) {
            svg += `<text x="${width/2}" y="${height + 25}"
                       text-anchor="middle" font-size="14" fill="#495057" font-weight="bold">
                    ${width} × ${height} mm
                  </text>`;
            
            // 🆕 Grain direction label
            if (grainDirection && grainDirection !== 'any') {
                const grainLabel = grainDirection === 'horizontal' ? '→ Grain' : '↑ Grain';
                svg += `<text x="${width + 30}" y="${height/2}"
                           text-anchor="start" font-size="12" fill="#667eea" font-weight="bold"
                           transform="rotate(${grainDirection === 'horizontal' ? 0 : -90}, ${width + 30}, ${height/2})">
                        ${grainLabel}
                      </text>`;
            }
        }

        svg += '</svg>';
        return svg;
    }

    /**
     * 🆕 SVG Definitions за patterns и gradients
     */
    static generateSVGDefinitions(grainDirection) {
        return `
        <defs>
            <!-- Horizontal grain pattern -->
            <pattern id="grain-horizontal" x="0" y="0" width="20" height="4" patternUnits="userSpaceOnUse">
                <line x1="0" y1="2" x2="20" y2="2" stroke="rgba(139, 69, 19, 0.2)" stroke-width="1"/>
            </pattern>
            
            <!-- Vertical grain pattern -->
            <pattern id="grain-vertical" x="0" y="0" width="4" height="20" patternUnits="userSpaceOnUse">
                <line x1="2" y1="0" x2="2" y2="20" stroke="rgba(139, 69, 19, 0.2)" stroke-width="1"/>
            </pattern>
            
            <!-- Wood texture gradient -->
            <linearGradient id="wood-gradient-h" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#d4a574;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#c19a6b;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#d4a574;stop-opacity:1" />
            </linearGradient>
            
            <linearGradient id="wood-gradient-v" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#d4a574;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#c19a6b;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#d4a574;stop-opacity:1" />
            </linearGradient>
        </defs>`;
    }

    /**
     * 🆕 Grain indicator за целия лист
     */
    static generateSheetGrainIndicator(width, height, grainDirection) {
        const arrows = [];
        const arrowSize = 30;
        const spacing = 200;

        if (grainDirection === 'horizontal') {
            // Хоризонтални стрелки
            for (let y = spacing; y < height; y += spacing) {
                for (let x = spacing/2; x < width - spacing; x += spacing) {
                    arrows.push(`
                        <path d="M${x},${y} L${x + arrowSize},${y} 
                                 M${x + arrowSize - 8},${y - 6} L${x + arrowSize},${y} L${x + arrowSize - 8},${y + 6}"
                              stroke="rgba(102, 126, 234, 0.3)" stroke-width="2" fill="none"/>
                    `);
                }
            }
        } else if (grainDirection === 'vertical') {
            // Вертикални стрелки
            for (let x = spacing; x < width; x += spacing) {
                for (let y = spacing/2; y < height - spacing; y += spacing) {
                    arrows.push(`
                        <path d="M${x},${y} L${x},${y + arrowSize}
                                 M${x - 6},${y + arrowSize - 8} L${x},${y + arrowSize} L${x + 6},${y + arrowSize - 8}"
                              stroke="rgba(102, 126, 234, 0.3)" stroke-width="2" fill="none"/>
                    `);
                }
            }
        }

        return arrows.join('');
    }

    /**
     * 🆕 Grain lines в детайла
     */
    static generatePartGrainLines(x, y, width, height, grainDirection, isRotated) {
        const lines = [];
        const lineSpacing = 15;
        const margin = 5;

        // Определяме ефективната grain direction след rotation
        let effectiveGrain = grainDirection;
        if (isRotated) {
            effectiveGrain = grainDirection === 'horizontal' ? 'vertical' : 'horizontal';
        }

        if (effectiveGrain === 'horizontal') {
            // Хоризонтални линии
            for (let py = y + margin + lineSpacing; py < y + height - margin; py += lineSpacing) {
                lines.push(`
                    <line x1="${x + margin}" y1="${py}" 
                          x2="${x + width - margin}" y2="${py}"
                          stroke="rgba(0, 0, 0, 0.15)" stroke-width="0.5" stroke-dasharray="2,2"/>
                `);
            }
        } else if (effectiveGrain === 'vertical') {
            // Вертикални линии
            for (let px = x + margin + lineSpacing; px < x + width - margin; px += lineSpacing) {
                lines.push(`
                    <line x1="${px}" y1="${y + margin}" 
                          x2="${px}" y2="${y + height - margin}"
                          stroke="rgba(0, 0, 0, 0.15)" stroke-width="0.5" stroke-dasharray="2,2"/>
                `);
            }
        }

        return lines.join('');
    }

    static generateGrid(width, height, step) {
        let gridSVG = '';
        const gridColor = 'rgba(0, 0, 0, 0.1)';

        for (let x = step; x < width; x += step) {
            gridSVG += `<line x1="${x}" y1="0" x2="${x}" y2="${height}"
                          stroke="${gridColor}" stroke-width="0.5"/>`;
        }

        for (let y = step; y < height; y += step) {
            gridSVG += `<line x1="0" y1="${y}" x2="${width}" y2="${y}"
                          stroke="${gridColor}" stroke-width="0.5"/>`;
        }

        return gridSVG;
    }

    static getSheetBackground(materialType, grainDirection, showGrain) {
        if (!materialType) {
            return showGrain && grainDirection === 'horizontal' 
                ? 'url(#grain-horizontal)' 
                : (showGrain && grainDirection === 'vertical'
                    ? 'url(#grain-vertical)'
                    : '#f8f9fa');
        }

        // За материали с grain, показваме pattern
        if (showGrain && grainDirection && grainDirection !== 'any') {
            if (materialType.includes('Масив') || materialType.includes('ХДЛ') || materialType.includes('Фурнир')) {
                return grainDirection === 'horizontal' 
                    ? 'url(#wood-gradient-h)' 
                    : 'url(#wood-gradient-v)';
            }
        }

        const backgrounds = {
            'ПДЧ': '#f5f5dc',
            'МДФ': '#e8e8e8',
            'ХДЛ': '#d4a574',
            'Масив': '#8B4513'
        };

        for (const [key, value] of Object.entries(backgrounds)) {
            if (materialType.includes(key)) {
                return value;
            }
        }

        return '#f8f9fa';
    }

    static getColorForMaterial(material, grainAligned = true) {
        if (!material) return '#e9ecef';

        const materialLower = material.toLowerCase();
        
        // 🆕 По-тъмен цвят за grain violations
        const alpha = grainAligned ? '' : 'dd';
        
        const colors = {
            'пдч': ['#e9c46a' + alpha, '#f4a261' + alpha, '#e76f51' + alpha],
            'мдф': ['#2a9d8f' + alpha, '#219ebc' + alpha, '#126782' + alpha],
            'хдл': ['#588157' + alpha, '#3a5a40' + alpha, '#344e41' + alpha],
            'масив': ['#bc6c25' + alpha, '#dda15e' + alpha, '#fefae0' + alpha],
            'гръб': ['#a8dadc' + alpha, '#457b9d' + alpha, '#1d3557' + alpha],
            'стекло': ['#caf0f8' + alpha, '#90e0ef' + alpha, '#00b4d8' + alpha]
        };

        for (const [key, palette] of Object.entries(colors)) {
            if (materialLower.includes(key)) {
                return palette[Math.floor(Math.random() * palette.length)];
            }
        }

        return '#adb5bd' + alpha;
    }

    static truncateLabel(label, maxLength = 10) {
        if (label.length <= maxLength) return label;
        return label.substring(0, maxLength - 3) + '...';
    }

    // 🆕 ПОДОБРЕН REPORT С GRAIN ИНФОРМАЦИЯ
    static generateReport(engine, containerId) {
        const stats = engine.getStatistics();
        const results = engine.results;

        let report = `<div class="cutlist-report">`;

        // Заглавие
        report += `<h3>📊 Детайлен отчет за разкроване</h3>`;

        // Обща статистика
        report += `<div class="report-section">
                    <h4>Обща статистика:</h4>
                    <table class="report-table">
                        <tr><td>Общо детайли:</td><td>${stats.totalParts}</td></tr>
                        <tr><td>Поставени детайли:</td><td>${stats.placedParts} (${stats.placementRate})</td></tr>
                        <tr><td>Използвани листове:</td><td>${stats.totalSheets}</td></tr>
                        <tr><td>Ефективност на материала:</td><td>${stats.materialEfficiency}</td></tr>
                        <tr><td>Средна ефективност:</td><td>${stats.avgSheetEfficiency}</td></tr>
                        <tr class="${stats.grainViolations > 0 ? 'grain-warning' : 'grain-ok'}">
                            <td>🌾 Grain съответствие:</td>
                            <td>${stats.grainCompliance} ${stats.grainViolations > 0 ? '⚠ ' + stats.grainViolations + ' нарушения' : '✓'}</td>
                        </tr>
                        <tr><td>Приблизителна цена:</td><td>${stats.estimatedCost}</td></tr>
                    </table>
                   </div>`;

        // Детайли по листове
        report += `<div class="report-section">
                    <h4>Разпределение по листове:</h4>`;

        results.forEach((sheet, index) => {
            const sheetEfficiency = sheet.efficiency ? sheet.efficiency.toFixed(1) + '%' : '0%';
            const grainCompliance = sheet.grainCompliance ? sheet.grainCompliance.toFixed(1) + '%' : 'N/A';
            const usedArea = sheet.usedArea ? (sheet.usedArea / 1000000).toFixed(3) : '0';
            const sheetArea = (sheet.area / 1000000).toFixed(3);
            const grainViolationsInSheet = sheet.placedParts.filter(p => !p.grainAligned).length;

            report += `<div class="sheet-report">
                        <h5>Лист ${index + 1}: ${sheet.width} × ${sheet.height} mm (${sheet.materialType})
                            ${sheet.grainDirection && sheet.grainDirection !== 'any' ? ' - Grain: ' + sheet.grainDirection : ''}
                        </h5>
                        <table class="sheet-details">
                            <tr><td>Детайли:</td><td>${sheet.placedParts.length} бр.</td></tr>
                            <tr><td>Използвана площ:</td><td>${usedArea} m² (${sheetEfficiency})</td></tr>
                            <tr><td>Обща площ:</td><td>${sheetArea} m²</td></tr>
                            <tr><td>Цена на листа:</td><td>${sheet.cost.toFixed(2)} лв.</td></tr>
                            <tr class="${grainViolationsInSheet > 0 ? 'grain-warning' : ''}">
                                <td>🌾 Grain съответствие:</td>
                                <td>${grainCompliance} ${grainViolationsInSheet > 0 ? '⚠ ' + grainViolationsInSheet + ' нарушения' : '✓'}</td>
                            </tr>
                        </table>
                        
                        <div class="parts-list">
                            <h6>Детайли в листа:</h6>
                            <table class="parts-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Име</th>
                                        <th>Размер</th>
                                        <th>Позиция</th>
                                        <th>Статус</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            sheet.placedParts.forEach((part, pIndex) => {
                const rotatedIcon = part.rotated ? '🔄' : '';
                const grainIcon = part.grainAligned ? '✓' : '⚠';
                const grainClass = part.grainAligned ? '' : 'grain-violation-row';
                
                report += `<tr class="${grainClass}">
                            <td>${pIndex + 1}</td>
                            <td>${part.name}</td>
                            <td>${part.placedWidth}×${part.placedHeight}mm ${rotatedIcon}</td>
                            <td>(${part.x}, ${part.y})</td>
                            <td>${grainIcon} ${part.grainAligned ? 'OK' : 'Grain нарушение'}</td>
                          </tr>`;
            });

            report += `            </tbody>
                            </table>
                        </div>
                       </div>`;
        });

        report += `</div>`;

        // 🆕 Легенда
        report += `<div class="report-legend">
                    <h4>Легенда:</h4>
                    <ul>
                        <li>✓ - Grain direction съответства</li>
                        <li>⚠ - Grain direction нарушение (завъртан детайл)</li>
                        <li>🔄 - Завъртан детайл</li>
                        <li>→ - Хоризонтален grain</li>
                        <li>↑ - Вертикален grain</li>
                    </ul>
                   </div>`;

        report += `</div>`;

        document.getElementById(containerId).innerHTML = report;
        return report;
    }

    /**
     * 🆕 Генериране на cutting instructions
     */
    static generateCuttingInstructions(results) {
        let instructions = '<div class="cutting-instructions"><h3>📐 Инструкции за рязане</h3>';

        results.forEach((sheet, sheetIndex) => {
            instructions += `<div class="sheet-instructions">
                <h4>Лист ${sheetIndex + 1} (${sheet.materialType})</h4>
                <p><strong>Размер:</strong> ${sheet.width}×${sheet.height}mm</p>`;
            
            if (sheet.grainDirection && sheet.grainDirection !== 'any') {
                instructions += `<p class="grain-notice">⚠ <strong>Внимание:</strong> Grain direction е <strong>${sheet.grainDirection === 'horizontal' ? 'хоризонтален →' : 'вертикален ↑'}</strong></p>`;
            }

            instructions += '<ol class="cut-sequence">';

            // Сортираме по Y след това по X за по-лесно рязане
            const sortedParts = [...sheet.placedParts].sort((a, b) => {
                if (Math.abs(a.y - b.y) < 10) {
                    return a.x - b.x;
                }
                return a.y - b.y;
            });

            sortedParts.forEach((part, index) => {
                const rotatedNote = part.rotated ? ' <span class="rotated-indicator">(ЗАВЪРТАН 90°)</span>' : '';
                const grainNote = !part.grainAligned ? ' <span class="grain-warning-inline">⚠ Grain нарушение!</span>' : '';
                
                instructions += `<li>
                    <strong>${part.name}</strong>${rotatedNote}${grainNote}<br>
                    Размер: ${part.placedWidth}×${part.placedHeight}mm<br>
                    Позиция: X=${part.x}mm, Y=${part.y}mm
                </li>`;
            });

            instructions += '</ol></div>';
        });

        instructions += '</div>';
        return instructions;
    }
}
