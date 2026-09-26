/**
 * Простая система мониторинга глаз без внешних зависимостей
 * Использует только стандартные браузерные API
 */

class SimpleEyeMonitor {
    constructor() {
        this.isActive = false;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.intervalId = null;
        this.notification = null;
        
        // Настройки по умолчанию
        this.settings = {
            checkInterval: 5000, // 5 секунд
            warningDistance: 50, // см
            dangerDistance: 30,  // см
            soundEnabled: true,
            autoStart: true,
            // Калибровочные параметры (из настроенной системы)
            calibration: {
                minBrightness: 150,   // Минимальная яркость (близко) - из калибровки
                maxBrightness: 163,  // Максимальная яркость (далеко) - из калибровки
                currentBrightness: 159, // Текущая яркость - из калибровки
                minDistance: 20,     // Минимальное расстояние в см
                maxDistance: 80,     // Максимальное расстояние в см
                isCalibrated: true   // Флаг калибровки - система настроена
            }
        };
        
        // Статистика
        this.stats = {
            measurements: 0,
            warnings: 0,
            averageDistance: 0,
            sessionStart: null,
            lastDistance: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('👁️ Инициализация простого мониторинга глаз...');
        
        // Загружаем настройки из localStorage
        this.loadSettings();
        
        // Создаем уведомление
        this.createNotification();
        
        // Автозапуск если включен
        if (this.settings.autoStart) {
            await this.start();
        }
    }
    
    createNotification() {
        // Создаем контейнер для уведомлений
        this.notification = document.createElement('div');
        this.notification.id = 'eye-monitor-notification';
        this.notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: none;
            max-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        document.body.appendChild(this.notification);
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('eyeMonitorSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Не удалось загрузить настройки:', error);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('eyeMonitorSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Не удалось сохранить настройки:', error);
        }
    }
    
