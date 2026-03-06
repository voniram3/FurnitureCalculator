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

<!-- 🆕 НОВО: Бройка шкафове -->
<div class="form-row">
    <div class="form-group">
        <label for="cabinet_quantity">🔢 Бройка шкафове:</label>
        <input type="number" id="cabinet_quantity" name="cabinet_quantity" value="1" min="1" max="50" step="1">
        <small style="color: #666;">Колко еднакви шкафа да се добавят към проекта</small>
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
            <!-- 🆕 НОВО: Dropdown за повдигащ механизъм -->
<div class="form-row" id="liftMechanismSection" style="display: none;">
    <div class="form-group">
        <label for="lift_mechanism">⬆️ Повдигащ механизъм:</label>
        <select id="lift_mechanism" name="lift_mechanism">
            <option value="Aventos HS">Aventos HS (малък)</option>
            <option value="Aventos HF">Aventos HF (голям)</option>
            <option value="Aventos HK">Aventos HK (среден)</option>
            <option value="GTV повдигач малък">GTV повдигач малък</option>
            <option value="GTV повдигач голям">GTV повдигач голям</option>
        </select>
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
                <h4 style="color: #ffc107; margin-bottom: 10px;">Размери на врати (mm)</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="door_width">Ширина на врата:</label>
                        <input type="number" id="door_width" name="door_width" placeholder="автоматично">
                    </div>
                    <div class="form-group">
                        <label for="door_height">Височина на врата:</label>
                        <input type="number" id="door_height" name="door_height" placeholder="автоматично">
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <button type="button" class="btn" id="calculateCabinetBtn">🧮 Изчисли</button>
                <button type="button" class="btn btn-success" id="addToProjectBtn">➕ Добави към проект</button>
                <button type="reset" class="btn btn-secondary">🔄 Изчисти</button>
            </div>
        `;
    },

    // Връзване на събития
    bindEvents() {
        // Табове
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e));
        });

        // Кабинет превю
        const typeSelect = document.getElementById('type');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => this.updateCabinetPreview());
        }

        // Персонализирани врати
        const customDoorCheck = document.getElementById('custom_door_size');
        if (customDoorCheck) {
            customDoorCheck.addEventListener('change', () => this.toggleCustomDoorSize());
        }

        // Бутони
        const calculateBtn = document.getElementById('calculateCabinetBtn');
        if (calculateBtn) calculateBtn.addEventListener('click', () => window.Calculator.calculateCabinet());

        const addToProjectBtn = document.getElementById('addToProjectBtn');
        if (addToProjectBtn) addToProjectBtn.addEventListener('click', () => this.addToProject());

        const calculateProjectBtn = document.getElementById('calculateProjectBtn');
        if (calculateProjectBtn) calculateProjectBtn.addEventListener('click', () => window.Calculator.calculateProject());

        const exportProjectBtn = document.getElementById('exportProjectBtn');
        if (exportProjectBtn) exportProjectBtn.addEventListener('click', () => window.Calculator.exportProject());

        const clearProjectBtn = document.getElementById('clearProjectBtn');
        if (clearProjectBtn) clearProjectBtn.addEventListener('click', () => this.clearProject());

        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    },

    // Превключване на табове
    switchTab(event) {
        const tabName = event.target.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
            event.target.classList.add('active');

            // Специални действия при смяна на таб
            if (tabName === 'project') this.updateProjectDisplay();
            if (tabName === 'history') this.loadHistory();
            if (tabName === 'pricing') {
                // Инициализираме секциите за ценообразуване ако все още не са
                if (!document.querySelector('.collapsible')) {
                    window.Tables.renderPricingSections();
                }
            }
        }
    },

    // Обновяване на preview на шкафа
    updateCabinetPreview() {
    const type = document.getElementById('type')?.value;
    const liftSection = document.getElementById('liftMechanismSection');

    if (!type || !cabinetTypes[type]) {
        document.getElementById('cabinetIcon').textContent = '📦';
        document.getElementById('cabinetTypeName').textContent = 'Изберете тип шкаф';
        document.getElementById('cabinetDescription').textContent = 'Изберете тип от менюто';
        if (liftSection) liftSection.style.display = 'none';
        return;
    }

    const config = cabinetTypes[type];
    document.getElementById('cabinetIcon').textContent = config.icon;
    document.getElementById('cabinetTypeName').textContent = config.name;
    document.getElementById('cabinetDescription').textContent = config.description;

    // 🆕 ПОКАЗВА/СКРИВА секцията за механизъм
    if (liftSection) {
        liftSection.style.display = (type === 'upperLift') ? 'block' : 'none';
    }

    // Автоматично попълване на стойности
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const depthInput = document.getElementById('depth');
    const shelvesInput = document.getElementById('shelf_count');
    const doorsInput = document.getElementById('door_count');
    const drawersInput = document.getElementById('drawer_count');

    if (widthInput) widthInput.value = config.defaultWidth;
    if (heightInput) heightInput.value = config.defaultHeight;
    if (depthInput) depthInput.value = config.defaultDepth;
    if (shelvesInput) shelvesInput.value = config.defaultShelves;
    if (doorsInput) doorsInput.value = config.defaultDoors;
    if (drawersInput) drawersInput.value = config.defaultDrawers;

    // Анимация
    const card = document.getElementById('cabinetPreviewCard');
    if (card) {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'pulse 0.5s ease';
        }, 10);
    }
},

// Показване/скриване на персонализирани врати
toggleCustomDoorSize() {
    const checkbox = document.getElementById('custom_door_size');
    const section = document.getElementById('customDoorSection');
    if (checkbox && section) {
        section.style.display = checkbox.checked ? 'block' : 'none';
    }
},

// Показване на резултат
showResult(data) {
    const resultContent = document.getElementById('resultContent');
    const resultDisplay = document.getElementById('resultDisplay');
    if (!resultContent || !resultDisplay) return;

        let html = `
            <div class="result-item">
                <span class="result-label">Шкаф ID:</span>
                <span class="result-value">${data.cabinet_id || 'N/A'}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Тип:</span>
                <span class="result-value">${cabinetTypes[data.type]?.name || data.type}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Обща цена:</span>
                <span class="result-value" style="font-size: 1.3em; color: #4caf50; font-weight: bold;">
                    ${data.total_cost_bgn ? data.total_cost_bgn.toFixed(2) : '0.00'} лв
                </span>
            </div>
        `;

        if (data.panels && data.panels.length > 0) {
            html += '<h5 style="margin-top: 20px; color: #667eea;">Панели:</h5><ul>';
            data.panels.forEach(panel => {
                html += `<li>${panel.name}: ${panel.width}×${panel.height}mm (${panel.quantity}бр)</li>`;
            });
            html += '</ul>';
        }

        resultContent.innerHTML = html;
        resultDisplay.style.display = 'block';

        // Скриваме грешките
        const errorDisplay = document.getElementById('errorDisplay');
        if (errorDisplay) errorDisplay.style.display = 'none';
    },

    // Показване на грешка
    showError(message) {
        const errorContent = document.getElementById('errorContent');
        const errorDisplay = document.getElementById('errorDisplay');

        if (errorContent && errorDisplay) {
            errorContent.textContent = message;
            errorDisplay.style.display = 'block';
        }

        // Скриваме резултатите
        const resultDisplay = document.getElementById('resultDisplay');
        if (resultDisplay) resultDisplay.style.display = 'none';
    },

    // Зареждане/скриване на спинър
    showLoading(show = true) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    },

    // Обновяване на дисплея на проекта
    updateProjectDisplay() {
        const count = State.getProjectCount();
        const countElement = document.getElementById('projectCabinetCount');
        const listElement = document.getElementById('projectCabinetList');

        if (countElement) countElement.textContent = count;

        if (listElement) {
            if (count === 0) {
                listElement.innerHTML = '<p style="color: #999;">Няма добавени шкафове</p>';
                return;
            }

            let html = '';
            State.currentProject.forEach((cabinet, index) => {
                const config = cabinetTypes[cabinet.type] || {};
                html += `
                    <div class="cabinet-list-item">
                        <div>
                            <span style="font-size: 1.5em;">${config.icon || '📦'}</span>
                            <strong>${config.name || cabinet.type}</strong>
                            - ${cabinet.width}×${cabinet.height}×${cabinet.depth}mm
                            ${cabinet.cabinet_id ? `<br><small>ID: ${cabinet.cabinet_id}</small>` : ''}
                        </div>
                        <button class="btn btn-danger btn-small" onclick="window.UI.removeFromProject(${index})">🗑️</button>
                    </div>
                `;
            });
            listElement.innerHTML = html;
        }
    },

  // Добавяне на шкаф към проект
addToProject() {
    const type = document.getElementById('type')?.value;
    if (!type) {
        alert('Моля, изберете тип шкаф!');
        return;
    }

    const cabinet = {
        type: type,
        width: parseInt(document.getElementById('width').value) || 0,
        height: parseInt(document.getElementById('height').value) || 0,
        depth: parseInt(document.getElementById('depth').value) || 0,
        cabinet_id: document.getElementById('cabinet_id').value || `cabinet_${Date.now()}`,
        body_edge: document.getElementById('body_edge').value,
        door_edge: document.getElementById('door_edge').value,
        shelf_count: parseInt(document.getElementById('shelf_count').value) || 0,
        door_count: parseInt(document.getElementById('door_count').value) || 0,
        drawer_count: parseInt(document.getElementById('drawer_count').value) || 0,
        has_back: document.getElementById('has_back').checked,
        custom_door_width: document.getElementById('door_width')?.value,
        custom_door_height: document.getElementById('door_height')?.value,
        pages_between_panels: document.getElementById('pages_between_panels')?.checked || false, // 🆕 ДОБАВИ
        lift_mechanism: document.getElementById('lift_mechanism')?.value || 'Aventos HS' // 🆕 ДОБАВИ
    };

    // 🆕 НОВА ЛОГИКА: Добавяне с бройка
    const quantity = parseInt(document.getElementById('cabinet_quantity')?.value) || 1;

    for (let i = 0; i < quantity; i++) {
        // Уникален ID за всеки шкаф
        const cabinetCopy = {
            ...cabinet,
            cabinet_id: cabinet.cabinet_id === `cabinet_${Date.now()}`
                ? `cabinet_${Date.now()}_${i}`
                : `${cabinet.cabinet_id}_${i}`
        };
        State.addToProject(cabinetCopy);
    }

    alert(`✅ ${quantity} шкаф(а) добавен(и) към проекта!\n\nОбщо шкафове: ${State.getProjectCount()}`);
    this.updateProjectDisplay();
},

    // Премахване от проект
    removeFromProject(index) {
        if (confirm('Сигурни ли сте, че искате да премахнете този шкаф от проекта?')) {
            State.removeFromProject(index);
            this.updateProjectDisplay();
        }
    },

    // Изчистване на проект
    clearProject() {
        if (confirm('⚠️ Сигурни ли сте, че искате да изчистите целия проект? Това действие не може да бъде отменено.')) {
            State.clearProject();
            this.updateProjectDisplay();
            alert('✅ Проектът е изчистен!');
        }
    },

    // Зареждане на история
    loadHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        const history = State.calculationHistory;
        if (history.length === 0) {
            historyList.innerHTML = '<p style="color: #999;">Няма записани изчисления</p>';
            return;
        }

        let html = '<ul style="list-style: none; padding: 0;">';
        history.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleString('bg-BG');
            const type = entry.data?.type || 'Неизвестен';
            const config = cabinetTypes[type] || {};
            const price = entry.data?.total_cost_bgn ? entry.data.total_cost_bgn.toFixed(2) : 'N/A';

            html += `
                <li class="cabinet-list-item">
                    <div>
                        <span style="font-size: 1.5em; margin-right: 10px;">${config.icon || '📦'}</span>
                        <strong>${date}</strong><br>
                        <small>ID: ${entry.data?.cabinet_id || 'Без ID'} | Тип: ${config.name || type} | Цена: ${price} лв.</small>
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="window.UI.viewHistoryDetail('${entry.id}')">👁️ Детайли</button>
                </li>
            `;
        });
        html += '</ul>';
        historyList.innerHTML = html;
    },

    // Изчистване на история
    clearHistory() {
        if (confirm('⚠️ Сигурни ли сте, че искате да изчистите цялата история? Това действие не може да бъде отменено.')) {
            State.clearHistory();
            this.loadHistory();
            alert('✅ Историята е изчистена!');
        }
    },

    // Преглед на детайли от история
    viewHistoryDetail(id) {
        const entry = State.calculationHistory.find(item => item.id === id);
        if (entry) {
            const detail = JSON.stringify(entry, null, 2);
            alert('Детайли на изчислението:\n\n' + detail);
        }
    }
};

// Експортираме глобално
window.UI = UI;
