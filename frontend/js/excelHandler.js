// js/excelHandler.js - Enhanced версия с детайлна разбивка
import { cabinetTypes } from '../data/cabinetTypes.js';

export class ExcelHandler {
    /**
     * Главна функция за експорт на проект в Excel
     * @param {Array} project - Масив от шкафове
     */
    static async exportProjectToExcel(project) {
        if (!window.XLSX) {
            console.error('XLSX библиотеката не е заредена!');
            alert('❌ Грешка: Excel библиотеката не е заредена. Моля, презаредете страницата.');
            return;
        }

        try {
            // Генериране на данни за експорт
            const exportData = this.generateExportData(project);
            
            // Създаване на workbook
            const wb = window.XLSX.utils.book_new();
            
            // Създаване на worksheet с данните
            const ws = this.createFormattedWorksheet(exportData);
            
            // Добавяне на worksheet към workbook
            window.XLSX.utils.book_append_sheet(wb, ws, 'Детайлна разбивка');
            
            // Генериране на filename
            const filename = `Проект_${new Date().toISOString().slice(0, 10)}_${Date.now()}.xlsx`;
            
            // Записване на файла
            window.XLSX.writeFile(wb, filename);
            
            console.log(`✅ Excel файл ${filename} е генериран успешно!`);
            return true;
        } catch (error) {
            console.error('Грешка при експорт в Excel:', error);
            alert(`❌ Грешка при експорт: ${error.message}`);
            return false;
        }
    }

    /**
     * Генериране на данни за експорт
     */
    static generateExportData(project) {
        const data = [];
        
        // Header
        data.push(['Име', 'Бройка', 'Размер']);
        
        // За всеки шкаф
        project.forEach((cabinet, index) => {
            const cabinetInfo = cabinetTypes[cabinet.type] || {};
            const cabinetName = `${cabinetInfo.name || cabinet.type} ${cabinet.width}мм`;
            
            // Заглавие на шкафа (мерджнат ред)
            data.push([cabinetName, null, null]);
            
            // Генериране на елементите
            const elements = this.generateCabinetElements(cabinet);
            
            // Добавяне на всеки елемент
            elements.forEach(element => {
                data.push([
                    `  ${element.name}`, // Отстъп за визуална йерархия
                    element.quantity,
                    element.size
                ]);
            });
            
            // Празен ред между шкафовете (освен след последния)
            if (index < project.length - 1) {
                data.push(['', '', '']);
            }
        });
        
        // Празен ред преди сумарното
        data.push(['', '', '']);
        data.push(['', '', '']);
        
        // Сумарна таблица
        const summary = this.generateSummary(project);
        data.push(['═══ СУМАРНО ═══', '', '']);
        data.push(['', '', '']);
        
        summary.forEach(item => {
            data.push([item.category, item.value, item.details || '']);
        });
        
        return data;
    }

