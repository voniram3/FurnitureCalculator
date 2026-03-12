// Категории материали - ФАЗА 2
// Динамично зареждане от JSON файлове

export const materialCategories = {
    plohi: {
        name: '🪵 Плочи (ПДЧ и МДФ)',
        icon: '🪵',
        jsonFile: 'plohi.json',
        unit: 'лист',
        description: 'ПДЧ и МДФ плоскости за корпуси и врати',
        items: [] // ще се зареди динамично
    },
    
    plotove: {
        name: '🔨 Плотове и гръбове',
        icon: '🔨',
        jsonFile: 'plotove.json',
        unit: 'лист',
        description: 'Плотове, гръбове и фазери',
        items: []
    },
    
    panti: {
        name: '🔩 Панти',
        icon: '🔩',
        jsonFile: 'panti.json',
        unit: 'бр',
        description: 'Панти за врати на шкафове',
        items: []
    },
    
    povdigashti: {
        name: '⬆️ Повдигащи механизми',
        icon: '⬆️',
        jsonFile: 'povdigashti.json',
        unit: 'комплект',
        description: 'Механизми за повдигащи вратички (Aventos и др.)',
        items: []
    },
    
    butilieri: {
        name: '🍷 Бутилиери',
        icon: '🍷',
        jsonFile: 'butilieri.json',
        unit: 'комплект',
        description: 'Механизми за бутилкови шкафове',
        items: []
    },
    
    mehanizmiDolen: {
        name: '🔧 Механизми за долен шкаф',
        icon: '🔧',
        jsonFile: 'mehanizmi-dolen.json',
        unit: 'комплект',
        description: 'Cargo механизми, въртящи кошове и др.',
        items: []
    },
    
    okachvachi: {
        name: '🔗 Окачвачи',
        icon: '🔗',
        jsonFile: 'okachvachi.json',
        unit: 'бр',
        description: 'Окачвачи и релси за монтаж на шкафове',
        items: []
    },
    
    chekmedzheta: {
        name: '🗃️ Системи за чекмеджета',
        icon: '🗃️',
        jsonFile: 'chekmedzheta.json',
        unit: 'комплект',
        description: 'Metabox, Tandembox, водачи и системи за чекмеджета',
        items: []
    },
    
    kraka: {
        name: '🦵 Крака за шкафове',
        icon: '🦵',
        jsonFile: 'kraka.json',
        unit: 'бр',
        description: 'Регулируеми крака за долни шкафове',
        items: []
    },
    
    drujki: {
        name: '🎛️ Дръжки',
        icon: '🎛️',
        jsonFile: 'drujki.json',
        unit: 'бр',
        description: 'Дръжки, профилни и релинг системи',
        items: []
    },
    
    drugi: {
        name: '🔧 Други',
        icon: '🔧',
        jsonFile: 'drugi.json',
        unit: 'бр',
        description: 'Рафтодържачи, щипки и други аксесоари',
        items: []
    },
    
    kantove: {
        name: '📏 Кантове',
        icon: '📏',
        jsonFile: 'kantove.json',
        unit: 'метър',
        description: 'PVC и ABS кантове за обработка',
        items: []
    }
};

// Helper функции за работа с материали

/**
 * Нормализира материал от Lamina.bg формат
 */
function normalizeLaminaFormat(item, unit) {
    // Поправка на image път: ./images/ -> /images/
    let imagePath = item.image || null;
    if (imagePath && imagePath.startsWith('./')) {
        imagePath = imagePath.substring(1); // Премахва точката
    }
    
    return {
        id: item.code || `item_${Date.now()}`,
        name: item.name,
        price: parseFloat(item.prices?.[0]?.price) || 0,
        priceAlt: parseFloat(item.prices?.[1]?.price) || null,
        unit: unit,
        image: imagePath,
        inStock: item.inStock !== false,
        supplier: 'lamina',
        url: item.url || null,
        
        // Допълнителни полета (ако има)
        size: item.size || null,
        thickness: item.thickness || null,
        brand: item.brand || null,
        code: item.code || null,
        edges: item.edges || []
    };
}

/**
 * Нормализира материал от Salex.bg формат
 */
