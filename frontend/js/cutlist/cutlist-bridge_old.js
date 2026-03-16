/**
 * CutList Bridge Module v2.0
 * 
 * Мост между Cabinet Engine и CutList Optimizer.
 * - Чете избраните материали от Materials.selectedMaterials
 * - Трансформира панели в cutlist формат с правилни материали по група
 * - Валидира избора на материали преди изпращане
 * - Обратна връзка: обновява бройки плоскости в Materials
 * - Background оптимизация за Авто изчисление
 */

import { Calculator } from '../calculator.js';
import { State } from '../state.js';

// ═══════════════════════════════════════════════════════
// Стандартни размери на листове (fallback)
// ═══════════════════════════════════════════════════════
const STANDARD_SHEETS = {
    'ПДЧ 18мм': { width: 2800, height: 2070, cost: 45.00, grain: 'none', thickness_mm: 18 },
    'ПДЧ 36мм': { width: 2800, height: 2070, cost: 85.00, grain: 'none', thickness_mm: 36 },
    'МДФ 18мм': { width: 2800, height: 2070, cost: 55.00, grain: 'none', thickness_mm: 18 },
    'ХДЛ 18мм': { width: 2800, height: 2070, cost: 65.00, grain: 'horizontal', thickness_mm: 18 },
    'Масив 20мм': { width: 2500, height: 1250, cost: 180.00, grain: 'horizontal', thickness_mm: 20 },
    'ПДЧ 3мм': { width: 2800, height: 2070, cost: 12.00, grain: 'none', thickness_mm: 3 },
    'ХДФ 3мм': { width: 2800, height: 2070, cost: 12.00, grain: 'none', thickness_mm: 3 },
};

const GRAIN_PREFERENCES = {
    'ПДЧ': 'none', 'МДФ': 'none', 'ХДЛ': 'horizontal',
    'Масив': 'horizontal', 'Фурнир': 'horizontal', 'Шперплат': 'none',
    'Гръб': 'none', 'ХДФ': 'none'
};

const CABINET_COLORS = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4',
    '#F44336', '#8BC34A', '#3F51B5', '#FF5722', '#009688',
    '#E91E63', '#CDDC39', '#673AB7', '#FFC107', '#607D8B'
];

