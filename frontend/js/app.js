// Главен модул на приложението
import { State } from './state.js';
import { UI } from './ui.js';
import { Tables } from './tables.js';
import { Calculator } from './calculator.js';
import { Api } from './api.js';
import { Materials } from './materials.js';


// Основен клас на приложението
class FurnitureCalculator {
    constructor() {
        this.init();
    }

    // Инициализация
    async init() {
        console.log('🚀 Стартиране на Мебелен калкулатор v3.0...');

        // Инициализация на модули
        UI.init();
        Tables.init();
        Materials.init();

        // Връзване на глобални събития
        this.bindGlobalEvents();

        // Първоначална настройка
        this.initialSetup();

        // Тестване на връзката със сървъра
        await this.testConnection();

        console.log('✅ Приложението е заредено успешно!');
    }

    // Тестване на връзката
    async testConnection() {
        const connection = await Api.testConnection();
        if (!connection.connected) {
            console.warn('⚠️  Внимание: ' + connection.message);
        } else {
            console.log('✅ ' + connection.message);
        }
    }

    // Връзване на глобални събития
    bindGlobalEvents() {
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
            if (tabName === 'materials') {  // ← ДОБАВИ
                Materials.renderMaterialsTab();
            }
        });
    });
}

    // Първоначална настройка
    initialSetup() {
        // Зареждане на последно използваните настройки
        const settings = State.userSettings;

        // Прилагане на настройките
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

        // Обновяване на броячите
        this.updateCounters();
    }

    // Обновяване на броячи
    updateCounters() {
        // Брой шкафове в проекта
        const projectCount = State.getProjectCount();
        const projectCountElement = document.getElementById('projectCabinetCount');
        if (projectCountElement) {
            projectCountElement.textContent = projectCount;
        }
    }

    // Запазване на състоянието
    saveAppState() {
        // Запазване на текущите стойности в настройките
        const settings = {
            defaultBodyEdge: document.getElementById('body_edge')?.value || '1',
            defaultDoorEdge: document.getElementById('door_edge')?.value || '2',
            showCustomDoorSize: document.getElementById('custom_door_size')?.checked || false
        };

        State.updateUserSettings(settings);
        console.log('💾 Състоянието на приложението е запазено');
    }
}

// Стартиране на приложението при зареждане на DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FurnitureCalculator();
});
