import { defaultMaterials, installationServices, laborOperations } from '../data/cabinetTypes.js';
import { State } from './state.js';
import { Calculator } from './calculator.js';

// Операции с таблици и изчисления
export const Tables = {
    // Инициализация
    init() {
        this.renderMaterialsTable();
        this.renderPricingSections();
        this.bindTableEvents();
    },

    // Рендериране на таблицата за материали
    renderMaterialsTable() {
        const container = document.getElementById('materialsContainer');
        if (!container) return;

        container.innerHTML = `
            <table class="price-table" id="materialsTable">
                <thead>
                    <tr>
                        <th>Материал</th>
                        <th>Размер</th>
                        <th>Дебелина</th>
                        <th>Брой</th>
                        <th>Цена/бр (лв)</th>
                        <th>Обща цена</th>
                    </tr>
                </thead>
                <tbody id="materialsTableBody">
                    <!-- Ще се попълва динамично -->
                </tbody>
                <tfoot>
                    <tr style="background: #667eea; color: white;">
                        <td colspan="5"><strong>ОБЩО МАТЕРИАЛИ:</strong></td>
                        <td><strong id="totalMaterials">0.00 лв</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;

        const tbody = document.getElementById('materialsTableBody');
        if (!tbody) return;

        let html = '';
        defaultMaterials.forEach((material, index) => {
            html += `
                <tr data-material-id="${index}">
                    <td>${material.name}</td>
                    <td>${material.size}</td>
                    <td>${material.thickness}</td>
                    <td><input type="number" class="material-qty" value="0" min="0" step="1" data-index="${index}"></td>
                    <td><input type="number" class="material-price" value="${material.price.toFixed(2)}" min="0" step="0.01" data-index="${index}"></td>
                    <td class="row-total material-total">0.00 лв</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },

    // Рендериране на секциите за ценообразуване
    renderPricingSections() {
        const container = document.getElementById('pricingContainer');
        if (!container) return;

        container.innerHTML = `
            <h2 class="section-title">Калкулация на цени</h2>

            <div class="profile-selector">
                <h4>💾 Ценови профили</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="profileName">Име на профил:</label>
                        <input type="text" id="profileName" placeholder="Стандартен, Премиум...">
                    </div>
                </div>
                <div class="profile-buttons">
                    <button class="btn btn-success btn-small" onclick="Tables.saveProfile()">💾 Запази</button>
                    <button class="btn btn-secondary btn-small" onclick="Tables.loadProfile()">📂 Зареди</button>
                    <button class="btn btn-danger btn-small" onclick="Tables.deleteProfile()">🗑️ Изтрий</button>
                </div>
                <div id="profileList" style="margin-top: 10px;">
                    <small>Запазени: <span id="savedProfilesList">няма</span></small>
                </div>
            </div>

            <button type="button" class="collapsible">
                🚚 Общи разходи
            </button>
            <div class="collapsible-content">
                <div class="collapsible-content-inner">
                    <p style="color: #666; margin-bottom: 15px;">Транспорт, Разнос, Дизайн</p>
                    <table class="price-table" id="overallCostsTable">
                        <thead>
                            <tr>
                                <th>Услуга</th>
                                <th style="width: 150px;">Цена (лв)</th>
                                <th style="width: 50px;">🗑️</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="text" value="Транспорт" class="item-name"></td>
                                <td><input type="number" value="0" step="0.01" class="item-price"></td>
                                <td><button class="delete-row-btn" onclick="Tables.deleteRow(this)">🗑️</button></td>
                            </tr>
                            <tr>
                                <td><input type="text" value="Разнос" class="item-name"></td>
                                <td><input type="number" value="0" step="0.01" class="item-price"></td>
                                <td><button class="delete-row-btn" onclick="Tables.deleteRow(this)">🗑️</button></td>
                            </tr>
                            <tr>
                                <td><input type="text" value="Дизайн" class="item-name"></td>
                                <td><input type="number" value="0" step="0.01" class="item-price"></td>
                                <td><button class="delete-row-btn" onclick="Tables.deleteRow(this)">🗑️</button></td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="add-row-section">
                        <button class="btn btn-small btn-success" onclick="Tables.addOverallCostRow()">➕ Добави ред</button>
                    </div>
                </div>
            </div>

            <button type="button" class="collapsible">
                🔧 Монтаж и ВиК услуги
            </button>
            <div class="collapsible-content">
                <div class="collapsible-content-inner">
                    <table class="price-table" id="installationTable">
                        <thead>
                            <tr>
                                <th>Услуга</th>
                                <th>Брой</th>
                                <th>Цена/бр</th>
                                <th>Обща цена</th>
                                <th>🗑️</th>
                            </tr>
                        </thead>
                        <tbody id="installationTableBody">
                            <!-- Ще се попълва динамично -->
                        </tbody>
                    </table>
                    <div class="add-row-section">
                        <button class="btn btn-small btn-success" onclick="Tables.addInstallationRow()">➕ Добави ред</button>
                    </div>
                </div>
            </div>

            <button type="button" class="collapsible">
                👷 Труд
            </button>
            <div class="collapsible-content">
                <div class="collapsible-content-inner">
                    <table class="price-table" id="laborTable">
                        <thead>
                            <tr>
                                <th>Операция</th>
                                <th>Линеен метър / Брой</th>
                                <th>Цена/м</th>
                                <th>Обща цена</th>
                                <th>🗑️</th>
                            </tr>
                        </thead>
                        <tbody id="laborTableBody">
                            <!-- Ще се попълва динамично -->
                        </tbody>
                    </table>
                    <div class="add-row-section">
                        <button class="btn btn-small btn-success" onclick="Tables.addLaborRow()">➕ Добави ред</button>
                    </div>
                </div>
            </div>

            <button type="button" class="collapsible active">
                📊 Обща калкулация
            </button>
            <div class="collapsible-content" style="max-height: none;">
                <div class="collapsible-content-inner">
                    <table class="price-table">
                        <tbody>
                            <tr>
                                <td><strong>Общи разходи</strong></td>
                                <td class="price-total" id="totalOverall">0.00 лв</td>
                            </tr>
                            <tr>
                                <td><strong>Материали</strong></td>
                                <td class="price-total" id="totalMaterialsCatalog">0.00 лв</td>
                            </tr>
                            <tr>
                                <td><strong>Монтаж и ВиК</strong></td>
                                <td class="price-total" id="totalInstallation">0.00 лв</td>
                            </tr>
                            <tr>
                                <td><strong>Труд</strong></td>
                                <td class="price-total" id="totalLabor">0.00 лв</td>
                            </tr>
                            <tr style="background: #f0f0f0;">
                                <td><strong>Междинна сума</strong></td>
                                <td class="price-total" id="subtotal">0.00 лв</td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>Надценка</strong>
                                    <input type="number" id="markupPercent" value="0" min="-100" max="500" step="1" 
                                           style="width: 60px; padding: 4px; margin-left: 10px; border: 1px solid #ddd; border-radius: 4px; text-align: right;"> %
                                </td>
                                <td class="price-total" id="markupAmount">0.00 лв</td>
                            </tr>
                            <tr>
                                <td><strong>ДДС (20%)</strong></td>
                                <td class="price-total" id="vat">0.00 лв</td>
                            </tr>
                            <tr style="background: #667eea; color: white;">
                                <td><strong style="font-size: 1.2em;">ОБЩО</strong></td>
                                <td style="font-size: 1.3em; font-weight: bold;" id="grandTotal">0.00 лв</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="margin-top: 30px; text-align: center;">
                <button class="btn btn-success" onclick="Tables.autoCalculateFromProject()">🤖 Авто изчисление на проект</button>
            </div>
        `;

        // Попълване на таблиците с данни
        this.renderInstallationTable();
        this.renderLaborTable();

        // Връзване на събития за колапсиращи секции
        this.bindCollapsibleEvents();
        this.updateProfilesList();
    },

    // Рендериране на таблицата за монтаж
    renderInstallationTable() {
        const tbody = document.getElementById('installationTableBody');
        if (!tbody) return;

        let html = '';
        installationServices.forEach((service, index) => {
            html += `
                <tr data-service-id="${index}">
                    <td><input type="text" value="${service.name}" class="service-name" data-index="${index}"></td>
                    <td><input type="number" value="0" min="0" step="1" class="service-qty" data-index="${index}"></td>
                    <td><input type="number" value="${service.price.toFixed(2)}" min="0" step="0.01" class="service-price" data-index="${index}"></td>
                    <td class="row-total service-total">0.00 лв</td>
                    <td><button class="delete-row-btn" onclick="Tables.deleteRow(this)">🗑️</button></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },

    // Рендериране на таблицата за труд
    renderLaborTable() {
        const tbody = document.getElementById('laborTableBody');
        if (!tbody) return;

        let html = '';
        laborOperations.forEach((operation, index) => {
            html += `
                <tr data-operation-id="${index}">
                    <td><input type="text" value="${operation.name}" class="operation-name" data-index="${index}"></td>
                    <td><input type="number" value="0" min="0" step="1" class="operation-qty" data-index="${index}"></td>
                    <td><input type="number" value="${operation.price.toFixed(2)}" min="0" step="0.01" class="operation-price" data-index="${index}"></td>
                    <td class="row-total operation-total">0.00 лв</td>
                    <td><button class="delete-row-btn" onclick="Tables.deleteRow(this)">🗑️</button></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },

    // Връзване на събития за таблиците
    bindTableEvents() {
        // Събития за материали
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('material-qty') || e.target.classList.contains('material-price')) {
                this.calculateMaterialRow(e.target);
                this.calculateTotals();
            }

            if (e.target.classList.contains('service-qty') || e.target.classList.contains('service-price')) {
                this.calculateServiceRow(e.target);
                this.calculateTotals();
            }

            if (e.target.classList.contains('operation-qty') || e.target.classList.contains('operation-price')) {
                this.calculateOperationRow(e.target);
                this.calculateTotals();
            }

            if (e.target.classList.contains('item-price')) {
                this.calculateTotals();
            }

            // Надценка
            if (e.target.id === 'markupPercent') {
                this.calculateTotals();
            }
        });
    },

    // Връзване на събития за колапсиращи секции
    bindCollapsibleEvents() {
        document.querySelectorAll('.collapsible').forEach(button => {
            button.addEventListener('click', function() {
                this.classList.toggle('active');
                const content = this.nextElementSibling;
                if (content.style.maxHeight && content.style.maxHeight !== 'none') {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
        });
    },

    // 🆕 ФУНКЦИЯ ЗА ОБНОВЯВАНЕ НА ВИСОЧИНАТА НА COLLAPSIBLE SECTION
    updateCollapsibleHeight(button) {
        if (!button) return;
        
        const collapsible = button.closest('.collapsible-content-inner')
                                  ?.parentElement;
        
        if (collapsible && collapsible.classList.contains('collapsible-content')) {
            // Само ако секцията е отворена (има max-height)
            if (collapsible.style.maxHeight && collapsible.style.maxHeight !== 'none') {
                collapsible.style.maxHeight = collapsible.scrollHeight + "px";
            }
        }
    },

    // Изчисляване на ред от материали
    calculateMaterialRow(input) {
        const row = input.closest('tr');
        if (!row) return;

        const qtyInput = row.querySelector('.material-qty');
        const priceInput = row.querySelector('.material-price');
        const totalCell = row.querySelector('.material-total');

        if (!qtyInput || !priceInput || !totalCell) return;

        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;

        totalCell.textContent = total.toFixed(2) + ' лв';
    },

    // Изчисляване на ред от услуги
    calculateServiceRow(input) {
        const row = input.closest('tr');
        if (!row) return;

        const qtyInput = row.querySelector('.service-qty');
        const priceInput = row.querySelector('.service-price');
        const totalCell = row.querySelector('.service-total');

        if (!qtyInput || !priceInput || !totalCell) return;

        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;

        totalCell.textContent = total.toFixed(2) + ' лв';
    },

    // Изчисляване на ред от операции
    calculateOperationRow(input) {
        const row = input.closest('tr');
        if (!row) return;

        const qtyInput = row.querySelector('.operation-qty');
        const priceInput = row.querySelector('.operation-price');
        const totalCell = row.querySelector('.operation-total');

        if (!qtyInput || !priceInput || !totalCell) return;

        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;

        totalCell.textContent = total.toFixed(2) + ' лв';
    },

    // Изчисляване на всички тотали
    calculateTotals() {
        // Общи разходи
        let totalOverall = 0;
        document.querySelectorAll('#overallCostsTable .item-price').forEach(input => {
            totalOverall += parseFloat(input.value) || 0;
        });

        // Монтаж и услуги
        let totalInstallation = 0;
        document.querySelectorAll('.service-total').forEach(cell => {
            const text = cell.textContent.replace(' лв', '').trim();
            totalInstallation += parseFloat(text) || 0;
        });

        // Труд
        let totalLabor = 0;
        document.querySelectorAll('.operation-total').forEach(cell => {
            const text = cell.textContent.replace(' лв', '').trim();
            totalLabor += parseFloat(text) || 0;
        });

        // Материали от каталог (Materials.selectedMaterials)
        let totalMaterialsCatalog = 0;
        const Materials = window.Materials;
        if (Materials && Materials.selectedMaterials) {
            Object.values(Materials.selectedMaterials).forEach(sel => {
                if (sel && sel.material && sel.quantity) {
                    totalMaterialsCatalog += (sel.material.price || 0) * sel.quantity;
                }
            });
        }

        // Междинна сума
        const subtotal = totalOverall + totalMaterialsCatalog + totalInstallation + totalLabor;

        // Надценка
        const markupPercent = parseFloat(document.getElementById('markupPercent')?.value) || 0;
        const markupAmount = subtotal * (markupPercent / 100);

        // Сума след надценка
        const afterMarkup = subtotal + markupAmount;

        // ДДС
        const vat = afterMarkup * 0.2;
        const grandTotal = afterMarkup + vat;

        // Обновяване на дисплея
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value.toFixed(2) + ' лв';
        };

        updateElement('totalOverall', totalOverall);
        updateElement('totalMaterialsCatalog', totalMaterialsCatalog);
        updateElement('totalInstallation', totalInstallation);
        updateElement('totalLabor', totalLabor);
        updateElement('subtotal', subtotal);
        updateElement('markupAmount', markupAmount);
        updateElement('vat', vat);
        updateElement('grandTotal', grandTotal);

        // Обновяване и в таба за материали
        const materialsTotalElement = document.getElementById('totalMaterials');
        if (materialsTotalElement) {
            materialsTotalElement.textContent = totalMaterials.toFixed(2) + ' лв';
        }
    },

    // Добавяне на ред за общи разходи
    addOverallCostRow() {
        const tbody = document.querySelector('#overallCostsTable tbody');
        if (!tbody) return;

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" value="Нова услуга" class="item-name"></td>
            <td><input type="number" value="0" step="0.01" class="item-price"></td>
            <td><button class="delete-row-btn" onclick="Tables.deleteRow(this)">🗑️</button></td>
        `;
        tbody.appendChild(newRow);
        
        // 🆕 ОБНОВЯВАНЕ НА ВИСОЧИНАТА
        const addButton = event?.target;
        if (addButton) {
            setTimeout(() => this.updateCollapsibleHeight(addButton), 100);
        }
    },

    // Добавяне на ред за монтаж
    addInstallationRow() {
        const tbody = document.getElementById('installationTableBody');
        if (!tbody) return;

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" value="Нова услуга" class="service-name"></td>
            <td><input type="number" value="1" min="0" step="1" class="service-qty"></td>
            <td><input type="number" value="0.00" min="0" step="0.01" class="service-price"></td>
            <td class="row-total service-total">0.00 лв</td>
            <td><button class="delete-row-btn" onclick="Tables.deleteRow(this)">🗑️</button></td>
        `;
        tbody.appendChild(newRow);
        
        // 🆕 ОБНОВЯВАНЕ НА ВИСОЧИНАТА
        const addButton = event?.target;
        if (addButton) {
            setTimeout(() => this.updateCollapsibleHeight(addButton), 100);
        }
    },

    // Добавяне на ред за труд
    addLaborRow() {
        const tbody = document.getElementById('laborTableBody');
        if (!tbody) return;

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="text" value="Нова операция" class="operation-name"></td>
            <td><input type="number" value="0" min="0" step="1" class="operation-qty"></td>
            <td><input type="number" value="0.00" min="0" step="0.01" class="operation-price"></td>
            <td class="row-total operation-total">0.00 лв</td>
            <td><button class="delete-row-btn" onclick="Tables.deleteRow(this)">🗑️</button></td>
        `;
        tbody.appendChild(newRow);
        
        // 🆕 ОБНОВЯВАНЕ НА ВИСОЧИНАТА
        const addButton = event?.target;
        if (addButton) {
            setTimeout(() => this.updateCollapsibleHeight(addButton), 100);
        }
    },

    // Изтриване на ред
    deleteRow(button) {
        const row = button.closest('tr');
        if (row && confirm('Сигурни ли сте, че искате да изтриете този ред?')) {
            row.remove();
            this.calculateTotals();
            
            // 🆕 ОБНОВЯВАНЕ НА ВИСОЧИНАТА СЛЕД ИЗТРИВАНЕ
            setTimeout(() => this.updateCollapsibleHeight(button), 100);
        }
    },

    // Превключване на колапсиращи секции
    toggleCollapsible(element) {
        element.classList.toggle('active');
        const content = element.nextElementSibling;
        if (content.style.maxHeight && content.style.maxHeight !== 'none') {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    },

    // 🆕 ПОДОБРЕНО АВТОМАТИЧНО ИЗЧИСЛЕНИЕ ОТ ПРОЕКТ
    autoCalculateFromProject() {
        const project = State.currentProject;
        if (!project || project.length === 0) {
            alert('⚠️ Няма шкафове в проекта за автоматично изчисление!');
            return;
        }

        console.log(`📊 Авто изчисление за ${project.length} шкафа...`);

        // Събиране на всички елементи от всички шкафове
        let totalComponents = 0;
        let totalDrawers = 0;
        let totalHinges = 0;
        let totalShelves = 0;
        let totalEdgeLength = 0; // в метри
        let totalBodyEdge = 0;
        let totalDoorEdge = 0;

       project.forEach(cabinet => {
    // Умножаваме по бройката на шкафа (ако има поле quantity)
    const cabinetQty = cabinet.quantity || 1;

    // Генериране на елементите за този шкаф
    const elements = Calculator.generateCabinetElements ?
                    Calculator.generateCabinetElements(cabinet) : [];

    elements.forEach(element => {
        const qty = (element.quantity || 0) * cabinetQty;

        // 🔧 ПОПРАВКА: Броим САМО компоненти за рязане (БЕЗ хардуер)
        if (element.category === 'component' || element.category === 'door' || element.category === 'back') {
            totalComponents += qty;
        }

        // Броене на специфични елементи
        if (element.name === 'Чекмеджета') {
            totalDrawers += qty;
        }
        if (element.name === 'Панти') {
            totalHinges += qty;
        }
        if (element.name === 'Рафтове' || element.name === 'Рафт') {
            totalShelves += qty;
        }

        // Изчисляване на кантове
        if (element.size && element.category) {
            const [w, h] = element.size.replace(' мм', '').split('x').map(Number);
            if (w && h) {
                const perimeter = (w + h) * 2 / 1000; // в метри
                const totalLength = perimeter * qty;

                if (element.category === 'door') {
                    totalDoorEdge += totalLength;
                } else if (element.category === 'component' || element.category === 'back') {
                    totalBodyEdge += totalLength;
                }
            }
        }
    });
});

        totalEdgeLength = totalBodyEdge + totalDoorEdge;

        // 🆕 Бройка плотове и гръбове (от Materials.selectedMaterials)
        let totalPlotove = 0;
        let totalGrubove = 0;
        const Materials = window.Materials;
        if (Materials && Materials.selectedMaterials) {
            if (Materials.selectedMaterials.plotove_plot) {
                totalPlotove = Materials.selectedMaterials.plotove_plot.quantity || 0;
            }
        }
        // Гръбовете = брой шкафове с has_back !== false
        project.forEach(cabinet => {
            const qty = cabinet.quantity || 1;
            if (cabinet.has_back !== false && cabinet.type !== 'panel' && cabinet.type !== 'plinth') {
                totalGrubove += qty;
            }
        });

        console.log(`  Компоненти: ${totalComponents}`);
        console.log(`  Чекмеджета: ${totalDrawers}`);
        console.log(`  Панти: ${totalHinges}`);
        console.log(`  Рафтове: ${totalShelves}`);
        console.log(`  Кант корпус: ${totalBodyEdge.toFixed(2)}м`);
        console.log(`  Кант врати: ${totalDoorEdge.toFixed(2)}м`);
        console.log(`  Плотове: ${totalPlotove}, Гръбове: ${totalGrubove}`);

        // ПОПЪЛВАНЕ НА ТРУД
        const laborRows = document.querySelectorAll('#laborTableBody tr');
        laborRows.forEach(row => {
            const nameInput = row.querySelector('.operation-name');
            const qtyInput = row.querySelector('.operation-qty');
            
            if (!nameInput || !qtyInput) return;
            
            const operationName = nameInput.value.toLowerCase();
            
            // Сглобяване на модули = брой шкафове
            if (operationName.includes('сглобяване') && operationName.includes('модул')) {
                qtyInput.value = project.length;
                this.calculateOperationRow(qtyInput);
            }
            
            // 🔧 ПОПРАВКА: "Рязане на плот/гръб" = бройка плотове + бройка гръбове
            if (operationName.includes('рязане') && (operationName.includes('плот') || operationName.includes('гръб'))) {
                qtyInput.value = totalPlotove + totalGrubove;
                this.calculateOperationRow(qtyInput);
            }
            // Рязане (обикновено) = общ брой компоненти за рязане (без плот/гръб)
            else if (operationName.includes('рязане') && !operationName.includes('криволинейно') && !operationName.includes('плот') && !operationName.includes('гръб')) {
                qtyInput.value = totalComponents;
                this.calculateOperationRow(qtyInput);
            }
            
            // Кантиране корпус (0,8мм)
            if (operationName.includes('кантиране') && operationName.includes('0,8')) {
                qtyInput.value = totalBodyEdge.toFixed(2);
                this.calculateOperationRow(qtyInput);
            }
            
            // Кантиране врати (1 до 2мм)
            if (operationName.includes('кантиране') && operationName.includes('1 до 2')) {
                qtyInput.value = totalDoorEdge.toFixed(2);
                this.calculateOperationRow(qtyInput);
            }
            
            // Монтаж на чекмедже
            if (operationName.includes('монтаж') && operationName.includes('чекмедже')) {
                qtyInput.value = totalDrawers;
                this.calculateOperationRow(qtyInput);
            }

            // 🆕 Панти
            if (operationName.includes('панти') || (operationName.includes('монтаж') && operationName.includes('пант'))) {
                qtyInput.value = totalHinges;
                this.calculateOperationRow(qtyInput);
            }
        });

        // ПОПЪЛВАНЕ НА МОНТАЖ
        const installationRows = document.querySelectorAll('#installationTableBody tr');
        installationRows.forEach(row => {
            const nameInput = row.querySelector('.service-name');
            const qtyInput = row.querySelector('.service-qty');
            
            if (!nameInput || !qtyInput) return;
            
            const serviceName = nameInput.value.toLowerCase();
            
            // Монтаж на модули = брой шкафове
            if (serviceName.includes('монтаж') && serviceName.includes('модул')) {
                qtyInput.value = project.length;
                this.calculateServiceRow(qtyInput);
            }
        });

        // ═══════════════════════════════════════════════════════
        // 🆕 ОБНОВЯВАНЕ НА БРОЙКИ МАТЕРИАЛИ В КАТАЛОГА
        // Само материалите, които реално се използват от шкафовете
        // ═══════════════════════════════════════════════════════
        if (Materials && Materials.selectedMaterials) {
            console.log('📦 Обновяване на бройки материали...');

            // Събираме бройки по категория от елементите
            let totalLegs = 0;          // крака
            let totalShelfHolders = 0;  // рафтодържачи
            let totalGuides = 0;        // водачи за чекмеджета
            let totalLiftMechs = 0;     // повдигащи механизми
            let totalBackCount = 0;     // гръбове

            project.forEach(cabinet => {
                const qty = cabinet.quantity || 1;
                const elements = Calculator.generateCabinetElements ?
                    Calculator.generateCabinetElements(cabinet) : [];

                elements.forEach(el => {
                    const elQty = (el.quantity || 0) * qty;

                    if (el.name === 'Крака') totalLegs += elQty;
                    if (el.name === 'Рафтодържачи') totalShelfHolders += elQty;
                    if (el.name === 'Водачи') totalGuides += elQty;
                    if (el.name === 'Панти') totalHinges += 0; // вече пресметнати горе
                    if (el.category === 'back') totalBackCount += elQty;
                    if (el.name && el.name.includes('Повдигащ механизъм')) totalLiftMechs += elQty;
                });
            });

            console.log(`  Крака: ${totalLegs}, Панти: ${totalHinges}, Рафтодържачи: ${totalShelfHolders}`);
            console.log(`  Водачи: ${totalGuides}, Повдигащи: ${totalLiftMechs}, Гръбове: ${totalBackCount}`);

            // Обновяваме само избраните (маркираните) материали
            // Ако материалът е избран но не е нужен — бройка = 0

            // Панти
            if (Materials.selectedMaterials.panti) {
                Materials.selectedMaterials.panti.quantity = totalHinges;
            }
            // Крака
            if (Materials.selectedMaterials.kraka) {
                Materials.selectedMaterials.kraka.quantity = totalLegs;
            }
            // Чекмеджета (системи за чекмеджета = брой чекмеджета)
            if (Materials.selectedMaterials.chekmedzheta) {
                Materials.selectedMaterials.chekmedzheta.quantity = totalDrawers;
            }
            // Повдигащи механизми
            if (Materials.selectedMaterials.povdigashti) {
                Materials.selectedMaterials.povdigashti.quantity = totalLiftMechs;
            }
            // Окачвачи = брой горни шкафове * 2
            if (Materials.selectedMaterials.okachvachi) {
                const upperCount = project.filter(c =>
                    c.type === 'upper' || c.type === 'upperLift'
                ).reduce((sum, c) => sum + (c.quantity || 1), 0);
                Materials.selectedMaterials.okachvachi.quantity = upperCount * 2;
            }
            // Дръжки — долни
            if (Materials.selectedMaterials.drujki_lower) {
                const lowerDoors = project.filter(c =>
                    c.type === 'base' || c.type === 'sink' || c.type === 'oven' || c.type === 'blind'
                ).reduce((sum, c) => sum + ((c.door_count || 0) * (c.quantity || 1)), 0);
                const lowerDrawers = project.filter(c => c.type === 'drawer')
                    .reduce((sum, c) => sum + ((c.drawer_count || 0) * (c.quantity || 1)), 0);
                Materials.selectedMaterials.drujki_lower.quantity = lowerDoors + lowerDrawers;
            }
            // Дръжки — горни
            if (Materials.selectedMaterials.drujki_upper) {
                const upperDoors = project.filter(c =>
                    c.type === 'upper' || c.type === 'upperLift'
                ).reduce((sum, c) => sum + ((c.door_count || 0) * (c.quantity || 1)), 0);
                Materials.selectedMaterials.drujki_upper.quantity = upperDoors;
            }
            // Други (рафтодържачи) — само ако реално има рафтове
            if (Materials.selectedMaterials.drugi && totalShelfHolders > 0) {
                Materials.selectedMaterials.drugi.quantity = totalShelfHolders;
            }
            // Кантове (общо метри)
            if (Materials.selectedMaterials.kantove) {
                Materials.selectedMaterials.kantove.quantity = Math.ceil(totalEdgeLength);
            }
            // Плотове — потребителят задава ръчно
            // Кошници/Бутилкови механизми — за baseBasket шкафове
            if (Materials.selectedMaterials.butilieri) {
                const basketCount = project.filter(c => c.type === 'baseBasket')
                    .reduce((sum, c) => sum + (c.quantity || 1), 0);
                Materials.selectedMaterials.butilieri.quantity = basketCount;
            }
            // Механизми за долен шкаф — за baseMechanism шкафове
            if (Materials.selectedMaterials.mehanizmiDolen) {
                const mechCount = project.filter(c => c.type === 'baseMechanism')
                    .reduce((sum, c) => sum + (c.quantity || 1), 0);
                Materials.selectedMaterials.mehanizmiDolen.quantity = mechCount;
            }
            // Повдигащи — включваме и baseMechanism ако има
            if (Materials.selectedMaterials.povdigashti) {
                const liftCount = project.filter(c => c.type === 'upperLift')
                    .reduce((sum, c) => sum + (c.quantity || 1), 0);
                Materials.selectedMaterials.povdigashti.quantity = liftCount;
            }

            // Запазваме и обновяваме UI
            if (Materials.saveSelections) Materials.saveSelections();
            if (Materials.renderMaterialsTab) Materials.renderMaterialsTab();
        }

        // Преизчисляване на всички тотали
        this.calculateTotals();
        
        alert(`✅ Автоматично изчисление завършено!\n\n` +
              `📦 Шкафове: ${project.length} бр\n` +
              `🔨 Компоненти: ${totalComponents} бр\n` +
              `📏 Кант корпус: ${totalBodyEdge.toFixed(2)} м\n` +
              `📏 Кант врати: ${totalDoorEdge.toFixed(2)} м\n` +
              `🗃️ Чекмеджета: ${totalDrawers} бр\n` +
              `🦵 Крака: ${totalLegs || 0} бр\n` +
              `🔩 Панти: ${totalHinges} бр`);

        // 🆕 Background cutlist оптимизация → обновява бройки плоскости в Materials
        const CutListBridge = window.CutListBridge;
        if (CutListBridge && CutListBridge.runBackgroundOptimization) {
            console.log('📐 Стартиране на background cutlist оптимизация...');
            CutListBridge.runBackgroundOptimization().then(result => {
                if (result) {
                    console.log('✅ Background cutlist завършен, бройки плоскости обновени');
                    // Преизчисляваме тоталите с новите бройки
                    this.calculateTotals();
                }
            }).catch(err => {
                console.warn('⚠️ Background cutlist грешка:', err);
            });
        }
    },

    // Обновяване на списъка с профили
    updateProfilesList() {
        const profilesList = document.getElementById('savedProfilesList');
        if (profilesList) {
            const names = Object.keys(State.pricingProfiles || {});
            profilesList.textContent = names.length > 0 ? names.join(', ') : 'няма';
        }
    },

    // Запазване на профил
    saveProfile() {
        const nameInput = document.getElementById('profileName');
        if (!nameInput) return;

        const name = nameInput.value.trim();
        if (!name) {
            alert('Моля, въведете име за профила!');
            return;
        }

        // Събиране на данните от таблиците
        const profileData = {
            materials: this.getTableData('#materialsTable tbody tr'),
            overallCosts: this.getTableData('#overallCostsTable tbody tr'),
            installation: this.getTableData('#installationTableBody tr'),
            labor: this.getTableData('#laborTableBody tr')
        };

        State.savePricingProfile(name, profileData);
        this.updateProfilesList();
        alert(`✅ Профил "${name}" запазен успешно!`);
    },

    // Зареждане на профил
    loadProfile() {
        const nameInput = document.getElementById('profileName');
        if (!nameInput) return;

        const name = nameInput.value.trim();
        if (!name) {
            alert('Моля, въведете име на профил!');
            return;
        }

        const profile = State.loadPricingProfile(name);
        if (!profile) {
            alert(`Профил "${name}" не съществува!`);
            return;
        }

        // Зареждане на данните в таблиците
        if (profile.materials) this.setTableData('#materialsTable tbody tr', profile.materials);
        if (profile.overallCosts) this.setTableData('#overallCostsTable tbody tr', profile.overallCosts);
        if (profile.installation) this.setTableData('#installationTableBody tr', profile.installation);
        if (profile.labor) this.setTableData('#laborTableBody tr', profile.labor);

        this.calculateTotals();
        alert(`✅ Профил "${name}" зареден успешно!`);
    },

    // Изтриване на профил
    deleteProfile() {
        const nameInput = document.getElementById('profileName');
        if (!nameInput) return;

        const name = nameInput.value.trim();
        if (!name) {
            alert('Моля, въведете име на профил!');
            return;
        }

        if (!State.pricingProfiles || !State.pricingProfiles[name]) {
            alert(`Профил "${name}" не съществува!`);
            return;
        }

        if (confirm(`Сигурни ли сте, че искате да изтриете профил "${name}"?`)) {
            State.deletePricingProfile(name);
            this.updateProfilesList();
            alert(`✅ Профил "${name}" изтрит успешно!`);
        }
    },

    // Помощни методи за работа с таблици
    getTableData(selector) {
        const rows = document.querySelectorAll(selector);
        const data = [];

        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const rowData = {};
            inputs.forEach((input, index) => {
                rowData[`col${index}`] = input.value;
            });
            data.push(rowData);
        });

        return data;
    },

    setTableData(selector, data) {
        const rows = document.querySelectorAll(selector);

        data.forEach((rowData, index) => {
            if (rows[index]) {
                const inputs = rows[index].querySelectorAll('input');
                inputs.forEach((input, colIndex) => {
                    if (rowData[`col${colIndex}`] !== undefined) {
                        input.value = rowData[`col${colIndex}`];
                    }
                });
            }
        });
    }
};

// Експортираме глобално
window.Tables = Tables;
