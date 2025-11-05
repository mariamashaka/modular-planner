// =====================================================
// CALENDAR MANAGER - Управление календарными задачами
// =====================================================

(function() {
    'use strict';

    // Хранилище календарных экземпляров задач
    const STORAGE_KEY = 'calendarInstances';
    const RECURRING_KEY = 'recurringEvents';

    // =====================================================
    // ГЕНЕРАЦИЯ ЗАДАЧ ИЗ ПРАВИЛ
    // =====================================================

    /**
     * Генерирует задачи из правил повторения на N дней вперёд
     * @param {number} daysAhead - сколько дней вперёд генерировать (по умолчанию 60)
     */
    function generateInstances(daysAhead = 60) {
        console.log(`=== Генерация календарных задач на ${daysAhead} дней ===`);
        
        // Загружаем правила
        const recurringEvents = JSON.parse(localStorage.getItem(RECURRING_KEY) || '[]');
        const activeRules = recurringEvents.filter(e => e.active);
        
        console.log(`Активных правил: ${activeRules.length}`);
        
        if (activeRules.length === 0) {
            console.log('Нет активных правил для генерации');
            return;
        }

        // Загружаем существующие экземпляры
        let instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        // Находим самую позднюю дату среди существующих экземпляров
        const today = new Date();
        const startDate = new Date(today);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + daysAhead);
        
        console.log(`Генерируем с ${formatDate(startDate)} по ${formatDate(endDate)}`);

        // Генерируем задачи для каждого правила
        activeRules.forEach(rule => {
            const newInstances = generateInstancesForRule(rule, startDate, endDate);
            
            // Фильтруем - не добавляем дубликаты
            newInstances.forEach(newInstance => {
                const exists = instances.some(inst => 
                    inst.ruleId === newInstance.ruleId && 
                    inst.date === newInstance.date &&
                    inst.status !== 'skipped' // Пропущенные не считаем дубликатами
                );
                
                if (!exists) {
                    instances.push(newInstance);
                }
            });
        });

        // Сохраняем
        localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
        console.log(`✅ Сгенерировано задач: ${instances.length}`);
        
        return instances;
    }

    /**
     * Генерирует экземпляры для одного правила
     */
    function generateInstancesForRule(rule, startDate, endDate) {
        const instances = [];
        const { recurrence } = rule;
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            
            if (matchesRecurrenceRule(currentDate, recurrence)) {
                instances.push({
                    id: `${rule.id}_${dateStr}`,
                    ruleId: rule.id,
                    name: rule.name,
                    date: dateStr,
                    time: recurrence.time || null,
                    project: rule.project || null,
                    description: rule.description || null,
                    recurrence: rule.recurrence,
                    status: 'pending', // pending, completed, skipped
                    createdAt: new Date().toISOString()
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`Правило "${rule.name}": ${instances.length} экземпляров`);
        return instances;
    }

    /**
     * Проверяет, соответствует ли дата правилу повторения
     */
    function matchesRecurrenceRule(date, recurrence) {
        const { type } = recurrence;
        
        try {
            if (type === 'monthly_date') {
                return date.getDate() === recurrence.date;
            } 
            else if (type === 'weekly') {
                return date.getDay() === recurrence.dayOfWeek;
            } 
            else if (type === 'interval_days') {
                const startDate = new Date(recurrence.startDate);
                const diffTime = date.getTime() - startDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays % recurrence.interval === 0;
            } 
            else if (type === 'quarterly') {
                // Проверяем, что дата попадает на первый месяц квартала
                const month = date.getMonth(); // 0-11
                const isQuarterMonth = [0, 3, 6, 9].includes(month);
                return isQuarterMonth && date.getDate() === recurrence.date;
            }
            else if (type === 'yearly') {
                const recurDate = new Date(recurrence.date);
                return date.getDate() === recurDate.getDate() && 
                       date.getMonth() === recurDate.getMonth();
            }
        } catch (error) {
            console.error('Ошибка проверки правила:', error);
        }
        
        return false;
    }

    // =====================================================
    // ДЕЙСТВИЯ С ЗАДАЧАМИ
    // =====================================================

    /**
     * Отмечает задачу как выполненную
     */
    function completeTask(instanceId) {
        const instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const instance = instances.find(inst => inst.id === instanceId);
        
        if (!instance) {
            console.error('Задача не найдена:', instanceId);
            return false;
        }

        // Отмечаем как выполненную
        instance.status = 'completed';
        instance.completedAt = new Date().toISOString();

        // Архивируем
        try {
            if (typeof window.ArchiveManager !== 'undefined') {
                const archiveData = {
                    id: instance.id,
                    text: instance.name,
                    moduleType: 'calendar-recurring',
                    projectId: instance.project,
                    date: instance.date,
                    createdAt: instance.completedAt
                };
                window.ArchiveManager.archive(archiveData);
                console.log('✅ Задача добавлена в архив');
            }
        } catch (error) {
            console.error('Ошибка архивирования:', error);
        }

        // Сохраняем
        localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
        console.log(`✅ Задача выполнена: ${instance.name}`);
        
        return true;
    }

    /**
     * Переносит задачу на другую дату
     */
    function rescheduleTask(instanceId, newDate) {
        const instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const instance = instances.find(inst => inst.id === instanceId);
        
        if (!instance) {
            console.error('Задача не найдена:', instanceId);
            return false;
        }

        // Создаём новый экземпляр на новую дату
        const newInstance = {
            ...instance,
            id: `${instance.ruleId}_${newDate}_rescheduled_${Date.now()}`,
            date: newDate,
            originalDate: instance.date,
            rescheduled: true,
            rescheduledAt: new Date().toISOString()
        };

        // Отмечаем старый как пропущенный (чтобы не показывать)
        instance.status = 'skipped';
        instance.skippedReason = 'rescheduled';

        // Добавляем новый
        instances.push(newInstance);

        // Сохраняем
        localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
        console.log(`📅 Задача перенесена с ${instance.date} на ${newDate}`);
        
        return true;
    }

    /**
     * Пропускает задачу (не будет показываться)
     */
    function skipTask(instanceId) {
        const instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const instance = instances.find(inst => inst.id === instanceId);
        
        if (!instance) {
            console.error('Задача не найдена:', instanceId);
            return false;
        }

        instance.status = 'skipped';
        instance.skippedAt = new Date().toISOString();

        localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
        console.log(`❌ Задача пропущена: ${instance.name}`);
        
        return true;
    }

    // =====================================================
    // ПОЛУЧЕНИЕ ДАННЫХ
    // =====================================================

    /**
     * Получает задачи на конкретную дату
     */
    function getTasksForDate(dateStr) {
        const instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        return instances.filter(inst => 
            inst.date === dateStr && 
            inst.status === 'pending'
        );
    }

    /**
     * Получает просроченные задачи (до указанной даты, не включая её)
     */
    function getOverdueTasks(beforeDate) {
        const instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const today = beforeDate || new Date().toISOString().split('T')[0];
        
        return instances.filter(inst => 
            inst.date < today && 
            inst.status === 'pending'
        ).map(inst => {
            // Добавляем количество дней просрочки
            const taskDate = new Date(inst.date);
            const todayDate = new Date(today);
            const diffTime = todayDate - taskDate;
            const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                ...inst,
                overdueDays
            };
        });
    }

    /**
     * Получает все задачи в диапазоне дат
     */
    function getTasksInRange(startDate, endDate) {
        const instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        return instances.filter(inst => 
            inst.date >= startDate && 
            inst.date <= endDate
        );
    }

    /**
     * Получает все задачи (для отображения в calendar-instances)
     */
    function getAllTasks() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    /**
     * Получает статистику
     */
    function getStats() {
        const instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const today = new Date().toISOString().split('T')[0];
        
        return {
            total: instances.length,
            pending: instances.filter(i => i.status === 'pending').length,
            completed: instances.filter(i => i.status === 'completed').length,
            overdue: instances.filter(i => i.status === 'pending' && i.date < today).length,
            today: instances.filter(i => i.status === 'pending' && i.date === today).length
        };
    }

    // =====================================================
    // УТИЛИТЫ
    // =====================================================

    /**
     * Форматирует дату для отображения
     */
    function formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        if (dateStr === todayStr) return 'Сегодня';
        if (dateStr === tomorrowStr) return 'Завтра';
        
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }

    /**
     * Очистка старых завершённых задач (старше N дней)
     */
    function cleanupOldTasks(daysOld = 90) {
        const instances = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        
        const cleaned = instances.filter(inst => {
            // Удаляем только завершённые и пропущенные задачи старше cutoffDate
            if ((inst.status === 'completed' || inst.status === 'skipped') && inst.date < cutoffStr) {
                return false;
            }
            return true;
        });
        
        const removed = instances.length - cleaned.length;
        
        if (removed > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            console.log(`🧹 Очищено старых задач: ${removed}`);
        }
        
        return removed;
    }

    // =====================================================
    // ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
    // =====================================================

    window.CalendarManager = {
        // Генерация
        generateInstances,
        
        // Действия с задачами
        completeTask,
        rescheduleTask,
        skipTask,
        
        // Получение данных
        getTasksForDate,
        getOverdueTasks,
        getTasksInRange,
        getAllTasks,
        getStats,
        
        // Утилиты
        formatDate,
        cleanupOldTasks
    };

    console.log('✅ CalendarManager загружен');
})();
