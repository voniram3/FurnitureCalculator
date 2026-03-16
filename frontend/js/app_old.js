// Главен модул на приложението
import { State } from './state.js';
import { UI } from './ui.js';
import { Tables } from './tables.js';
import { Calculator } from './calculator.js';
import { Api } from './api.js';
import { Materials } from './materials.js';
import { Cabinet3D } from './cabinet3d.js';

// Стартиране на приложението при зареждане на DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Стартиране на Мебелен калкулатор v3.0...');

    // Инициализация на модули
    UI.init();
    Tables.init();

    await Materials.init(); // Async зареждане на материали от JSON файлове

    // Връзване на tab switching събития
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Скриване на всички табове
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Показване на избрания таб
            tab.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            // Специална логика за Materials таб
            if (tabName === 'materials') {
                Materials.renderMaterialsTab();
            }
        });
    });

    // Първоначална настройка
    const settings = State.userSettings;

    if (settings.defaultBodyEdge) {
        const bodyEdgeSelect = document.getElementById('body_edge');
        if (bodyEdgeSelect) bodyEdgeSelect.value = settings.defaultBodyEdge;
    }

    if (settings.defaultDoorEdge) {
        const doorEdgeSelect = document.getElementById('door_edge');
        if (doorEdgeSelect) doorEdgeSelect.value = settings.defaultDoorEdge;
    }

    if (settings.showCustomDoorSize) {
        const customDoorCheck = document.getElementById('custom_door_size');
        if (customDoorCheck) {
            customDoorCheck.checked = settings.showCustomDoorSize;
            UI.toggleCustomDoorSize();
        }
    }

    // Обновяване на броячи
    const projectCount = State.getProjectCount();
    const projectCountElement = document.getElementById('projectCabinetCount');
    if (projectCountElement) {
        projectCountElement.textContent = projectCount;
    }

    // Тестване на връзката
    const connection = await Api.testConnection();
    if (!connection.connected) {
        console.warn('⚠️ Внимание: ' + connection.message);
    } else {
        console.log('✅ ' + connection.message);
    }

    console.log('✅ Приложението е заредено успешно!');
});
