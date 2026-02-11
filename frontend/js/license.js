// js/license.js
export class LicenseManager {
    static async validateLicense(key) {
        // Локална проверка (за демо)
        const validKeys = [
            'FURN-CALC-2024-PRO',
            'FURN-CALC-2024-ENTERPRISE',
            'TEST-LICENSE-123'
        ];
        
        if (validKeys.includes(key)) {
            localStorage.setItem('license_key', key);
            localStorage.setItem('license_active', 'true');
            localStorage.setItem('license_expiry', this.getExpiryDate(365)); // 1 година
            
            return {
                valid: true,
                type: key.includes('ENTERPRISE') ? 'enterprise' : 'pro',
                expires: this.getExpiryDate(365)
            };
        }
        
        // Онлайн проверка (за реална система)
        try {
            const response = await fetch('https://api.yourdomain.com/validate-license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            
            return await response.json();
        } catch (error) {
            return { valid: false, error: 'Няма интернет връзка' };
        }
    }
    
    static getExpiryDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }
    
    static checkFeatures() {
        const licenseActive = localStorage.getItem('license_active') === 'true';
        const expiry = localStorage.getItem('license_expiry');
        
        if (!licenseActive || new Date(expiry) < new Date()) {
            return {
                cutList: false,
                pdfExport: false,
                excelImport: false,
                unlimitedProjects: false,
                cloudSync: false
            };
        }
        
        return {
            cutList: true,
            pdfExport: true,
            excelImport: true,
            unlimitedProjects: true,
            cloudSync: false // За enterprise план
        };
    }
}