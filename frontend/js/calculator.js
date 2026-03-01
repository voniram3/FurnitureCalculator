import { State } from './state.js';
import { UI } from './ui.js';
import { Api } from './api.js';

// Калкулаторни функции
export const Calculator = {
    // Изчисляване на един шкаф
    async calculateCabinet() {
        const formData = this.getCabinetFormData();
        if (!formData) return;

        // Валидация
        if (!this.validateCabinetData(formData)) {
            return;
        }

        // Показване на спинър
        UI.showLoading(true);
        UI.showError('');

        try {
            // API заявка към бекенда
            const result = await Api.calculateCabinet(formData);

            if (result.success) {
                // Показване на резултата
                UI.showResult(result.data);

                // Добавяне в историята
                State.addToHistory({
                    data: result.data,
                    formData: formData
                });

                // Обновяване на историята ако сме в този таб
                if (document.getElementById('history').classList.contains('active')) {
                    UI.loadHistory();
                }
            } else {
                UI.showError(result.error || 'Грешка при изчисление');
            }
        } catch (error) {
            console.error('Грешка при изчисление:', error);
            UI.showError(`Грешка при връзка със сървъра: ${error.message}`);
        } finally {
            UI.showLoading(false);
        }
    },

    // Изчисляване на цял проект
    async calculateProject() {
        const project = State.currentProject;
        if (project.length === 0) {
            alert('⚠️ Няма шкафове в проекта!');
            return;
        }

        if (!confirm(`Сигурни ли сте, че искате да изчислите целия проект (${project.length} шкафа)?`)) {
            return;
        }

        UI.showLoading(true);

        try {
            // API заявка за проект
            const result = await Api.calculateProject(project);

            if (result.success) {
                // Показване на резултата
                this.showProjectResult(result.data);

                // Добавяне в историята
                State.addToHistory({
                    data: result.data,
                    type: 'project',
                    cabinetCount: project.length
                });
            } else {
                alert(`Грешка при изчисление на проект: ${result.error}`);
            }
        } catch (error) {
            console.error('Грешка при изчисление на проект:', error);
            alert(`Грешка: ${error.message}`);
        } finally {
            UI.showLoading(false);
        }
    },

    // ДИРЕКТЕН EXCEL ЕКСПОРТ
    exportProject() {
        const project = State.currentProject;
        if (project.length === 0) {
            alert('⚠️ Няма данни за експорт!');
            return;
        }

        try {
            console.log('📊 Стартиране на Excel експорт...');
            this.exportToExcel(project);
        } catch (error) {
            console.error('Грешка при експорт:', error);
            alert(`❌ Грешка при експорт: ${error.message}`);
        }
    },

    // Excel експорт с детайлна разбивка
    exportToExcel(project) {
        if (!window.XLSX) {
            alert('❌ Грешка: Excel библиотеката не е заредена. Моля, презаредете страницата.');
            return;
        }

        // Генериране на данни
        const data = this.generateDetailedExportData(project);
        
        // Създаване на workbook
        const wb = window.XLSX.utils.book_new();
        const ws = window.XLSX.utils.aoa_to_sheet(data);
        
        // Автоматична ширина на колоните
        ws['!cols'] = [
            { wch: 40 }, // Име
            { wch: 10 }, // Бройка
            { wch: 20 }  // Размер
        ];
        
        window.XLSX.utils.book_append_sheet(wb, ws, 'Детайлна разбивка');
        
        // Записване на файла
        const filename = `Проект_${new Date().toISOString().slice(0, 10)}.xlsx`;
        window.XLSX.writeFile(wb, filename);
        
        alert('✅ Проектът е експортиран успешно в Excel файл!');
    },

    // Генериране на детайлни данни за експорт
    generateDetailedExportData(project) {
        const data = [];
        
        // Header
        data.push(['Име', 'Бройка', 'Размер']);
        
        // За всеки шкаф
        project.forEach((cabinet, index) => {
            // Заглавие на шкафа
            const cabinetName = this.getCabinetDisplayName(cabinet);
            data.push([cabinetName, null, null]);
            
            // Генериране на елементите
            const elements = this.generateCabinetElements(cabinet);
            
            // Добавяне на всеки елемент
            elements.forEach(element => {
                data.push([
                    element.name,
                    element.quantity,
                    element.size
                ]);
            });
            
            // Празен ред между шкафовете (освен след последния)
            if (index < project.length - 1) {
                data.push(['', '', '']);
            }
        });
        
        // Сумарна таблица
        data.push(['', '', '']);
        data.push(['═══ СУМАРНО ═══', '', '']);
        data.push(['', '', '']);
        
        const summary = this.generateDetailedSummary(project);
        summary.forEach(item => {
            data.push([item.category, item.value, item.details || '']);
        });
        
        return data;
    },

    // Име на шкафа за показване
    getCabinetDisplayName(cabinet) {
        const typeNames = {
            'base': 'Долен шкаф',
            'upper': 'Горен шкаф',
            'drawer': 'Долен шкаф чекмедже',
            'oven': 'Долен шкаф фурна',
            'sink': 'Долен шкаф мивка',
            'blind': 'Долен глух шкаф',
            'fridge': 'Колона хладилник',
            'column': 'Колона'
        };
        
        const typeName = typeNames[cabinet.type] || cabinet.type;
        return `${typeName} ${cabinet.width}мм`;
    },

    // Генериране на елементите на шкаф
    generateCabinetElements(cabinet) {
        const elements = [];
        const w = cabinet.width;
        const h = cabinet.height;
        const d = cabinet.depth;
        const type = cabinet.type;
        
        // 📐 ПРОВЕРКА ЗА МЕТОД НА КОНСТРУКЦИЯ
        const pagesBetweenPanels = cabinet.pages_between_panels === true;
        
        if (pagesBetweenPanels) {
            // ═══════════════════════════════════════════════════════════
            // МЕТОД 2: СТРАНИЦИ МЕЖДУ ДЪНО/КАПАК (БЕЗ СТАБИЛИЗАТОРИ)
            // ═══════════════════════════════════════════════════════════
            
            // Страници (ПО-НИСКИ - h минус две дебелини)
            elements.push({
                name: 'Страници',
                quantity: 2,
                size: `${h - 36}x${d} мм`,  // ← h - 36 вместо h
                category: 'component'
            });
            
            // Дъно (ПЪЛНА ШИРИНА)
            if (type !== 'upper' && type !== 'fridge') {
                elements.push({
                    name: 'Дъно',
                    quantity: 1,
                    size: `${w}x${d} мм`,  // ← w вместо (w - 36)
                    category: 'component'
                });
            }
            
            // Капак (ПЪЛНА ШИРИНА)
            if (type === 'base' || type === 'sink' || type === 'blind' || type === 'column' || type === 'fridge') {
                elements.push({
                    name: 'Капак',
                    quantity: 1,
                    size: `${w}x${d} мм`,  // ← w вместо (w - 36)
                    category: 'component'
                });
            }
            
            // ❌ НЯМА СТАБИЛИЗАТОРИ в Метод 2!
            
            // Дъна за drawer шкафове (ПЪЛНА ШИРИНА)
            if (type === 'drawer') {
                const drawerCount = cabinet.drawer_count || 3;
                elements.push({
                    name: 'Дъна',
                    quantity: drawerCount + 1,
                    size: `${w}x${d} мм`,  // ← w вместо (w - 36)
                    category: 'component'
                });
            }
            
        } else {
            // ═══════════════════════════════════════════════════════════
            // МЕТОД 1: ДЪНО/КАПАК МЕЖДУ СТРАНИЦИ (СТАНДАРТЕН)
            // ═══════════════════════════════════════════════════════════
            
            // Страници (НОРМАЛНА ВИСОЧИНА)
            elements.push({
                name: 'Страници',
                quantity: 2,
                size: `${h}x${d} мм`,
                category: 'component'
            });
            
            // Дъно и капак (ПО-ТЕСНИ - между страниците)
            if (type !== 'drawer' && type !== 'upper' && type !== 'fridge') {
                const bottomWidth = w - 36;
                
                elements.push({
                    name: 'Дъно',
                    quantity: 1,
                    size: `${bottomWidth}x${d} мм`,
                    category: 'component'
                });
                
                if (type === 'base' || type === 'sink' || type === 'blind') {
                    elements.push({
                        name: 'Капак',
                        quantity: 1,
                        size: `${bottomWidth}x${d} мм`,
                        category: 'component'
                    });
                }
            }
            
            // Дъна за drawer шкафове
            if (type === 'drawer') {
                const drawerCount = cabinet.drawer_count || 3;
                elements.push({
                    name: 'Дъна',
                    quantity: drawerCount + 1,
                    size: `${w - 36}x${d} мм`,
                    category: 'component'
                });
            }
            
            // ✅ СТАБИЛИЗАТОРИ (само в Метод 1)
            if (type === 'base' || type === 'sink' || type === 'oven' || type === 'drawer' || type === 'blind') {
                let stabCount = 2;
                if (type === 'sink' || w >= 800) {
                    stabCount = 3;
                }
                
                elements.push({
                    name: 'Стабилизатори',
                    quantity: stabCount,
                    size: `${w - 36}x100 мм`,
                    category: 'component'
                });
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // ОБЩИ ЕЛЕМЕНТИ (и за двата метода)
        // ═══════════════════════════════════════════════════════════
        
        // Рафтове
        if (cabinet.shelf_count > 0) {
            const shelfWidth = w - 50;
            const shelfDepth = d - 30;
            
            elements.push({
                name: cabinet.shelf_count === 1 ? 'Рафт' : 'Рафтове',
                quantity: cabinet.shelf_count,
                size: `${shelfWidth}x${shelfDepth} мм`,
                category: 'component'
            });
        }
        
        // Врати / Вратички
        if (cabinet.door_count > 0) {
            const doorHeight = this.calculateDoorHeight(cabinet);
            const doorWidth = this.calculateDoorWidth(cabinet);
            
            const doorName = (cabinet.door_count === 1 || type === 'oven') ? 'Вратичка' : 'Вратички';
            
            elements.push({
                name: doorName,
                quantity: cabinet.door_count,
                size: `${doorWidth}x${doorHeight} мм`,
                category: 'door'
            });
        }
        
        // Чекмеджета
        if (cabinet.drawer_count > 0) {
            const drawerHeight = Math.floor((h - 100) / cabinet.drawer_count) - 20;
            const drawerWidth = w - 6;
            
            elements.push({
                name: 'Чекмеджета',
                quantity: cabinet.drawer_count,
                size: `${drawerWidth}x${drawerHeight} мм`,
                category: 'component'
            });
        }
        
        // Гръб
        if (cabinet.has_back !== false) {
            const backWidth = w - 40;
            const backHeight = h - 4;
            
            elements.push({
                name: 'Гръб',
                quantity: 1,
                size: `${backWidth}x${backHeight} мм`,
                category: 'back'
            });
        }
        
        // Крака (само за долни шкафове)
        if (type === 'base' || type === 'sink' || type === 'oven' || type === 'blind' || type === 'drawer') {
            const legCount = w >= 800 ? 6 : 4;
            elements.push({
                name: 'Крака',
                quantity: legCount,
                size: null,
                category: 'hardware'
            });
        }
        
        // Панти
        if (cabinet.door_count > 0) {
            elements.push({
                name: 'Панти',
                quantity: cabinet.door_count * 2,
                size: null,
                category: 'hardware'
            });
        }
        
        // Рафтодържачи
        if (cabinet.shelf_count > 0) {
            elements.push({
                name: 'Рафтодържачи',
                quantity: cabinet.shelf_count * 4,
                size: null,
                category: 'hardware'
            });
        }
        
        // Водачи за чекмеджета
        if (cabinet.drawer_count > 0) {
            elements.push({
                name: 'Водачи',
                quantity: cabinet.drawer_count * 2,
                size: null,
                category: 'hardware'
            });
        }
        
        return elements;
    },

    // Изчисляване на височина на врата
    calculateDoorHeight(cabinet) {
        const type = cabinet.type;
        const h = cabinet.height;
        
        if (cabinet.custom_door_size && cabinet.door_height) {
            return cabinet.door_height;
        }
        
        if (type === 'base' || type === 'sink' || type === 'blind' || type === 'drawer') {
            return h - 103; // 100mm цокъл + 3mm процеп
        } else if (type === 'upper' || type === 'fridge' || type === 'column') {
            return h - 3;
        } else if (type === 'oven') {
            return 145; // Малка вратичка
        }
        
        return h - 3;
    },

    // Изчисляване на ширина на врата
    calculateDoorWidth(cabinet) {
        const w = cabinet.width;
        const doorCount = cabinet.door_count;
        
        if (cabinet.custom_door_size && cabinet.door_width) {
            return cabinet.door_width;
        }
        
        if (doorCount === 1) {
            return w - 3;
        } else if (doorCount === 2) {
            return Math.floor((w - 3) / 2);
        } else {
            return Math.floor((w - 3) / doorCount);
        }
    },

    // 🆕 ПОДРОБНО СУМАРНО С ГРУПИРАНЕ
    generateDetailedSummary(project) {
        const summary = [];
        
        // Събиране на всички елементи от всички шкафове
        const allElements = [];
        project.forEach(cabinet => {
            const elements = this.generateCabinetElements(cabinet);
            allElements.push(...elements);
        });
        
        // 1. Основна информация
        summary.push({
            category: '📋 Основна информация',
            value: '',
            details: ''
        });
        
        summary.push({
            category: 'Общо шкафове',
            value: project.length,
            details: 'бр'
        });
        
        // Групиране по тип шкаф
        const typeGroups = {};
        project.forEach(cabinet => {
            const typeName = this.getCabinetDisplayName(cabinet).replace(/\s\d+мм$/, '');
            typeGroups[typeName] = (typeGroups[typeName] || 0) + 1;
        });
        
        Object.entries(typeGroups).forEach(([typeName, count]) => {
            summary.push({
                category: `  ${typeName}`,
                value: count,
                details: 'бр'
            });
        });
        
        summary.push({ category: '', value: '', details: '' });
        
        // 2. 🆕 КОМПОНЕНТИ ПО РАЗМЕР
        summary.push({
            category: '📐 Компоненти по размер',
            value: '',
            details: ''
        });
        
        // Групиране по размер
        const componentsBySize = {};
        allElements.forEach(element => {
            if (element.size && element.category === 'component') {
                const key = element.size;
                if (!componentsBySize[key]) {
                    componentsBySize[key] = {
                        size: key,
                        count: 0,
                        names: new Set()
                    };
                }
                componentsBySize[key].count += element.quantity;
                componentsBySize[key].names.add(element.name);
            }
        });
        
        // Сортиране по брой (най-много първи)
        const sortedComponents = Object.values(componentsBySize)
            .sort((a, b) => b.count - a.count);
        
        sortedComponents.forEach(comp => {
            const namesStr = Array.from(comp.names).join(', ');
            summary.push({
                category: `  ${comp.size}`,
                value: comp.count,
                details: `бр (${namesStr})`
            });
        });
        
        summary.push({ category: '', value: '', details: '' });
        
        // 3. 🆕 ВРАТИ ПО РАЗМЕР
        const doorsBySize = {};
        allElements.forEach(element => {
            if (element.category === 'door') {
                const key = element.size;
                if (!doorsBySize[key]) {
                    doorsBySize[key] = 0;
                }
                doorsBySize[key] += element.quantity;
            }
        });
        
        if (Object.keys(doorsBySize).length > 0) {
            summary.push({
                category: '🚪 Врати/Вратички по размер',
                value: '',
                details: ''
            });
            
            Object.entries(doorsBySize)
                .sort((a, b) => b[1] - a[1])
                .forEach(([size, count]) => {
                    summary.push({
                        category: `  ${size}`,
                        value: count,
                        details: 'бр'
                    });
                });
            
            summary.push({ category: '', value: '', details: '' });
        }
        
        // 4. 🆕 ГРЪБОВЕ ПО РАЗМЕР
        const backsBySize = {};
        allElements.forEach(element => {
            if (element.category === 'back') {
                const key = element.size;
                if (!backsBySize[key]) {
                    backsBySize[key] = 0;
                }
                backsBySize[key] += element.quantity;
            }
        });
        
        if (Object.keys(backsBySize).length > 0) {
            summary.push({
                category: '⬜ Гръбове по размер',
                value: '',
                details: ''
            });
            
            Object.entries(backsBySize)
                .sort((a, b) => b[1] - a[1])
                .forEach(([size, count]) => {
                    summary.push({
                        category: `  ${size}`,
                        value: count,
                        details: 'бр'
                    });
                });
            
            summary.push({ category: '', value: '', details: '' });
        }
        
        // 5. 🆕 ХАРДУЕР
        summary.push({
            category: '🔩 Хардуер',
            value: '',
            details: ''
        });
        
        // Групиране на хардуер
        const hardwareGroups = {};
        allElements.forEach(element => {
            if (element.category === 'hardware') {
                const name = element.name;
                if (!hardwareGroups[name]) {
                    hardwareGroups[name] = 0;
                }
                hardwareGroups[name] += element.quantity;
            }
        });
        
        // Показване на хардуер
        const hardwareOrder = ['Крака', 'Панти', 'Рафтодържачи', 'Водачи'];
        hardwareOrder.forEach(name => {
            if (hardwareGroups[name]) {
                summary.push({
                    category: `  ${name}`,
                    value: hardwareGroups[name],
                    details: 'бр'
                });
            }
        });
        
        summary.push({ category: '', value: '', details: '' });
        
        // 6. 🆕 КАНТОВЕ (приблизително)
        summary.push({
            category: '📏 Кантове (приблизително)',
            value: '',
            details: ''
        });
        
        // Кант за корпус (всички компоненти освен врати и гръбове)
        let bodyEdgeLength = 0;
        allElements.forEach(element => {
            if (element.size && (element.category === 'component')) {
                const [w, h] = element.size.replace(' мм', '').split('x').map(Number);
                if (w && h) {
                    // Периметър на всеки елемент
                    const perimeter = (w + h) * 2;
                    bodyEdgeLength += (perimeter * element.quantity) / 1000; // в метри
                }
            }
        });
        
        summary.push({
            category: '  Кант за корпус',
            value: bodyEdgeLength.toFixed(1),
            details: 'м'
        });
        
        // Кант за врати
        let doorEdgeLength = 0;
        allElements.forEach(element => {
            if (element.size && element.category === 'door') {
                const [w, h] = element.size.replace(' мм', '').split('x').map(Number);
                if (w && h) {
                    const perimeter = (w + h) * 2;
                    doorEdgeLength += (perimeter * element.quantity) / 1000;
                }
            }
        });
        
        if (doorEdgeLength > 0) {
            summary.push({
                category: '  Кант за врати/вратички',
                value: doorEdgeLength.toFixed(1),
                details: 'м'
            });
        }
        
        // Общо кантове
        const totalEdge = bodyEdgeLength + doorEdgeLength;
        summary.push({
            category: '  Общо кантове',
            value: totalEdge.toFixed(1),
            details: 'м'
        });
        
        return summary;
    },

    // Показване на резултат от проект
    showProjectResult(data) {
        let message = `✅ Проектът е изчислен успешно!\n\n`;
        message += `Общ брой шкафове: ${data.total_cabinets || State.currentProject.length}\n`;
        message += `Обща цена: ${data.project_total_cost ? data.project_total_cost.toFixed(2) : '0.00'} лв\n`;

        if (data.totals) {
            message += `\nДетайли:\n`;
            message += `- Хардуер: ${Object.keys(data.totals.hardware || {}).length} вида\n`;
            message += `- Материали: ${Object.keys(data.totals.material_area || {}).length} вида\n`;
            message += `- Дължина на цокъл: ${data.totals.plinth_length || 0} mm\n`;
        }

        alert(message);
    },

    // Събиране на данни от формата
    getCabinetFormData() {
        const form = document.getElementById('cabinetForm');
        if (!form) return null;

        const data = {
            cabinet_id: document.getElementById('cabinet_id')?.value || '',
            type: document.getElementById('type')?.value,
            width: parseInt(document.getElementById('width')?.value) || 0,
            height: parseInt(document.getElementById('height')?.value) || 0,
            depth: parseInt(document.getElementById('depth')?.value) || 0,
            body_edge: document.getElementById('body_edge')?.value || '1',
            door_edge: document.getElementById('door_edge')?.value || '2',
            shelf_count: parseInt(document.getElementById('shelf_count')?.value) || 0,
            door_count: parseInt(document.getElementById('door_count')?.value) || 0,
            drawer_count: parseInt(document.getElementById('drawer_count')?.value) || 0,
            has_back: document.getElementById('has_back')?.checked || true,
            custom_door_size: document.getElementById('custom_door_size')?.checked || false,
            
            // 🆕 НОВО ПОЛЕ: Метод на конструкция
            pages_between_panels: document.getElementById('pages_between_panels')?.checked || false
        };

        // Добавяне на персонализирани размери на врати ако са активирани
        if (data.custom_door_size) {
            data.door_width = parseInt(document.getElementById('door_width')?.value) || null;
            data.door_height = parseInt(document.getElementById('door_height')?.value) || null;
        }

        return data;
    },

    // Валидация на данни
    validateCabinetData(data) {
        const errors = [];

        if (!data.type) {
            errors.push('Моля, изберете тип шкаф');
        }

        if (data.width < 150 || data.width > 2000) {
            errors.push('Ширината трябва да е между 150 и 2000 mm');
        }

        if (data.height < 200 || data.height > 3000) {
            errors.push('Височината трябва да е между 200 и 3000 mm');
        }

        if (data.depth < 100 || data.depth > 1000) {
            errors.push('Дълбочината трябва да е между 100 и 1000 mm');
        }

        if (data.shelf_count < 0 || data.shelf_count > 20) {
            errors.push('Броят рафтове трябва да е между 0 и 20');
        }

        if (errors.length > 0) {
            UI.showError(errors.join('\n'));
            return false;
        }

        return true;
    }
};

// Експортираме глобално
window.Calculator = Calculator;
