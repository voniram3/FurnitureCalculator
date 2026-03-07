// Конфигурации на типовете шкафове
export const cabinetTypes = {
    'base': {
        icon: '🗄️', name: 'Долен шкаф',
        description: 'Стандартен долен кухненски шкаф',
        defaultWidth: 600, defaultHeight: 760, defaultDepth: 560,
        defaultShelves: 1, defaultDoors: 2, defaultDrawers: 0
    },
    'upper': {
        icon: '📦', name: 'Горен шкаф',
        description: 'Горен кухненски шкаф с монтажна система',
        defaultWidth: 600, defaultHeight: 720, defaultDepth: 320,
        defaultShelves: 2, defaultDoors: 2, defaultDrawers: 0
    },
    'drawer': {
        icon: '🗃️', name: 'Шкаф чекмедже',
        description: 'Шкаф с множество чекмеджета',
        defaultWidth: 600, defaultHeight: 760, defaultDepth: 560,
        defaultShelves: 0, defaultDoors: 0, defaultDrawers: 3
    },
    'oven': {
        icon: '🔥', name: 'Шкаф за фурна',
        description: 'Специализиран шкаф за вградена фурна',
        defaultWidth: 600, defaultHeight: 760, defaultDepth: 560,
        defaultShelves: 0, defaultDoors: 0, defaultDrawers: 1
    },
    'sink': {
        icon: '🚰', name: 'Шкаф за мивка',
        description: 'Шкаф под мивка с отвор за сифон',
        defaultWidth: 800, defaultHeight: 760, defaultDepth: 560,
        defaultShelves: 0, defaultDoors: 2, defaultDrawers: 0
    },
    'blind': {
        icon: '📐', name: 'Глух шкаф',
        description: 'Ъглов глух шкаф',
        defaultWidth: 900, defaultHeight: 760, defaultDepth: 560,
        defaultShelves: 1, defaultDoors: 1, defaultDrawers: 0
    },
    'fridge': {
        icon: '❄️', name: 'Вграден хладилник',
        description: 'Колона за вграждане на хладилник',
        defaultWidth: 600, defaultHeight: 2100, defaultDepth: 560,
        defaultShelves: 0, defaultDoors: 2, defaultDrawers: 0
    },
    'column': {
        icon: '🏛️', name: 'Колона',
        description: 'Висока колона за съхранение',
        defaultWidth: 600, defaultHeight: 2100, defaultDepth: 560,
        defaultShelves: 3, defaultDoors: 2, defaultDrawers: 0
    },
     'upperLift': {
        name: 'Горен шкаф с механизъм',
        icon: '⬆️',
        description: 'Горен шкаф с повдигащ механизъм вместо панти',
        defaultWidth: 800,
        defaultHeight: 720,
        defaultDepth: 320,
        defaultShelves: 1,
        defaultDoors: 2,
        defaultDrawers: 0,
        liftMechanism: 'Aventos HS'
    },

    'panel': {
        name: 'Допълнителна плоскост',
        icon: '📋',
        description: 'Допълнителна плоскост с произволни размери',
        defaultWidth: 880,
        defaultHeight: 580,
        defaultDepth: 18,
        defaultShelves: 0,
        defaultDoors: 0,
        defaultDrawers: 0
    },

    'plinth': {
        name: 'Цокъл',
        icon: '📏',
        description: 'Цокъл за долни шкафове',
        defaultWidth: 4000,
        defaultHeight: 100,
        defaultDepth: 18,
        defaultShelves: 0,
        defaultDoors: 0,
        defaultDrawers: 0
    }
};

// Стандартни материали
export const defaultMaterials = [
    { name: 'ПДЧ', size: '2800×2070', thickness: '18мм', price: 120.00, unit: 'лист' },
    { name: 'МДФ', size: '2800×2070', thickness: '18мм', price: 180.00, unit: 'лист' },
    { name: 'ХДЛ плот', size: '4100×600', thickness: '38мм', price: 250.00, unit: 'лист' },
    { name: 'Масив плот', size: '2000×600', thickness: '40мм', price: 350.00, unit: 'лист' },
    { name: 'ХДЛ гръб', size: '4100×600', thickness: '8мм', price: 80.00, unit: 'лист' },
    { name: 'МДФ гръб', size: '4100×600', thickness: '8мм', price: 90.00, unit: 'лист' },
    { name: 'Фазер/гръб', size: '2800×2070', thickness: '2.5мм', price: 45.00, unit: 'лист' }
];

