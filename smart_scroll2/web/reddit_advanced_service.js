/**
 * Продвинутый сервис для работы с Reddit API
 * Поддерживает OAuth2 аутентификацию и продвинутое извлечение изображений
 * Версия: 2.0 - Исправлены URL для локального API
 */

class RedditAdvancedService {
    constructor() {
        this.userAgent = 'smartscrolling/1.0';

        // Кэш для изображений
        this.imageCache = new Map();

        console.log('🚀 RedditAdvancedService инициализирован (версия 2.0)');
    }

    /**
     * Поиск постов с продвинутыми параметрами
     */
    async searchPosts(query, options = {}) {
        console.log('🔍 Поиск постов:', query, options);
        console.log('🔧 RedditAdvancedService версия 2.0 - исправленные URL');
        
        const {
            subreddit = null,
            limit = 10,
            sort = 'relevance',
            time = 'all',
            includeOver18 = true
        } = options;

        try {
            let url, headers, params;

            // Всегда используем публичный режим (более надежный)
            console.log('🌐 Используем публичный режим');
            url = subreddit 
                ? `https://www.reddit.com/r/${subreddit}/search.json`
                : 'https://www.reddit.com/search.json';
            
            headers = {
                'User-Agent': this.userAgent
            };
            
            params = {
                q: query,
                sort: sort,
                limit: limit,
                restrict_sr: subreddit ? 'on' : 'off',
                type: 'link',
                t: time
            };

            // Сначала пробуем CORS Proxy для Reddit API
            try {
                console.log('🔄 Пробуем CORS Proxy для Reddit API...');
                const corsProxyUrl = `/reddit/search?q=${encodeURIComponent(params.q)}&sort=${params.sort}&limit=${params.limit}&type=${params.type}&include_over_18=on&restrict_sr=off&t=all`;
                console.log('📍 URL для CORS Proxy:', corsProxyUrl);
                
                const response = await fetch(corsProxyUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'SmartScroll/1.0 (by /u/smartscroll)'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ CORS Proxy для Reddit API работает');
                    
                    // Обрабатываем данные Reddit API
                    if (data && data.data && data.data.children) {
                        const posts = data.data.children.map(child => this.processRedditPost(child.data));
                        return {
                            query: query,
                            posts: posts,
                            total: posts.length,
                            success: true,
                            isDemo: false
                        };
                    } else {
                        console.log('❌ Неожиданный формат данных от Reddit API через CORS Proxy');
                        throw new Error('Invalid Reddit API response format');
                    }
                } else {
                    console.log(`❌ CORS Proxy вернул ошибку: ${response.status}`);
                }
            } catch (error) {
                console.log('❌ CORS Proxy не работает:', error.message);
            }

            // Если локальный API не работает, пробуем напрямую публичный Reddit API
            try {
                console.log('🔄 Пробуем публичный Reddit API напрямую...');
                const publicRedditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(params.q)}&sort=${params.sort}&limit=${params.limit}&type=${params.type}&include_over_18=on&restrict_sr=off&t=all`;
                
                const response = await fetch(publicRedditUrl, {
                    headers: {
                        'User-Agent': 'SmartScroll/1.0 (by /u/smartscroll)',
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Публичный Reddit API работает');
                    
                    // Обрабатываем данные Reddit API
                    if (data && data.data && data.data.children) {
                        const posts = data.data.children.map(child => this.processRedditPost(child.data));
                        return {
                            query: query,
                            posts: posts,
                            total: posts.length,
                            success: true,
                            isDemo: false
                        };
                    } else {
                        console.log('❌ Неожиданный формат данных от публичного Reddit API');
                        throw new Error('Invalid public Reddit API response format');
                    }
                } else {
                    console.log(`❌ Публичный Reddit API вернул ошибку: ${response.status}`);
                }
            } catch (error) {
                console.log('❌ Публичный Reddit API не работает:', error.message);
            }

            // Если публичные API не работают, возвращаем демо-данные
            console.log('⚠️ Публичные Reddit API не работают, возвращаем демо-данные');
            return this.getDemoPosts(query, options);

        } catch (error) {
            console.error('❌ Ошибка поиска постов:', error);
            console.log('⚠️ Возвращаем демо-данные из-за ошибки');
            return this.getDemoPosts(query, options);
        }
    }

    /**
     * Генерация демо-постов для fallback
     */
    getDemoPosts(query, options = {}) {
        const { limit = 10 } = options;
        
        console.log(`🎭 Генерируем ${limit} демо-постов для запроса: "${query}"`);
        
        const demoPosts = [
            {
                id: 'demo1',
                title: `Learn ${query} Programming - Complete Tutorial`,
                subreddit: 'learnprogramming',
                description: `Master ${query} programming with this comprehensive tutorial. Perfect for beginners who want to start their programming journey.`,
                author: 'CodeMaster',
                score: 1250,
                numComments: 89,
                created: new Date(),
                url: 'https://www.reddit.com/r/learnprogramming/',
                thumbnail: 'https://picsum.photos/800/400?random=1',
                preview: 'https://picsum.photos/800/400?random=1',
                isVideo: false,
                over18: false,
                permalink: '/r/learnprogramming/comments/demo1/'
            },
            {
                id: 'demo2',
                title: `${query} Best Practices and Tips`,
                subreddit: 'programming',
                description: `Discover the best practices for ${query} development. Learn from experienced developers and improve your coding skills.`,
                author: 'DevGuru',
                score: 890,
                numComments: 45,
                created: new Date(),
                url: 'https://www.reddit.com/r/programming/',
                thumbnail: 'https://picsum.photos/800/400?random=2',
                preview: 'https://picsum.photos/800/400?random=2',
                isVideo: false,
                over18: false,
                permalink: '/r/programming/comments/demo2/'
            },
            {
                id: 'demo3',
                title: `Advanced ${query} Concepts Explained`,
                subreddit: 'technology',
                description: `Deep dive into advanced ${query} concepts. Perfect for intermediate developers looking to level up their skills.`,
                author: 'TechExpert',
                score: 2100,
                numComments: 156,
                created: new Date(),
                url: 'https://www.reddit.com/r/technology/',
                thumbnail: 'https://picsum.photos/800/400?random=3',
                preview: 'https://picsum.photos/800/400?random=3',
                isVideo: false,
                over18: false,
                permalink: '/r/technology/comments/demo3/'
            },
            {
                id: 'demo4',
                title: `${query} Project Ideas for Portfolio`,
                subreddit: 'webdev',
                description: `Build impressive ${query} projects for your portfolio. Step-by-step guides and real-world examples.`,
                author: 'PortfolioBuilder',
                score: 675,
                numComments: 32,
                created: new Date(),
                url: 'https://www.reddit.com/r/webdev/',
                thumbnail: 'https://picsum.photos/800/400?random=4',
                preview: 'https://picsum.photos/800/400?random=4',
                isVideo: false,
                over18: false,
                permalink: '/r/webdev/comments/demo4/'
            },
            {
                id: 'demo5',
                title: `${query} vs Other Technologies - Comparison`,
                subreddit: 'programming',
                description: `Comprehensive comparison of ${query} with other technologies. Make informed decisions for your projects.`,
                author: 'TechAnalyst',
                score: 1450,
                numComments: 78,
                created: new Date(),
                url: 'https://www.reddit.com/r/programming/',
                thumbnail: 'https://picsum.photos/800/400?random=5',
                preview: 'https://picsum.photos/800/400?random=5',
                isVideo: false,
                over18: false,
                permalink: '/r/programming/comments/demo5/'
            }
        ];

        // Возвращаем нужное количество постов
        const selectedPosts = demoPosts.slice(0, Math.min(limit, demoPosts.length));
        
        return {
            query: query,
            posts: selectedPosts,
            total: selectedPosts.length,
            success: true,
            isDemo: true
        };
    }

    /**
     * Продвинутая обработка поста Reddit с 3-уровневой системой извлечения изображений
     */
    processRedditPost(redditPost) {
        console.log('🔄 Обрабатываем пост:', redditPost.title);
        
        // ПРИОРИТЕТ 1: Preview изображения (высокое качество)
        let previewUrl = null;
        let imageType = null;
        
        try {
            const preview = redditPost.preview || {};
            const images = preview.images || [];
            
            if (images.length > 0) {
                const firstImage = images[0];
                
                // Сначала пытаемся получить source (оригинал)
                if (firstImage.source && firstImage.source.url) {
                    previewUrl = firstImage.source.url.replace(/&amp;/g, '&');
                    imageType = 'preview_source';
                    console.log('✅ Используем preview source:', previewUrl);
                } 
                // Если нет source, берем самое большое из resolutions
                else if (firstImage.resolutions && firstImage.resolutions.length > 0) {
                    const largest = firstImage.resolutions[firstImage.resolutions.length - 1];
                    if (largest && largest.url) {
                        previewUrl = largest.url.replace(/&amp;/g, '&');
                        imageType = 'preview_resolution';
                        console.log('✅ Используем preview resolution:', previewUrl);
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ Ошибка обработки preview:', error);
        }

        // ПРИОРИТЕТ 2: Thumbnail (среднее качество)
        if (!previewUrl) {
            const thumbnail = redditPost.thumbnail;
            if (thumbnail && typeof thumbnail === 'string' && thumbnail.startsWith('http')) {
                previewUrl = thumbnail;
                imageType = 'thumbnail';
                console.log('✅ Используем thumbnail:', previewUrl);
            }
        }

        // ПРИОРИТЕТ 3: Прямая ссылка на изображение
        if (!previewUrl) {
            const linkUrl = redditPost.url_overridden_by_dest || redditPost.url || '';
            if (linkUrl && this.isImageUrl(linkUrl)) {
                previewUrl = linkUrl;
                imageType = 'direct_url';
                console.log('✅ Используем прямую ссылку:', previewUrl);
            }
        }

        // ПРИОРИТЕТ 4: Галереи изображений (Reddit galleries)
        if (!previewUrl && redditPost.is_gallery && redditPost.media_metadata) {
            console.log('🖼️ Найдена галерея изображений');
            const mediaMetadata = redditPost.media_metadata;
            const firstImageId = Object.keys(mediaMetadata)[0];
            if (firstImageId && mediaMetadata[firstImageId].s && mediaMetadata[firstImageId].s.u) {
                previewUrl = mediaMetadata[firstImageId].s.u.replace(/&amp;/g, '&');
                imageType = 'gallery';
                console.log('✅ Используем изображение из галереи:', previewUrl);
            }
        }

        console.log('🎯 Итоговое изображение:', {
            url: previewUrl,
            type: imageType
        });

        // Создание правильных ссылок
        const permalink = redditPost.permalink ? 
            `https://reddit.com${redditPost.permalink}` : '';
        const url = redditPost.url_overridden_by_dest || redditPost.url || '';

        return {
            id: redditPost.id,
            title: redditPost.title || '',
            subreddit: redditPost.subreddit || '',
            description: redditPost.selftext || '',
            author: redditPost.author || '',
            score: redditPost.score || 0,
            numComments: redditPost.num_comments || 0,
            created: new Date(redditPost.created_utc * 1000),
            
            // ССЫЛКИ
            permalink: permalink,           // Ссылка на пост в Reddit
            url: url,                      // Прямая ссылка на контент
            
            // ИЗОБРАЖЕНИЯ
            thumbnail: redditPost.thumbnail || '',  // Маленькое изображение
            preview: previewUrl || '',             // Лучшее изображение
            imageType: imageType,                  // Тип изображения
            
            // КОНТЕНТ
            selftext: redditPost.selftext || '',    // Текст поста
            selftextHtml: redditPost.selftext_html || '', // HTML версия
            over18: Boolean(redditPost.over_18),   // NSFW флаг
            
            // ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ
            isVideo: Boolean(redditPost.is_video),
            isSelf: Boolean(redditPost.is_self),
            domain: redditPost.domain || '',
            postHint: redditPost.post_hint || '',
            
            // МЕТАДАННЫЕ
            gilded: redditPost.gilded || 0,
            upvoteRatio: redditPost.upvote_ratio || 0,
            stickied: Boolean(redditPost.stickied),
            locked: Boolean(redditPost.locked),
            archived: Boolean(redditPost.archived)
        };
    }

    /**
     * Проверка, является ли URL изображением
     */
    isImageUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        const lowerUrl = url.toLowerCase();
        
        // Проверяем расширения файлов
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.ico'];
        if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
            return true;
        }
        
