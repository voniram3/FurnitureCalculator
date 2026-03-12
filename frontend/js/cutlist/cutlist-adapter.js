/**
 * CutList API Client & Visualizer Adapter
 * 
 * Свързва Python backend cutlist engine с frontend CutListVisualizer.
 * 
 * Workflow:
 * 1. Frontend събира парчета и листове от UI
 * 2. cutlistApi.optimize() изпраща към /api/v1/cutlist/optimize
 * 3. Отговорът включва visualizer_data — директно подаване към CutListVisualizer.generateSVG()
 * 4. renderResults() рендира SVG + report за всеки лист
 */

import { CutListVisualizer } from './visualizer-improved.js';

// ─────────────── API Configuration ───────────────

const API_BASE = '/api/v1/cutlist';

// ─────────────── API Client ───────────────

export const cutlistApi = {

    /**
     * Оптимизиране на разкрояване.
     * @param {Object[]} parts - Списък от парчета
     * @param {Object[]} sheets - Шаблони на листове
     * @param {Object} settings - Настройки (опционално)
     * @returns {Promise<Object>} - Резултат от оптимизацията
     */
    async optimize(parts, sheets, settings = {}) {
        const payload = {
            parts: parts.map(p => ({
                name: p.name,
                width: parseInt(p.width),
                height: parseInt(p.height),
                material: p.material || 'ПДЧ 18мм',
                grain: p.grainDirection || p.grain || 'none',
                allow_rotation: p.allowRotation !== false,
                priority: p.priority || 5,
                quantity: p.quantity || 1,
                edge_banding: p.edgeBanding || p.edge_banding || {
                    top: false, bottom: false, left: false, right: false
                },
                cabinet_id: p.cabinetId || p.cabinet_id || ''
            })),
            sheets: sheets.map(s => ({
                name: s.name,
                width: parseInt(s.width),
                height: parseInt(s.height),
                material: s.materialType || s.material || 'ПДЧ 18мм',
                grain: s.grainDirection || s.grain || 'none',
                cost: parseFloat(s.cost) || 0,
                thickness_mm: parseFloat(s.thickness_mm || s.thickness) || 18
            })),
            settings: {
                saw_kerf_mm: settings.cuttingBladeWidth || settings.saw_kerf_mm || 4,
                allow_rotation: settings.allowRotation !== false,
                respect_grain: settings.respectGrainDirection !== false,
                min_usable_offcut_mm: settings.minUsableOffcut || 100,
                min_waste_area_mm2: settings.minWasteArea || 10000,
                grain_penalty_factor: settings.grainPenaltyFactor || 0.5,
                multi_pass: settings.multiPass !== false
            }
        };

        const response = await fetch(`${API_BASE}/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `API error: ${response.status}`);
        }

        return response.json();
    },

    /**
     * Валидиране на входни данни (бърза проверка без оптимизация).
     */
    async validate(parts, sheets) {
        const payload = {
            parts: parts.map(p => ({
                name: p.name,
                width: parseInt(p.width),
                height: parseInt(p.height),
                material: p.material || 'ПДЧ 18мм',
                grain: p.grainDirection || 'none',
                quantity: p.quantity || 1,
            })),
            sheets: sheets.map(s => ({
                name: s.name,
                width: parseInt(s.width),
                height: parseInt(s.height),
                material: s.materialType || s.material || 'ПДЧ 18мм',
                grain: s.grainDirection || 'none',
                cost: 0
            })),
            settings: {}
        };

        const response = await fetch(`${API_BASE}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return response.json();
    },

    /**
     * Вземи настройки по подразбиране.
     */
    async getDefaults() {
        const response = await fetch(`${API_BASE}/defaults`);
        return response.json();
    }
};


// ─────────────── Visualizer Adapter ───────────────

/**
 * Адаптира отговора от Python API към формата на CutListVisualizer.
 * Всъщност Python engine-ът вече връща visualizer_data в правилния формат,
 * но тази функция служи като safety net и добавя допълнителна логика.
 */
export function adaptForVisualizer(apiResponse) {
    // visualizer_data идва директно от backend-а в правилния формат
    if (apiResponse.visualizer_data && apiResponse.visualizer_data.length > 0) {
        return apiResponse.visualizer_data;
    }

    // Fallback: ръчно конвертираме от used_sheets
    return apiResponse.used_sheets.map(sheet => ({
        width: sheet.width,
        height: sheet.height,
        materialType: sheet.material,
        grainDirection: sheet.grain,
        area: sheet.total_area,
        usedArea: sheet.used_area,
        efficiency: sheet.efficiency_pct,
        cost: sheet.cost,
        placedParts: sheet.placed_parts.map(p => ({
            name: p.name,
            x: p.x,
            y: p.y,
            placedWidth: p.width,
            placedHeight: p.height,
            width: p.width,
            height: p.height,
            rotated: p.rotated,
            grainAligned: p.grain_aligned,
            grainDirection: sheet.grain,
            material: p.material
        }))
    }));
}


// ─────────────── Render Functions ───────────────

/**
 * Рендира всички листове от оптимизацията.
 * @param {Object} apiResponse - Отговор от /api/v1/cutlist/optimize
 * @param {string} containerId - ID на HTML контейнера
 * @param {Object} options - Опции за визуализатора
 */
export function renderResults(apiResponse, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} not found`);
        return;
    }

    const sheetsData = adaptForVisualizer(apiResponse);
    const stats = apiResponse.statistics;

    // Статистика
    let html = `<div class="cutlist-results">`;
    html += renderStatistics(stats);

    // Неразпределени парчета (ако има)
    if (apiResponse.unplaced_parts && apiResponse.unplaced_parts.length > 0) {
        html += renderUnplacedParts(apiResponse.unplaced_parts);
    }

    // Листове с SVG визуализация
    sheetsData.forEach((sheetData, index) => {
        const svgOptions = {
            scale: options.scale || 0.25,
            showLabels: options.showLabels !== false,
            showGrid: options.showGrid !== false,
            showDimensions: options.showDimensions !== false,
            showGrain: options.showGrain !== false,
            showGrainViolations: options.showGrainViolations !== false,
            ...options
        };

        const svg = CutListVisualizer.generateSVG(sheetData, svgOptions);
        const efficiency = sheetData.efficiency || 0;
        const partsCount = sheetData.placedParts?.length || 0;

        html += `
            <div class="sheet-result" data-sheet-index="${index}">
                <div class="sheet-header">
                    <h4>Лист ${index + 1}: ${sheetData.materialType}</h4>
                    <span class="sheet-info">
                        ${sheetData.width}×${sheetData.height}mm | 
                        ${partsCount} детайла | 
                        ${efficiency}% ефективност |
                        ${(sheetData.cost || 0).toFixed(2)} лв.
                    </span>
                </div>
                <div class="sheet-svg-container">
                    ${svg}
                </div>
            </div>
        `;
    });

    // Reusable offcuts
    if (apiResponse.reusable_offcuts && apiResponse.reusable_offcuts.length > 0) {
        html += renderOffcuts(apiResponse.reusable_offcuts);
    }

    html += `</div>`;
    container.innerHTML = html;
}


function renderStatistics(stats) {
    const grainClass = stats.grain_violations > 0 ? 'grain-warning' : 'grain-ok';
    return `
        <div class="cutlist-statistics">
            <h3>📊 Резултат от оптимизацията</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${stats.total_sheets}</span>
                    <span class="stat-label">Листа</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.placed_parts}/${stats.total_parts}</span>
                    <span class="stat-label">Поставени</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.efficiency_pct}%</span>
                    <span class="stat-label">Ефективност</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.estimated_cost_bgn.toFixed(2)} лв.</span>
                    <span class="stat-label">Цена материали</span>
                </div>
                <div class="stat-item ${grainClass}">
                    <span class="stat-value">${stats.grain_compliance_pct}%</span>
                    <span class="stat-label">Grain ${stats.grain_violations > 0 ? '⚠' : '✓'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${(stats.waste_area_mm2 / 1000000).toFixed(2)} m²</span>
                    <span class="stat-label">Отпадък</span>
                </div>
            </div>
        </div>
    `;
}


function renderUnplacedParts(parts) {
    let html = `
        <div class="unplaced-warning">
            <h4>⚠ Неразпределени парчета (${parts.length})</h4>
            <ul>`;
    parts.forEach(p => {
        html += `<li>${p.name} — ${p.width}×${p.height}mm (${p.material})</li>`;
    });
    html += `</ul></div>`;
    return html;
}


function renderOffcuts(offcuts) {
    let html = `
        <div class="reusable-offcuts">
            <h4>♻ Използваеми остатъци (${offcuts.length})</h4>
            <table class="offcuts-table">
                <thead><tr><th>Размер</th><th>Материал</th><th>От лист</th></tr></thead>
                <tbody>`;
    offcuts.forEach(o => {
        html += `<tr>
            <td>${o.width}×${o.height}mm</td>
            <td>${o.material}</td>
            <td>#${o.source_sheet_index + 1}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
}


// ─────────────── Convenience: Full workflow ───────────────

/**
 * Пълен workflow: optimize → render.
 * Удобно за извикване от UI бутон.
 * 
 * @example
 * import { runCutlistOptimization } from './cutlist-adapter.js';
 * 
 * document.getElementById('optimizeBtn').addEventListener('click', async () => {
 *     await runCutlistOptimization(myParts, mySheets, 'results-container', {
 *         saw_kerf_mm: 4,
 *         multiPass: true
 *     });
 * });
 */
export async function runCutlistOptimization(parts, sheets, containerId, settings = {}) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading">⏳ Оптимизация...</div>';
    }

    try {
        const result = await cutlistApi.optimize(parts, sheets, settings);
        renderResults(result, containerId);
        return result;
    } catch (error) {
        if (container) {
            container.innerHTML = `
                <div class="error">
                    <h4>❌ Грешка при оптимизация</h4>
                    <p>${error.message}</p>
                </div>`;
        }
        throw error;
    }
}
