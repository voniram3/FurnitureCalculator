// Категории материали с реалистични български цени (2024-2025)
export const materialCategories = {
    panels: {
        name: '🪵 Плоскости',
        icon: '🪵',
        items: [
            { id: 1, name: 'ПДЧ бял гладък 18мм', size: '2800×2070', thickness: '18мм', price: 85.00, unit: 'лист', brand: 'Kronospan' },
            { id: 2, name: 'ПДЧ бял структура 18мм', size: '2800×2070', thickness: '18мм', price: 92.00, unit: 'лист', brand: 'Egger' },
            { id: 3, name: 'ПДЧ дъб сонома 18мм', size: '2800×2070', thickness: '18мм', price: 95.00, unit: 'лист', brand: 'Egger' },
            { id: 4, name: 'ПДЧ бук 18мм', size: '2800×2070', thickness: '18мм', price: 90.00, unit: 'лист', brand: 'Kronospan' },
            { id: 5, name: 'ПДЧ венге 18мм', size: '2800×2070', thickness: '18мм', price: 98.00, unit: 'лист', brand: 'Egger' },
            { id: 6, name: 'МДФ бял 18мм', size: '2800×2070', thickness: '18мм', price: 145.00, unit: 'лист', brand: 'Kronospan' },
            { id: 7, name: 'МДФ гланц бял 18мм', size: '2800×2070', thickness: '18мм', price: 185.00, unit: 'лист', brand: 'Egger' },
            { id: 8, name: 'МДФ гланц антрацит 18мм', size: '2800×2070', thickness: '18мм', price: 195.00, unit: 'лист', brand: 'Egger' },
            { id: 9, name: 'ХДЛ бял 10мм', size: '2800×2070', thickness: '10мм', price: 125.00, unit: 'лист', brand: 'Kronospan' }
        ]
    },
    
    countertops: {
        name: '🔨 Плотове и гръбове',
        icon: '🔨',
        items: [
            { id: 10, name: 'ХДЛ плот 38мм бял', size: '4100×600', thickness: '38мм', price: 145.00, unit: 'лист', brand: 'Egger' },
            { id: 11, name: 'ХДЛ плот 38мм дъб', size: '4100×600', thickness: '38мм', price: 155.00, unit: 'лист', brand: 'Egger' },
            { id: 12, name: 'ХДЛ плот 38мм мрамор', size: '4100×600', thickness: '38мм', price: 165.00, unit: 'лист', brand: 'Egger' },
            { id: 13, name: 'Масив плот дъб 40мм', size: '3000×600', thickness: '40мм', price: 380.00, unit: 'лист', brand: 'Premium Wood' },
            { id: 14, name: 'Кварцов плот 20мм', size: '3000×600', thickness: '20мм', price: 650.00, unit: 'лист', brand: 'Technistone' },
            { id: 15, name: 'Гръб/фазер 2.5мм', size: '2800×2070', thickness: '2.5мм', price: 28.00, unit: 'лист', brand: 'Kronospan' },
            { id: 16, name: 'Гръб/фазер 3мм', size: '2800×2070', thickness: '3мм', price: 32.00, unit: 'лист', brand: 'Kronospan' }
        ]
    },
    
    hinges: {
        name: '🔩 Панти',
        icon: '🔩',
        items: [
            { id: 20, name: 'Blum Clip Top стандартен', price: 2.80, unit: 'бр', brand: 'Blum' },
            { id: 21, name: 'Blum Clip Top Blumotion (с амортисьор)', price: 4.50, unit: 'бр', brand: 'Blum' },
            { id: 22, name: 'Hettich Sensys стандартен', price: 2.60, unit: 'бр', brand: 'Hettich' },
            { id: 23, name: 'Hettich Sensys със Silent System', price: 4.20, unit: 'бр', brand: 'Hettich' },
            { id: 24, name: 'Fennel панта стандартен', price: 1.80, unit: 'бр', brand: 'Fennel' },
            { id: 25, name: 'GTV панта с клик', price: 2.20, unit: 'бр', brand: 'GTV' }
        ]
    },
    
    drawers: {
        name: '🗃️ Чекмеджета и водачи',
        icon: '🗃️',
        items: [
            { id: 30, name: 'Blum Metabox 350мм H=86мм', size: '350мм', price: 18.50, unit: 'комплект', brand: 'Blum' },
            { id: 31, name: 'Blum Metabox 450мм H=86мм', size: '450мм', price: 22.00, unit: 'комплект', brand: 'Blum' },
            { id: 32, name: 'Blum Metabox 550мм H=86мм', size: '550мм', price: 25.50, unit: 'комплект', brand: 'Blum' },
            { id: 33, name: 'Blum Tandembox 350мм H=86мм', size: '350мм', price: 45.00, unit: 'комплект', brand: 'Blum' },
            { id: 34, name: 'Blum Tandembox 450мм H=86мм', size: '450мм', price: 52.00, unit: 'комплект', brand: 'Blum' },
            { id: 35, name: 'Hettich InnoTech 350мм', size: '350мм', price: 42.00, unit: 'комплект', brand: 'Hettich' },
            { id: 36, name: 'Hettich InnoTech 450мм', size: '450мм', price: 48.00, unit: 'комплект', brand: 'Hettich' },
            { id: 37, name: 'Водачи ролкови 350мм', size: '350мм', price: 4.50, unit: 'чифт', brand: 'Generic' },
            { id: 38, name: 'Водачи ролкови 450мм', size: '450мм', price: 5.20, unit: 'чифт', brand: 'Generic' },
            { id: 39, name: 'Водачи ролкови 550мм', size: '550мм', price: 6.00, unit: 'чифт', brand: 'Generic' },
            { id: 40, name: 'Водачи телескопични 350мм', size: '350мм', price: 12.00, unit: 'чифт', brand: 'GTV' },
            { id: 41, name: 'Водачи телескопични 450мм', size: '450мм', price: 14.50, unit: 'чифт', brand: 'GTV' }
        ]
    },
    
    liftMechanisms: {
        name: '⬆️ Повдигащи механизми',
        icon: '⬆️',
        items: [
            { id: 50, name: 'Blum Aventos HF (голям)', price: 95.00, unit: 'комплект', brand: 'Blum' },
            { id: 51, name: 'Blum Aventos HS (малък)', price: 85.00, unit: 'комплект', brand: 'Blum' },
            { id: 52, name: 'Blum Aventos HK (среден)', price: 90.00, unit: 'комплект', brand: 'Blum' },
            { id: 53, name: 'Hettich AvanTech YOU', price: 88.00, unit: 'комплект', brand: 'Hettich' },
            { id: 54, name: 'GTV повдигач малък', price: 45.00, unit: 'комплект', brand: 'GTV' },
            { id: 55, name: 'GTV повдигач голям', price: 55.00, unit: 'комплект', brand: 'GTV' }
        ]
    },
    
    pullOutMechanisms: {
        name: '🍷 Механизми за бутилиери',
        icon: '🍷',
        items: [
            { id: 60, name: 'Cargo механизъм 150мм', size: '150мм', price: 85.00, unit: 'комплект', brand: 'GTV' },
            { id: 61, name: 'Cargo механизъм 200мм', size: '200мм', price: 95.00, unit: 'комплект', brand: 'GTV' },
            { id: 62, name: 'Въртящ кош за ъглов шкаф', price: 145.00, unit: 'комплект', brand: 'GTV' },
            { id: 63, name: 'Кош за бутилки', price: 75.00, unit: 'комплект', brand: 'GTV' },
            { id: 64, name: 'Кош за подправки', price: 55.00, unit: 'комплект', brand: 'GTV' },
            { id: 65, name: 'Blum Space Corner', price: 285.00, unit: 'комплект', brand: 'Blum' }
        ]
    },
    
    handles: {
        name: '🎛️ Дръжки',
        icon: '🎛️',
        items: [
            { id: 70, name: 'Профилна дръжка алуминий', size: '2700мм', price: 12.00, unit: 'метър', brand: 'GTV' },
            { id: 71, name: 'Профилна дръжка черна мат', size: '2700мм', price: 15.00, unit: 'метър', brand: 'GTV' },
            { id: 72, name: 'Дръжка релинг 128мм', size: '128мм', price: 3.50, unit: 'бр', brand: 'GTV' },
            { id: 73, name: 'Дръжка релинг 192мм', size: '192мм', price: 4.20, unit: 'бр', brand: 'GTV' },
            { id: 74, name: 'Дръжка релинг 320мм', size: '320мм', price: 5.80, unit: 'бр', brand: 'GTV' },
            { id: 75, name: 'Дръжка ретро месинг', price: 8.50, unit: 'бр', brand: 'Premium' },
            { id: 76, name: 'Дръжка черна мат', price: 6.50, unit: 'бр', brand: 'GTV' },
            { id: 77, name: 'Копче порцелан', price: 4.80, unit: 'бр', brand: 'Premium' }
        ]
    },
    
    hangingSystems: {
        name: '🔗 Окачвачи',
        icon: '🔗',
        items: [
            { id: 80, name: 'Blum Modul окачвач', price: 4.50, unit: 'бр', brand: 'Blum' },
            { id: 81, name: 'Hettich окачвач', price: 3.80, unit: 'бр', brand: 'Hettich' },
            { id: 82, name: 'GTV окачвач стандартен', price: 2.20, unit: 'бр', brand: 'GTV' },
            { id: 83, name: 'Релса за окачване 2м', size: '2000мм', price: 8.50, unit: 'бр', brand: 'GTV' },
            { id: 84, name: 'Релса за окачване 3м', size: '3000мм', price: 12.00, unit: 'бр', brand: 'GTV' }
        ]
    },
    
    other: {
        name: '🔧 Други',
        icon: '🔧',
        items: [
            { id: 90, name: 'Крачета регулируеми 100-150мм', price: 1.20, unit: 'бр', brand: 'GTV' },
            { id: 91, name: 'Крачета регулируеми 150-200мм', price: 1.50, unit: 'бр', brand: 'GTV' },
            { id: 92, name: 'Рафтодържач пластмасов', price: 0.15, unit: 'бр', brand: 'Generic' },
            { id: 93, name: 'Рафтодържач метален', price: 0.35, unit: 'бр', brand: 'GTV' },
            { id: 94, name: 'Щипка за цокъл', price: 0.25, unit: 'бр', brand: 'GTV' },
            { id: 95, name: 'Цокъл PVC 100мм h', size: '4м', price: 8.00, unit: 'бр', brand: 'GTV' },
            { id: 96, name: 'Цокъл алуминий 100мм h', size: '4м', price: 18.00, unit: 'бр', brand: 'GTV' },
            { id: 97, name: 'Лента ПВЦ 0.4мм', size: '50м', price: 3.50, unit: 'руло', brand: 'Rehau' },
            { id: 98, name: 'Лента ПВЦ 1мм', size: '50м', price: 8.00, unit: 'руло', brand: 'Rehau' },
            { id: 99, name: 'Лента ПВЦ 2мм', size: '50м', price: 12.00, unit: 'руло', brand: 'Rehau' },
            { id: 100, name: 'Лента ABS 0.8мм', size: '50м', price: 18.00, unit: 'руло', brand: 'Rehau' },
            { id: 101, name: 'Лента ABS 2мм', size: '50м', price: 28.00, unit: 'руло', brand: 'Rehau' }
        ]
    }
};

