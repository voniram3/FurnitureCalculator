import { cabinetTypes } from '../data/cabinetTypes.js';
import { State } from './state.js';

// UI контроли и манипулации
export const UI = {
    // Инициализация
    init() {
        this.renderCalculatorForm();
        this.bindEvents();
        this.updateProjectDisplay();
        this.loadHistory();
    },

    // Рендериране на формата за калкулатор
    renderCalculatorForm() {
        const form = document.getElementById('cabinetForm');
        if (!form) return;

        form.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="cabinet_id">ID на шкаф:</label>
                    <input type="text" id="cabinet_id" name="cabinet_id" placeholder="base_600">
                </div>
                <div class="form-group">
                    <label for="type">Тип шкаф:</label>
                    <select id="type" name="type" required>
                        <option value="">-- Изберете --</option>
                        ${Object.entries(cabinetTypes).map(([key, type]) =>
                            `<option value="${key}">${type.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <h4 style="margin: 20px 0 10px 0; color: #667eea;">Размери (mm)</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="width">Ширина:</label>
                    <input type="number" id="width" name="width" value="600" min="100" required>
                </div>
                <div class="form-group">
                    <label for="height">Височина:</label>
                    <input type="number" id="height" name="height" value="760" min="100" required>
                </div>
                <div class="form-group">
                    <label for="depth">Дълбочина:</label>
                    <input type="number" id="depth" name="depth" value="560" min="100" required>
                </div>
            </div>

            <h4 style="margin: 20px 0 10px 0; color: #667eea;">Дебелина на кант</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="body_edge">Кант за корпус:</label>
                    <select id="body_edge" name="body_edge">
                        <option value="0.4">0.4 мм</option>
                        <option value="0.8">0.8 мм</option>
                        <option value="1" selected>1 мм</option>
                        <option value="2">2 мм</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="door_edge">Кант за врати:</label>
                    <select id="door_edge" name="door_edge">
                        <option value="0.4">0.4 мм</option>
                        <option value="0.8">0.8 мм</option>
                        <option value="1">1 мм</option>
                        <option value="2" selected>2 мм</option>
                    </select>
                </div>
            </div>

            <h4 style="margin: 20px 0 10px 0; color: #667eea;">Конфигурация</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="shelf_count">Брой рафтове:</label>
                    <input type="number" id="shelf_count" name="shelf_count" value="1" min="0" max="10">
                </div>
                <div class="form-group">
                    <label for="door_count">Брой врати:</label>
                    <input type="number" id="door_count" name="door_count" value="2" min="0" max="4">
                </div>
                <div class="form-group">
                    <label for="drawer_count">Брой чекмеджета:</label>
                    <input type="number" id="drawer_count" name="drawer_count" value="0" min="0" max="6">
                </div>
            </div>

            <div class="form-group">
                <input type="checkbox" id="has_back" name="has_back" checked>
                <label for="has_back" class="checkbox-label">Шкафът има гръб</label>
            </div>

            <div class="form-group" style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 2px solid #ffc107; margin: 15px 0;">
                <input type="checkbox" id="pages_between_panels" name="pages_between_panels">
                <label for="pages_between_panels" class="checkbox-label" style="font-weight: bold; color: #856404;">
                    📐 Страници между дъно/капак (без стабилизатори)
                </label>
                <div style="font-size: 0.85em; color: #856404; margin-top: 5px; margin-left: 25px;">
                    <strong>Метод 2:</strong> Страниците са по-ниски (h-36) и се слагат между дъно и капак.<br>
                    Дъно и капак са с пълна ширина. <strong>Няма стабилизатори.</strong>
                </div>
            </div>

            <div class="form-group">
                <input type="checkbox" id="custom_door_size" name="custom_door_size">
                <label for="custom_door_size" class="checkbox-label">Персонализирани размери на врати</label>
            </div>

            <div id="customDoorSection" class="custom-door-size" style="display: none;">
                <h4 style="margin: 10px 0; color: #667eea;">Размери на врати</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="door_width">Ширина на врата:</label>
                        <input type="number" id="door_width" name="door_width" min="50">
                    </div>
                    <div class="form-group">
                        <label for="door_height">Височина на врата:</label>
                        <input type="number" id="door_height" name="door_height" min="50">
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn" id="calculateBtn">💰 Изчисли шкаф</button>
                <button type="button" class="btn btn-success" id="addToProjectBtn">➕ Добави към проект</button>
                <button type="reset" class="btn btn-secondary">🔄 Изчисти</button>
            </div>
        `;

        // Event listener за показване на custom door fields
        const customDoorCheckbox = document.getElementById('custom_door_size');
        const customDoorSection = document.getElementById('customDoorSection');
        
        if (customDoorCheckbox && customDoorSection) {
            customDoorCheckbox.addEventListener('change', (e) => {
                customDoorSection.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        // Event listener за промяна на тип шкаф
        const typeSelect = document.getElementById('type');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.updateCabinetPreview(e.target.value);
                this.updateFormDefaultsByType(e.target.value);
            });
        }
    },

    // Актуализиране на превюто на шкафа
    updateCabinetPreview(type) {
        const cabinetInfo = cabinetTypes[type];
        if (!cabinetInfo) return;

        const icon = document.getElementById('cabinetIcon');
        const name = document.getElementById('cabinetTypeName');
        const description = document.getElementById('cabinetDescription');

        if (icon) icon.textContent = cabinetInfo.icon;
        if (name) name.textContent = cabinetInfo.name;
        if (description) description.textContent = cabinetInfo.description;
    },

    // Актуализиране на стойностите по подразбиране според типа
    updateFormDefaultsByType(type) {
        const cabinetInfo = cabinetTypes[type];
        if (!cabinetInfo) return;

        // Променяме стойностите само ако полето е празно или има стойността по подразбиране
        const widthInput = document.getElementById('width');
        const heightInput = document.getElementById('height');
        const depthInput = document.getElementById('depth');
        const shelfInput = document.getElementById('shelf_count');
        const doorInput = document.getElementById('door_count');
        const drawerInput = document.getElementById('drawer_count');

        if (widthInput) widthInput.value = cabinetInfo.defaultWidth;
        if (heightInput) heightInput.value = cabinetInfo.defaultHeight;
        if (depthInput) depthInput.value = cabinetInfo.defaultDepth;
        if (shelfInput) shelfInput.value = cabinetInfo.defaultShelves;
        if (doorInput) doorInput.value = cabinetInfo.defaultDoors;
        if (drawerInput) drawerInput.value = cabinetInfo.defaultDrawers;
    },

    // Актуализиране на показването на проекта
    updateProjectDisplay() {
        const projectList = document.getElementById('projectCabinetList');
        const projectCount = document.getElementById('projectCabinetCount');
        
        if (!projectList) return;

        if (projectCount) {
            projectCount.textContent = State.currentProject.length;
        }

        if (State.currentProject.length === 0) {
            projectList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Няма шкафове в проекта. Добавете шкаф от калкулатора.</p>';
            return;
        }

        projectList.innerHTML = State.currentProject.map((cabinet, index) => {
            const cabinetInfo = cabinetTypes[cabinet.type] || {};
            return `
                <div class="project-cabinet-item">
                    <div class="cabinet-item-icon">${cabinetInfo.icon || '📦'}</div>
                    <div class="cabinet-item-info">
                        <strong>${cabinet.cabinet_id || `Шкаф ${index + 1}`}</strong>
                        <div class="cabinet-item-details">
                            ${cabinetInfo.name || cabinet.type} | 
                            ${cabinet.width}×${cabinet.height}×${cabinet.depth}mm |
                            Рафтове: ${cabinet.shelf_count || 0} |
                            Врати: ${cabinet.door_count || 0}
                            ${cabinet.pages_between_panels ? ' | <span style="color: #856404;">📐 М2</span>' : ''}
                        </div>
                    </div>
                    <div class="cabinet-item-actions">
                        <button class="btn btn-sm btn-danger" onclick="window.removeCabinetFromProject(${index})">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Показване на резултат
    showResult(data) {
        const resultDisplay = document.getElementById('resultDisplay');
        const resultContent = document.getElementById('resultContent');
        
        if (!resultDisplay || !resultContent) return;

        resultDisplay.style.display = 'block';
        
        let html = '<div class="result-summary">';
        
        if (data.cabinet_details) {
            html += `
                <h5>Информация за шкафа</h5>
                <p><strong>Тип:</strong> ${data.cabinet_details.type || 'N/A'}</p>
                <p><strong>Размери:</strong> ${data.cabinet_details.width}×${data.cabinet_details.height}×${data.cabinet_details.depth} mm</p>
            `;
        }

        if (data.material_breakdown) {
            html += '<h5>Материали</h5><ul>';
            Object.entries(data.material_breakdown).forEach(([material, area]) => {
                html += `<li>${material}: ${area.toFixed(2)} m²</li>`;
            });
            html += '</ul>';
        }

        if (data.hardware_list) {
            html += '<h5>Хардуер</h5><ul>';
            Object.entries(data.hardware_list).forEach(([item, quantity]) => {
                html += `<li>${item}: ${quantity} бр</li>`;
            });
            html += '</ul>';
        }

        if (data.total_cost) {
            html += `<h5 style="color: #667eea;">Обща цена: ${data.total_cost.toFixed(2)} лв</h5>`;
        }

        html += '</div>';
        resultContent.innerHTML = html;
    },

    // Показване на грешка
    showError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        const errorContent = document.getElementById('errorContent');
        
        if (!errorDisplay || !errorContent) return;

        if (!message) {
            errorDisplay.style.display = 'none';
            return;
        }

        errorDisplay.style.display = 'block';
        errorContent.textContent = message;
    },

    // Показване на спинър
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    },

    // Зареждане на история
    loadHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (State.calculationHistory.length === 0) {
            historyList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Няма история на изчисления.</p>';
            return;
        }

        historyList.innerHTML = State.calculationHistory.map((item, index) => {
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleString('bg-BG');
            
            return `
                <div class="history-item">
                    <div class="history-item-header">
                        <strong>${item.formData?.cabinet_id || `Изчисление ${index + 1}`}</strong>
                        <span class="history-item-date">${formattedDate}</span>
                    </div>
                    <div class="history-item-details">
                        ${item.type === 'project' ? 
                            `Проект с ${item.cabinetCount} шкафа` : 
                            `${item.formData?.type || 'N/A'} | ${item.formData?.width}×${item.formData?.height}×${item.formData?.depth}mm`
                        }
                    </div>
                </div>
            `;
        }).join('');
    },

    // Event binding
    bindEvents() {
        // Calculate button
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                if (window.Calculator) {
                    window.Calculator.calculateCabinet();
                }
            });
        }

        // Add to project button
        const addToProjectBtn = document.getElementById('addToProjectBtn');
        if (addToProjectBtn) {
            addToProjectBtn.addEventListener('click', () => {
                if (window.Calculator) {
                    const formData = window.Calculator.getCabinetFormData();
                    if (formData && window.Calculator.validateCabinetData(formData)) {
                        State.addToProject(formData);
                        this.updateProjectDisplay();
                        alert('✅ Шкафът е добавен към проекта!');
                    }
                }
            });
        }

        // Calculate project button
        const calculateProjectBtn = document.getElementById('calculateProjectBtn');
        if (calculateProjectBtn) {
            calculateProjectBtn.addEventListener('click', () => {
                if (window.Calculator) {
                    window.Calculator.calculateProject();
                }
            });
        }

        // Export project button
        const exportProjectBtn = document.getElementById('exportProjectBtn');
        if (exportProjectBtn) {
            exportProjectBtn.addEventListener('click', () => {
                if (window.Calculator) {
                    window.Calculator.exportProject();
                }
            });
        }

        // Clear project button
        const clearProjectBtn = document.getElementById('clearProjectBtn');
        if (clearProjectBtn) {
            clearProjectBtn.addEventListener('click', () => {
                if (confirm('Сигурни ли сте, че искате да изчистите проекта?')) {
                    State.clearProject();
                    this.updateProjectDisplay();
                }
            });
        }

        // Clear history button
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Сигурни ли сте, че искате да изчистите историята?')) {
                    State.clearHistory();
                    this.loadHistory();
                }
            });
        }
    }
};

// Глобална функция за премахване на шкаф от проекта
window.removeCabinetFromProject = (index) => {
    if (confirm('Сигурни ли сте, че искате да премахнете този шкаф?')) {
        State.removeFromProject(index);
        UI.updateProjectDisplay();
    }
};

// Експортираме глобално
window.UI = UI;