        // Проверяем популярные хостинги изображений
        const imageHosts = [
            'i.redd.it', 'preview.redd.it', 'external-preview.redd.it',
            'i.redditmedia.com', 'preview.redditmedia.com',
            'i.imgur.com', 'imgur.com', 'gyazo.com',
            'cdn.reddit.com', 'images.reddit.com', 'media.reddit.com',
            'thumbs.redditmedia.com', 'b.thumbs.redditmedia.com',
            'i.reddit.com', 'preview.reddit.com', 'external.reddit.com',
            'postimg.cc', 'imgbb.com', 'ibb.co'
        ];
        
        return imageHosts.some(host => lowerUrl.includes(host));
    }

    /**
     * Получение прокси URL для изображения
     */
    getProxiedImageUrl(originalUrl) {
        if (!originalUrl) {
            return '';
        }
        
        // Проверяем кэш
        if (this.imageCache.has(originalUrl)) {
            return this.imageCache.get(originalUrl);
        }
        
        console.log('🖼️ Обрабатываем изображение:', originalUrl);
        
        // Проверяем, является ли URL уже проксированным
        if (originalUrl.includes('images.weserv.nl') || 
            originalUrl.includes('cors-anywhere.herokuapp.com') ||
            originalUrl.includes('api.allorigins.win') ||
            originalUrl.includes('thingproxy.freeboard.io')) {
            return originalUrl;
        }
        
        // Для picsum.photos используем напрямую
        if (originalUrl.includes('picsum.photos')) {
            this.imageCache.set(originalUrl, originalUrl);
            return originalUrl;
        }
        
        // Для Reddit изображений используем weserv.nl
        if (originalUrl.includes('redd.it') || 
            originalUrl.includes('preview.redd.it') ||
            originalUrl.includes('i.redd.it') ||
            originalUrl.includes('external-preview.redd.it') ||
            originalUrl.includes('i.redditmedia.com') ||
            originalUrl.includes('preview.redditmedia.com') ||
            originalUrl.includes('reddit.com')) {
            
            const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&output=webp&q=85&n=-1&w=800&h=600&fit=cover`;
            this.imageCache.set(originalUrl, proxiedUrl);
            return proxiedUrl;
        }
        
        // Для других изображений также используем прокси
        if (originalUrl.startsWith('http')) {
            const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&output=webp&q=80&n=-1&w=800`;
            this.imageCache.set(originalUrl, proxiedUrl);
            return proxiedUrl;
        }
        
        this.imageCache.set(originalUrl, originalUrl);
        return originalUrl;
    }

    /**
     * Очистка кэша
     */
    clearCache() {
        this.imageCache.clear();
        console.log('🧹 Кэш изображений очищен');
    }
}

// Экспорт для использования
window.RedditAdvancedService = RedditAdvancedService;