export const CutListBridge = {

    // ═══════════════════════════════════════════════════════
    // ВАЛИДАЦИЯ
    // ═══════════════════════════════════════════════════════

    validateMaterialSelection() {
        const Materials = window.Materials;
        if (!Materials) return { valid: false, missing: ['Модулът Materials не е зареден'] };

        const selected = Materials.selectedMaterials || {};
        const missing = [];

        if (!selected.plohi_corpus) missing.push('Плочи за корпус (страници, дъно, капак, стабилизатори)');
        if (!selected.plohi_doors) missing.push('Плочи за вратички');

        const project = State.currentProject || [];
        const hasPanels = project.some(c => c.type === 'panel');
        const hasPlinth = project.some(c => c.type === 'plinth');

        if (hasPanels && !selected.plohi_panels) missing.push('Плочи за допълнителни плоскости (панели)');
        if (hasPlinth && !selected.plohi_plinth) missing.push('Плочи за цокъл');

        return { valid: missing.length === 0, missing };
    },

    // ═══════════════════════════════════════════════════════
    // МАТЕРИАЛНА ИНФОРМАЦИЯ ОТ КАТАЛОГА
    // ═══════════════════════════════════════════════════════

    _getMaterialInfo(groupKey) {
        const Materials = window.Materials;
        if (!Materials) return null;

        const selection = Materials.selectedMaterials?.[groupKey];
        if (!selection || !selection.material) return null;

        const mat = selection.material;

        let width = 2800, height = 2070;
        if (mat.size) {
            const sizeMatch = mat.size.match(/(\d+)\s*[×xX]\s*(\d+)/);
            if (sizeMatch) { width = parseInt(sizeMatch[1]); height = parseInt(sizeMatch[2]); }
        }

        let thickness = 18;
        if (mat.thickness) {
            const thickMatch = mat.thickness.match(/(\d+)/);
            if (thickMatch) thickness = parseInt(thickMatch[1]);
        }

        let grain = 'none';
        const matName = mat.name || '';
        for (const [key, g] of Object.entries(GRAIN_PREFERENCES)) {
            if (matName.includes(key)) { grain = g; break; }
        }

        return { name: mat.name || `${groupKey}`, width, height, cost: mat.price || 0, grain, thickness_mm: thickness };
    },

    // ═══════════════════════════════════════════════════════
    // ИЗВЛИЧАНЕ НА ПАНЕЛИ
    // ═══════════════════════════════════════════════════════

    extractCutListData(project) {
        if (!project || project.length === 0) {
            return { parts: [], sheets: [], settings: this.getDefaultSettings(), cabinetColors: {} };
        }

        const allParts = [];
        const materialsUsed = {};
        const cabinetColors = {};

        const corpusMat = this._getMaterialInfo('plohi_corpus');
        const doorsMat = this._getMaterialInfo('plohi_doors');
        const panelsMat = this._getMaterialInfo('plohi_panels');
        const plinthMat = this._getMaterialInfo('plohi_plinth');

        project.forEach((cabinet, cabinetIndex) => {
            const cabinetId = `cab_${cabinetIndex + 1}`;
            const cabinetName = Calculator.getCabinetDisplayName(cabinet);
            cabinetColors[cabinetId] = {
                color: CABINET_COLORS[cabinetIndex % CABINET_COLORS.length],
                name: cabinetName, index: cabinetIndex
            };

            const elements = Calculator.generateCabinetElements(cabinet);

            elements.forEach(element => {
                if (element.category === 'hardware' || !element.size) return;
                const parsed = this._parseSize(element.size);
                if (!parsed) return;

                const matInfo = this._resolveElementMaterial(element, cabinet, corpusMat, doorsMat, panelsMat, plinthMat);
                const materialName = matInfo.name;

                if (!materialsUsed[materialName]) materialsUsed[materialName] = matInfo;

                const grain = this._detectGrain(materialName);

                allParts.push({
                    name: `${element.name} (${cabinetName})`,
                    width: parsed.width, height: parsed.height,
                    material: materialName, grain,
                    allow_rotation: grain === 'none' || grain === 'any',
                    priority: this._getPriority(element),
                    quantity: element.quantity || 1,
                    edge_banding: this._getEdgeBanding(element),
                    cabinet_id: cabinetId
                });
            });
        });

        const sheets = [];
        for (const [matName, info] of Object.entries(materialsUsed)) {
            sheets.push({
                name: `${matName} ${info.width}×${info.height}`,
                width: info.width, height: info.height,
                material: matName, grain: info.grain || 'none',
                cost: info.cost || 0, thickness_mm: info.thickness_mm || 18
            });
        }

        return { parts: allParts, sheets, settings: this.getDefaultSettings(), cabinetColors };
    },

    _resolveElementMaterial(element, cabinet, corpusMat, doorsMat, panelsMat, plinthMat) {
        if (element.category === 'back') {
            return { name: 'ХДФ 3мм', width: 2800, height: 2070, cost: 12, grain: 'none', thickness_mm: 3 };
        }
        if (element.category === 'door') {
            return doorsMat || this._fallbackSheet('ПДЧ 18мм');
        }
        if (cabinet.type === 'panel') {
            return panelsMat || corpusMat || this._fallbackSheet('ПДЧ 18мм');
        }
        if (cabinet.type === 'plinth') {
            return plinthMat || corpusMat || this._fallbackSheet('ПДЧ 18мм');
        }
        return corpusMat || this._fallbackSheet('ПДЧ 18мм');
    },

    _fallbackSheet(key) {
        const s = STANDARD_SHEETS[key] || STANDARD_SHEETS['ПДЧ 18мм'];
        return { name: key, width: s.width, height: s.height, cost: s.cost, grain: s.grain, thickness_mm: s.thickness_mm };
    },

    // ═══════════════════════════════════════════════════════
    // НАВИГАЦИЯ
    // ═══════════════════════════════════════════════════════

    sendToCutList() {
        const project = State.currentProject;
        if (!project || project.length === 0) {
            alert('⚠️ Няма шкафове в проекта! Добавете поне един шкаф.');
            return;
        }

        const validation = this.validateMaterialSelection();
        if (!validation.valid) {
            alert(
                '⚠️ Преди да изпратите към разкрояване, моля изберете материали в таб "Материали":\n\n' +
                validation.missing.map(m => `  ❌ ${m}`).join('\n') +
                '\n\nОтидете в таб "Материали" → секция "Плочи" и изберете материали за всяка група.'
            );
            return;
        }

        const data = this.extractCutListData(project);
        if (data.parts.length === 0) {
            alert('⚠️ Няма панели за разкрояване.');
            return;
        }

        const summary = this._generateSummary(data);
        if (!confirm(`📋 Обобщение на разкрояването:\n\n${summary}\n\nЖелаете ли да продължите към оптимизатора?`)) {
            return;
        }

        try {
            const jsonData = JSON.stringify(data);
            sessionStorage.setItem('cutlist_import_data', jsonData);
            sessionStorage.setItem('cutlist_import_timestamp', Date.now().toString());

            // Верификация — проверяваме дали записът е успешен преди пренасочване
            const verify = sessionStorage.getItem('cutlist_import_data');
            if (!verify || verify.length < 10) {
                throw new Error('sessionStorage write verification failed');
            }

            console.log(`✅ CutList data saved: ${jsonData.length} chars, ${data.parts.length} parts`);

            // Малко забавяне за да се гарантира записа
            setTimeout(() => {
                window.location.href = '/cutlist.html';
            }, 100);
        } catch (e) {
            console.error('Грешка при запис:', e);
            // Fallback: опитваме с localStorage
            try {
                localStorage.setItem('cutlist_import_data', JSON.stringify(data));
                localStorage.setItem('cutlist_import_timestamp', Date.now().toString());
                setTimeout(() => { window.location.href = '/cutlist.html'; }, 100);
            } catch (e2) {
                alert('❌ Грешка при подготовка на данните. Опитайте отново.');
            }
        }
    },

    // ═══════════════════════════════════════════════════════
    // ОБРАТНА ВРЪЗКА: cutlist → Materials
    // ═══════════════════════════════════════════════════════

    updateMaterialQuantities(cutlistResult) {
        const Materials = window.Materials;
        if (!Materials || !cutlistResult?.used_sheets) return;

        const sheetsByMaterial = {};
        cutlistResult.used_sheets.forEach(sheet => {
            const mat = sheet.material || sheet.name;
            sheetsByMaterial[mat] = (sheetsByMaterial[mat] || 0) + 1;
        });

        console.log('📊 CutList → Materials update:', sheetsByMaterial);

        const groupMap = {
            'plohi_corpus': this._getMaterialInfo('plohi_corpus')?.name,
            'plohi_doors': this._getMaterialInfo('plohi_doors')?.name,
            'plohi_panels': this._getMaterialInfo('plohi_panels')?.name,
            'plohi_plinth': this._getMaterialInfo('plohi_plinth')?.name,
        };

        for (const [groupKey, matName] of Object.entries(groupMap)) {
            if (!matName || !Materials.selectedMaterials[groupKey]) continue;
            let count = 0;
            for (const [usedMat, cnt] of Object.entries(sheetsByMaterial)) {
                if (usedMat === matName || usedMat.includes(matName) || matName.includes(usedMat)) count += cnt;
            }
            if (count > 0) Materials.selectedMaterials[groupKey].quantity = count;
        }

        if (Materials.renderMaterialsTab) Materials.renderMaterialsTab();
        if (Materials.saveSelections) Materials.saveSelections();
    },

    // ═══════════════════════════════════════════════════════
    // BACKGROUND ОПТИМИЗАЦИЯ
    // ═══════════════════════════════════════════════════════

    async runBackgroundOptimization() {
        const project = State.currentProject;
        if (!project || project.length === 0) return null;

        const validation = this.validateMaterialSelection();
        if (!validation.valid) {
            console.warn('CutList background: липсват материали, fallback по площ');
            return this._fallbackAreaCalculation(project);
        }

        const data = this.extractCutListData(project);
        if (data.parts.length === 0) return null;

        const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:8000' : window.location.origin;

        try {
            const response = await fetch(`${API_BASE}/api/v1/cutlist/optimize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parts: data.parts, sheets: data.sheets, settings: data.settings })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();
            this.updateMaterialQuantities(result);
            return result;
        } catch (error) {
            console.error('CutList background failed:', error);
            return this._fallbackAreaCalculation(project);
        }
    },

    _fallbackAreaCalculation(project) {
        const data = this.extractCutListData(project);
        const Materials = window.Materials;

        const areaByMaterial = {};
        data.parts.forEach(p => {
            areaByMaterial[p.material] = (areaByMaterial[p.material] || 0) + p.width * p.height * p.quantity;
        });

        const sheetsByMaterial = {};
        for (const [mat, area] of Object.entries(areaByMaterial)) {
            const sheet = data.sheets.find(s => s.material === mat);
            if (sheet) {
                sheetsByMaterial[mat] = Math.ceil(area / (sheet.width * sheet.height * 0.85));
            }
        }

        if (Materials) {
            const groupMap = {
                'plohi_corpus': this._getMaterialInfo('plohi_corpus')?.name,
                'plohi_doors': this._getMaterialInfo('plohi_doors')?.name,
                'plohi_panels': this._getMaterialInfo('plohi_panels')?.name,
                'plohi_plinth': this._getMaterialInfo('plohi_plinth')?.name,
            };
            for (const [groupKey, matName] of Object.entries(groupMap)) {
                if (!matName || !Materials.selectedMaterials[groupKey]) continue;
                const count = sheetsByMaterial[matName] || 0;
                if (count > 0) Materials.selectedMaterials[groupKey].quantity = count;
            }
            if (Materials.renderMaterialsTab) Materials.renderMaterialsTab();
            if (Materials.saveSelections) Materials.saveSelections();
        }

        return { fallback: true, sheetsByMaterial };
    },

    // ═══════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════

    _parseSize(s) {
        if (!s) return null;
        const parts = s.replace(/\s*мм\s*$/i, '').trim().split('x');
        if (parts.length !== 2) return null;
        const w = parseInt(parts[0]), h = parseInt(parts[1]);
        return (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) ? null : { width: w, height: h };
    },

    _detectGrain(material) {
        for (const [key, grain] of Object.entries(GRAIN_PREFERENCES)) {
            if (material.includes(key)) return grain;
        }
        return 'none';
    },

    _getPriority(el) {
        return el.category === 'door' ? 8 : el.category === 'component' ? 7 : el.category === 'back' ? 3 : 5;
    },

    _getEdgeBanding(el) {
        if (el.category === 'door') return { top: true, bottom: true, left: true, right: true };
        if (el.category === 'component') return { top: false, bottom: false, left: true, right: false };
        return { top: false, bottom: false, left: false, right: false };
    },

    _generateSummary(data) {
        const byMat = {};
        let total = 0;
        data.parts.forEach(p => {
            if (!byMat[p.material]) byMat[p.material] = { count: 0, qty: 0 };
            byMat[p.material].count++;
            byMat[p.material].qty += p.quantity;
            total += p.quantity;
        });
        let lines = [`Общо уникални детайли: ${data.parts.length}`, `Общо парчета: ${total}`, `Материали: ${data.sheets.length} вида`, ''];
        for (const [m, i] of Object.entries(byMat)) lines.push(`  ${m}: ${i.qty} парчета`);
        lines.push('', 'Листове:');
        data.sheets.forEach(s => lines.push(`  ${s.name} — ${s.cost.toFixed(2)} лв./лист`));
        return lines.join('\n');
    },

    getDefaultSettings() {
        return { saw_kerf_mm: 4, allow_rotation: true, respect_grain: true, min_usable_offcut_mm: 100, min_waste_area_mm2: 10000, grain_penalty_factor: 0.5, multi_pass: true };
    },

    getCabinetColors() { return CABINET_COLORS; }
};

window.CutListBridge = CutListBridge;
