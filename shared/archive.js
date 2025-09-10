/*
MODULE: Task Archive System
VERSION: 1.0  
STATUS: WORKING
FEATURES: Unified archive for all task modules
STORAGE: localStorage
MODULES: urgent-flow, repeat-flow, calendar-flow, etc.
*/

// Ключ для сохранения в localStorage
const ARCHIVE_STORAGE_KEY = 'taskManager_archive';

// Инициализация архива
function initializeArchive() {
    console.log('Task Archive System инициализирован');
}

// Получить все архивные задачи
function getArchivedTasks() {
    try {
        const archive = localStorage.getItem(ARCHIVE_STORAGE_KEY);
        return archive ? JSON.parse(archive) : [];
    } catch (error) {
        console.error('Ошибка загрузки архива:', error);
        return [];
    }
}

// Сохранить архив в localStorage
function saveArchive(tasks) {
    try {
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения архива:', error);
        return false;
    }
}

// Добавить задачу в архив
function archiveTask(taskData) {
    const requiredFields = ['text', 'moduleType'];
    for (let field of requiredFields) {
        if (!taskData[field]) {
            throw new Error(`Поле ${field} обязательно для архивирования`);
        }
    }

    const archivedTasks = getArchivedTasks();
    
    const archivedTask = {
        id: generateArchiveId(),
        originalId: taskData.id || null,
        text: taskData.text,
        projectId: taskData.projectId || null,
        moduleType: taskData.moduleType, // 'urgent-flow', 'repeat-flow', etc.
        
        // Даты
        createdAt: taskData.createdAt || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        originalDate: taskData.date || null,
        
        // Дополнительные данные
        priority: taskData.priority || null,
        tags: taskData.tags || [],
        notes: taskData.notes || '',
        
        // Метаданные
        isArchived: true,
        archivedFrom: taskData.moduleType
    };

    archivedTasks.push(archivedTask);
    
    if (saveArchive(archivedTasks)) {
        console.log('Задача добавлена в архив:', archivedTask.text);
        return archivedTask;
    } else {
        throw new Error('Ошибка сохранения в архив');
    }
}

// Получить задачи по фильтрам
function getFilteredArchive(filters = {}) {
    const tasks = getArchivedTasks();
    let filtered = [...tasks];

    // Фильтр по дате
    if (filters.dateFrom) {
        filtered = filtered.filter(task => 
            task.completedAt >= filters.dateFrom
        );
    }
    if (filters.dateTo) {
        filtered = filtered.filter(task => 
            task.completedAt <= filters.dateTo
        );
    }

    // Фильтр по проекту
    if (filters.projectId) {
        filtered = filtered.filter(task => 
            task.projectId === filters.projectId
        );
    }

    // Фильтр по модулю
    if (filters.moduleType) {
        filtered = filtered.filter(task => 
            task.moduleType === filters.moduleType
        );
    }

    // Поиск по тексту
    if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        filtered = filtered.filter(task => 
            task.text.toLowerCase().includes(searchLower) ||
            task.notes.toLowerCase().includes(searchLower)
        );
    }

    // Сортировка (по умолчанию - новые сначала)
    const sortBy = filters.sortBy || 'completedAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';
        
        if (sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1;
        } else {
            return aValue > bValue ? 1 : -1;
        }
    });

    return filtered;
}

// Получить задачи за сегодня
function getTodayArchive() {
    const today = new Date().toISOString().split('T')[0];
    return getFilteredArchive({
        dateFrom: today + 'T00:00:00.000Z',
        dateTo: today + 'T23:59:59.999Z'
    });
}

// Получить задачи за неделю
function getWeekArchive() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    return getFilteredArchive({
        dateFrom: weekAgo.toISOString(),
        dateTo: today.toISOString()
    });
}

// Получить задачи за месяц
function getMonthArchive() {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    
    return getFilteredArchive({
        dateFrom: monthAgo.toISOString(),
        dateTo: today.toISOString()
    });
}

