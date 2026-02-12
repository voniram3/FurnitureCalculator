import { State } from './state.js';
import { UI } from './ui.js';
import { Api } from './api.js';
import { ExcelHandler } from './excelHandler.js';

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

    // 🆕 ПОДОБРЕН Експорт на проект - Директно в Excel
    async exportProject() {
        const project = State.currentProject;
        
        if (project.length === 0) {
            alert('⚠️ Няма данни за експорт!');
            return;
        }

        try {
            // Директен Excel export без prompt
            console.log('📊 Стартиране на Excel експорт...');
            console.log(`Проект с ${project.length} шкафа`);
            
            const success = await ExcelHandler.exportProjectToExcel(project);
            
            if (success) {
                alert('✅ Проектът е експортиран успешно в Excel файл!');
            }
        } catch (error) {
            console.error('Грешка при експорт:', error);
            alert(`❌ Грешка при експорт: ${error.message}`);
        }
    },

    // Стари експорт функции (запазени за backwards compatibility)
    exportToCSV(project) {
        const headers = ['ID', 'Тип', 'Ширина (mm)', 'Височина (mm)', 'Дълбочина (mm)', 'Рафтове', 'Врати', 'Чекмеджета', 'Кант корпус', 'Кант врати'];
        const rows = project.map(cabinet => [
            cabinet.cabinet_id || '',
            cabinet.type,
            cabinet.width,
            cabinet.height,
            cabinet.depth,
            cabinet.shelf_count || 0,
            cabinet.door_count || 0,
            cabinet.drawer_count || 0,
            cabinet.body_edge || '1',
            cabinet.door_edge || '2'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `проект_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('✅ Проектът е експортиран в CSV файл!');
    },

    exportToJSON(project) {
        const data = {
            project: project,
            exportDate: new Date().toISOString(),
            totalCabinets: project.length,
            version: '3.0'
        };

        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `проект_${new Date().toISOString().slice(0, 10)}.json`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('✅ Проектът е експортиран в JSON файл!');
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
            custom_door_size: document.getElementById('custom_door_size')?.checked || false
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
