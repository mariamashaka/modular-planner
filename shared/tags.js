/*
MODULE: Tag Management System
VERSION: 1.0  
STATUS: WORKING
FEATURES: Cross-module tag management and filtering
STORAGE: localStorage (читает из всех модулей)
MODULES: urgent-flow, repeat-flow, projects-flow, calendar-flow, etc.
*/

console.log('Tag Management System загружается...');

// Ключи localStorage для разных модулей
const MODULE_STORAGE_KEYS = {
    'urgent-flow': 'urgentTasks',
    'repeat-flow': 'repeatPools', 
    'projects-flow': 'projectTasks',
    'calendar-flow': 'calendarTasks',
    'onetime-flow': 'onetimeTasks'
};

// Инициализация системы тегов
function initializeTags() {
    console.log('Tag Management System инициализирован');
}

// Получить все активные задачи из всех модулей
function getAllActiveTasks() {
    const allTasks = [];
    
    try {
        // URGENT FLOW - прямые задачи
        const urgentTasks = JSON.parse(localStorage.getItem('urgentTasks') || '[]');
        urgentTasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                allTasks.push({
                    id: task.id,
                    name: task.name || task.text,
                    module: 'urgent-flow',
                    moduleIcon: '⚡',
                    project: task.project || null,
                    tags: task.tags,
                    priority: task.priority || null,
                    date: task.date || null,
                    originalData: task
                });
            }
        });

        // REPEAT FLOW - задачи в пулах
        const repeatPools = JSON.parse(localStorage.getItem('repeatPools') || '[]');
        repeatPools.forEach(pool => {
            if (pool.tasks && Array.isArray(pool.tasks)) {
                pool.tasks.forEach(task => {
                    if (task.tags && Array.isArray(task.tags)) {
                        allTasks.push({
                            id: `${pool.id}-${task.id}`,
                            name: task.name,
                            module: 'repeat-flow',
                            moduleIcon: '🔄',
                            project: pool.project || null,
                            tags: task.tags,
                            priority: null,
                            date: null,
                            pool: pool.name,
                            progress: `${task.completed}/${task.target}`,
                            originalData: {pool: pool, task: task}
                        });
                    }
                });
            }
        });

        // TODO: Добавить другие модули когда они будут созданы
        // PROJECTS FLOW, CALENDAR FLOW, etc.
        
        console.log(`Собрано ${allTasks.length} активных задач с тегами`);
        return allTasks;
        
    } catch (error) {
        console.error('Ошибка получения активных задач:', error);
        return [];
    }
}

// Получить все уникальные теги
function getAllTags() {
    const tasks = getAllActiveTasks();
    const tagSet = new Set();
    
    tasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
                if (tag && typeof tag === 'string' && tag.trim()) {
                    tagSet.add(tag.trim().toLowerCase());
                }
            });
        }
    });
    
    const tags = Array.from(tagSet).sort();
    console.log(`Найдено ${tags.length} уникальных тегов:`, tags);
    return tags;
}

// Получить задачи по тегу
function getTasksByTag(targetTag) {
    if (!targetTag || typeof targetTag !== 'string') {
        return [];
    }
    
    const normalizedTarget = targetTag.trim().toLowerCase();
    const tasks = getAllActiveTasks();
    
    const filtered = tasks.filter(task => {
        return task.tags && task.tags.some(tag => 
            tag.trim().toLowerCase() === normalizedTarget
        );
    });
    
    console.log(`Найдено ${filtered.length} задач с тегом "${targetTag}"`);
    return filtered;
}

// Получить статистику по тегам
function getTagStats() {
    const tasks = getAllActiveTasks();
    const tagStats = {};
    
    tasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
                if (tag && typeof tag === 'string' && tag.trim()) {
                    const normalizedTag = tag.trim().toLowerCase();
                    if (!tagStats[normalizedTag]) {
                        tagStats[normalizedTag] = {
                            tag: tag.trim(),
                            count: 0,
                            modules: new Set(),
                            projects: new Set()
                        };
                    }
                    tagStats[normalizedTag].count++;
                    tagStats[normalizedTag].modules.add(task.module);
                    if (task.project) {
                        tagStats[normalizedTag].projects.add(task.project);
                    }
                }
            });
        }
    });
    
    // Конвертируем Sets в массивы для JSON
    const result = Object.keys(tagStats).map(key => ({
        tag: tagStats[key].tag,
        count: tagStats[key].count,
        modules: Array.from(tagStats[key].modules),
        projects: Array.from(tagStats[key].projects)
    })).sort((a, b) => b.count - a.count); // Сортируем по популярности
    
    console.log(`Статистика по ${result.length} тегам:`, result);
    return result;
}

