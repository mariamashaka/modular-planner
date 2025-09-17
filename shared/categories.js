/*
MODULE: Categories Management System (formerly Projects)
VERSION: 2.0  
STATUS: WORKING
FEATURES: Hierarchical categories, groups, backward compatibility
STORAGE: localStorage
*/

// Ключ для сохранения в localStorage
const CATEGORIES_STORAGE_KEY = 'taskManager_categories';

// Дефолтные категории с иерархией
const DEFAULT_CATEGORIES = [
    // РАБОТА
    { 
        id: 'nesuda_adm', 
        name: 'Nesuda.adm', 
        group: 'РАБОТА', 
        color: '#e53e3e', 
        description: 'Административные дела'
    },
    { 
        id: 'nesuda_training', 
        name: 'Nesuda.обучение персонала', 
        group: 'РАБОТА', 
        color: '#dd6b20', 
        description: 'Обучение и развитие персонала'
    },
    { 
        id: 'nesuda_decr', 
        name: 'Nesuda.decr.makato', 
        group: 'РАБОТА', 
        color: '#38a169', 
        description: 'Декретные вопросы'
    },

    // ПРОФЕССИОНАЛЬНОЕ САМОРАЗВИТИЕ
    { 
        id: 'msc_research', 
        name: 'MSc', 
        group: 'ПРОФЕССИОНАЛЬНОЕ САМОРАЗВИТИЕ', 
        color: '#805ad5', 
        description: 'Магистерская программа и исследования'
    },
    { 
        id: 'prof_courses', 
        name: 'Курсы и сертификации', 
        group: 'ПРОФЕССИОНАЛЬНОЕ САМОРАЗВИТИЕ', 
        color: '#3182ce', 
        description: 'Профессиональные курсы'
    },

    // ЛИЧНОЕ
    { 
        id: 'personal_health', 
        name: 'Я.здоровье', 
        group: 'ЛИЧНОЕ', 
        color: '#48bb78', 
        description: 'Здоровье и самочувствие'
    },
    { 
        id: 'personal_hobby', 
        name: 'Я.хобби', 
        group: 'ЛИЧНОЕ', 
        color: '#ed8936', 
        description: 'Хобби и увлечения'
    },
    { 
        id: 'personal_development', 
        name: 'Я.развитие', 
        group: 'ЛИЧНОЕ', 
        color: '#6c5ce7', 
        description: 'Личностное развитие'
    },

    // СЕМЬЯ
    { 
        id: 'children_school', 
        name: 'Дети.школа', 
        group: 'СЕМЬЯ', 
        color: '#f56565', 
        description: 'Школьные дела детей'
    },
    { 
        id: 'children_health', 
        name: 'Дети.здоровье', 
        group: 'СЕМЬЯ', 
        color: '#4299e1', 
        description: 'Здоровье детей'
    },
    { 
        id: 'family_general', 
        name: 'Семья.общее', 
        group: 'СЕМЬЯ', 
        color: '#f687b3', 
        description: 'Общие семейные дела'
    }
];

// Инициализация - создаем дефолтные категории если их нет
function initializeCategories() {
    const existing = getCategories();
    if (existing.length === 0) {
        DEFAULT_CATEGORIES.forEach(category => {
            createCategory(category.name, category.color, category.description, category.group, category.id);
        });
        console.log('Инициализированы дефолтные категории');
    }
}

// Получить все категории
function getCategories() {
    try {
        const categories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
        return categories ? JSON.parse(categories) : [];
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        return [];
    }
}

// Сохранить категории в localStorage
function saveCategories(categories) {
    try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения категорий:', error);
        return false;
    }
}

// Создать новую категорию
function createCategory(name, color = '#667eea', description = '', group = 'ОБЩЕЕ', id = null) {
    if (!name || name.trim() === '') {
        throw new Error('Название категории не может быть пустым');
    }

    const categories = getCategories();
    
    // Проверяем уникальность названия
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Категория с таким названием уже существует');
    }

    const newCategory = {
        id: id || generateCategoryId(),
        name: name.trim(),
        group: group.trim(),
        color: color,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
    };

    categories.push(newCategory);
    
    if (saveCategories(categories)) {
        console.log('Категория создана:', newCategory.name);
        return newCategory;
    } else {
        throw new Error('Ошибка сохранения категории');
    }
}

// Получить категорию по ID
function getCategoryById(categoryId) {
    const categories = getCategories();
    return categories.find(c => c.id === categoryId) || null;
}

// Получить категорию по названию
function getCategoryByName(categoryName) {
    const categories = getCategories();
    return categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) || null;
}

// Получить категории по группе
function getCategoriesByGroup(groupName) {
    const categories = getCategories();
    return categories.filter(c => c.group.toLowerCase() === groupName.toLowerCase() && c.isActive);
}

// Получить все группы категорий
function getCategoryGroups() {
    const categories = getCategories();
    const groups = [...new Set(categories.map(c => c.group))];
    return groups.sort();
}

