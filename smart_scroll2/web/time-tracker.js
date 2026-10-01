/**
 * Глобальный трекер времени на сайте и очков активности.
 * Загружается на КАЖДОЙ странице (см. unified-navbar.js), поэтому время
 * накапливается независимо от того, по каким страницам ходит пользователь,
 * а не только пока он находится на stats.html.
 */

class SiteTimeTracker {
    constructor() {
        this.sessionStart = Date.now();
        this.totalTime = this.loadTotalTime();
        this.points = this.loadPoints();
        this.isActive = true;
        this.lastActivity = Date.now();

        this.init();
    }

    init() {
        this.trackActivity();
        this.tick();

        // Сохраняем данные каждые 30 секунд
        setInterval(() => this.saveData(), 30000);

        // Обработка закрытия/перезагрузки/перехода на другую страницу
        window.addEventListener('beforeunload', () => this.saveData());
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    trackActivity() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
                if (!this.isActive) {
                    this.isActive = true;
                    this.sessionStart = Date.now();
                }
            }, true);
        });

        // Проверяем активность каждые 5 секунд
        setInterval(() => {
            const timeSinceActivity = Date.now() - this.lastActivity;
            if (timeSinceActivity > 30000 && this.isActive) { // 30 секунд неактивности
                this.isActive = false;
            }
        }, 5000);
    }

    tick() {
        if (this.isActive) {
            const currentTime = Date.now();
            const timeDiff = currentTime - this.sessionStart;

            // Добавляем только новое время (не дублируем)
            this.totalTime += timeDiff;
            this.sessionStart = currentTime;

            // Начисляем очки за активность (1 очко за минуту общего времени на сайте)
            this.points = Math.floor(this.totalTime / 1000 / 60);
        }

        setTimeout(() => this.tick(), 1000);
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.isActive = false;
            this.saveData();
        } else {
            this.isActive = true;
            this.sessionStart = Date.now();
            this.lastActivity = Date.now();
        }
    }

    loadData() {
        const today = new Date().toDateString();
        const savedData = JSON.parse(localStorage.getItem('smartScrollStats') || '{}');

        if (savedData[today]) {
            this.totalTime = savedData[today].time || 0;
            this.points = savedData[today].points || 0;
        }
    }

    saveData() {
        const today = new Date().toDateString();
        const savedData = JSON.parse(localStorage.getItem('smartScrollStats') || '{}');

        savedData[today] = {
            time: this.totalTime,
            points: this.points,
            lastUpdate: Date.now()
        };

        localStorage.setItem('smartScrollStats', JSON.stringify(savedData));
    }

    loadTotalTime() {
        const today = new Date().toDateString();
        const savedData = JSON.parse(localStorage.getItem('smartScrollStats') || '{}');
        return savedData[today]?.time || 0;
    }

    loadPoints() {
        const today = new Date().toDateString();
        const savedData = JSON.parse(localStorage.getItem('smartScrollStats') || '{}');
        return savedData[today]?.points || 0;
    }

    getYesterdayData() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        const savedData = JSON.parse(localStorage.getItem('smartScrollStats') || '{}');

        return savedData[yesterdayStr] || { time: 0, points: 0 };
    }

    calculateStreak() {
        const savedData = JSON.parse(localStorage.getItem('smartScrollStats') || '{}');
        const today = new Date();
        let streak = 0;

        for (let i = 0; i < 30; i++) { // Проверяем последние 30 дней
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            const dayData = savedData[dateStr];

            if (dayData && dayData.time > 0) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }
}

window.SiteTimeTracker = new SiteTimeTracker();
