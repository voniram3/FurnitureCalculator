// Работа с localStorage
export const Storage = {
    // История
    getHistory() {
        return JSON.parse(localStorage.getItem('furniture_calc_history')) || [];
    },
    
    saveHistory(history) {
        localStorage.setItem('furniture_calc_history', JSON.stringify(history));
    },
    
    clearHistory() {
        localStorage.removeItem('furniture_calc_history');
    },
    
    // Профили за цени
    getPricingProfiles() {
        return JSON.parse(localStorage.getItem('furniture_pricing_profiles')) || {};
    },
    
    savePricingProfile(name, profile) {
        const profiles = this.getPricingProfiles();
        profiles[name] = { ...profile, timestamp: new Date().toISOString() };
        localStorage.setItem('furniture_pricing_profiles', JSON.stringify(profiles));
    },
    
    deletePricingProfile(name) {
        const profiles = this.getPricingProfiles();
        delete profiles[name];
        localStorage.setItem('furniture_pricing_profiles', JSON.stringify(profiles));
    },
    
    // Текущ проект
    getProject() {
        return JSON.parse(localStorage.getItem('furniture_current_project')) || [];
    },
    
    saveProject(project) {
        localStorage.setItem('furniture_current_project', JSON.stringify(project));
    },
    
    clearProject() {
        localStorage.removeItem('furniture_current_project');
    },
    
    // Настройки на потребителя
    getUserSettings() {
        return JSON.parse(localStorage.getItem('furniture_user_settings')) || {
            defaultBodyEdge: '1',
            defaultDoorEdge: '2',
            showCustomDoorSize: false,
            autoCalculateLabor: true
        };
    },
    
    saveUserSettings(settings) {
        localStorage.setItem('furniture_user_settings', JSON.stringify(settings));
    },
    
    // Експорт на всички данни
    exportAllData() {
        return {
            history: this.getHistory(),
            pricingProfiles: this.getPricingProfiles(),
            project: this.getProject(),
            settings: this.getUserSettings(),
            exportDate: new Date().toISOString(),
            version: '3.0'
        };
    },
    
    // Импорт на данни
    importAllData(data) {
        if (data.history) localStorage.setItem('furniture_calc_history', JSON.stringify(data.history));
        if (data.pricingProfiles) localStorage.setItem('furniture_pricing_profiles', JSON.stringify(data.pricingProfiles));
        if (data.project) localStorage.setItem('furniture_current_project', JSON.stringify(data.project));
        if (data.settings) localStorage.setItem('furniture_user_settings', JSON.stringify(data.settings));
    }
};