function normalizeSalexFormat(item, unit) {
    // Извличаме размер и дебелина от заглавието
    const sizeMatch = item.title?.match(/(\d+)\/(\d+)\/(\d+)мм/) || [];
    const brandMatch = item.title?.match(/(EGGER|KRONOSPAN|FUNDERMAX)/i) || [];
    
    // Поправка на image път: ./images/ -> /images/
    let imagePath = item.image || null;
    if (imagePath && imagePath.startsWith('./')) {
        imagePath = imagePath.substring(1);
    }
    
    return {
        id: `salex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.title,
        price: parseFloat(item.price_bgn) || 0,
        priceEur: parseFloat(item.price_eur) || null,
        unit: unit,
        image: imagePath,
        inStock: true, // Salex няма inStock поле, приемаме да
        supplier: 'salex',
        url: item.url || null,
        category: item.category || null,
        
        // Извлечени данни
        size: sizeMatch[1] && sizeMatch[2] ? `${sizeMatch[1]}×${sizeMatch[2]}` : null,
        thickness: sizeMatch[3] ? `${sizeMatch[3]}мм` : null,
        brand: brandMatch[1] || null
    };
}

/**
 * Вече унифициран формат (не се променя)
 */
function normalizeUnifiedFormat(item, unit) {
    // Поправка на image път: ./images/ -> /images/
    let imagePath = item.image || null;
    if (imagePath && imagePath.startsWith('./')) {
        imagePath = imagePath.substring(1);
    }
    
    return {
        ...item,
        image: imagePath,
        unit: item.unit || unit,
        inStock: item.inStock !== false
    };
}

/**
 * Auto-detect и нормализиране на материал
 */
export function normalizeMaterial(item, unit) {
    // Детектираме формата и нормализираме
    if (item.code && item.prices) {
        // Lamina формат
        return normalizeLaminaFormat(item, unit);
    } else if (item.title && item.price_bgn) {
        // Salex формат
        return normalizeSalexFormat(item, unit);
    } else {
        // Вече унифициран или неизвестен формат
        return normalizeUnifiedFormat(item, unit);
    }
}

/**
 * Зареждане на материали от JSON файл
 */
export async function loadCategoryMaterials(categoryKey) {
    const category = materialCategories[categoryKey];
    if (!category) {
        console.error(`Category ${categoryKey} not found`);
        return [];
    }
    
    try {
        const response = await fetch(`/data/materials/${category.jsonFile}`);
        if (!response.ok) {
            console.warn(`File ${category.jsonFile} not found, using empty array`);
            return [];
        }
        
        const rawData = await response.json();
        
        // Нормализираме всеки материал
        const normalized = rawData.map(item => normalizeMaterial(item, category.unit));
        
        // Запазваме в категорията
        category.items = normalized;
        
        return normalized;
    } catch (error) {
        console.error(`Error loading ${category.jsonFile}:`, error);
        return [];
    }
}

/**
 * Зареждане на всички категории
 */
export async function loadAllMaterials() {
    const categories = Object.keys(materialCategories);
    const promises = categories.map(key => loadCategoryMaterials(key));
    
    await Promise.all(promises);
    
    console.log('✅ All materials loaded');
    return materialCategories;
}

/**
 * Получаване на материал по ID
 */
export function getMaterialById(id) {
    for (const category of Object.values(materialCategories)) {
        const material = category.items.find(item => item.id === id);
        if (material) return material;
    }
    return null;
}

/**
 * Търсене на материали
 */
export function searchMaterials(query, categoryKey = null) {
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    const categoriesToSearch = categoryKey 
        ? [materialCategories[categoryKey]]
        : Object.values(materialCategories);
    
    for (const category of categoriesToSearch) {
        const matches = category.items.filter(item => 
            item.name.toLowerCase().includes(lowerQuery) ||
            item.id.toLowerCase().includes(lowerQuery) ||
            item.brand?.toLowerCase().includes(lowerQuery)
        );
        results.push(...matches);
    }
    
    return results;
}

/**
 * Експорт на персонализирани материали
 */
export function exportCustomMaterials() {
    // Експортира само добавени/променени материали от localStorage
    const custom = localStorage.getItem('customMaterials');
    return custom ? JSON.parse(custom) : {};
}

/**
 * Запазване на персонализиран материал
 */
export function saveCustomMaterial(categoryKey, material) {
    const custom = exportCustomMaterials();
    
    if (!custom[categoryKey]) {
        custom[categoryKey] = [];
    }
    
    // Проверка дали вече съществува
    const existingIndex = custom[categoryKey].findIndex(m => m.id === material.id);
    
    if (existingIndex >= 0) {
        custom[categoryKey][existingIndex] = material;
    } else {
        custom[categoryKey].push(material);
    }
    
    localStorage.setItem('customMaterials', JSON.stringify(custom));
    
    // Добавяме и в категорията
    if (materialCategories[categoryKey]) {
        materialCategories[categoryKey].items.push(material);
    }
}

/**
 * Изтриване на персонализиран материал
 */
export function deleteCustomMaterial(categoryKey, materialId) {
    const custom = exportCustomMaterials();
    
    if (custom[categoryKey]) {
        custom[categoryKey] = custom[categoryKey].filter(m => m.id !== materialId);
        localStorage.setItem('customMaterials', JSON.stringify(custom));
    }
    
    // Премахваме и от категорията
    if (materialCategories[categoryKey]) {
        materialCategories[categoryKey].items = 
            materialCategories[categoryKey].items.filter(m => m.id !== materialId);
    }
}