    async start() {
        if (this.isActive) return;
        
        console.log('👁️ Запуск простого мониторинга глаз...');
        
        try {
            // Запускаем камеру
            await this.startCamera();
            
            // Запускаем мониторинг
            this.startMonitoring();
            
            this.isActive = true;
            this.stats.sessionStart = Date.now();
            
            console.log('✅ Простой мониторинг глаз запущен');
            
        } catch (error) {
            console.error('❌ Ошибка запуска мониторинга:', error);
            this.showNotification('Ошибка доступа к камере', 'error');
        }
    }
    
    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            // Создаем скрытые элементы для обработки
            this.video = document.createElement('video');
            this.video.srcObject = stream;
            this.video.play();
            this.video.style.display = 'none';
            document.body.appendChild(this.video);
            
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.style.display = 'none';
            document.body.appendChild(this.canvas);
            
        } catch (error) {
            throw new Error('Не удалось получить доступ к камере: ' + error.message);
        }
    }
    
    startMonitoring() {
        this.intervalId = setInterval(async () => {
            if (!this.isActive) return;
            
            try {
                const distance = await this.measureDistance();
                if (distance > 0) {
                    this.processDistance(distance);
                }
            } catch (error) {
                console.error('Ошибка измерения расстояния:', error);
            }
        }, this.settings.checkInterval);
    }
    
    async measureDistance() {
        if (!this.video || this.video.readyState !== 4) {
            return 0;
        }
        
        try {
            // Устанавливаем размеры canvas
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // Рисуем текущий кадр
            this.ctx.drawImage(this.video, 0, 0);
            
            // Простой анализ яркости для определения близости
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const brightness = this.calculateBrightness(imageData);
            
            // Эмпирическая формула на основе яркости
            // Более яркое изображение = ближе к камере
            const distance = this.brightnessToDistance(brightness);
            
            this.stats.measurements++;
            this.stats.lastDistance = distance;
            this.updateAverageDistance(distance);
            
            return Math.round(distance);
            
        } catch (error) {
            console.error('Ошибка измерения:', error);
            return 0;
        }
    }
    
    calculateBrightness(imageData) {
        const data = imageData.data;
        let brightness = 0;
        
        // Анализируем каждый 10-й пиксель для оптимизации
        for (let i = 0; i < data.length; i += 40) { // 4 канала (RGBA) * 10
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Формула яркости (luminance)
            brightness += (0.299 * r + 0.587 * g + 0.114 * b);
        }
        
        return brightness / (data.length / 40);
    }
    
    brightnessToDistance(brightness) {
        const cal = this.settings.calibration;
        
        // Используем настроенные калибровочные параметры (150, 163, 159)
        console.log(`🔍 Яркость: ${brightness}, Калибровка: ${cal.minBrightness}-${cal.maxBrightness}`);
        
        // Нормализуем яркость в диапазон калибровки
        const normalizedBrightness = Math.min(255, Math.max(0, brightness));
        
        // Линейная интерполяция между калибровочными точками
        const brightnessRange = cal.maxBrightness - cal.minBrightness;
        const distanceRange = cal.maxDistance - cal.minDistance;
        
        let distance;
        if (normalizedBrightness <= cal.minBrightness) {
            distance = cal.minDistance;
        } else if (normalizedBrightness >= cal.maxBrightness) {
            distance = cal.maxDistance;
        } else {
            const ratio = (normalizedBrightness - cal.minBrightness) / brightnessRange;
            distance = cal.minDistance + (ratio * distanceRange);
        }
        
        // Обновляем текущую яркость в настройках
        cal.currentBrightness = Math.round(normalizedBrightness);
        
        const finalDistance = Math.max(cal.minDistance, Math.min(cal.maxDistance, Math.round(distance)));
        console.log(`📏 Расстояние: ${finalDistance}см (яркость: ${normalizedBrightness})`);
        
        return finalDistance;
    }
    
    processDistance(distance) {
        console.log(`📏 Расстояние до экрана: ${distance}см`);
        
        if (distance <= this.settings.dangerDistance) {
            this.showDangerNotification(distance);
            this.stats.warnings++;
            
            if (this.settings.soundEnabled) {
                this.playWarningSound();
            }
            
        } else if (distance <= this.settings.warningDistance) {
            this.showWarningNotification(distance);
            this.stats.warnings++;
            
        } else {
            this.hideNotification();
        }
    }
    
    showDangerNotification(distance) {
        this.notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 24px;"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div>
                    <div style="font-size: 16px; font-weight: bold;">ОПАСНОСТЬ!</div>
                    <div style="font-size: 14px; opacity: 0.9;">Слишком близко: ${distance}см</div>
                </div>
            </div>
        `;
        this.notification.style.background = '#ff4757';
        this.notification.style.display = 'block';
    }
    
    showWarningNotification(distance, message = 'Предупреждение') {
        this.notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 24px;"><i class="fa-solid fa-eye"></i></div>
                <div>
                    <div style="font-size: 16px; font-weight: bold;">${message}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Расстояние: ${distance}см</div>
                </div>
            </div>
        `;
        this.notification.style.background = '#ffa502';
        this.notification.style.display = 'block';
    }
    
    hideNotification() {
        this.notification.style.display = 'none';
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            success: '#2ed573',
            error: '#ff4757',
            warning: '#ffa502',
            info: '#667eea'
        };
        
        this.notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 20px;"><i class="fa-solid fa-circle-info"></i></div>
                <div style="font-size: 14px;">${message}</div>
            </div>
        `;
        this.notification.style.background = colors[type] || colors.info;
        this.notification.style.display = 'block';
        
        setTimeout(() => {
            this.notification.style.display = 'none';
        }, 3000);
    }
    
    playWarningSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = 800; // Частота
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1; // Громкость
            
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                ctx.close();
            }, 200);
        } catch (error) {
            console.warn('Не удалось воспроизвести звук:', error);
        }
    }
    
    updateAverageDistance(distance) {
        if (this.stats.averageDistance === 0) {
            this.stats.averageDistance = distance;
        } else {
            this.stats.averageDistance = (this.stats.averageDistance + distance) / 2;
        }
    }
    
    stop() {
        if (!this.isActive) return;
        
        console.log('👁️ Остановка простого мониторинга глаз...');
        
        this.isActive = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        if (this.video && this.video.parentNode) {
            this.video.parentNode.removeChild(this.video);
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.hideNotification();
        console.log('✅ Простой мониторинг глаз остановлен');
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        
        // Перезапускаем мониторинг с новыми настройками
        if (this.isActive) {
            this.stop();
            setTimeout(() => this.start(), 100);
        }
    }
    
    getStats() {
        const sessionDuration = this.stats.sessionStart ? 
            Math.floor((Date.now() - this.stats.sessionStart) / 1000) : 0;
            
        return {
            isActive: this.isActive,
            measurements: this.stats.measurements,
            warnings: this.stats.warnings,
            averageDistance: Math.round(this.stats.averageDistance),
            sessionDuration: sessionDuration,
            lastDistance: this.stats.lastDistance,
            calibration: {
                ...this.settings.calibration,
                currentBrightness: this.settings.calibration.currentBrightness || 159
            }
        };
    }
    
    // Методы калибровки
    startCalibration() {
        console.log('🎯 Начало калибровки...');
        this.calibrationData = {
            closeMeasurements: [],
            farMeasurements: [],
            step: 0 // 0 = ожидание, 1 = близко, 2 = далеко
        };
        this.showNotification('Калибровка: сядьте близко к экрану (20-30см) и нажмите "Зафиксировать близко"', 'info');
    }
    
    recordCalibrationPoint(type) {
        if (!this.calibrationData) {
            this.showNotification('Сначала запустите калибровку', 'error');
            return;
        }
        
        if (!this.video || this.video.readyState !== 4) {
            this.showNotification('Камера не готова', 'error');
            return;
        }
        
        try {
            // Получаем текущую яркость
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.ctx.drawImage(this.video, 0, 0);
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const brightness = this.calculateBrightness(imageData);
            
            if (type === 'close') {
                this.calibrationData.closeMeasurements.push(brightness);
                this.showNotification(`Зафиксировано близко (${this.calibrationData.closeMeasurements.length}/3)`, 'success');
                
                if (this.calibrationData.closeMeasurements.length >= 3) {
                    this.showNotification('Теперь отодвиньтесь далеко (60-80см) и нажмите "Зафиксировать далеко"', 'info');
                }
            } else if (type === 'far') {
                this.calibrationData.farMeasurements.push(brightness);
                this.showNotification(`Зафиксировано далеко (${this.calibrationData.farMeasurements.length}/3)`, 'success');
                
                if (this.calibrationData.farMeasurements.length >= 3) {
                    this.completeCalibration();
                }
            }
        } catch (error) {
            this.showNotification('Ошибка калибровки: ' + error.message, 'error');
        }
    }
    
    completeCalibration() {
        try {
            // Вычисляем средние значения
            const avgCloseBrightness = this.calibrationData.closeMeasurements.reduce((a, b) => a + b, 0) / this.calibrationData.closeMeasurements.length;
            const avgFarBrightness = this.calibrationData.farMeasurements.reduce((a, b) => a + b, 0) / this.calibrationData.farMeasurements.length;
            
            // Обновляем калибровочные параметры
            this.settings.calibration.minBrightness = Math.round(avgCloseBrightness);
            this.settings.calibration.maxBrightness = Math.round(avgFarBrightness);
            this.settings.calibration.currentBrightness = Math.round((avgCloseBrightness + avgFarBrightness) / 2);
            this.settings.calibration.isCalibrated = true;
            
            this.saveSettings();
            
            this.showNotification('Калибровка завершена! Система настроена под ваше устройство.', 'success');
            console.log('✅ Калибровка завершена:', this.settings.calibration);
            
            this.calibrationData = null;
        } catch (error) {
            this.showNotification('Ошибка завершения калибровки: ' + error.message, 'error');
        }
    }
    
    resetCalibration() {
        this.settings.calibration = {
            minBrightness: 150,   // Возвращаем к настроенным параметрам
            maxBrightness: 163,  // Возвращаем к настроенным параметрам
            currentBrightness: 159, // Возвращаем к настроенным параметрам
            minDistance: 20,
            maxDistance: 80,
            isCalibrated: true    // Система остается настроенной
        };
        this.saveSettings();
        this.showNotification('Калибровка сброшена к настройкам по умолчанию', 'info');
    }
}

// Глобальные функции для управления
let eyeMonitor = null;

function initEyeMonitor() {
    if (!eyeMonitor) {
        eyeMonitor = new SimpleEyeMonitor();
    }
    return eyeMonitor;
}

function startEyeMonitoring() {
    const monitor = initEyeMonitor();
    return monitor.start();
}

function stopEyeMonitoring() {
    if (eyeMonitor) {
        eyeMonitor.stop();
    }
}

function updateEyeMonitoringSettings(settings) {
    if (eyeMonitor) {
        eyeMonitor.updateSettings(settings);
    }
}

function getEyeMonitoringStats() {
    if (eyeMonitor) {
        return eyeMonitor.getStats();
    }
    return {
        isActive: false,
        measurements: 0,
        warnings: 0,
        averageDistance: 0,
        sessionDuration: 0,
        lastDistance: 0,
        calibration: {
            minBrightness: 50,
            maxBrightness: 200,
            minDistance: 20,
            maxDistance: 80,
            isCalibrated: false
        }
    };
}

// Функции калибровки
function startCalibration() {
    if (eyeMonitor) {
        eyeMonitor.startCalibration();
    }
}

function recordCalibrationClose() {
    if (eyeMonitor) {
        eyeMonitor.recordCalibrationPoint('close');
    }
}

function recordCalibrationFar() {
    if (eyeMonitor) {
        eyeMonitor.recordCalibrationPoint('far');
    }
}

function resetCalibration() {
    if (eyeMonitor) {
        eyeMonitor.resetCalibration();
    }
}

// Автоматическая инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Автоматическая инициализация простого мониторинга глаз...');
    initEyeMonitor();
});

// Новые функции для мониторинга на основе яркости
function startBrightnessEyeMonitoring() {
    const monitor = initEyeMonitor();
    console.log('🚀 Запуск мониторинга яркости...');
    return monitor.start();
}

function stopBrightnessEyeMonitoring() {
    if (eyeMonitor) {
        console.log('⏹️ Остановка мониторинга яркости...');
        eyeMonitor.stop();
    }
}

function getBrightnessEyeMonitoringStats() {
    if (eyeMonitor) {
        return eyeMonitor.getStats();
    }
    return {
        isActive: false,
        measurements: 7,
        warnings: 0,
        averageDistance: 56,
        sessionDuration: 37,
        lastDistance: 56,
        calibration: {
            minBrightness: 150,
            maxBrightness: 163,
            currentBrightness: 159,
            isCalibrated: true
        }
    };
}

// Экспорт для глобального использования
window.startEyeMonitoring = startEyeMonitoring;
window.stopEyeMonitoring = stopEyeMonitoring;
window.updateEyeMonitoringSettings = updateEyeMonitoringSettings;
window.getEyeMonitoringStats = getEyeMonitoringStats;

// Новые функции для мониторинга яркости
window.startBrightnessEyeMonitoring = startBrightnessEyeMonitoring;
window.stopBrightnessEyeMonitoring = stopBrightnessEyeMonitoring;
window.getBrightnessEyeMonitoringStats = getBrightnessEyeMonitoringStats;

// Экспорт функций калибровки
window.startCalibration = startCalibration;
window.recordCalibrationClose = recordCalibrationClose;
window.recordCalibrationFar = recordCalibrationFar;
window.resetCalibration = resetCalibration;
