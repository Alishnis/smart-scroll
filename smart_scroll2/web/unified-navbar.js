/**
 * Единый навбар для SmartScroll
 * Обеспечивает консистентную навигацию между всеми страницами
 */

// Определение текущей страницы
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    
    switch(filename) {
        case 'dashboard.html':
        case 'index.html':
        case '':
            return 'feed';
        case 'posts.html':
            return 'posts';
        case 'feed.html':
            return 'feed';
        case 'quiz-template.html':
            return 'quiz';
        case 'flashcard-generator.html':
            return 'flashcard-generator';
        case 'smart-shop.html':
            return 'shop';
        case 'conference-template-new.html':
            return 'conference';
        case 'settings.html':
            return 'settings';
        case 'profile.html':
            return 'profile';
        case 'stats.html':
            return 'stats';
        case 'eye-health.html':
            return 'eye-health';
        case 'conference.html':
            return 'conference';
        case 'document-reader.html':
            return 'document-reader';
        default:
            return 'feed';
    }
}

// Определение заголовка страницы
const PAGE_TITLES = {
    'dashboard.html':               { ru: 'SmartScroll',           en: 'SmartScroll' },
    'index.html':                   { ru: 'SmartScroll',           en: 'SmartScroll' },
    '':                             { ru: 'SmartScroll',           en: 'SmartScroll' },
    'posts.html':                   { ru: 'Посты',                 en: 'Posts' },
    'feed.html':                    { ru: 'Лента',                 en: 'Feed' },
    'quiz-template.html':           { ru: 'Квиз',                  en: 'Quiz' },
    'flashcard-generator.html':     { ru: 'Генератор флешкарт',    en: 'Flashcard Generator' },
    'smart-shop.html':              { ru: 'Магазин',               en: 'Shop' },
    'conference-template-new.html': { ru: 'Видеоконференции',      en: 'Video Conference' },
    'settings.html':                { ru: 'Настройки',             en: 'Settings' },
    'profile.html':                 { ru: 'Профиль',               en: 'Profile' },
    'stats.html':                   { ru: 'Статистика',            en: 'Stats' },
    'eye-health.html':              { ru: 'Здоровье глаз',         en: 'Eye Health' },
    'conference.html':              { ru: 'Конференция',           en: 'Conference' },
    'document-reader.html':         { ru: 'Документы',             en: 'Documents' }
};

function getPageTitle() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    const entry = PAGE_TITLES[filename] || PAGE_TITLES['dashboard.html'];
    return entry.ru;
}

function getPageTitleEn() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    const entry = PAGE_TITLES[filename] || PAGE_TITLES['dashboard.html'];
    return entry.en;
}

// Инициализация навбара
function initializeNavbar() {
    const currentPage = getCurrentPage();
    const pageTitle = getPageTitle();
    
    // Устанавливаем заголовок страницы
    const titleElement = document.getElementById('pageTitle');
    if (titleElement) {
        titleElement.textContent = pageTitle;
        titleElement.setAttribute('data-i18n-en', getPageTitleEn());
        if (window.SmartScrollI18N) window.SmartScrollI18N.refresh();
    }
    
    // Убираем активный класс со всех элементов навбара
    document.querySelectorAll('.ss-navbar__item').forEach(item => {
        item.classList.remove('ss-navbar__item--active');
    });
    
    // Добавляем активный класс к текущей странице
    const activeItem = document.querySelector(`[onclick*="${currentPage}"]`);
    if (activeItem) {
        activeItem.classList.add('ss-navbar__item--active');
    }
    
    // Инициализируем выпадающие меню
    initializeDropdowns();
    
    // Добавляем класс для темной темы если нужно
    if (document.body.classList.contains('dark-theme') || 
        document.body.style.background.includes('gradient') ||
        document.body.style.background.includes('#000') ||
        document.body.style.backgroundColor === 'rgb(0, 0, 0)') {
        document.body.classList.add('dark-theme');
    }
}

// Инициализация выпадающих меню
function initializeDropdowns() {
    const dropdownItems = document.querySelectorAll('.ss-navbar__item--dropdown');
    
    dropdownItems.forEach(item => {
        const dropdownMenu = item.querySelector('.ss-navbar__dropdown-menu');
        
        if (dropdownMenu) {
            // Обработчик для показа/скрытия меню
            item.addEventListener('mouseenter', () => {
                dropdownMenu.style.opacity = '1';
                dropdownMenu.style.visibility = 'visible';
                dropdownMenu.style.transform = 'translateX(-50%) translateY(0)';
            });
            
            item.addEventListener('mouseleave', () => {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
                dropdownMenu.style.transform = 'translateX(-50%) translateY(10px)';
            });
            
            // Предотвращаем закрытие меню при наведении на само меню
            dropdownMenu.addEventListener('mouseenter', () => {
                dropdownMenu.style.opacity = '1';
                dropdownMenu.style.visibility = 'visible';
                dropdownMenu.style.transform = 'translateX(-50%) translateY(0)';
            });
            
            dropdownMenu.addEventListener('mouseleave', () => {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
                dropdownMenu.style.transform = 'translateX(-50%) translateY(10px)';
            });
        }
    });
}

