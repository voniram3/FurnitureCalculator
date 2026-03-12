import { 
    materialCategories, 
    loadAllMaterials, 
    getMaterialById,
    searchMaterials
} from '../data/materialCategories.js';
import { State } from './state.js';

// Модул за управление на материали - ФИНАЛНА версия
export const Materials = {
    selectedMaterials: {
        // Плочи - 4 подменюта
        plohi_corpus: null,
        plohi_doors: null,
        plohi_panels: null,
        plohi_plinth: null,
        
        // Дръжки - 2 подменюта
        drujki_lower: null,
        drujki_upper: null,
        
        // Останалите категории - директно
        plotove: null,
        panti: null,
        povdigashti: null,
        butilieri: null,
        mehanizmiDolen: null,
        okachvachi: null,
        chekmedzheta: null,
        kraka: null,
        drugi: null,
        kantove: null
    },
    loaded: false,
    currentModal: null,
    currentCategory: null,
    currentSubcategory: null,
    
    // Инициализация
    async init() {
        console.log('🔧 Materials module initializing...');
        await loadAllMaterials();
        this.loaded = true;
        console.log('✅ Materials loaded');
        this.loadSelections();
        this.renderMaterialsTab();
        this.bindEvents();
    },
    
    // Рендериране на Materials таба
    renderMaterialsTab() {
        const container = document.getElementById('materialsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="materials-header" style="margin-bottom: 25px;">
                <h3 style="color: #667eea; margin-bottom: 5px;">📦 Материали и фурнитура</h3>
                <p style="color: #666; font-size: 0.95em;">Изберете необходимите материали за проекта</p>
            </div>
            
            ${this.renderSelectedSummary()}
            ${this.renderAllCategories()}
            
            <div id="materialModal" class="material-modal" style="display: none;"></div>
        `;
        
        this.bindCollapsibleEvents();
    },
    
    // Обобщение на избрани материали
    renderSelectedSummary() {
        const selected = Object.entries(this.selectedMaterials).filter(([k, v]) => v !== null);
        if (selected.length === 0) return '';
        
        const total = selected.reduce((sum, [k, data]) => {
            return sum + ((data.material.price || 0) * data.quantity);
        }, 0);
        
        return `
            <div class="form-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-bottom: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0 0 5px 0;">✓ Избрани материали</h4>
                        <p style="margin: 0; opacity: 0.9; font-size: 0.9em;">${selected.length} избрани</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 2em; font-weight: 700;">${total.toFixed(2)} лв</div>
                        <div style="font-size: 0.85em; opacity: 0.9;">Обща стойност</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Рендериране на всички категории
    renderAllCategories() {
        let html = '';
        
        // ПЛОЧИ - със 4 подменюта
        html += this.renderCategoryWithSubmenu('plohi', [
            { key: 'corpus', name: 'Корпус (страници, дъно, капак, стабилизатори)' },
            { key: 'doors', name: 'Вратички' },
            { key: 'panels', name: 'Допълнителни плоскости' },
            { key: 'plinth', name: 'Цокъл' }
        ]);
        
        // ДРЪЖКИ - с 2 подменюта
        html += this.renderCategoryWithSubmenu('drujki', [
            { key: 'lower', name: 'Долни шкафове' },
            { key: 'upper', name: 'Горни шкафове' }
        ]);
        
        // Останалите категории - без подменюта
        const simpleCategories = ['plotove', 'panti', 'povdigashti', 'butilieri', 
                                 'mehanizmiDolen', 'okachvachi', 'chekmedzheta', 
                                 'kraka', 'drugi', 'kantove'];
        
        simpleCategories.forEach(key => {
            html += this.renderSimpleCategory(key);
        });
        
        return html;
    },
    
    // Рендериране на категория с подменюта
    renderCategoryWithSubmenu(categoryKey, submenus) {
        const category = materialCategories[categoryKey];
        if (!category) return '';
        
        const hasSelected = submenus.some(sub => 
            this.selectedMaterials[`${categoryKey}_${sub.key}`] !== null
        );
        
        const headerStyle = hasSelected 
            ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;'
            : '';
        
        let html = `
            <button type="button" class="collapsible" data-category="${categoryKey}" style="${headerStyle}">
                ${category.name}
                ${hasSelected ? '<span style="opacity: 0.9; margin-left: 10px;">✓</span>' : ''}
            </button>
            <div class="collapsible-content">
                <div class="collapsible-content-inner" style="padding: 15px;">
        `;
        
        submenus.forEach(sub => {
            const fullKey = `${categoryKey}_${sub.key}`;
            const selected = this.selectedMaterials[fullKey];
            
            html += `
                <div style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #667eea; font-size: 0.95em;">${sub.name}</h4>
                    ${selected ? this.renderSelectedMaterialCompact(fullKey, selected, category) : ''}
                    <button class="btn btn-success" onclick="Materials.openMaterialSelector('${categoryKey}', '${sub.key}')" 
                            style="width: 100%; margin-top: ${selected ? '10px' : '0'};">
                        ${selected ? '✏️ Промени материал' : '➕ Избери материал'}
                    </button>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    // Рендериране на проста категория
    renderSimpleCategory(categoryKey) {
        const category = materialCategories[categoryKey];
        if (!category) return '';
        
        const selected = this.selectedMaterials[categoryKey];
        const headerStyle = selected 
            ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;'
            : '';
        
        return `
            <button type="button" class="collapsible" data-category="${categoryKey}" style="${headerStyle}">
                ${category.name}
                ${selected ? `<span style="opacity: 0.9; font-size: 0.9em; margin-left: 10px;">✓ ${selected.quantity} ${selected.material.unit}</span>` : ''}
            </button>
            <div class="collapsible-content">
                <div class="collapsible-content-inner" style="padding: 15px;">
                    ${selected ? this.renderSelectedMaterialCard(categoryKey, selected, category) : ''}
                    <button class="btn btn-success" onclick="Materials.openMaterialSelector('${categoryKey}')" 
                            style="width: 100%; margin-top: ${selected ? '15px' : '0'};">
                        ${selected ? '✏️ Промени материал' : '➕ Избери материал'}
                    </button>
                </div>
            </div>
        `;
    },
    
    // Компактна карта за избран материал (в подменюта)
    renderSelectedMaterialCompact(key, data, category) {
        const { material, quantity } = data;
        const total = (material.price || 0) * quantity;
        const displayName = material.code ? `${material.code} - ${material.name}` : material.name;
        
        return `
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #333; font-size: 0.9em;">${displayName}</div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 3px;">
                            ${material.size ? material.size + ' • ' : ''}${material.price ? material.price.toFixed(2) + ' лв/' + material.unit : 'N/A'}
                        </div>
                        <div style="font-size: 0.8em; color: #999; margin-top: 3px;">
                            Количество: <strong>${quantity} ${material.unit}</strong>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.1em; font-weight: 700; color: #667eea;">${total.toFixed(2)} лв</div>
                        <button class="btn btn-small btn-danger" onclick="Materials.removeMaterial('${key}')" style="margin-top: 5px;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Пълна карта за избран материал
    renderSelectedMaterialCard(key, data, category) {
        const { material, quantity, edge } = data;
        const total = (material.price || 0) * quantity;
        const displayName = material.code ? `${material.code} - ${material.name}` : material.name;
        
        return `
            <div style="background: #f8f9fa; border: 2px solid #667eea; border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 15px; align-items: center;">
                    ${material.image ? 
                        `<img src="${material.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">` :
                        `<div style="width: 60px; height: 60px; background: #e0e0e0; border-radius: 5px;"></div>`
                    }
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 3px;">${displayName}</div>
                        <div style="font-size: 0.85em; color: #666;">
                            ${material.size ? material.size + ' • ' : ''}${material.price ? material.price.toFixed(2) + ' лв/' + material.unit : 'N/A'}
                        </div>
                        <div style="font-size: 0.85em; color: #999; margin-top: 3px;">
                            Количество: <strong>${quantity} ${material.unit}</strong>
                            ${edge ? ` • Кант: ${edge.name}` : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2em; font-weight: 700; color: #667eea;">${total.toFixed(2)} лв</div>
                        <button class="btn btn-small btn-danger" onclick="Materials.removeMaterial('${key}')" style="margin-top: 5px;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Отваряне на material selector modal
    openMaterialSelector(categoryKey, subcategory = null) {
        const category = materialCategories[categoryKey];
        if (!category) return;
        
        this.currentCategory = categoryKey;
        this.currentSubcategory = subcategory;
        
        const fullKey = subcategory ? `${categoryKey}_${subcategory}` : categoryKey;
        const currentSelection = this.selectedMaterials[fullKey];
        const selectedId = currentSelection?.material?.id;
        
        const modal = document.getElementById('materialModal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        modal.innerHTML = this.renderMaterialSelectorModal(category, selectedId);
        
        this.bindModalEvents();
    },
    
    // Рендериране на material selector modal
    renderMaterialSelectorModal(category, selectedId) {
        return `
            <div class="material-modal-overlay" onclick="Materials.closeMaterialSelector()"></div>
            <div class="material-modal-content" onclick="event.stopPropagation()">
                <div class="material-modal-header">
                    <h3 style="margin: 0; color: #667eea;">${category.name}</h3>
                    <button onclick="Materials.closeMaterialSelector()" style="background: none; border: none; font-size: 1.5em; cursor: pointer; color: #999;">✕</button>
                </div>
                
                <div style="padding: 15px; border-bottom: 1px solid #eee;">
                    <input type="text" 
                           id="materialSearchInput" 
                           placeholder="🔍 Търси по име или код..." 
                           style="width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em;">
                </div>
                
                <div class="material-modal-body">
                    <div class="material-list" id="materialList">
                        ${category.items.length === 0 ? 
                            '<div style="padding: 40px; text-align: center; color: #999;">Няма налични материали</div>' :
                            category.items.map(item => this.renderMaterialListItem(item, selectedId)).join('')
                        }
                    </div>
                    
                    <div class="material-preview" id="materialPreview">
                        ${selectedId ? this.renderMaterialPreview(getMaterialById(selectedId)) : 
                            '<div style="padding: 40px; text-align: center; color: #999;"><div style="font-size: 3em; margin-bottom: 10px;">👈</div><p>Изберете материал от списъка</p></div>'
                        }
                    </div>
                </div>
            </div>
            
            <style>
                .material-modal {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000;
                    display: flex; align-items: center; justify-content: center;
                }
                .material-modal-overlay {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                }
                .material-modal-content {
                    position: relative; background: white; border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); width: 90%; max-width: 900px;
                    max-height: 80vh; display: flex; flex-direction: column;
                }
                .material-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px; border-bottom: 1px solid #eee;
                }
                .material-modal-body {
                    display: grid; grid-template-columns: 1fr 300px; gap: 0;
                    overflow: hidden; flex: 1;
                }
                .material-list {
                    overflow-y: auto; max-height: 400px; border-right: 1px solid #eee;
                }
                .material-list-item {
                    padding: 12px 20px; border-bottom: 1px solid #f0f0f0;
                    cursor: pointer; transition: background 0.2s;
                }
                .material-list-item:hover { background: #f8f9fa; }
                .material-list-item.selected {
                    background: #e7f0ff; border-left: 4px solid #667eea;
                }
                .material-preview { padding: 20px; overflow-y: auto; }
            </style>
        `;
    },
    
    // Рендериране на material list item
    renderMaterialListItem(item, selectedId) {
        const isSelected = item.id === selectedId;
        const price = (item.price !== null && item.price !== undefined) 
            ? item.price.toFixed(2) + ' лв' 
            : 'N/A';
        const displayName = item.code ? `${item.code} - ${item.name}` : item.name;
        
        return `
            <div class="material-list-item ${isSelected ? 'selected' : ''}" 
                 data-material-id="${item.id}"
                 data-search-text="${(item.code || '').toLowerCase()} ${item.name.toLowerCase()}"
                 onclick="Materials.selectMaterial('${item.id}')">
                <div style="font-weight: 500; color: #333; margin-bottom: 3px;">${displayName}</div>
                <div style="font-size: 0.9em; color: #666;">
                    ${price}/${item.unit}
                    ${item.size ? ` • ${item.size}` : ''}
                    ${item.brand ? ` • ${item.brand}` : ''}
                </div>
            </div>
        `;
    },
    
    // Рендериране на material preview
    renderMaterialPreview(material) {
        if (!material) return '';
        
        const fullKey = this.currentSubcategory 
            ? `${this.currentCategory}_${this.currentSubcategory}` 
            : this.currentCategory;
        const currentSelection = this.selectedMaterials[fullKey];
        const quantity = currentSelection?.quantity || 1;
        const price = (material.price !== null && material.price !== undefined) 
            ? material.price.toFixed(2) 
            : 'N/A';
        const displayName = material.code ? `${material.code} - ${material.name}` : material.name;
        
        return `
            <div style="text-align: center;">
                ${material.image ? 
                    `<img src="${material.image}" style="width: 100%; max-width: 250px; height: auto; border-radius: 10px; margin-bottom: 15px;">` :
                    `<div style="width: 100%; height: 200px; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                        <span style="font-size: 4em; opacity: 0.3;">📦</span>
                    </div>`
                }
                
                <h4 style="color: #333; margin: 0 0 10px 0;">${displayName}</h4>
                
                <div style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                    ${material.size ? `📏 ${material.size}<br>` : ''}
                    ${material.thickness ? `${material.thickness}<br>` : ''}
                    ${material.brand ? `🏷️ ${material.brand}<br>` : ''}
                </div>
                
                <div style="font-size: 1.5em; font-weight: 700; color: #667eea; margin-bottom: 20px;">
                    ${price} лв/${material.unit}
                </div>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">Количество:</label>
                    <input type="number" 
                           id="materialQuantity" 
                           value="${quantity}" 
                           min="0.1" 
                           step="0.1"
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1.1em; text-align: center;">
                    <div style="font-size: 0.85em; color: #999; margin-top: 5px;">${material.unit}</div>
                </div>
                
                ${this.renderEdgeSelector(material)}
                
                <button class="btn btn-success" onclick="Materials.confirmMaterialSelection()" style="width: 100%; padding: 12px; font-size: 1.1em; margin-top: 10px;">
                    ✓ Избери материал
                </button>
            </div>
        `;
    },
    
    // Рендериране на edge selector
    renderEdgeSelector(material) {
        if (this.currentCategory !== 'plohi') return '';
        
        const kantoveCategory = materialCategories.kantove;
        if (!kantoveCategory || kantoveCategory.items.length === 0) return '';
        
        const materialCode = material.code || material.id || material.name.split(' ')[0];
        const matchingEdges = kantoveCategory.items.filter(edge => {
            return edge.materialCode === materialCode || 
                   edge.code === materialCode ||
                   edge.name.includes(materialCode);
        });
        
        const edgesToShow = matchingEdges.length > 0 ? matchingEdges : kantoveCategory.items;
        const fullKey = this.currentSubcategory 
            ? `${this.currentCategory}_${this.currentSubcategory}` 
            : this.currentCategory;
        const currentEdge = this.selectedMaterials[fullKey]?.edge;
        
        return `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">Кант:</label>
                <select id="materialEdge" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em;">
                    <option value="">-- Без кант --</option>
                    ${edgesToShow.map(edge => {
                        const price = edge.price ? edge.price.toFixed(2) : 'N/A';
                        const selected = currentEdge?.id === edge.id ? 'selected' : '';
                        return `<option value="${edge.id}" ${selected}>${edge.name} - ${price} лв/м</option>`;
                    }).join('')}
                </select>
            </div>
        `;
    },
    
    // Избор на материал
    selectMaterial(materialId) {
        const material = getMaterialById(materialId);
        if (!material) return;
        
        const preview = document.getElementById('materialPreview');
        if (preview) {
            preview.innerHTML = this.renderMaterialPreview(material);
        }
        
        document.querySelectorAll('.material-list-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-material-id="${materialId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    },
    
    // Потвърждаване на избор
    confirmMaterialSelection() {
        const selectedItem = document.querySelector('.material-list-item.selected');
        if (!selectedItem) {
            alert('Моля изберете материал!');
            return;
        }
        
        const materialId = selectedItem.getAttribute('data-material-id');
        const material = getMaterialById(materialId);
        const quantity = parseFloat(document.getElementById('materialQuantity')?.value) || 1;
        const edgeId = document.getElementById('materialEdge')?.value;
        const edge = edgeId ? getMaterialById(edgeId) : null;
        
        const fullKey = this.currentSubcategory 
            ? `${this.currentCategory}_${this.currentSubcategory}` 
            : this.currentCategory;
        
        this.selectedMaterials[fullKey] = { material, quantity, edge };
        
        this.closeMaterialSelector();
        this.renderMaterialsTab();
        this.saveSelections();
    },
    
    // Премахване на материал
    removeMaterial(key) {
        if (!confirm('Сигурни ли сте че искате да премахнете този материал?')) {
            return;
        }
        
        delete this.selectedMaterials[key];
        this.renderMaterialsTab();
        this.saveSelections();
    },
    
    // Затваряне на modal
    closeMaterialSelector() {
        const modal = document.getElementById('materialModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentCategory = null;
        this.currentSubcategory = null;
    },
    
    // Връзване на modal събития
    bindModalEvents() {
        const searchInput = document.getElementById('materialSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterMaterials(e.target.value);
            });
            setTimeout(() => searchInput.focus(), 100);
        }
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeMaterialSelector();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },
    
    // Филтриране на материали (търси по име И CODE)
    filterMaterials(query) {
        const lowerQuery = query.toLowerCase();
        
        document.querySelectorAll('.material-list-item').forEach(item => {
            const searchText = item.getAttribute('data-search-text') || '';
            if (searchText.includes(lowerQuery)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    // Връзване на събития
    bindEvents() {
        // Няма глобални събития
    },
    
    // Collapsible събития
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
    
    // Запазване на избори
    saveSelections() {
        try {
            localStorage.setItem('selectedMaterials', JSON.stringify(this.selectedMaterials));
        } catch (error) {
            console.error('Error saving selections:', error);
        }
    },
    
    // Зареждане на избори
    loadSelections() {
        try {
            const saved = localStorage.getItem('selectedMaterials');
            if (saved) {
                this.selectedMaterials = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading selections:', error);
        }
    },
    
    // Получаване на избрани материали
    getSelectedMaterials() {
        return this.selectedMaterials;
    }
};

window.Materials = Materials;
