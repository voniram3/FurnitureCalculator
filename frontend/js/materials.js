import { materialCategories, addMaterialToCategory, removeMaterialFromCategory, updateMaterial, exportMaterials, importMaterials } from '../data/materialCategories.js';
import { State } from './state.js';

// Модул за управление на материали
export const Materials = {
    currentCategory: null,
    quantities: {}, // Съхранява количествата: { itemId: quantity }
    
    // Инициализация
    init() {
        this.loadQuantitiesFromLocalStorage();
        this.renderMaterialsTab();
        this.bindEvents();
    },
    
    // Рендериране на Materials таба
    renderMaterialsTab() {
        const container = document.getElementById('materialsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="materials-header" style="margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h3 style="color: #667eea; margin-bottom: 5px;">📦 Управление на материали и фурнитура</h3>
                        <p style="color: #666; font-size: 0.95em;">Добавете, редактирайте и управлявайте наличните материали</p>
                    </div>
                    <div class="materials-actions">
                        <button class="btn btn-small btn-success" onclick="Materials.exportToFile()">📤 Експорт</button>
                        <button class="btn btn-small btn-secondary" onclick="Materials.importFromFile()">📥 Импорт</button>
                        <button class="btn btn-small btn-warning" onclick="Materials.resetToDefaults()">🔄 Възстанови</button>
                    </div>
                </div>
            </div>
            
            ${this.renderAllCategories()}
            
            <!-- Обща сума -->
            <div class="form-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-top: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">💰 Обща стойност на материали</h3>
                    <h2 id="materialsTotalValue" style="margin: 0; font-size: 2em;">0.00 лв</h2>
                </div>
            </div>
            
            <input type="file" id="materialImportFile" accept=".json" style="display: none;">
        `;
        
        this.bindCollapsibleEvents();
        this.calculateTotal();
    },
    
    // Рендериране на всички категории
    renderAllCategories() {
        let html = '';
        
        Object.entries(materialCategories).forEach(([key, category]) => {
            html += this.renderCategory(key, category);
        });
        
        return html;
    },
    
    // Рендериране на една категория
    renderCategory(categoryKey, category) {
        return `
            <button type="button" class="collapsible" data-category="${categoryKey}">
                ${category.name}
            </button>
            <div class="collapsible-content">
                <div class="collapsible-content-inner">
                    <table class="price-table materials-table" id="table-${categoryKey}">
                        <thead>
                            <tr>
                                <th>Материал / Артикул</th>
                                ${category.items[0]?.size ? '<th>Размер</th>' : ''}
                                ${category.items[0]?.thickness ? '<th>Дебелина</th>' : ''}
                                <th>Марка</th>
                                <th>Количество</th>
                                <th>Цена/ед.</th>
                                <th>Ед.</th>
                                <th>Обща цена</th>
                                <th style="width: 50px;">🗑️</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderCategoryItems(categoryKey, category)}
                        </tbody>
                    </table>
                    <div class="add-row-section">
                        <button class="btn btn-small btn-success" onclick="Materials.showAddItemDialog('${categoryKey}')">
                            ➕ Добави ${category.name.replace(/[^\w\s]/gi, '').trim()}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Рендериране на артикулите в категория
    renderCategoryItems(categoryKey, category) {
        let html = '';
        
        category.items.forEach((item, index) => {
            const quantity = this.quantities[item.id] || 0;
            const totalPrice = quantity * item.price;
            
            html += `
                <tr data-item-id="${item.id}">
                    <td>
                        <input type="text" 
                               class="material-name" 
                               value="${item.name}" 
                               data-category="${categoryKey}" 
                               data-id="${item.id}"
                               style="font-weight: 500;">
                    </td>
                    ${item.size !== undefined ? `
                        <td>
                            <input type="text" 
                                   class="material-size" 
                                   value="${item.size || ''}" 
                                   data-category="${categoryKey}" 
                                   data-id="${item.id}">
                        </td>
                    ` : ''}
                    ${item.thickness !== undefined ? `
                        <td>
                            <input type="text" 
                                   class="material-thickness" 
                                   value="${item.thickness || ''}" 
                                   data-category="${categoryKey}" 
                                   data-id="${item.id}">
                        </td>
                    ` : ''}
                    <td>
                        <input type="text" 
                               class="material-brand" 
                               value="${item.brand || ''}" 
                               data-category="${categoryKey}" 
                               data-id="${item.id}">
                    </td>
                    <td>
                        <input type="number" 
                               class="material-quantity" 
                               value="${quantity}" 
                               min="0" 
                               step="1" 
                               data-category="${categoryKey}" 
                               data-id="${item.id}"
                               style="background: #fff3cd; font-weight: bold;">
                    </td>
                    <td>
                        <input type="number" 
                               class="material-price" 
                               value="${item.price.toFixed(2)}" 
                               min="0" 
                               step="0.01" 
                               data-category="${categoryKey}" 
                               data-id="${item.id}">
                    </td>
                    <td style="text-align: center; color: #666;">
                        ${item.unit}
                    </td>
                    <td class="row-total" style="font-weight: bold; color: #28a745;">
                        ${totalPrice.toFixed(2)} лв
                    </td>
                    <td>
                        <button class="delete-row-btn" 
                                onclick="Materials.deleteItem('${categoryKey}', ${item.id})">🗑️</button>
                    </td>
                </tr>
            `;
        });
        
        return html;
    },
    
    // Показване на диалог за добавяне на артикул
    showAddItemDialog(categoryKey) {
        const category = materialCategories[categoryKey];
        if (!category) return;
        
        // Проверка какви полета има първия артикул
        const firstItem = category.items[0] || {};
        const hasSize = firstItem.size !== undefined;
        const hasThickness = firstItem.thickness !== undefined;
        
        const name = prompt(`Въведете име на нов ${category.name}:`);
        if (!name) return;
        
        let size = '';
        let thickness = '';
        
        if (hasSize) {
            size = prompt('Въведете размер (напр. 2800×2070):') || '';
        }
        
        if (hasThickness) {
            thickness = prompt('Въведете дебелина (напр. 18мм):') || '';
        }
        
        const brand = prompt('Въведете марка/производител:') || 'Generic';
        const priceStr = prompt('Въведете цена:');
        const price = parseFloat(priceStr) || 0;
        
        const unit = firstItem.unit || 'бр';
        
        const newItem = {
            name,
            price,
            unit,
            brand
        };
        
        if (hasSize) newItem.size = size;
        if (hasThickness) newItem.thickness = thickness;
        
        const success = addMaterialToCategory(categoryKey, newItem);
        
        if (success) {
            this.renderMaterialsTab();
            
            // Отваряме секцията
            setTimeout(() => {
                const collapsible = document.querySelector(`[data-category="${categoryKey}"]`);
                if (collapsible && !collapsible.classList.contains('active')) {
                    collapsible.click();
                }
            }, 100);
            
            alert('✅ Материалът е добавен успешно!');
        }
    },
    
    // Изтриване на артикул
    deleteItem(categoryKey, itemId) {
        if (!confirm('Сигурни ли сте, че искате да изтриете този артикул?')) {
            return;
        }
        
        const success = removeMaterialFromCategory(categoryKey, itemId);
        
        if (success) {
            // Изтриваме и количеството
            delete this.quantities[itemId];
            this.saveQuantitiesToLocalStorage();
            
            this.renderMaterialsTab();
            
            // Отваряме секцията
            setTimeout(() => {
                const collapsible = document.querySelector(`[data-category="${categoryKey}"]`);
                if (collapsible && !collapsible.classList.contains('active')) {
                    collapsible.click();
                }
            }, 100);
        }
    },
    
    // Връзване на събития
    bindEvents() {
        // Auto-save при промяна на полета
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('material-name') ||
                e.target.classList.contains('material-size') ||
                e.target.classList.contains('material-thickness') ||
                e.target.classList.contains('material-brand') ||
                e.target.classList.contains('material-price')) {
                
                this.handleFieldChange(e.target);
            }
            
            // Специална обработка за количество
            if (e.target.classList.contains('material-quantity')) {
                this.handleQuantityChange(e.target);
            }
        });
    },
    
    // Обработка на промяна в поле
    handleFieldChange(input) {
        const categoryKey = input.dataset.category;
        const itemId = parseInt(input.dataset.id);
        
        if (!categoryKey || !itemId) return;
        
        const updates = {};
        
        if (input.classList.contains('material-name')) {
            updates.name = input.value;
        } else if (input.classList.contains('material-size')) {
            updates.size = input.value;
        } else if (input.classList.contains('material-thickness')) {
            updates.thickness = input.value;
        } else if (input.classList.contains('material-brand')) {
            updates.brand = input.value;
        } else if (input.classList.contains('material-price')) {
            updates.price = parseFloat(input.value) || 0;
        }
        
        updateMaterial(categoryKey, itemId, updates);
        
        // Запазваме в localStorage
        this.saveToLocalStorage();
        
        // Преизчисляваме общата цена при промяна на цена
        if (input.classList.contains('material-price')) {
            this.updateRowTotal(input);
            this.calculateTotal();
        }
    },
    
    // Обработка на промяна в количество
    handleQuantityChange(input) {
        const itemId = parseInt(input.dataset.id);
        if (!itemId) return;
        
        const quantity = parseFloat(input.value) || 0;
        this.quantities[itemId] = quantity;
        
        // Обновяване на реда
        this.updateRowTotal(input);
        
        // Запазване
        this.saveQuantitiesToLocalStorage();
        
        // Преизчисляване на общата сума
        this.calculateTotal();
    },
    
    // Обновяване на цената на ред
    updateRowTotal(input) {
        const row = input.closest('tr');
        if (!row) return;
        
        const itemId = parseInt(input.dataset.id);
        const priceInput = row.querySelector('.material-price');
        const totalCell = row.querySelector('.row-total');
        
        if (!priceInput || !totalCell) return;
        
        const quantity = this.quantities[itemId] || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        
        totalCell.textContent = total.toFixed(2) + ' лв';
    },
    
    // Изчисляване на общата сума
    calculateTotal() {
        let grandTotal = 0;
        
        Object.entries(materialCategories).forEach(([categoryKey, category]) => {
            category.items.forEach(item => {
                const quantity = this.quantities[item.id] || 0;
                grandTotal += quantity * item.price;
            });
        });
        
        const totalElement = document.getElementById('materialsTotalValue');
        if (totalElement) {
            totalElement.textContent = grandTotal.toFixed(2) + ' лв';
        }
    },
    
    // Връзване на collapsible събития
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
    
    // Запазване в localStorage
    saveToLocalStorage() {
        try {
            const data = exportMaterials();
            localStorage.setItem('customMaterials', data);
        } catch (error) {
            console.error('Error saving materials:', error);
        }
    },
    
    // Запазване на количествата
    saveQuantitiesToLocalStorage() {
        try {
            localStorage.setItem('materialQuantities', JSON.stringify(this.quantities));
        } catch (error) {
            console.error('Error saving quantities:', error);
        }
    },
    
    // Зареждане от localStorage
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('customMaterials');
            if (data) {
                importMaterials(data);
                return true;
            }
        } catch (error) {
            console.error('Error loading materials:', error);
        }
        return false;
    },
    
    // Зареждане на количествата
    loadQuantitiesFromLocalStorage() {
        try {
            const data = localStorage.getItem('materialQuantities');
            if (data) {
                this.quantities = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading quantities:', error);
            this.quantities = {};
        }
    },
    
    // Експорт към файл
    exportToFile() {
        const data = {
            materials: JSON.parse(exportMaterials()),
            quantities: this.quantities
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `materials_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Материалите и количествата са експортирани успешно!');
    },
    
    // Импорт от файл
    importFromFile() {
        const fileInput = document.getElementById('materialImportFile');
        if (!fileInput) return;
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Импорт на материали
                    if (data.materials) {
                        importMaterials(JSON.stringify(data.materials));
                    }
                    
                    // Импорт на количества
                    if (data.quantities) {
                        this.quantities = data.quantities;
                        this.saveQuantitiesToLocalStorage();
                    }
                    
                    this.renderMaterialsTab();
                    this.saveToLocalStorage();
                    alert('✅ Материалите и количествата са импортирани успешно!');
                } catch (error) {
                    alert('❌ Грешка при импортиране на материали!');
                    console.error(error);
                }
            };
            reader.readAsText(file);
        };
        
        fileInput.click();
    },
    
    // Възстановяване на defaults
    resetToDefaults() {
        if (!confirm('Сигурни ли сте, че искате да възстановите материалите по подразбиране?\n\nВсички промени и количества ще бъдат изгубени!')) {
            return;
        }
        
        localStorage.removeItem('customMaterials');
        localStorage.removeItem('materialQuantities');
        location.reload();
    },
    
    // Получаване на материали с количества за други модули
    getMaterialsWithQuantities() {
        const result = [];
        
        Object.entries(materialCategories).forEach(([categoryKey, category]) => {
            category.items.forEach(item => {
                const quantity = this.quantities[item.id] || 0;
                if (quantity > 0) {
                    result.push({
                        ...item,
                        quantity,
                        total: quantity * item.price,
                        category: category.name
                    });
                }
            });
        });
        
        return result;
    }
};

// Експортираме глобално
window.Materials = Materials;
