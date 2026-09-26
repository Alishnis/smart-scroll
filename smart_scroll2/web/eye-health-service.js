/**
 * Eye Health Service - Расширенный сервис для заботы о здоровье глаз
 * Интеграция с SmartScroll для мониторинга и ухода за глазами
 */

class EyeHealthService {
    constructor() {
        this.isActive = false;
        this.reminderInterval = 20; // минуты
        this.breakDuration = 20; // секунды
        this.screenTimeStart = Date.now();
        this.dailyStats = this.loadDailyStats();
        this.settings = this.loadSettings();
        this.reminderTimer = null;
        this.breakTimer = null;
        this.currentBreakTime = 0;
        
        // Инициализация
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startScreenTimeTracking();
        this.loadUserPreferences();
        console.log('👁️ Eye Health Service инициализирован');
    }

    setupEventListeners() {
        // Отслеживание активности пользователя
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseTracking();
            } else {
                this.resumeTracking();
            }
        });

        // Отслеживание кликов и движения мыши
        document.addEventListener('click', () => this.updateActivity());
        document.addEventListener('mousemove', this.throttle(() => this.updateActivity(), 1000));
        document.addEventListener('keydown', () => this.updateActivity());

        // Обработка закрытия страницы
        window.addEventListener('beforeunload', () => {
            this.saveCurrentSession();
        });
    }

    // Система напоминаний
    startReminders() {
        if (this.isActive) return;
        
        this.isActive = true;
        const intervalMs = this.reminderInterval * 60 * 1000;
        
        this.reminderTimer = setInterval(() => {
            this.showReminder();
        }, intervalMs);

        // Показать демо-напоминание за 15 секунд до основного
        setTimeout(() => {
            this.showDemoReminder();
        }, intervalMs - 15000);

        this.updateStatus('Напоминания активны', 'success');
        console.log(`⏰ Напоминания запущены с интервалом ${this.reminderInterval} минут`);
    }

    stopReminders() {
        this.isActive = false;
        clearInterval(this.reminderTimer);
        clearInterval(this.breakTimer);
        this.updateStatus('Напоминания отключены', 'warning');
        console.log('⏹️ Напоминания остановлены');
    }

    showReminder() {
        // Создание полноэкранного окна напоминания
        const reminderWindow = this.createReminderWindow();
        document.body.appendChild(reminderWindow);
        
        // Запуск обратного отсчета
        this.startBreakCountdown();
        
        // Звуковое уведомление
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
    }

    showDemoReminder() {
        // Показать предупреждение за 15 секунд
        const demoNotification = this.createDemoNotification();
        document.body.appendChild(demoNotification);
        
        setTimeout(() => {
            if (demoNotification.parentNode) {
                demoNotification.parentNode.removeChild(demoNotification);
            }
        }, 5000);
    }

    createReminderWindow() {
        const window = document.createElement('div');
        window.className = 'eye-health-reminder-window';
        window.innerHTML = `
            <div class="reminder-overlay">
                <div class="reminder-content">
                    <div class="reminder-icon"><i class="fa-solid fa-eye"></i></div>
                    <h2>Время перерыва для глаз!</h2>
                    <p>Сделайте перерыв и посмотрите вдаль на 20 секунд</p>
                    <div class="break-timer" id="breakTimer">${this.breakDuration}</div>
                    <div class="reminder-actions">
                        <button class="btn-primary" onclick="eyeHealthService.closeReminder()">Понятно</button>
                        <button class="btn-secondary" onclick="eyeHealthService.skipBreak()">Пропустить</button>
                    </div>
                </div>
            </div>
        `;

        // Добавление стилей
        const style = document.createElement('style');
        style.textContent = `
            .eye-health-reminder-window {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.5s ease-in;
            }
            
            .reminder-overlay {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 50px;
                border-radius: 20px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .reminder-icon {
                font-size: 64px;
                margin-bottom: 20px;
                animation: pulse 2s infinite;
            }
            
            .reminder-content h2 {
                color: #ffd700;
                margin-bottom: 15px;
                font-size: 28px;
            }
            
            .reminder-content p {
                color: white;
                margin-bottom: 30px;
                font-size: 18px;
                line-height: 1.6;
            }
            
            .break-timer {
                font-size: 48px;
                font-weight: bold;
                color: #ff6b6b;
                margin: 20px 0;
                animation: countdown 1s ease-in-out;
            }
            
            .reminder-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
            }
            
            .btn-primary, .btn-secondary {
                padding: 15px 30px;
                border: none;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-primary {
                background: linear-gradient(45deg, #2ecc71, #27ae60);
                color: white;
            }
            
            .btn-secondary {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }
            
            .btn-primary:hover, .btn-secondary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @keyframes countdown {
                0% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        return window;
    }

    createDemoNotification() {
        const notification = document.createElement('div');
        notification.className = 'demo-notification';
        notification.innerHTML = `
            <div class="demo-content">
                <span class="demo-icon"><i class="fa-solid fa-clock"></i></span>
                <span class="demo-text">Через 15 секунд - перерыв для глаз!</span>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .demo-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #f39c12, #e67e22);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                z-index: 9999;
                animation: slideIn 0.5s ease-out;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            }
            
            .demo-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .demo-icon {
                font-size: 20px;
            }
            
            .demo-text {
                font-weight: 600;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        return notification;
    }

    startBreakCountdown() {
        this.currentBreakTime = this.breakDuration;
        const timerElement = document.getElementById('breakTimer');
        
        this.breakTimer = setInterval(() => {
            this.currentBreakTime--;
            if (timerElement) {
                timerElement.textContent = this.currentBreakTime;
            }
            
            if (this.currentBreakTime <= 0) {
                this.closeReminder();
            }
        }, 1000);
    }

    closeReminder() {
        const reminderWindow = document.querySelector('.eye-health-reminder-window');
        if (reminderWindow) {
            reminderWindow.remove();
        }
        clearInterval(this.breakTimer);
        this.recordBreakTaken();
    }

    skipBreak() {
        this.closeReminder();
        console.log('⏭️ Перерыв пропущен');
    }

    // Отслеживание времени использования экрана
    startScreenTimeTracking() {
        this.screenTimeStart = Date.now();
        this.lastActivityTime = Date.now();
        
        // Обновление статистики каждую минуту
        setInterval(() => {
            this.updateScreenTimeStats();
        }, 60000);
    }

    updateScreenTimeStats() {
        const now = Date.now();
        const sessionTime = now - this.screenTimeStart;
        
        // Обновление дневной статистики
        const today = new Date().toDateString();
        if (!this.dailyStats[today]) {
            this.dailyStats[today] = {
                screenTime: 0,
                breaks: 0,
                reminders: 0
            };
        }
        
        this.dailyStats[today].screenTime += sessionTime;
        this.screenTimeStart = now;
        
        this.saveDailyStats();
        this.updateStatsDisplay();
    }

    updateActivity() {
        this.lastActivityTime = Date.now();
    }

    pauseTracking() {
        this.updateScreenTimeStats();
        console.log('⏸️ Отслеживание приостановлено');
    }

    resumeTracking() {
        this.screenTimeStart = Date.now();
        console.log('▶️ Отслеживание возобновлено');
    }

    // Упражнения для глаз
    startEyeExercise(exerciseType) {
        const exercises = {
            blinking: {
                name: 'Моргание',
                duration: 30,
                instructions: 'Быстро моргайте 20 раз, затем закройте глаза на 30 секунд'
            },
            focus: {
                name: 'Фокусировка',
                duration: 40,
                instructions: 'Смотрите на объект вдали 20 секунд, затем на объект вблизи 20 секунд'
            },
            circles: {
                name: 'Круговые движения',
                duration: 60,
                instructions: 'Медленно вращайте глазами по часовой стрелке 10 раз, затем против часовой стрелки 10 раз'
            },
            palming: {
                name: 'Пальминг',
                duration: 180,
                instructions: 'Закройте глаза ладонями на 2-3 минуты, не надавливая на глазные яблоки'
            }
        };

        const exercise = exercises[exerciseType];
        if (!exercise) return;

        this.showExerciseWindow(exercise);
    }

    showExerciseWindow(exercise) {
        const exerciseWindow = this.createExerciseWindow(exercise);
        document.body.appendChild(exerciseWindow);
        
        // Автоматическое закрытие через указанное время
        setTimeout(() => {
            this.closeExerciseWindow();
        }, exercise.duration * 1000);
    }

    createExerciseWindow(exercise) {
        const window = document.createElement('div');
        window.className = 'eye-exercise-window';
        window.innerHTML = `
            <div class="exercise-overlay">
                <div class="exercise-content">
                    <div class="exercise-icon"><i class="fa-solid fa-dumbbell"></i></div>
                    <h2>${exercise.name}</h2>
                    <p>${exercise.instructions}</p>
                    <div class="exercise-timer" id="exerciseTimer">${exercise.duration}</div>
                    <button class="btn-primary" onclick="eyeHealthService.closeExerciseWindow()">Завершить</button>
                </div>
            </div>
        `;

        // Добавление стилей для упражнений
        const style = document.createElement('style');
        style.textContent = `
            .eye-exercise-window {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.5s ease-in;
            }
            
            .exercise-overlay {
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                padding: 50px;
                border-radius: 20px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .exercise-icon {
                font-size: 64px;
                margin-bottom: 20px;
                animation: bounce 2s infinite;
            }
            
            .exercise-content h2 {
                color: #ffd700;
                margin-bottom: 15px;
                font-size: 28px;
            }
            
            .exercise-content p {
                color: white;
                margin-bottom: 30px;
                font-size: 18px;
                line-height: 1.6;
            }
            
            .exercise-timer {
                font-size: 48px;
                font-weight: bold;
                color: #ffd700;
                margin: 20px 0;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);

        // Запуск таймера упражнения
        let timeLeft = exercise.duration;
        const timerElement = document.getElementById('exerciseTimer');
        
        const exerciseTimer = setInterval(() => {
            timeLeft--;
            if (timerElement) {
                timerElement.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(exerciseTimer);
                this.closeExerciseWindow();
            }
        }, 1000);

        return window;
    }

    closeExerciseWindow() {
        const exerciseWindow = document.querySelector('.eye-exercise-window');
        if (exerciseWindow) {
            exerciseWindow.remove();
        }
    }

    // Статистика и аналитика
    recordBreakTaken() {
        const today = new Date().toDateString();
        if (!this.dailyStats[today]) {
            this.dailyStats[today] = {
                screenTime: 0,
                breaks: 0,
                reminders: 0
            };
        }
        
        this.dailyStats[today].breaks++;
        this.saveDailyStats();
        this.updateStatsDisplay();
        
        console.log('📊 Перерыв зафиксирован');
    }

    updateStatsDisplay() {
        const today = new Date().toDateString();
        const todayStats = this.dailyStats[today] || { screenTime: 0, breaks: 0, reminders: 0 };
        
        // Обновление элементов на странице
        const todayTimeElement = document.getElementById('todayTime');
        const breaksElement = document.getElementById('breaksTaken');
        
        if (todayTimeElement) {
            const hours = Math.floor(todayStats.screenTime / (1000 * 60 * 60));
            const minutes = Math.floor((todayStats.screenTime % (1000 * 60 * 60)) / (1000 * 60));
            todayTimeElement.textContent = `${hours}ч ${minutes}м`;
        }
        
        if (breaksElement) {
            breaksElement.textContent = todayStats.breaks;
        }
    }

    // Настройки
    loadSettings() {
        const defaultSettings = {
            reminderInterval: 20,
            breakDuration: 20,
            soundEnabled: true,
            autoStart: false,
            workHours: '9:00 - 18:00'
        };
        
        const saved = localStorage.getItem('eyeHealthSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('eyeHealthSettings', JSON.stringify(this.settings));
        console.log('💾 Настройки сохранены');
    }

    loadDailyStats() {
        const saved = localStorage.getItem('eyeHealthDailyStats');
        return saved ? JSON.parse(saved) : {};
    }

    saveDailyStats() {
        localStorage.setItem('eyeHealthDailyStats', JSON.stringify(this.dailyStats));
    }

    loadUserPreferences() {
        // Загрузка пользовательских предпочтений
        this.reminderInterval = this.settings.reminderInterval;
        this.breakDuration = this.settings.breakDuration;
    }

    // Утилиты
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('reminderStatus');
        if (statusElement) {
            statusElement.innerHTML = `<strong>Статус:</strong> ${message}`;
            statusElement.className = `status ${type}`;
        }
    }

    playNotificationSound() {
        // Простое звуковое уведомление
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.play().catch(e => console.log('Не удалось воспроизвести звук:', e));
    }

    saveCurrentSession() {
        this.updateScreenTimeStats();
        this.saveDailyStats();
    }

    // Публичные методы для интеграции
    getStats() {
        return {
            daily: this.dailyStats,
            settings: this.settings,
            isActive: this.isActive
        };
    }

    setReminderInterval(minutes) {
        this.reminderInterval = minutes;
        this.settings.reminderInterval = minutes;
        this.saveSettings();
        
        if (this.isActive) {
            this.stopReminders();
            this.startReminders();
        }
    }

    setBreakDuration(seconds) {
        this.breakDuration = seconds;
        this.settings.breakDuration = seconds;
        this.saveSettings();
    }
}

// Глобальная инициализация
let eyeHealthService;

document.addEventListener('DOMContentLoaded', function() {
    eyeHealthService = new EyeHealthService();
    
    // Интеграция с существующими функциями
    window.eyeHealthService = eyeHealthService;
    
    // Автозапуск если включен
    if (eyeHealthService.settings.autoStart) {
        eyeHealthService.startReminders();
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EyeHealthService;
}