// Восстановить задачу из архива (удалить из архива, вернуть данные)
function restoreTask(archiveId) {
    const tasks = getArchivedTasks();
    const taskIndex = tasks.findIndex(t => t.id === archiveId);
    
    if (taskIndex === -1) {
        throw new Error('Задача в архиве не найдена');
    }
    
    const task = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    
    if (saveArchive(tasks)) {
        console.log('Задача восстановлена из архива:', task.text);
        return {
            id: task.originalId,
            text: task.text,
            projectId: task.projectId,
            date: task.originalDate,
            moduleType: task.moduleType,
            priority: task.priority,
            tags: task.tags,
            notes: task.notes,
            createdAt: task.createdAt
        };
    } else {
        throw new Error('Ошибка восстановления из архива');
    }
}

// Удалить задачу из архива навсегда
function deleteFromArchive(archiveId) {
    const tasks = getArchivedTasks();
    const task = tasks.find(t => t.id === archiveId);
    
    if (!task) {
        throw new Error('Задача в архиве не найдена');
    }
    
    const filteredTasks = tasks.filter(t => t.id !== archiveId);
    
    if (saveArchive(filteredTasks)) {
        console.log('Задача удалена из архива навсегда:', task.text);
        return true;
    } else {
        throw new Error('Ошибка удаления из архива');
    }
}

// Получить статистику по архиву
function getArchiveStats(period = 'month') {
    let tasks;
    
    switch(period) {
        case 'today':
            tasks = getTodayArchive();
            break;
        case 'week':
            tasks = getWeekArchive();
            break;
        case 'month':
            tasks = getMonthArchive();
            break;
        default:
            tasks = getArchivedTasks();
    }
    
    // Общая статистика
    const totalTasks = tasks.length;
    
    // По проектам
    const projectStats = {};
    tasks.forEach(task => {
        const projectId = task.projectId || 'no-project';
        projectStats[projectId] = (projectStats[projectId] || 0) + 1;
    });
    
    // По модулям
    const moduleStats = {};
    tasks.forEach(task => {
        moduleStats[task.moduleType] = (moduleStats[task.moduleType] || 0) + 1;
    });
    
    // По дням (для графиков)
    const dailyStats = {};
    tasks.forEach(task => {
        const date = task.completedAt.split('T')[0];
        dailyStats[date] = (dailyStats[date] || 0) + 1;
    });
    
    return {
        period: period,
        totalTasks: totalTasks,
        projectStats: projectStats,
        moduleStats: moduleStats,
        dailyStats: dailyStats,
        averagePerDay: totalTasks / Object.keys(dailyStats).length || 0
    };
}

// Очистить старые задачи из архива (старше N дней)
function cleanOldArchive(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();
    
    const tasks = getArchivedTasks();
    const filteredTasks = tasks.filter(task => task.completedAt >= cutoffISO);
    const removedCount = tasks.length - filteredTasks.length;
    
    if (saveArchive(filteredTasks)) {
        console.log(`Удалено ${removedCount} старых задач из архива`);
        return removedCount;
    } else {
        throw new Error('Ошибка очистки архива');
    }
}

// Экспортировать архив в JSON
function exportArchive(filters = {}) {
    const tasks = getFilteredArchive(filters);
    const exportData = {
        exportDate: new Date().toISOString(),
        taskCount: tasks.length,
        filters: filters,
        tasks: tasks
    };
    
    return JSON.stringify(exportData, null, 2);
}

// Генерация ID для архивной записи
function generateArchiveId() {
    return 'arch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Экспорт функций для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        initializeArchive,
        archiveTask,
        getArchivedTasks,
        getFilteredArchive,
        getTodayArchive,
        getWeekArchive,
        getMonthArchive,
        restoreTask,
        deleteFromArchive,
        getArchiveStats,
        cleanOldArchive,
        exportArchive
    };
} else {
    // Browser environment - функции доступны глобально
    window.ArchiveManager = {
        init: initializeArchive,
        archive: archiveTask,
        getAll: getArchivedTasks,
        getFiltered: getFilteredArchive,
        getToday: getTodayArchive,
        getWeek: getWeekArchive,
        getMonth: getMonthArchive,
        restore: restoreTask,
        delete: deleteFromArchive,
        getStats: getArchiveStats,
        cleanOld: cleanOldArchive,
        export: exportArchive
    };
}

console.log('Task Archive System загружен');
