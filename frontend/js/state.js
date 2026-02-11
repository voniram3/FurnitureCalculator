import { Storage } from './storage.js';

// Глобално състояние на приложението
export const State = {
    // Данни
    currentProject: Storage.getProject(),
    calculationHistory: Storage.getHistory(),
    pricingProfiles: Storage.getPricingProfiles(),
    userSettings: Storage.getUserSettings(),
    
    // Избрани стойности
    selectedCabinetType: null,
    activeProfile: null,
    
    // Методи за управление на състоянието
    // Проект
    addToProject(cabinet) {
        this.currentProject.push(cabinet);
        Storage.saveProject(this.currentProject);
        return this.currentProject;
    },
    
    removeFromProject(index) {
        if (index >= 0 && index < this.currentProject.length) {
            this.currentProject.splice(index, 1);
            Storage.saveProject(this.currentProject);
        }
        return this.currentProject;
    },
    
    clearProject() {
        this.currentProject = [];
        Storage.clearProject();
        return this.currentProject;
    },
    
    updateProjectCabinet(index, updates) {
        if (index >= 0 && index < this.currentProject.length) {
            this.currentProject[index] = { ...this.currentProject[index], ...updates };
            Storage.saveProject(this.currentProject);
        }
        return this.currentProject;
    },
    
    // История
    addToHistory(calculation) {
        this.calculationHistory.unshift({
            ...calculation,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        });
        
        // Ограничаваме историята до 100 записа
        if (this.calculationHistory.length > 100) {
            this.calculationHistory = this.calculationHistory.slice(0, 100);
        }
        
        Storage.saveHistory(this.calculationHistory);
        return this.calculationHistory;
    },
    
    clearHistory() {
        this.calculationHistory = [];
        Storage.clearHistory();
        return this.calculationHistory;
    },
    
    // Профили за цени
    savePricingProfile(name, data) {
        this.pricingProfiles[name] = {
            ...data,
            name: name,
            lastModified: new Date().toISOString()
        };
        Storage.savePricingProfile(name, this.pricingProfiles[name]);
        return this.pricingProfiles;
    },
    
    loadPricingProfile(name) {
        return this.pricingProfiles[name] || null;
    },
    
    deletePricingProfile(name) {
        delete this.pricingProfiles[name];
        Storage.deletePricingProfile(name);
        return this.pricingProfiles;
    },
    
    // Настройки
    updateUserSettings(settings) {
        this.userSettings = { ...this.userSettings, ...settings };
        Storage.saveUserSettings(this.userSettings);
        return this.userSettings;
    },
    
    // Гетъри
    getProjectCount() {
        return this.currentProject.length;
    },
    
    getHistoryCount() {
        return this.calculationHistory.length;
    },
    
    getProfileCount() {
        return Object.keys(this.pricingProfiles).length;
    },
    
    // Статистика
    getProjectStats() {
        const stats = {
            totalCabinets: this.currentProject.length,
            byType: {},
            totalWidth: 0,
            totalHeight: 0,
            totalDepth: 0
        };
        
        this.currentProject.forEach(cabinet => {
            stats.totalWidth += cabinet.width || 0;
            stats.totalHeight += cabinet.height || 0;
            stats.totalDepth += cabinet.depth || 0;
            
            if (!stats.byType[cabinet.type]) {
                stats.byType[cabinet.type] = 0;
            }
            stats.byType[cabinet.type]++;
        });
        
        return stats;
    }
};