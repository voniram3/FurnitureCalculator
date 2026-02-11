// API комуникация с бекенда
export const Api = {
    // Автоматично избира адреса според това къде е зареден сайтът
    baseUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8000'
        : window.location.origin, // Това автоматично ще стане https://furniturecalculator.onrender.com

    // Изчисляване на един шкаф
    async calculateCabinet(data) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/cabinets/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API грешка при изчисляване на шкаф:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Изчисляване на проект
    async calculateProject(project) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/projects/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ cabinets: project })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API грешка при изчисляване на проект:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // Тестване на връзката със сървъра
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            return {
                connected: response.ok,
                status: response.status,
                message: response.ok ? 'Връзката със сървъра е успешна' : 'Грешка при връзка със сървъра'
            };
        } catch (error) {
            return {
                connected: false,
                status: 0,
                message: `Не може да се осъществи връзка със сървъра: ${error.message}`
            };
        }
    },
    
    // Зареждане на типовете шкафове от сървъра (ако има такава функционалност)
    async getCabinetTypes() {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/cabinets/types`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API грешка при зареждане на типовете:', error);
            return [];
        }
    },
    
    // Зареждане на материали от сървъра
    async getMaterials() {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/materials`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API грешка при зареждане на материалите:', error);
            return [];
        }
    }
};

// Експортираме глобално
window.Api = Api;