    /**
     * Генериране на елементите на един шкаф
     */
    static generateCabinetElements(cabinet) {
        const elements = [];
        const w = cabinet.width;
        const h = cabinet.height;
        const d = cabinet.depth;
        const type = cabinet.type;
        
        // Корпус
        if (type !== 'drawer') {
            // Страници (странични панели)
            elements.push({
                name: 'Страници',
                quantity: 2,
                size: `${h}×${d} мм`
            });
            
            // Дъно
            if (type === 'base' || type === 'oven' || type === 'sink' || type === 'blind') {
                elements.push({
                    name: 'Дъно',
                    quantity: 1,
                    size: `${w - 36}×${d} мм`
                });
            }
            
            // Капак (само за долни шкафове)
            if (type === 'base' || type === 'sink' || type === 'blind') {
                elements.push({
                    name: 'Капак',
                    quantity: 1,
                    size: `${w - 36}×${d} мм`
                });
            }
        } else {
            // За drawer шкафове
            elements.push({
                name: 'Страници',
                quantity: 2,
                size: `${h}×${d} мм`
            });
            
            elements.push({
                name: 'Дъна',
                quantity: cabinet.drawer_count + 1,
                size: `${w - 36}×${d} мм`
            });
        }
        
        // Стабилизатори (ако е долен шкаф или шкаф за мивка)
        if (type === 'base' || type === 'sink' || type === 'oven') {
            const stabCount = type === 'sink' ? 3 : 2;
            elements.push({
                name: 'Стабилизатори',
                quantity: stabCount,
                size: `${w - 36}×100 мм`
            });
        }
        
        // Рафтове
        if (cabinet.shelf_count > 0) {
            const shelfWidth = w - 50;
            const shelfDepth = d - 30;
            elements.push({
                name: cabinet.shelf_count === 1 ? 'Рафт' : 'Рафтове',
                quantity: cabinet.shelf_count,
                size: `${shelfWidth}×${shelfDepth} мм`
            });
        }
        
        // Врати
        if (cabinet.door_count > 0 && !cabinet.custom_door_size) {
            const doorHeight = this.calculateDoorHeight(cabinet);
            const doorWidth = this.calculateDoorWidth(cabinet);
            
            elements.push({
                name: cabinet.door_count === 1 ? 'Врата' : 'Врати',
                quantity: cabinet.door_count,
                size: `${doorWidth}×${doorHeight} мм`
            });
        } else if (cabinet.door_count > 0 && cabinet.custom_door_size) {
            elements.push({
                name: cabinet.door_count === 1 ? 'Врата' : 'Врати',
                quantity: cabinet.door_count,
                size: `${cabinet.door_width}×${cabinet.door_height} мм`
            });
        }
        
        // Чекмеджета
        if (cabinet.drawer_count > 0) {
            const drawerHeight = Math.floor((h - 100) / cabinet.drawer_count) - 20;
            const drawerWidth = w - 6;
            
            elements.push({
                name: 'Чекмеджета',
                quantity: cabinet.drawer_count,
                size: `${drawerWidth}×${drawerHeight} мм`
            });
        }
        
        // Гръб (ако е активиран)
        if (cabinet.has_back !== false) {
            const backWidth = w - 4;
            const backHeight = h - 4;
            
            elements.push({
                name: 'Гръб',
                quantity: 1,
                size: `${backWidth}×${backHeight} мм`
            });
        }
        
        // Хардуер
        // Крака (само за долни шкафове)
        if (type === 'base' || type === 'sink' || type === 'oven' || type === 'blind') {
            const legCount = w >= 800 ? 6 : 4;
            elements.push({
                name: 'Крака',
                quantity: legCount,
                size: null
            });
        }
        
        // Панти
        if (cabinet.door_count > 0) {
            elements.push({
                name: 'Панти',
                quantity: cabinet.door_count * 2,
                size: null
            });
        }
        
        // Рафтодържачи
        if (cabinet.shelf_count > 0) {
            elements.push({
                name: 'Рафтодържачи',
                quantity: cabinet.shelf_count * 4,
                size: null
            });
        }
        
        // Водачи за чекмеджета
        if (cabinet.drawer_count > 0) {
            elements.push({
                name: 'Водачи за чекмеджета',
                quantity: cabinet.drawer_count * 2,
                size: null
            });
        }
        
        return elements;
    }

    /**
     * Изчисляване на височина на врата
     */
    static calculateDoorHeight(cabinet) {
        const type = cabinet.type;
        const h = cabinet.height;
        
        if (type === 'base' || type === 'sink' || type === 'blind') {
            // За долни шкафове - от капака до долу минус цокъл
            return h - 100 - 3; // 100mm цокъл + 3mm процеп
        } else if (type === 'upper') {
            // За горни шкафове
            return h - 3;
        } else if (type === 'oven') {
            // За шкаф за фурна - малка вратичка отгоре
            return 145;
        } else {
            return h - 3;
        }
    }

    /**
     * Изчисляване на ширина на врата
     */
    static calculateDoorWidth(cabinet) {
        const w = cabinet.width;
        const doorCount = cabinet.door_count;
        
        if (doorCount === 1) {
            return w - 3;
        } else if (doorCount === 2) {
            return Math.floor((w - 3) / 2);
        } else {
            return Math.floor((w - 3) / doorCount);
        }
    }