// Получить задачи с фильтрами
function getFilteredTasks(filters = {}) {
    let tasks = getAllActiveTasks();
    
    // Фильтр по тегу
    if (filters.tag) {
        tasks = getTasksByTag(filters.tag);
    }
    
    // Фильтр по модулю
    if (filters.module) {
        tasks = tasks.filter(task => task.module === filters.module);
    }
    
    // Фильтр по проекту
    if (filters.project) {
        tasks = tasks.filter(task => task.project === filters.project);
    }
    
    // Фильтр по приоритету
    if (filters.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
    }
    
    // Поиск по тексту
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        tasks = tasks.filter(task => 
            task.name.toLowerCase().includes(searchLower) ||
            (task.tags && task.tags.some(tag => 
                tag.toLowerCase().includes(searchLower)
            ))
        );
    }
    
    // Сортировка
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    
    tasks.sort((a, b) => {
        let aValue = a[sortBy] || '';
        let bValue = b[sortBy] || '';
        
        // Специальная обработка для даты
        if (sortBy === 'date') {
            aValue = a.date ? new Date(a.date) : new Date(0);
            bValue = b.date ? new Date(b.date) : new Date(0);
        }
        
        if (sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1;
        } else {
            return aValue > bValue ? 1 : -1;
        }
    });
    
    console.log(`Отфильтровано ${tasks.length} задач:`, filters);
    return tasks;
}

// Получить популярные теги (топ N)
function getPopularTags(limit = 10) {
    const stats = getTagStats();
    return stats.slice(0, limit);
}

// Получить теги для конкретного проекта
function getTagsByProject(projectName) {
    const tasks = getAllActiveTasks().filter(task => task.project === projectName);
    const tagSet = new Set();
    
    tasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
                if (tag && typeof tag === 'string' && tag.trim()) {
                    tagSet.add(tag.trim().toLowerCase());
                }
            });
        }
    });
    
    return Array.from(tagSet).sort();
}

// Получить теги для конкретного модуля
function getTagsByModule(moduleName) {
    const tasks = getAllActiveTasks().filter(task => task.module === moduleName);
    const tagSet = new Set();
    
    tasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
                if (tag && typeof tag === 'string' && tag.trim()) {
                    tagSet.add(tag.trim().toLowerCase());
                }
            });
        }
    });
    
    return Array.from(tagSet).sort();
}

// Предложить теги (автокомплит)
function suggestTags(input, limit = 5) {
    if (!input || typeof input !== 'string') {
        return [];
    }
    
    const inputLower = input.toLowerCase();
    const allTags = getAllTags();
    
    // Точные совпадения в начале
    const exactMatches = allTags.filter(tag => 
        tag.startsWith(inputLower)
    );
    
    // Частичные совпадения
    const partialMatches = allTags.filter(tag => 
        tag.includes(inputLower) && !tag.startsWith(inputLower)
    );
    
    const suggestions = [...exactMatches, ...partialMatches].slice(0, limit);
    console.log(`Предложения для "${input}":`, suggestions);
    return suggestions;
}

// Проверить существует ли тег
function tagExists(tagName) {
    if (!tagName || typeof tagName !== 'string') {
        return false;
    }
    
    const normalizedTag = tagName.trim().toLowerCase();
    const allTags = getAllTags();
    return allTags.includes(normalizedTag);
}

// Получить связанные теги (часто используются вместе)
function getRelatedTags(targetTag, limit = 5) {
    if (!targetTag || typeof targetTag !== 'string') {
        return [];
    }
    
    const normalizedTarget = targetTag.trim().toLowerCase();
    const tasks = getTasksByTag(targetTag);
    const relatedTagCounts = {};
    
    tasks.forEach(task => {
        if (task.tags && Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
                const normalizedTag = tag.trim().toLowerCase();
                if (normalizedTag !== normalizedTarget) {
                    relatedTagCounts[normalizedTag] = (relatedTagCounts[normalizedTag] || 0) + 1;
                }
            });
        }
    });
    
    const relatedTags = Object.keys(relatedTagCounts)
        .map(tag => ({
            tag: tag,
            count: relatedTagCounts[tag]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => item.tag);
    
    console.log(`Связанные теги для "${targetTag}":`, relatedTags);
    return relatedTags;
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    // Browser environment
    window.TagManager = {
        init: initializeTags,
        getAllTasks: getAllActiveTasks,
        getAllTags: getAllTags,
        getTasksByTag: getTasksByTag,
        getStats: getTagStats,
        getFiltered: getFilteredTasks,
        getPopular: getPopularTags,
        getByProject: getTagsByProject,
        getByModule: getTagsByModule,
        suggest: suggestTags,
        exists: tagExists,
        getRelated: getRelatedTags
    };
} else {
    // Node.js environment
    module.exports = {
        initializeTags,
        getAllActiveTasks,
        getAllTags,
        getTasksByTag,
        getTagStats,
        getFilteredTasks,
        getPopularTags,
        getTagsByProject,
        getTagsByModule,
        suggestTags,
        tagExists,
        getRelatedTags
    };
}

console.log('Tag Management System загружен успешно');
