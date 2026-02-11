export class CutListVisualizer {
    static generateSVG(sheetData, options = {}) {
        const { width, height, placedParts, materialType, grainDirection } = sheetData;
        const {
            scale = 0.3,
            showLabels = true,
            showGrid = true,
            showDimensions = true,
            showGrain = true,
            showGrainViolations = true
        } = options;

        const svgWidth = width * scale;
        const svgHeight = height * scale;

        let svg = `<svg width="${svgWidth}" height="${svgHeight}"
                        viewBox="0 0 ${width} ${height}"
                        xmlns="http://www.w3.org/2000/svg"
                        class="cutlist-svg">`;

        svg += this.generateSVGDefinitions();

        // Фон на листа
        svg += `<rect x="0" y="0" width="${width}" height="${height}"
                     fill="${this.getSheetBackground(materialType, grainDirection, showGrain)}"
                     stroke="#495057" stroke-width="3"/>`;

        if (showGrain && grainDirection && grainDirection !== 'any') {
            svg += this.generateSheetGrainIndicator(width, height, grainDirection);
        }

        if (showGrid) {
            svg += this.generateGrid(width, height, 100);
        }

        if (placedParts && placedParts.length > 0) {
            placedParts.forEach((part, index) => {
                const partWidth = part.placedWidth || part.width || 100;
                const partHeight = part.placedHeight || part.height || 100;
                const color = this.getColorForMaterial(part.material, part.grainAligned);
                const isRotated = part.rotated || false;
                const grainAligned = part.grainAligned !== false;

                const strokeColor = !grainAligned && showGrainViolations ? '#dc3545' : '#212529';
                const strokeWidth = !grainAligned && showGrainViolations ? 3 : 2;

                svg += `<rect x="${part.x}" y="${part.y}"
                             width="${partWidth}" height="${partHeight}"
                             fill="${color}" fill-opacity="0.8"
                             stroke="${strokeColor}" stroke-width="${strokeWidth}"
                             class="cutlist-part ${!grainAligned ? 'grain-violation' : ''}"
                             data-index="${index}"
                             data-rotated="${isRotated}"
                             data-grain-aligned="${grainAligned}"/>`;

                const grainStatus = grainAligned ? '✓ Grain OK' : '⚠ Grain нарушение';
                svg += `<title>${part.name} | ${partWidth}×${partHeight}mm${isRotated ? ' (завъртан)' : ''}
${part.grainDirection ? 'Grain: ' + part.grainDirection : ''}
${grainStatus}</title>`;

                if (showGrain && part.grainDirection && part.grainDirection !== 'any') {
                    svg += this.generatePartGrainLines(
                        part.x, part.y, partWidth, partHeight,
                        part.grainDirection, isRotated
                    );
                }

                if (isRotated) {
                    svg += `<path d="M${part.x + 10},${part.y + 10} 
                                   L${part.x + 30},${part.y + 10} 
                                   L${part.x + 10},${part.y + 30} Z"
                             fill="#ffc107" fill-opacity="0.9"/>`;
                }

                if (!grainAligned && showGrainViolations) {
                    svg += `<text x="${part.x + partWidth - 25}" y="${part.y + 25}"
                               font-size="20" fill="#dc3545" font-weight="bold">⚠</text>`;
                }

                if (showLabels && partWidth > 80 && partHeight > 40) {
                    const label = this.truncateLabel(part.name, 12);
                    if (showDimensions) {
                        svg += `<text x="${part.x + partWidth/2}" y="${part.y - 5}"
                                   text-anchor="middle" font-size="10" fill="#495057" font-weight="bold">
                                ${partWidth}mm
                              </text>`;
                        svg += `<text x="${part.x - 5}" y="${part.y + partHeight/2}"
                                   text-anchor="end" font-size="10" fill="#495057" font-weight="bold"
                                   transform="rotate(-90, ${part.x - 5}, ${part.y + partHeight/2})">
                                ${partHeight}mm
                              </text>`;
                    }
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

        if (showDimensions) {
            svg += `<text x="${width/2}" y="${height + 25}"
                       text-anchor="middle" font-size="14" fill="#495057" font-weight="bold">
                    ${width} × ${height} mm
                  </text>`;
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

    static generateSVGDefinitions() {
        return `
        <defs>
            <pattern id="grain-horizontal" x="0" y="0" width="20" height="4" patternUnits="userSpaceOnUse">
                <line x1="0" y1="2" x2="20" y2="2" stroke="rgba(139,69,19,0.2)" stroke-width="1"/>
            </pattern>
            <pattern id="grain-vertical" x="0" y="0" width="4" height="20" patternUnits="userSpaceOnUse">
                <line x1="2" y1="0" x2="2" y2="20" stroke="rgba(139,69,19,0.2)" stroke-width="1"/>
            </pattern>
            <linearGradient id="wood-gradient-h" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#d4a574"/>
                <stop offset="50%" stop-color="#c19a6b"/>
                <stop offset="100%" stop-color="#d4a574"/>
            </linearGradient>
            <linearGradient id="wood-gradient-v" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#d4a574"/>
                <stop offset="50%" stop-color="#c19a6b"/>
                <stop offset="100%" stop-color="#d4a574"/>
            </linearGradient>
        </defs>`;
    }

    static generateSheetGrainIndicator(width, height, grainDirection) {
        let arrows = '';
        const arrowSize = 30;
        const spacing = 200;
        if (grainDirection === 'horizontal') {
            for (let y = spacing; y < height; y += spacing) {
                for (let x = spacing/2; x < width - spacing; x += spacing) {
                    arrows += `<path d="M${x},${y} L${x+arrowSize},${y} 
                                     M${x+arrowSize-8},${y-6} L${x+arrowSize},${y} L${x+arrowSize-8},${y+6}"
                              stroke="rgba(102,126,234,0.3)" stroke-width="2" fill="none"/>`;
                }
            }
        } else if (grainDirection === 'vertical') {
            for (let x = spacing; x < width; x += spacing) {
                for (let y = spacing/2; y < height - spacing; y += spacing) {
                    arrows += `<path d="M${x},${y} L${x},${y+arrowSize}
                                     M${x-6},${y+arrowSize-8} L${x},${y+arrowSize} L${x+6},${y+arrowSize-8}"
                              stroke="rgba(102,126,234,0.3)" stroke-width="2" fill="none"/>`;
                }
            }
        }
        return arrows;
    }

    static generatePartGrainLines(x, y, width, height, grainDirection, isRotated) {
        let lines = '';
        const lineSpacing = 15;
        const margin = 5;
        let effectiveGrain = grainDirection;
        if (isRotated) {
            effectiveGrain = grainDirection === 'horizontal' ? 'vertical' : 'horizontal';
        }
        if (effectiveGrain === 'horizontal') {
            for (let py = y + margin + lineSpacing; py < y + height - margin; py += lineSpacing) {
                lines += `<line x1="${x+margin}" y1="${py}" x2="${x+width-margin}" y2="${py}"
                           stroke="rgba(0,0,0,0.15)" stroke-width="0.5" stroke-dasharray="2,2"/>`;
            }
        } else if (effectiveGrain === 'vertical') {
            for (let px = x + margin + lineSpacing; px < x + width - margin; px += lineSpacing) {
                lines += `<line x1="${px}" y1="${y+margin}" x2="${px}" y2="${y+height-margin}"
                           stroke="rgba(0,0,0,0.15)" stroke-width="0.5" stroke-dasharray="2,2"/>`;
            }
        }
        return lines;
    }

    static generateGrid(width, height, step) {
        let grid = '';
        const color = 'rgba(0,0,0,0.1)';
        for (let x = step; x < width; x += step) {
            grid += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${color}" stroke-width="0.5"/>`;
        }
        for (let y = step; y < height; y += step) {
            grid += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${color}" stroke-width="0.5"/>`;
        }
        return grid;
    }

    static getSheetBackground(materialType, grainDirection, showGrain) {
        if (!materialType) {
            if (showGrain && grainDirection === 'horizontal') return 'url(#grain-horizontal)';
            if (showGrain && grainDirection === 'vertical') return 'url(#grain-vertical)';
            return '#f8f9fa';
        }
        if (showGrain && grainDirection && grainDirection !== 'any') {
            if (materialType.includes('Масив') || materialType.includes('ХДЛ') || materialType.includes('Фурнир')) {
                return grainDirection === 'horizontal' ? 'url(#wood-gradient-h)' : 'url(#wood-gradient-v)';
            }
        }
        const backgrounds = {
            'ПДЧ': '#f5f5dc',
            'МДФ': '#e8e8e8',
            'ХДЛ': '#d4a574',
            'Масив': '#8B4513'
        };
        for (const [key, value] of Object.entries(backgrounds)) {
            if (materialType.includes(key)) return value;
        }
        return '#f8f9fa';
    }

    static getColorForMaterial(material, grainAligned = true) {
        if (!material) return '#e9ecef';
        const alpha = grainAligned ? '' : 'dd';
        const colors = {
            'пдч': ['#e9c46a' + alpha, '#f4a261' + alpha, '#e76f51' + alpha],
            'мдф': ['#2a9d8f' + alpha, '#219ebc' + alpha, '#126782' + alpha],
            'хдл': ['#588157' + alpha, '#3a5a40' + alpha, '#344e41' + alpha],
            'масив': ['#bc6c25' + alpha, '#dda15e' + alpha, '#fefae0' + alpha],
            'гръб': ['#a8dadc' + alpha, '#457b9d' + alpha, '#1d3557' + alpha],
            'стекло': ['#caf0f8' + alpha, '#90e0ef' + alpha, '#00b4d8' + alpha]
        };
        const lower = material.toLowerCase();
        for (const [key, palette] of Object.entries(colors)) {
            if (lower.includes(key)) return palette[Math.floor(Math.random() * palette.length)];
        }
        return '#adb5bd' + alpha;
    }

    static truncateLabel(label, maxLength = 10) {
        return label.length <= maxLength ? label : label.substring(0, maxLength - 3) + '...';
    }

    static generateReport(engine, containerId) {
        const stats = engine.getStatistics();
        const results = engine.results;
        let report = `<div class="cutlist-report">`;
        report += `<h3>📊 Детайлен отчет за разкрояване</h3>`;
        report += `<div class="report-section"><h4>Обща статистика:</h4><table class="report-table">`;
        report += `<tr><td>Общо детайли:</td><td>${stats.totalParts}</td></tr>`;
        report += `<tr><td>Поставени детайли:</td><td>${stats.placedParts} (${stats.placementRate})</td></tr>`;
        report += `<tr><td>Използвани листове:</td><td>${stats.totalSheets}</td></tr>`;
        report += `<tr><td>Ефективност на материала:</td><td>${stats.materialEfficiency}</td></tr>`;
        report += `<tr><td>Средна ефективност:</td><td>${stats.avgSheetEfficiency}</td></tr>`;
        report += `<tr class="${stats.grainViolations > 0 ? 'grain-warning' : 'grain-ok'}">`;
        report += `<td>🌾 Grain съответствие:</td><td>${stats.grainCompliance} ${stats.grainViolations > 0 ? '⚠ ' + stats.grainViolations + ' нарушения' : '✓'}</td></tr>`;
        report += `<tr><td>Приблизителна цена:</td><td>${stats.estimatedCost}</td></tr>`;
        report += `</table></div>`;

        report += `<div class="report-section"><h4>Разпределение по листове:</h4>`;
        results.forEach((sheet, index) => {
            const sheetEfficiency = sheet.efficiency ? sheet.efficiency.toFixed(1) + '%' : '0%';
            const grainCompliance = sheet.grainCompliance ? sheet.grainCompliance.toFixed(1) + '%' : 'N/A';
            const usedArea = (sheet.usedArea / 1000000).toFixed(3);
            const sheetArea = (sheet.area / 1000000).toFixed(3);
            const grainViolationsInSheet = sheet.placedParts.filter(p => !p.grainAligned).length;
            report += `<div class="sheet-report">`;
            report += `<h5>Лист ${index + 1}: ${sheet.width} × ${sheet.height} mm (${sheet.materialType})`;
            if (sheet.grainDirection && sheet.grainDirection !== 'any') {
                report += ` - Grain: ${sheet.grainDirection === 'horizontal' ? '→' : '↑'}`;
            }
            report += `</h5>`;
            report += `<table class="sheet-details">`;
            report += `<tr><td>Детайли:</td><td>${sheet.placedParts.length} бр.</td></tr>`;
            report += `<tr><td>Използвана площ:</td><td>${usedArea} m² (${sheetEfficiency})</td></tr>`;
            report += `<tr><td>Обща площ:</td><td>${sheetArea} m²</td></tr>`;
            report += `<tr><td>Цена на листа:</td><td>${sheet.cost.toFixed(2)} лв.</td></tr>`;
            report += `<tr class="${grainViolationsInSheet > 0 ? 'grain-warning' : ''}">`;
            report += `<td>🌾 Grain съответствие:</td><td>${grainCompliance} ${grainViolationsInSheet > 0 ? '⚠ ' + grainViolationsInSheet + ' нарушения' : '✓'}</td></tr>`;
            report += `</table>`;

            if (sheet.placedParts.length > 0) {
                report += `<div class="parts-list"><h6>Детайли в листа:</h6><table class="parts-table">`;
                report += `<thead><tr><th>#</th><th>Име</th><th>Размер</th><th>Позиция</th><th>Статус</th></tr></thead><tbody>`;
                sheet.placedParts.forEach((part, pIndex) => {
                    const rotatedIcon = part.rotated ? '🔄' : '';
                    const grainIcon = part.grainAligned ? '✓' : '⚠';
                    const grainClass = part.grainAligned ? '' : 'grain-violation-row';
                    report += `<tr class="${grainClass}">`;
                    report += `<td>${pIndex + 1}</td>`;
                    report += `<td>${part.name}</td>`;
                    report += `<td>${part.placedWidth}×${part.placedHeight}mm ${rotatedIcon}</td>`;
                    report += `<td>(${part.x}, ${part.y})</td>`;
                    report += `<td>${grainIcon} ${part.grainAligned ? 'OK' : 'Grain нарушение'}</td>`;
                    report += `</tr>`;
                });
                report += `</tbody></table></div>`;
            }
            report += `</div>`;
        });
        report += `</div>`;

        report += `<div class="report-legend"><h4>Легенда:</h4><ul>`;
        report += `<li>✓ - Grain direction съответства</li>`;
        report += `<li>⚠ - Grain direction нарушение (завъртан детайл)</li>`;
        report += `<li>🔄 - Завъртан детайл</li>`;
        report += `<li>→ - Хоризонтален grain</li>`;
        report += `<li>↑ - Вертикален grain</li>`;
        report += `</ul></div></div>`;

        document.getElementById(containerId).innerHTML = report;
        return report;
    }

    static generateCuttingInstructions(results) {
        let instructions = '<div class="cutting-instructions"><h3>📐 Инструкции за рязане</h3>';
        results.forEach((sheet, sheetIndex) => {
            instructions += `<div class="sheet-instructions">`;
            instructions += `<h4>Лист ${sheetIndex + 1} (${sheet.materialType})</h4>`;
            instructions += `<p><strong>Размер:</strong> ${sheet.width}×${sheet.height}mm</p>`;
            if (sheet.grainDirection && sheet.grainDirection !== 'any') {
                instructions += `<p class="grain-notice">⚠ <strong>Внимание:</strong> Grain direction е <strong>${sheet.grainDirection === 'horizontal' ? 'хоризонтален →' : 'вертикален ↑'}</strong></p>`;
            }
            instructions += '<ol class="cut-sequence">';
            const sortedParts = [...sheet.placedParts].sort((a, b) => {
                if (Math.abs(a.y - b.y) < 10) return a.x - b.x;
                return a.y - b.y;
            });
            sortedParts.forEach((part) => {
                const rotatedNote = part.rotated ? ' <span class="rotated-indicator">(ЗАВЪРТАН 90°)</span>' : '';
                const grainNote = !part.grainAligned ? ' <span class="grain-warning-inline">⚠ Grain нарушение!</span>' : '';
                instructions += `<li>`;
                instructions += `<strong>${part.name}</strong>${rotatedNote}${grainNote}<br>`;
                instructions += `Размер: ${part.placedWidth}×${part.placedHeight}mm<br>`;
                instructions += `Позиция: X=${part.x}mm, Y=${part.y}mm`;
                instructions += `</li>`;
            });
            instructions += '</ol></div>';
        });
        instructions += '</div>';
        return instructions;
    }
}