// ID counter за нови материали
export let nextMaterialId = 102;

export function getNextMaterialId() {
    return nextMaterialId++;
}

// Helper функции
export function getAllCategories() {
    return Object.keys(materialCategories);
}

export function getCategoryByKey(key) {
    return materialCategories[key];
}

export function addMaterialToCategory(categoryKey, material) {
    if (!materialCategories[categoryKey]) {
        console.error(`Category ${categoryKey} does not exist`);
        return false;
    }
    
    material.id = getNextMaterialId();
    materialCategories[categoryKey].items.push(material);
    return true;
}

export function removeMaterialFromCategory(categoryKey, materialId) {
    if (!materialCategories[categoryKey]) {
        return false;
    }
    
    const items = materialCategories[categoryKey].items;
    const index = items.findIndex(item => item.id === materialId);
    
    if (index > -1) {
        items.splice(index, 1);
        return true;
    }
    
    return false;
}

export function updateMaterial(categoryKey, materialId, updates) {
    if (!materialCategories[categoryKey]) {
        return false;
    }
    
    const item = materialCategories[categoryKey].items.find(item => item.id === materialId);
    
    if (item) {
        Object.assign(item, updates);
        return true;
    }
    
    return false;
}

// Експорт/Импорт
export function exportMaterials() {
    return JSON.stringify(materialCategories, null, 2);
}

export function importMaterials(jsonString) {
    try {
        const imported = JSON.parse(jsonString);
        Object.assign(materialCategories, imported);
        return true;
    } catch (error) {
        console.error('Error importing materials:', error);
        return false;
    }
}