// Монтажни услуги
export const installationServices = [
    { name: 'Вграждане на аспиратор', price: 50.00, unit: 'бр' },
    { name: 'Монтаж на мивка, сифон и преливник', price: 50.00, unit: 'бр' },
    { name: 'Вграждане на миялна или перална машина', price: 50.00, unit: 'бр' },
    { name: 'Вграждане на плот с котлони', price: 50.00, unit: 'бр' },
    { name: 'Вграждане на фурна', price: 30.00, unit: 'бр' },
    { name: 'Вграждане на хладилник или фризер', price: 50.00, unit: 'бр' },
    { name: 'Монтаж на аксесоар', price: 9.00, unit: 'бр' },
    { name: 'Монтаж на водобран (детайл 1 бр)', price: 10.00, unit: 'бр' },
    { name: 'Монтаж на компоненти към бар-плот 1 бр', price: 28.00, unit: 'бр' },
    { name: 'Монтаж на мелница за отпадъци', price: 50.00, unit: 'бр' },
    { name: 'Монтаж на механизъм в шкаф', price: 40.00, unit: 'бр' },
    { name: 'Монтаж на модул', price: 25.00, unit: 'бр' },
    { name: 'Монтаж на окачен осветителен панел 1 бр', price: 24.00, unit: 'бр' },
    { name: 'Монтаж на осветителни панели - за 1 бр', price: 16.00, unit: 'бр' },
    { name: 'Монтаж на островен аспиратор', price: 200.00, unit: 'бр' },
    { name: 'Монтаж на осветително тяло', price: 15.00, unit: 'бр' },
    { name: 'Монтаж на стенни панели (детайл 1 бр)', price: 16.00, unit: 'бр' },
    { name: 'Монтаж на кухненски плот (детайл 1 бр)', price: 25.00, unit: 'бр' },
    { name: 'Монтаж на LED лента 1 бр', price: 30.00, unit: 'бр' },
    { name: 'Свързване на ел. уред към ел. инсталация 1 бр', price: 15.00, unit: 'бр' },
    { name: 'Извеждане на ел. точка 1 бр', price: 16.00, unit: 'бр' },
    { name: 'Изместване на ел. точка 1 бр', price: 33.00, unit: 'бр' },
    { name: 'Зарязване на плот или шкаф 1 бр', price: 16.00, unit: 'бр' },
    { name: 'Свързване на смесител към водопровод', price: 35.00, unit: 'бр' },
    { name: 'Свързване на сифон към канализация', price: 35.00, unit: 'бр' },
    { name: 'Свързване на миялна към ВиК', price: 35.00, unit: 'бр' },
    { name: 'Свързване на пералня към ВиК', price: 35.00, unit: 'бр' }
];

// Трудови операции
export const laborOperations = [
    { name: 'Рязане', price: 1.80, unit: 'м' },
    { name: 'Кантиране 0,8 мм', price: 1.60, unit: 'м' },
    { name: 'Кантиране от 1 до 2 мм', price: 1.80, unit: 'м' },
    { name: 'Кантиране гланц', price: 2.30, unit: 'м' },
    { name: 'Кантиране от 0,8 до 2х42', price: 3.45, unit: 'м' },
    { name: 'Рязане на плот/гръб', price: 7.00, unit: 'м' },
    { name: 'Кантиране на плот/гръб', price: 10.00, unit: 'м' },
    { name: 'Криволинейно рязане и кантиране', price: 22.00, unit: 'м' },
    { name: 'Сглобяване на модули', price: 50.00, unit: 'бр' },
    { name: 'Монтаж на чекмедже', price: 16.50, unit: 'бр' },
    { name: 'Монтаж на амортисьор', price: 5.00, unit: 'бр' },
    { name: 'Бутилков механизъм', price: 35.00, unit: 'бр' },
    { name: 'Клапващ механизъм малък', price: 30.00, unit: 'бр' },
    { name: 'Клапващ механизъм голям', price: 44.00, unit: 'бр' },
    { name: 'Електрически клапващ механизъм', price: 50.00, unit: 'бр' },
    { name: 'Нут и фалц или фрезоване', price: 10.00, unit: 'м' },
    { name: 'Витрини', price: 42.00, unit: 'бр' },
    { name: 'Вкопаване на дръжки', price: 15.00, unit: 'бр' },
    { name: 'Обтегач за врата', price: 20.00, unit: 'бр' },
    { name: 'Сдвояване на детайли на винтове', price: 12.00, unit: 'бр' },
    { name: 'Сдвояване на детайли на лепило', price: 24.00, unit: 'бр' }
];
