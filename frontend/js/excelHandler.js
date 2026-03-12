// js/excelHandler.js
import * as XLSX from 'xlsx';

export class ExcelHandler {
    static parseMaterialsFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // Конвертиране в JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    // Парсване на структурата от твоя пример
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
    
    static parseExcelStructure(data) {
        const materials = [];
        let currentCabinet = null;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            if (!row[0]) continue;
            
            // Проверка за нов шкаф (ред, който съдържа "шкаф" и "мм")
            if (row[0].includes('шкаф') && row[0].includes('мм')) {
                if (currentCabinet) {
                    materials.push(currentCabinet);
                }
                
                currentCabinet = {
                    name: row[0].trim(),
                    parts: []
                };
            } 
            // Проверка за детайл (име и размери)
            else if (currentCabinet && row[0] && row[1] && row[2]) {
                const [quantity, size] = this.parsePartRow(row);
                
                if (quantity && size) {
                    currentCabinet.parts.push({
                        name: row[0].trim(),
                        quantity: quantity,
                        size: size,
                        width: this.extractWidth(size),
                        height: this.extractHeight(size)
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
    
    static parsePartRow(row) {
        const quantity = parseInt(row[1]) || 1;
        const size = row[2] ? row[2].toString().trim() : '';
        return [quantity, size];
    }
    
    static extractWidth(size) {
        const match = size.match(/(\d+)x(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    
    static extractHeight(size) {
        const match = size.match(/(\d+)x(\d+)/);
        return match ? parseInt(match[2]) : 0;
    }
    
    // Експорт на компоненти в Excel
    static exportComponents(project) {
        const wb = XLSX.utils.book_new();
        
        // Създаваме лист за всеки шкаф
        project.forEach((cabinet, index) => {
            const components = this.extractCabinetComponents(cabinet);
            const ws = XLSX.utils.json_to_sheet(components);
            XLSX.utils.book_append_sheet(wb, ws, `Шкаф ${index + 1}`);
        });
        
        // Общ лист
        const allComponents = project.flatMap(cabinet => 
            this.extractCabinetComponents(cabinet)
        );
        const summaryWs = XLSX.utils.json_to_sheet(allComponents);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Общо');
        
        // Записване на файл
        XLSX.writeFile(wb, `компоненти_проект_${Date.now()}.xlsx`);
    }
    
    static extractCabinetComponents(cabinet) {
        // Това е примерна логика - ще трябва да се доразвие
        return [
            { Компонент: 'Дъно', Брой: 1, Размери: `${cabinet.width}x${cabinet.depth}mm` },
            { Компонент: 'Страници', Брой: 2, Размери: `${cabinet.height}x${cabinet.depth}mm` },
            { Компонент: 'Капак', Брой: 1, Размери: `${cabinet.width}x${cabinet.depth}mm` },
            { Компонент: 'Рафт', Брой: cabinet.shelf_count, Размери: `${cabinet.width - 50}x${cabinet.depth - 30}mm` }
        ];
    }
}