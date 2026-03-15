/**
 * CutList Integration Init v2.0
 * 
 * Зарежда се в index.html като <script type="module" src="js/cutlist/cutlist-init.js">
 * Инициализира бутони, cutlist таб, inline оптимизация.
 */

import { CutListBridge } from './cutlist-bridge.js';
import { State } from '../state.js';
import { Calculator } from '../calculator.js';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000' : window.location.origin;

let lastCutListData = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔌 CutList integration v2.0 initializing...');

    // Бутон "Изпрати към разкрояване" в project таба
    const sendBtn = document.getElementById('sendToCutListBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', () => CutListBridge.sendToCutList());
    }

    // Бутон "Оптимизирай" в cutlist таба
    const optimizeBtn = document.getElementById('cutlistOptimizeBtn');
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', () => runInlineOptimization());
    }

    // Бутон "Отвори пълен оптимизатор"
    const openFullBtn = document.getElementById('cutlistOpenFullBtn');
    if (openFullBtn) {
        openFullBtn.addEventListener('click', () => CutListBridge.sendToCutList());
    }

    // Обновяване при смяна на таб
    document.querySelectorAll('.tab[data-tab="cutlist"]').forEach(tab => {
        tab.addEventListener('click', () => setTimeout(refreshCutListTab, 150));
    });

    console.log('✅ CutList integration ready');
});

// ═══════════════════════════════════════════════════════
// Обновяване на cutlist таба
// ═══════════════════════════════════════════════════════

function refreshCutListTab() {
    const project = window.State?.currentProject || [];
    const summaryEl = document.getElementById('cutlistProjectSummary');
    const settingsEl = document.getElementById('cutlistMaterialSettings');

    if (project.length === 0) {
        if (summaryEl) {
            summaryEl.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Добавете шкафове в проекта, за да видите обобщение тук.</p>';
        }
        if (settingsEl) settingsEl.style.display = 'none';
        return;
    }

    // Проверка за материали
    const validation = CutListBridge.validateMaterialSelection();
    if (!validation.valid) {
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border: 1px solid #ffc107;">
                    <h4 style="margin: 0 0 10px; color: #856404;">⚠️ Изберете материали</h4>
                    <p style="margin: 0 0 10px; color: #856404;">Преди разкрояване, моля изберете плочи в таб "Материали":</p>
                    <ul style="margin: 0; padding-left: 20px; color: #856404;">
                        ${validation.missing.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>`;
        }
        if (settingsEl) settingsEl.style.display = 'none';
        return;
    }

    const data = CutListBridge.extractCutListData(project);
    lastCutListData = data;

    if (summaryEl) summaryEl.innerHTML = renderSummary(data, project);
    if (settingsEl) {
        settingsEl.style.display = 'block';
        renderMaterialGroups(data);
    }
}

function renderSummary(data, project) {
    const partsByMaterial = {};
    let totalPieces = 0;

    data.parts.forEach(p => {
        if (!partsByMaterial[p.material]) partsByMaterial[p.material] = { count: 0, totalQty: 0, totalArea: 0 };
        partsByMaterial[p.material].count++;
        partsByMaterial[p.material].totalQty += p.quantity;
        partsByMaterial[p.material].totalArea += p.width * p.height * p.quantity;
        totalPieces += p.quantity;
    });

    let materialRows = '';
    for (const [mat, info] of Object.entries(partsByMaterial)) {
        const areaM2 = (info.totalArea / 1_000_000).toFixed(2);
        materialRows += `
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 4px;">
                <span style="font-weight: 600;">${mat}</span>
                <span style="color: #666;">${info.totalQty} парчета · ${areaM2} m²</span>
            </div>`;
    }

    let cabinetLegend = '';
    for (const [id, cab] of Object.entries(data.cabinetColors)) {
        cabinetLegend += `
            <span style="display: inline-flex; align-items: center; gap: 5px; margin-right: 12px; margin-bottom: 4px;">
                <span style="width: 14px; height: 14px; border-radius: 3px; background: ${cab.color}; display: inline-block;"></span>
                <span style="font-size: 0.85em;">${cab.name}</span>
            </span>`;
    }

    return `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                <div style="font-size: 2em; font-weight: 700;">${project.length}</div>
                <div style="font-size: 0.85em; opacity: 0.9;">Шкафове</div>
            </div>
            <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                <div style="font-size: 2em; font-weight: 700;">${data.parts.length}</div>
                <div style="font-size: 0.85em; opacity: 0.9;">Уникални детайли</div>
            </div>
            <div style="background: linear-gradient(135deg, #ff9800, #f44336); color: white; padding: 15px; border-radius: 10px; text-align: center;">
                <div style="font-size: 2em; font-weight: 700;">${totalPieces}</div>
                <div style="font-size: 0.85em; opacity: 0.9;">Общо парчета</div>
            </div>
        </div>
        <h4 style="margin: 15px 0 8px; color: #667eea;">📦 По материали:</h4>
        ${materialRows}
        <div style="margin-top: 12px;">
            <h4 style="margin: 0 0 8px; color: #667eea;">🎨 Легенда по шкафове:</h4>
            <div style="display: flex; flex-wrap: wrap;">${cabinetLegend}</div>
        </div>`;
}

function renderMaterialGroups(data) {
    const container = document.getElementById('cutlistMaterialGroups');
    if (!container) return;

    let html = '';
    data.sheets.forEach((sheet, idx) => {
        html += `
            <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <strong>${sheet.name}</strong>
                    <br><small style="color: #888;">${sheet.width}×${sheet.height}мм · ${sheet.thickness_mm}мм</small>
                </div>
                <div style="text-align: right;">
                    <input type="number" class="cutlist-sheet-cost" data-idx="${idx}" 
                           value="${sheet.cost}" min="0" step="0.5"
                           style="width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 6px; text-align: right;">
                    <span style="font-size: 0.85em; color: #888;"> лв.</span>
                </div>
            </div>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.cutlist-sheet-cost').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            if (lastCutListData?.sheets[idx]) lastCutListData.sheets[idx].cost = parseFloat(e.target.value) || 0;
        });
    });
}

