/**
 * Smart Currency System
 * Система игровой валюты Smart для геймификации
 */

class SmartCurrency {
    constructor() {
        this.storageKey = 'smart_currency_points';
        this.achievementsKey = 'smart_achievements';
        this.init();
    }

    init() {
        // Инициализируем данные пользователя если их нет
        if (!this.getPoints()) {
            this.setPoints(0);
        }
        if (!this.getAchievements()) {
            this.setAchievements([]);
        }
    }

    // Получить текущие очки Smart
    getPoints() {
        const points = localStorage.getItem(this.storageKey);
        return points ? parseInt(points) : 0;
    }

    // Установить очки Smart
    setPoints(points) {
        localStorage.setItem(this.storageKey, points.toString());
        this.updateDisplay();
    }

    // Добавить очки Smart
    addPoints(amount, reason = '') {
        const currentPoints = this.getPoints();
        const newPoints = currentPoints + amount;
        this.setPoints(newPoints);
        
        // Показать уведомление о награде
        this.showRewardNotification(amount, reason);
        
        // Проверить достижения
        this.checkAchievements(newPoints);
        
        return newPoints;
    }

    // Потратить очки Smart
    spendPoints(amount) {
        const currentPoints = this.getPoints();
        if (currentPoints >= amount) {
            this.setPoints(currentPoints - amount);
            return true;
        }
        return false;
    }

    // Получить достижения
    getAchievements() {
        const achievements = localStorage.getItem(this.achievementsKey);
        return achievements ? JSON.parse(achievements) : [];
    }

    // Добавить достижение
    addAchievement(achievement) {
        const achievements = this.getAchievements();
        if (!achievements.find(a => a.id === achievement.id)) {
            achievements.push({
                ...achievement,
                earnedAt: new Date().toISOString()
            });
            this.setAchievements(achievements);
            this.showAchievementNotification(achievement);
        }
    }

    // Установить достижения
    setAchievements(achievements) {
        localStorage.setItem(this.achievementsKey, JSON.stringify(achievements));
    }

    // Проверить достижения
    checkAchievements(points) {
        const achievements = [
            {
                id: 'first_smart',
                title: 'Первые Smart очки',
                description: 'Заработали первые 10 Smart очков',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
                requirement: 10
            },
            {
                id: 'smart_collector',
                title: 'Собиратель Smart',
                description: 'Заработали 100 Smart очков',
                icon: '<i class="fa-solid fa-sack-dollar"></i>',
                requirement: 100
            },
            {
                id: 'smart_master',
                title: 'Мастер Smart',
                description: 'Заработали 500 Smart очков',
                icon: '<i class="fa-solid fa-crown"></i>',
                requirement: 500
            },
            {
                id: 'smart_legend',
                title: 'Легенда Smart',
                description: 'Заработали 1000 Smart очков',
                icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
                requirement: 1000
            }
        ];

        achievements.forEach(achievement => {
            if (points >= achievement.requirement) {
                this.addAchievement(achievement);
            }
        });
    }

    // Показать уведомление о награде
    showRewardNotification(amount, reason) {
        const notification = document.createElement('div');
        notification.className = 'smart-reward-notification';
        notification.innerHTML = `
            <div class="smart-reward-content">
                <div class="smart-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
                <div class="smart-reward-text">
                    <div class="smart-amount">+${amount} Smart</div>
                    <div class="smart-reason">${reason}</div>
                </div>
            </div>
        `;

        // Добавляем стили если их нет
        if (!document.getElementById('smart-currency-styles')) {
            const style = document.createElement('style');
            style.id = 'smart-currency-styles';
            style.textContent = `
                .smart-reward-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #30CAA1 0%, #20A0FF 100%);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(48, 202, 161, 0.3);
                    z-index: 10000;
                    animation: smartRewardSlideIn 0.5s ease-out;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    min-width: 200px;
                }

                .smart-reward-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .smart-icon {
                    font-size: 24px;
                    animation: smartBounce 0.6s ease-in-out;
                }

                .smart-amount {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 2px;
                }

                .smart-reason {
                    font-size: 12px;
                    opacity: 0.9;
                }

                @keyframes smartRewardSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes smartBounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                    60% {
                        transform: translateY(-5px);
                    }
                }

                .smart-currency-display {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(48, 202, 161, 0.1);
                    border: 1px solid rgba(48, 202, 161, 0.3);
                    border-radius: 20px;
                    padding: 8px 16px;
                    color: #30CAA1;
                    font-weight: 600;
                    font-size: 14px;
                }

                .smart-currency-display .smart-icon {
                    font-size: 16px;
                }

                .smart-achievement-notification {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                    color: #333;
                    padding: 20px 30px;
                    border-radius: 16px;
                    box-shadow: 0 12px 48px rgba(255, 215, 0, 0.4);
                    z-index: 10001;
                    animation: achievementPop 0.6s ease-out;
                    text-align: center;
                    min-width: 300px;
                }

                .smart-achievement-notification .achievement-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                    animation: achievementBounce 0.8s ease-in-out;
                }

                .smart-achievement-notification .achievement-title {
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .smart-achievement-notification .achievement-description {
                    font-size: 14px;
                    opacity: 0.8;
                }

                @keyframes achievementPop {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }

                @keyframes achievementBounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-15px);
                    }
                    60% {
                        transform: translateY(-8px);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'smartRewardSlideIn 0.3s ease-in reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Показать уведомление о достижении
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'smart-achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-description">${achievement.description}</div>
        `;

        document.body.appendChild(notification);

        // Удаляем уведомление через 4 секунды
        setTimeout(() => {
            notification.style.animation = 'achievementPop 0.3s ease-in reverse';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Обновить отображение очков
    updateDisplay() {
        const displays = document.querySelectorAll('.smart-currency-display');
        const points = this.getPoints();
        
        displays.forEach(display => {
            const amountElement = display.querySelector('.smart-amount');
            if (amountElement) {
                amountElement.textContent = points;
            } else {
                display.innerHTML = `
                    <span class="smart-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
                    <span class="smart-amount">${points}</span>
                    <span class="smart-text">Smart</span>
                `;
            }
        });
    }

    // Создать элемент отображения валюты
    createDisplayElement() {
        const display = document.createElement('div');
        display.className = 'smart-currency-display';
        display.innerHTML = `
            <span class="smart-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>
            <span class="smart-amount">${this.getPoints()}</span>
            <span class="smart-text">Smart</span>
        `;
        return display;
    }

    // Наградить за правильный ответ в квизе
    rewardQuizAnswer(isCorrect, difficulty = 'medium') {
        if (!isCorrect) return 0;

        const rewards = {
            'easy': 5,
            'medium': 10,
            'hard': 20
        };

        const amount = rewards[difficulty] || 10;
        return this.addPoints(amount, 'Правильный ответ в квизе');
    }

    // Наградить за завершение квиза
    rewardQuizCompletion(score, totalQuestions) {
        const percentage = (score / totalQuestions) * 100;
        let bonus = 0;

        if (percentage >= 90) bonus = 50;
        else if (percentage >= 70) bonus = 30;
        else if (percentage >= 50) bonus = 15;

        if (bonus > 0) {
            this.addPoints(bonus, `Бонус за отличный результат (${Math.round(percentage)}%)`);
        }

        return bonus;
    }

    // Получить статистику
    getStats() {
        return {
            points: this.getPoints(),
            achievements: this.getAchievements(),
            totalAchievements: this.getAchievements().length
        };
    }
}

// Создаем глобальный экземпляр
window.SmartCurrency = new SmartCurrency();

// Экспортируем для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartCurrency;
}
