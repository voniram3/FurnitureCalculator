/**
 * CutList Tab Controller v1.0
 * 
 * Контролер за вградения таб "Разкрояване" в index.html.
 * Показва обобщение на панелите, настройки на материалите,
 * стартира оптимизация inline и визуализира резултатите.
 */

import { CutListBridge } from './cutlist-bridge.js';
import { State } from '../state.js';
import { Calculator } from '../calculator.js';

// Опит за import на визуализатора (може да не е наличен)
let CutListVisualizer = null;
try {
    const mod = await import('./visualizer-improved.js');
    CutListVisualizer = mod.CutListVisualizer;
} catch (e) {
    console.warn('CutListVisualizer not available for inline rendering');
}

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : window.location.origin;

export const CutListTab = {
    lastData: null,
    lastResult: null,

    // ═══════════════════════════════════════════════════════
    // ИНИЦИАЛИЗАЦИЯ
    // ═══════════════════════════════════════════════════════

    init() {
        this.bindEvents();
        console.log('✅ CutListTab initialized');
    },

    bindEvents() {
        // Бутон "Изпрати към разкрояване" в project таба
        const sendBtn = document.getElementById('sendToCutListBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                CutListBridge.sendToCutList();
            });
        }

        // Бутон "Оптимизирай" в cutlist таба
        const optimizeBtn = document.getElementById('cutlistOptimizeBtn');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => this.runOptimization());
        }

        // Бутон "Отвори пълен оптимизатор"
        const openFullBtn = document.getElementById('cutlistOpenFullBtn');
        if (openFullBtn) {
            openFullBtn.addEventListener('click', () => {
                CutListBridge.sendToCutList();
            });
        }

        // Слушаме за смяна на таб — обновяваме cutlist таба
        document.querySelectorAll('.tab[data-tab="cutlist"]').forEach(tab => {
            tab.addEventListener('click', () => {
                setTimeout(() => this.refresh(), 100);
            });
        });
    },

    // ═══════════════════════════════════════════════════════
    // ОБНОВЯВАНЕ НА СЪДЪРЖАНИЕ
    // ═══════════════════════════════════════════════════════

    refresh() {
        const project = State.currentProject;
        const summaryEl = document.getElementById('cutlistProjectSummary');
        const settingsEl = document.getElementById('cutlistMaterialSettings');
        const resultsEl = document.getElementById('cutlistResults');

        if (!project || project.length === 0) {
            if (summaryEl) {
                summaryEl.innerHTML = `
                    <p style="color: #888; text-align: center; padding: 20px;">
                        Добавете шкафове в проекта, за да видите обобщение тук.
                    </p>`;
            }
            if (settingsEl) settingsEl.style.display = 'none';
            if (resultsEl) resultsEl.style.display = 'none';
            return;
        }

        // Извличаме данните
        const data = CutListBridge.extractCutListData(project);
        this.lastData = data;

        // Обобщение
        if (summaryEl) {
            summaryEl.innerHTML = this._renderSummary(data, project);
        }

        // Показваме настройките
        if (settingsEl) {
            settingsEl.style.display = 'block';
            this._renderMaterialGroups(data);
        }
    },

    // ═══════════════════════════════════════════════════════
    // РЕНДЕРИРАНЕ НА ОБОБЩЕНИЕ
    // ═══════════════════════════════════════════════════════

    _renderSummary(data, project) {
        const partsByMaterial = {};
        let totalPieces = 0;

        data.parts.forEach(p => {
            if (!partsByMaterial[p.material]) {
                partsByMaterial[p.material] = { count: 0, totalQty: 0, totalArea: 0 };
            }
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

        // Цветова легенда на шкафовете
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
    },

    // ═══════════════════════════════════════════════════════
    // РЕНДЕРИРАНЕ НА МАТЕРИАЛНИ ГРУПИ
    // ═══════════════════════════════════════════════════════

    _renderMaterialGroups(data) {
        const container = document.getElementById('cutlistMaterialGroups');
        if (!container) return;

        let html = '';
        data.sheets.forEach((sheet, idx) => {
            html += `
                <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <strong>${sheet.name}</strong>
                        <br><small style="color: #888;">${sheet.width}×${sheet.height}мм · ${sheet.thickness_mm}мм · ${sheet.grain}</small>
                    </div>
                    <div style="text-align: right;">
                        <input type="number" class="sheet-cost-input" data-idx="${idx}" 
                               value="${sheet.cost}" min="0" step="0.5"
                               style="width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 6px; text-align: right;">
                        <span style="font-size: 0.85em; color: #888;"> лв./лист</span>
                    </div>
                </div>`;
        });

        container.innerHTML = html;

        // Bind cost change events
        container.querySelectorAll('.sheet-cost-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                const val = parseFloat(e.target.value) || 0;
                if (this.lastData && this.lastData.sheets[idx]) {
                    this.lastData.sheets[idx].cost = val;
                }
            });
        });
    },

    // ═══════════════════════════════════════════════════════
    // ОПТИМИЗАЦИЯ
    // ═══════════════════════════════════════════════════════

    async runOptimization() {
        if (!this.lastData || this.lastData.parts.length === 0) {
            alert('⚠️ Няма данни за оптимизация. Добавете шкафове в проекта.');
            return;
        }

        const optimizeBtn = document.getElementById('cutlistOptimizeBtn');
        const resultsEl = document.getElementById('cutlistResults');

        // Вземаме текущите настройки от UI
        const settings = {
            saw_kerf_mm: parseFloat(document.getElementById('cutlistSawKerf')?.value) || 4,
            allow_rotation: document.getElementById('cutlistAllowRotation')?.checked ?? true,
            respect_grain: document.getElementById('cutlistRespectGrain')?.checked ?? true,
            min_usable_offcut_mm: parseFloat(document.getElementById('cutlistMinOffcut')?.value) || 100,
            min_waste_area_mm2: 10000,
            grain_penalty_factor: 0.5,
            multi_pass: document.getElementById('cutlistMultiPass')?.checked ?? true
        };

        const payload = {
            parts: this.lastData.parts,
            sheets: this.lastData.sheets,
            settings: settings
        };

        // Loading state
        if (optimizeBtn) {
            optimizeBtn.disabled = true;
            optimizeBtn.textContent = '⏳ Оптимизиране...';
        }

        try {
            const response = await fetch(`${API_BASE}/api/v1/cutlist/optimize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `HTTP ${response.status}`);
            }

            const result = await response.json();
            this.lastResult = result;

            this._renderResults(result);

            if (resultsEl) resultsEl.style.display = 'block';

        } catch (error) {
            console.error('CutList optimization error:', error);
            alert(`❌ Грешка при оптимизация: ${error.message}\n\nУверете се, че Python API сървърът работи.`);
        } finally {
            if (optimizeBtn) {
                optimizeBtn.disabled = false;
                optimizeBtn.textContent = '✂️ Оптимизирай разкрояването';
            }
        }
    },

    // ═══════════════════════════════════════════════════════
    // РЕНДЕРИРАНЕ НА РЕЗУЛТАТИ
    // ═══════════════════════════════════════════════════════

    _renderResults(result) {
        const stats = result.statistics || {};
        const statsGrid = document.getElementById('cutlistStatsGrid');
        const vizContainer = document.getElementById('cutlistVisualization');
        const legendContainer = document.getElementById('cutlistCabinetLegend');

        // Статистика
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div style="background: #f0f0f0; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: 700; color: #333;">${stats.total_sheets || 0}</div>
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
                <div style="background: #${(stats.grain_violations || 0) > 0 ? 'f8d7da' : 'e8f5e9'}; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: 700;">${stats.grain_compliance_pct || 100}%</div>
                    <div style="font-size: 0.8em;">Grain</div>
                </div>
                <div style="background: #f0f0f0; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: 700; color: #666;">${((stats.waste_area_mm2 || 0) / 1_000_000).toFixed(2)} m²</div>
                    <div style="font-size: 0.8em; color: #888;">Отпадък</div>
                </div>`;
        }

        // Визуализация на листовете
        if (vizContainer && result.visualizer_data) {
            let vizHtml = '';

            result.visualizer_data.forEach((sheet, idx) => {
                vizHtml += `
                    <div style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background: #f8f9fa; padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                            <strong>Лист ${idx + 1}:</strong> ${sheet.materialType} 
                            (${sheet.width}×${sheet.height}мм) — ${sheet.efficiency}% ефективност
                        </div>
                        <div id="cutlistSheetViz${idx}" style="padding: 10px; overflow-x: auto;"></div>
                    </div>`;
            });

            // Неразпределени парчета
            if (result.unplaced_parts?.length > 0) {
                vizHtml += `
                    <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <strong>⚠ Неразпределени парчета (${result.unplaced_parts.length}):</strong>
                        <ul style="margin: 10px 0 0;">${result.unplaced_parts.map(p => 
                            `<li>${p.name} — ${p.width}×${p.height}мм (${p.material})</li>`
                        ).join('')}</ul>
                    </div>`;
            }

            vizContainer.innerHTML = vizHtml;

            // Рендериране на SVG визуализации
            if (CutListVisualizer) {
                result.visualizer_data.forEach((sheet, idx) => {
                    const el = document.getElementById(`cutlistSheetViz${idx}`);
                    if (el) {
                        try {
                            // Добавяме цветове по cabinet_id
                            const coloredSheet = this._addCabinetColors(sheet);
                            el.innerHTML = CutListVisualizer.generateSVG(coloredSheet, {
                                scale: 0.2,
                                showLabels: true,
                                showGrid: false,
                                showDimensions: true,
                                showGrain: true,
                                showGrainViolations: true
                            });
                        } catch (e) {
                            el.innerHTML = `<p style="color: #dc3545;">Грешка при визуализация: ${e.message}</p>`;
                        }
                    }
                });
            }
        }

        // Цветова легенда по шкафове
        if (legendContainer && this.lastData?.cabinetColors) {
            let legend = '<h4 style="margin: 0 0 8px; color: #667eea;">🎨 Легенда:</h4><div style="display: flex; flex-wrap: wrap; gap: 8px;">';
            for (const [id, cab] of Object.entries(this.lastData.cabinetColors)) {
                legend += `
                    <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; background: #f8f9fa; border-radius: 20px; font-size: 0.85em;">
                        <span style="width: 12px; height: 12px; border-radius: 3px; background: ${cab.color};"></span>
                        ${cab.name}
                    </span>`;
            }
            legend += '</div>';
            legendContainer.innerHTML = legend;
        }
    },

    /**
     * Добавя цветове по cabinet_id към visualizer данните.
     */
    _addCabinetColors(sheet) {
        if (!this.lastData?.cabinetColors || !sheet.placedParts) return sheet;

        const colored = { ...sheet };
        colored.placedParts = sheet.placedParts.map(part => {
            const cabInfo = Object.entries(this.lastData.cabinetColors)
                .find(([id]) => part.name?.includes(this.lastData.cabinetColors[id]?.name));
            
            // Намираме cabinet_id от original parts
            const originalPart = this.lastData.parts.find(p => part.name?.includes(p.name?.split(' (')[0]));
            const cabColor = originalPart?.cabinet_id 
                ? this.lastData.cabinetColors[originalPart.cabinet_id]?.color 
                : null;

            return {
                ...part,
                cabinetColor: cabColor || '#4CAF50'
            };
        });

        return colored;
    }
};

// Глобален достъп
window.CutListTab = CutListTab;