// ═══════════════════════════════════════════════════════
// Inline оптимизация
// ═══════════════════════════════════════════════════════

async function runInlineOptimization() {
    if (!lastCutListData || lastCutListData.parts.length === 0) {
        alert('⚠️ Няма данни за оптимизация. Добавете шкафове и изберете материали.');
        return;
    }

    const optimizeBtn = document.getElementById('cutlistOptimizeBtn');
    const resultsEl = document.getElementById('cutlistResults');

    const settings = {
        saw_kerf_mm: parseFloat(document.getElementById('cutlistSawKerf')?.value) || 4,
        allow_rotation: document.getElementById('cutlistAllowRotation')?.checked ?? true,
        respect_grain: document.getElementById('cutlistRespectGrain')?.checked ?? true,
        min_usable_offcut_mm: parseFloat(document.getElementById('cutlistMinOffcut')?.value) || 100,
        min_waste_area_mm2: 10000,
        grain_penalty_factor: 0.5,
        multi_pass: document.getElementById('cutlistMultiPass')?.checked ?? true
    };

    if (optimizeBtn) { optimizeBtn.disabled = true; optimizeBtn.textContent = '⏳ Оптимизиране...'; }

    try {
        const response = await fetch(`${API_BASE}/api/v1/cutlist/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parts: lastCutListData.parts, sheets: lastCutListData.sheets, settings })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `HTTP ${response.status}`);
        }

        const result = await response.json();

        // Обновяваме бройките в Materials
        CutListBridge.updateMaterialQuantities(result);

        renderInlineResults(result);
        if (resultsEl) resultsEl.style.display = 'block';

        // Преизчисляваме тоталите в Ценообразуване
        if (window.Tables?.calculateTotals) window.Tables.calculateTotals();

    } catch (error) {
        console.error('CutList optimization error:', error);
        alert(`❌ Грешка при оптимизация: ${error.message}\n\nУверете се, че Python API сървърът работи.`);
    } finally {
        if (optimizeBtn) { optimizeBtn.disabled = false; optimizeBtn.textContent = '✂️ Оптимизирай разкрояването'; }
    }
}

function renderInlineResults(result) {
    const stats = result.statistics || {};
    const statsGrid = document.getElementById('cutlistStatsGrid');
    const vizContainer = document.getElementById('cutlistVisualization');
    const legendContainer = document.getElementById('cutlistCabinetLegend');

    if (statsGrid) {
        const grainBg = (stats.grain_violations || 0) > 0 ? '#f8d7da' : '#e8f5e9';
        statsGrid.innerHTML = `
            <div style="background: #f0f0f0; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: 700;">${stats.total_sheets || 0}</div>
                <div style="font-size: 0.8em; color: #888;">Листове</div>
            </div>
            <div style="background: #d4edda; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: 700; color: #155724;">${stats.efficiency_pct || 0}%</div>
                <div style="font-size: 0.8em; color: #155724;">Ефективност</div>
            </div>
            <div style="background: #fff3cd; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: 700; color: #856404;">${(stats.estimated_cost_bgn || 0).toFixed(2)} лв.</div>
                <div style="font-size: 0.8em; color: #856404;">Цена материали</div>
            </div>
            <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: 700; color: #2e7d32;">${stats.placed_parts || 0}/${stats.total_parts || 0}</div>
                <div style="font-size: 0.8em; color: #2e7d32;">Поставени</div>
            </div>
            <div style="background: ${grainBg}; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: 700;">${stats.grain_compliance_pct || 100}%</div>
                <div style="font-size: 0.8em;">Grain</div>
            </div>
            <div style="background: #f0f0f0; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: 700; color: #666;">${((stats.waste_area_mm2 || 0) / 1_000_000).toFixed(2)} m²</div>
                <div style="font-size: 0.8em; color: #888;">Отпадък</div>
            </div>`;
    }

    if (vizContainer && result.used_sheets) {
        let html = '';
        result.used_sheets.forEach((sheet, idx) => {
            html += `
                <div style="margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background: #f8f9fa; padding: 10px 15px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between;">
                        <strong>Лист ${idx + 1}: ${sheet.material} ${sheet.width}×${sheet.height}мм</strong>
                        <span style="color: #28a745; font-weight: 600;">${sheet.efficiency_pct}%</span>
                    </div>
                    <div style="padding: 10px;">
                        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                            ${sheet.placed_parts.map(p => {
                                const cabId = p.cabinet_id;
                                const cabColor = lastCutListData?.cabinetColors?.[cabId]?.color || '#4CAF50';
                                return `<span style="display: inline-block; padding: 4px 8px; background: ${cabColor}20; border-left: 3px solid ${cabColor}; border-radius: 4px; font-size: 0.82em;">
                                    ${p.name} <small style="color: #888;">${p.width}×${p.height}</small>
                                    ${p.rotated ? ' <span style="color: #ffc107;">↻</span>' : ''}
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                </div>`;
        });

        if (result.unplaced_parts?.length > 0) {
            html += `
                <div style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 8px; margin-top: 8px;">
                    <strong>⚠ Неразпределени (${result.unplaced_parts.length}):</strong>
                    ${result.unplaced_parts.map(p => `${p.name} ${p.width}×${p.height}`).join(', ')}
                </div>`;
        }

        html += '<div style="text-align: center; margin-top: 15px;"><p style="color: #888; font-size: 0.9em;">За пълна SVG визуализация натиснете "Отвори пълен оптимизатор"</p></div>';
        vizContainer.innerHTML = html;
    }

    if (legendContainer && lastCutListData?.cabinetColors) {
        let legend = '<h4 style="margin: 0 0 8px; color: #667eea;">🎨 Легенда:</h4><div style="display: flex; flex-wrap: wrap; gap: 8px;">';
        for (const [id, cab] of Object.entries(lastCutListData.cabinetColors)) {
            legend += `<span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; background: #f8f9fa; border-radius: 20px; font-size: 0.85em;">
                <span style="width: 12px; height: 12px; border-radius: 3px; background: ${cab.color};"></span>${cab.name}</span>`;
        }
        legend += '</div>';
        legendContainer.innerHTML = legend;
    }
}