// Функция поиска (универсальная)
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.error('❌ Поле поиска не найдено в unified-navbar.js');
        alert('Ошибка: поле поиска не найдено');
        return;
    }
    
    const query = searchInput.value.trim();
    console.log('🔍 Unified navbar поиск:', query);
    console.log('📝 Значение поля:', searchInput.value);
    console.log('📝 Обрезанное значение:', query);
    
    if (!query) {
        console.log('❌ Запрос пустой в unified-navbar.js');
        alert('Пожалуйста, введите ключевые слова для поиска');
        return;
    }
    
    // Определяем текущую страницу и выполняем соответствующий поиск
    const currentPage = getCurrentPage();
    console.log('📍 Текущая страница:', currentPage);
    
    switch(currentPage) {
        case 'posts':
            console.log('🔄 Перенаправляем на поиск постов');
            if (window.performPostSearch) {
                window.performPostSearch();
            } else if (window.searchPosts) {
                window.searchPosts(query);
            } else {
                window.location.href = `posts.html?search=${encodeURIComponent(query)}`;
            }
            break;
        case 'feed':
            console.log('🔄 Перенаправляем на поиск видео');
            if (window.performVideoSearch) {
                window.performVideoSearch();
            } else if (window.searchVideos) {
                window.searchVideos(query);
            } else {
                window.location.href = `feed.html?search=${encodeURIComponent(query)}`;
            }
            break;
        default:
            console.log('🔄 Перенаправляем на поиск постов по умолчанию');
            window.location.href = `posts.html?search=${encodeURIComponent(query)}`;
            break;
    }
}

// Обработка Enter в поле поиска
function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

// Добавление отступа для контента
function addContentPadding() {
    // Добавляем отступ для body
    document.body.style.paddingBottom = '80px';
    document.body.style.boxSizing = 'border-box';
    
    // Добавляем отступ для основного контейнера
    const mainContent = document.querySelector('.container, .feed-container, .posts-container, main, .main-content, .content, .page');
    if (mainContent) {
        mainContent.style.paddingBottom = '80px';
        mainContent.style.boxSizing = 'border-box';
    }
    
    // Добавляем отступ для всех элементов с классом main-content
    const allMainContent = document.querySelectorAll('.main-content, .content, .feed-container, .posts-container');
    allMainContent.forEach(element => {
        element.style.paddingBottom = '80px';
        element.style.boxSizing = 'border-box';
    });
}

// Инициализация Smart Currency
function initializeSmartCurrency() {
    if (window.SmartCurrency) {
        window.SmartCurrency.updateDisplay();
        console.log('✅ Smart Currency инициализирована');
    }
}

// Инициализация TTS
function initializeTTS() {
    if (window.TTSService) {
        // Проверяем настройки TTS
        const ttsSettings = localStorage.getItem('ttsSettings');
        if (ttsSettings) {
            const settings = JSON.parse(ttsSettings);
            if (settings.enabled) {
                window.TTSService.enableTTS();
                console.log('🔊 TTS автоматически включен');
            }
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация единого навбара');
    
    initializeNavbar();
    addContentPadding();
    initializeSmartCurrency();
    initializeTTS();
    
    // Добавляем обработчик для Enter в поле поиска
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearchKeyPress);
    }
    
    // Обработка параметров URL для поиска
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery && searchInput) {
        searchInput.value = searchQuery;
        // Автоматически выполняем поиск если есть параметр
        setTimeout(() => {
            performSearch();
        }, 500);
    }
    
    // Специальная функциональность для секции статистики
    initializeStatsSection();
    
    console.log('✅ Единый навбар инициализирован');
});

// Специальная функциональность для секции статистики
function initializeStatsSection() {
    const statsNavItem = document.querySelector('.ss-navbar__item--stats');
    if (statsNavItem) {
        // Добавляем эффект при наведении
        statsNavItem.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        statsNavItem.addEventListener('mouseleave', function() {
            if (!this.classList.contains('ss-navbar__item--active')) {
                this.style.transform = 'translateY(0) scale(1)';
            }
        });

        // Анимация при клике
        statsNavItem.addEventListener('click', function() {
            // Создаем эффект волны
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(48, 202, 161, 0.6);
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                width: 20px;
                height: 20px;
                left: 50%;
                top: 50%;
                margin-left: -10px;
                margin-top: -10px;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    // Убеждаемся, что навбар прокручивается для показа всех элементов
    const navbar = document.querySelector('.ss-navbar');
    if (navbar) {
        // Добавляем плавную прокрутку
        navbar.style.scrollBehavior = 'smooth';
        
        // Автоматически прокручиваем к активному элементу
        const activeItem = navbar.querySelector('.ss-navbar__item--active');
        if (activeItem) {
            setTimeout(() => {
                activeItem.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest',
                    inline: 'center'
                });
            }, 100);
        }
    }
}

// Экспорт функций для глобального использования
window.performSearch = performSearch;
window.getCurrentPage = getCurrentPage;
window.getPageTitle = getPageTitle;
window.initializeNavbar = initializeNavbar;
window.initializeStatsSection = initializeStatsSection;
