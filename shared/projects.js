/*
MODULE: Projects Management System
VERSION: 1.0  
STATUS: WORKING
FEATURES: Create, Read, Update, Delete projects
STORAGE: localStorage
*/

// Ключ для сохранения в localStorage
const PROJECTS_STORAGE_KEY = 'taskManager_projects';

// Инициализация - создаем дефолтные проекты если их нет
function initializeProjects() {
    const existing = getProjects();
    if (existing.length === 0) {
        // Создаем только один дефолтный проект
        createProject('Общие задачи', '#6c757d');
        console.log('Инициализированы дефолтные проекты');
    }
}

// Получить все проекты
function getProjects() {
    try {
        const projects = localStorage.getItem(PROJECTS_STORAGE_KEY);
        return projects ? JSON.parse(projects) : [];
    } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
        return [];
    }
}

// Сохранить проекты в localStorage
function saveProjects(projects) {
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения проектов:', error);
        return false;
    }
}

// Создать новый проект
function createProject(name, color = '#667eea', description = '') {
    if (!name || name.trim() === '') {
        throw new Error('Название проекта не может быть пустым');
    }

    const projects = getProjects();
    
    // Проверяем уникальность названия
    if (projects.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Проект с таким названием уже существует');
    }

    const newProject = {
        id: generateProjectId(),
        name: name.trim(),
        color: color,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
    };

    projects.push(newProject);
    
    if (saveProjects(projects)) {
        console.log('Проект создан:', newProject.name);
        return newProject;
    } else {
        throw new Error('Ошибка сохранения проекта');
    }
}

// Получить проект по ID
function getProjectById(projectId) {
    const projects = getProjects();
    return projects.find(p => p.id === projectId) || null;
}

// Получить проект по названию
function getProjectByName(projectName) {
    const projects = getProjects();
    return projects.find(p => p.name.toLowerCase() === projectName.toLowerCase()) || null;
}

// Обновить проект
function updateProject(projectId, updates) {
    const projects = getProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
        throw new Error('Проект не найден');
    }

    // Проверяем уникальность нового названия (если меняется)
    if (updates.name && updates.name !== projects[projectIndex].name) {
        if (projects.find(p => p.name.toLowerCase() === updates.name.toLowerCase() && p.id !== projectId)) {
            throw new Error('Проект с таким названием уже существует');
        }
    }

    // Обновляем поля
    projects[projectIndex] = {
        ...projects[projectIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    if (saveProjects(projects)) {
        console.log('Проект обновлен:', projects[projectIndex].name);
        return projects[projectIndex];
    } else {
        throw new Error('Ошибка сохранения изменений');
    }
}

// Удалить проект
function deleteProject(projectId) {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
        throw new Error('Проект не найден');
    }

    // Проверяем, есть ли задачи в этом проекте
    const hasActiveTasks = checkProjectHasTasks(projectId);
    if (hasActiveTasks) {
        throw new Error('Нельзя удалить проект с активными задачами');
    }

    const filteredProjects = projects.filter(p => p.id !== projectId);
    
    if (saveProjects(filteredProjects)) {
        console.log('Проект удален:', project.name);
        return true;
    } else {
        throw new Error('Ошибка удаления проекта');
    }
}

// Архивировать проект (сделать неактивным)
function archiveProject(projectId) {
    return updateProject(projectId, { isActive: false });
}

// Восстановить проект из архива
function restoreProject(projectId) {
    return updateProject(projectId, { isActive: true });
}

// Получить только активные проекты
function getActiveProjects() {
    return getProjects().filter(p => p.isActive);
}

// Получить проекты для выпадающего списка
function getProjectsForSelect() {
    const projects = getActiveProjects();
    return [
        { id: null, name: '-- Без проекта --', color: '#6c757d' },
        ...projects.map(p => ({ id: p.id, name: p.name, color: p.color }))
    ];
}

// Генерация уникального ID для проекта
function generateProjectId() {
    return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Проверить есть ли задачи в проекте (заглушка, будет реализована позже)
function checkProjectHasTasks(projectId) {
    // TODO: Интегрировать с модулями задач
    // Пока возвращаем false для тестирования
    return false;
}

// Получить статистику по проекту
function getProjectStats(projectId) {
    // TODO: Интегрировать с модулями задач
    return {
        totalTasks: 0,
        completedTasks: 0,
        urgentTasks: 0,
        overdueeTasks: 0
    };
}

// Валидация цвета проекта
function isValidColor(color) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
}

// Экспорт функций для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        initializeProjects,
        getProjects,
        createProject,
        getProjectById,
        getProjectByName,
        updateProject,
        deleteProject,
        archiveProject,
        restoreProject,
        getActiveProjects,
        getProjectsForSelect,
        getProjectStats
    };
} else {
    // Browser environment - функции доступны глобально
    window.ProjectsManager = {
        init: initializeProjects,
        getAll: getProjects,
        create: createProject,
        getById: getProjectById,
        getByName: getProjectByName,
        update: updateProject,
        delete: deleteProject,
        archive: archiveProject,
        restore: restoreProject,
        getActive: getActiveProjects,
        getForSelect: getProjectsForSelect,
        getStats: getProjectStats
    };
}

console.log('Projects Management System загружен');