    /**
     * Генериране на сумарна таблица
     */
    static generateSummary(project) {
        const summary = [];
        
        // Брой шкафове
        summary.push({
            category: 'Общо шкафове',
            value: project.length,
            details: 'бр'
        });
        
        // Брой детайли (приблизително)
        let totalElements = 0;
        project.forEach(cabinet => {
            const elements = this.generateCabinetElements(cabinet);
            totalElements += elements.reduce((sum, el) => sum + (el.quantity || 0), 0);
        });
        
        summary.push({
            category: 'Общо детайли',
            value: totalElements,
            details: 'бр'
        });
        
        // Групиране по тип шкаф
        const typeGroups = {};
        project.forEach(cabinet => {
            const cabinetInfo = cabinetTypes[cabinet.type] || {};
            const typeName = cabinetInfo.name || cabinet.type;
            
            if (!typeGroups[typeName]) {
                typeGroups[typeName] = 0;
            }
            typeGroups[typeName]++;
        });
        
        summary.push({
            category: '',
            value: '',
            details: ''
        });
        
        summary.push({
            category: '─── По типове ───',
            value: '',
            details: ''
        });
        
        Object.entries(typeGroups).forEach(([typeName, count]) => {
            summary.push({
                category: `  ${typeName}`,
                value: count,
                details: 'бр'
            });
        });
        
        // Общи материали (приблизително)
        summary.push({
            category: '',
            value: '',
            details: ''
        });
        
        summary.push({
            category: '─── Материали (прибл.) ───',
            value: '',
            details: ''
        });
        
        // ПДЧ площ (приблизително)
        let totalArea = 0;
        project.forEach(cabinet => {
            const elements = this.generateCabinetElements(cabinet);
            elements.forEach(el => {
                if (el.size && el.size.includes('×')) {
                    const [w, h] = el.size.replace(' мм', '').split('×').map(Number);
                    if (w && h) {
                        totalArea += (w * h * (el.quantity || 1)) / 1000000; // в m²
                    }
                }
            });
        });
        
        const pdc18sheets = Math.ceil(totalArea / (2.8 * 2.07));
        
        summary.push({
            category: '  ПДЧ 18мм',
            value: pdc18sheets,
            details: `листа (≈${totalArea.toFixed(2)} m²)`
        });
        
        // Общо панти
        let totalHinges = 0;
        project.forEach(cabinet => {
            if (cabinet.door_count > 0) {
                totalHinges += cabinet.door_count * 2;
            }
        });
        
        if (totalHinges > 0) {
            summary.push({
                category: '  Панти',
                value: totalHinges,
                details: 'бр'
            });
        }
        
        // Общо крака
        let totalLegs = 0;
        project.forEach(cabinet => {
            const type = cabinet.type;
            if (type === 'base' || type === 'sink' || type === 'oven' || type === 'blind') {
                totalLegs += cabinet.width >= 800 ? 6 : 4;
            }
        });
        
        if (totalLegs > 0) {
            summary.push({
                category: '  Крака',
                value: totalLegs,
                details: 'бр'
            });
        }
        
        // Обща дължина на кантове (приблизително)
        let totalEdge = 0;
        project.forEach(cabinet => {
            const elements = this.generateCabinetElements(cabinet);
            elements.forEach(el => {
                if (el.size && el.size.includes('×')) {
                    const [w, h] = el.size.replace(' мм', '').split('×').map(Number);
                    if (w && h) {
                        // Приблизителен периметър на всеки елемент
                        const perimeter = (w + h) * 2;
                        totalEdge += (perimeter * (el.quantity || 1)) / 1000; // в метри
                    }
                }
            });
        });
        
        summary.push({
            category: '  Кант (общо)',
            value: totalEdge.toFixed(1),
            details: 'метра'
        });
        
        return summary;
    }

    /**
     * Създаване на форматиран worksheet
     */
    static createFormattedWorksheet(data) {
        // Създаване на worksheet от данните
        const ws = window.XLSX.utils.aoa_to_sheet(data);
        
        // Автоматична ширина на колоните
        const colWidths = [
            { wch: 40 }, // Име
            { wch: 10 }, // Бройка
            { wch: 20 }  // Размер
        ];
        ws['!cols'] = colWidths;
        
        // Форматиране на клетки (ако XLSX поддържа)
        // Header (първи ред)
        if (ws['A1']) {
            ws['A1'].s = {
                font: { bold: true, sz: 12 },
                fill: { fgColor: { rgb: "CCCCCC" } },
                alignment: { horizontal: "center" }
            };
        }
        
        return ws;
    }

    /**
     * Парсване на Excel файл (за импорт)
     */
    static parseMaterialsFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // Конвертиране в JSON
                    const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    // Парсване на структурата
                    const materials = this.parseExcelStructure(jsonData);
                    resolve(materials);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Парсване на Excel структура (за импорт)
     */
    static parseExcelStructure(data) {
        const materials = [];
        let currentCabinet = null;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            if (!row[0]) continue;
            
            // Проверка за нов шкаф
            if (row[0].includes('шкаф') && row[0].includes('мм')) {
                if (currentCabinet) {
                    materials.push(currentCabinet);
                }
                
                currentCabinet = {
                    name: row[0].trim(),
                    parts: []
                };
            } 
            // Проверка за детайл
            else if (currentCabinet && row[0] && row[1] && row[2]) {
                const quantity = parseInt(row[1]) || 1;
                const size = row[2] ? row[2].toString().trim() : '';
                
                if (quantity && size) {
                    const match = size.match(/(\d+)×(\d+)/);
                    const width = match ? parseInt(match[1]) : 0;
                    const height = match ? parseInt(match[2]) : 0;
                    
                    currentCabinet.parts.push({
                        name: row[0].trim(),
                        quantity: quantity,
                        size: size,
                        width: width,
                        height: height
                    });
                }
            }
        }
        
        // Добавяме последния шкаф
        if (currentCabinet) {
            materials.push(currentCabinet);
        }
        
        return materials;
    }
}

// Експортираме глобално за лесна употреба
window.ExcelHandler = ExcelHandler;