// Получить категории сгруппированными
function getCategoriesGrouped() {
    const categories = getActiveCategories();
    const grouped = {};
    
    categories.forEach(category => {
        if (!grouped[category.group]) {
            grouped[category.group] = [];
        }
        grouped[category.group].push(category);
    });

    // Сортируем категории внутри групп
    Object.keys(grouped).forEach(group => {
        grouped[group].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
}

// Обновить категорию
function updateCategory(categoryId, updates) {
    const categories = getCategories();
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    
    if (categoryIndex === -1) {
        throw new Error('Категория не найдена');
    }

    // Проверяем уникальность нового названия (если меняется)
    if (updates.name && updates.name !== categories[categoryIndex].name) {
        if (categories.find(c => c.name.toLowerCase() === updates.name.toLowerCase() && c.id !== categoryId)) {
            throw new Error('Категория с таким названием уже существует');
        }
    }

    // Обновляем поля
    categories[categoryIndex] = {
        ...categories[categoryIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    if (saveCategories(categories)) {
        console.log('Категория обновлена:', categories[categoryIndex].name);
        return categories[categoryIndex];
    } else {
        throw new Error('Ошибка сохранения изменений');
    }
}

// Удалить категорию
function deleteCategory(categoryId) {
    const categories = getCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) {
        throw new Error('Категория не найдена');
    }

    // TODO: Проверить, есть ли задачи в этой категории
    // const hasActiveTasks = checkCategoryHasTasks(categoryId);
    // if (hasActiveTasks) {
    //     throw new Error('Нельзя удалить категорию с активными задачами');
    // }

    const filteredCategories = categories.filter(c => c.id !== categoryId);
    
    if (saveCategories(filteredCategories)) {
        console.log('Категория удалена:', category.name);
        return true;
    } else {
        throw new Error('Ошибка удаления категории');
    }
}

// Архивировать категорию (сделать неактивной)
function archiveCategory(categoryId) {
    return updateCategory(categoryId, { isActive: false });
}

// Восстановить категорию из архива
function restoreCategory(categoryId) {
    return updateCategory(categoryId, { isActive: true });
}

// Получить только активные категории
function getActiveCategories() {
    return getCategories().filter(c => c.isActive);
}

// Получить категории для выпадающего списка
function getCategoriesForSelect() {
    const categories = getActiveCategories();
    return [
        { id: null, name: '-- Без категории --', color: '#6c757d', group: '' },
        ...categories.map(c => ({ id: c.id, name: c.name, color: c.color, group: c.group }))
    ];
}

// Получить категории для выпадающего списка (сгруппированные)
function getCategoriesForSelectGrouped() {
    const grouped = getCategoriesGrouped();
    const result = [{ id: null, name: '-- Без категории --', color: '#6c757d', group: '' }];
    
    Object.keys(grouped).sort().forEach(group => {
        grouped[group].forEach(category => {
            result.push({
                id: category.id,
                name: category.name,
                color: category.color,
                group: group,
                fullName: `${group} → ${category.name}`
            });
        });
    });
    
    return result;
}

// Генерация уникального ID для категории
function generateCategoryId() {
    return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Получить статистику по категории
function getCategoryStats(categoryId) {
    // TODO: Интегрировать с модулями задач
    return {
        totalTasks: 0,
        completedTasks: 0,
        urgentTasks: 0,
        overdueTasks: 0
    };
}

// Получить статистику по группам категорий (для колеса баланса)
function getGroupStats() {
    const groups = getCategoryGroups();
    const stats = {};
    
    groups.forEach(group => {
        stats[group] = {
            totalTasks: 0,
            completedTasks: 0,
            urgentTasks: 0,
            overdueTasks: 0,
            categories: getCategoriesByGroup(group).length
        };
    });
    
    // TODO: Подсчитать реальную статистику из модулей задач
    
    return stats;
}

// Валидация цвета категории
function isValidColor(color) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
}

// НОВЫЙ API (основной)
window.CategoryManager = {
    // Основные функции
    init: initializeCategories,
    getAll: getCategories,
    create: createCategory,
    getById: getCategoryById,
    getByName: getCategoryByName,
    update: updateCategory,
    delete: deleteCategory,
    archive: archiveCategory,
    restore: restoreCategory,
    
    // Активные категории
    getActive: getActiveCategories,
    getForSelect: getCategoriesForSelect,
    getForSelectGrouped: getCategoriesForSelectGrouped,
    
    // Группировка
    getByGroup: getCategoriesByGroup,
    getGroups: getCategoryGroups,
    getGrouped: getCategoriesGrouped,
    
    // Статистика
    getStats: getCategoryStats,
    getGroupStats: getGroupStats
};

// ОБРАТНАЯ СОВМЕСТИМОСТЬ - алиасы для старых названий
window.ProjectManager = {
    getProjects: getActiveCategories,
    getActive: getActiveCategories,
    getAll: getCategories,
    getById: getCategoryById,
    getByName: getCategoryByName,
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
    getForSelect: getCategoriesForSelect,
    getStats: getCategoryStats
};

window.ProjectsManager = {
    init: initializeCategories,
    getAll: getCategories,
    create: createCategory,
    getById: getCategoryById,
    getByName: getCategoryByName,
    update: updateCategory,
    delete: deleteCategory,
    archive: archiveCategory,
    restore: restoreCategory,
    getActive: getActiveCategories,
    getForSelect: getCategoriesForSelect,
    getStats: getCategoryStats
};

console.log('Categories Management System v2.0 загружен (с обратной совместимостью)');
