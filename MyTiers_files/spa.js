// Простой SPA-роутер с History API, fetch и плавными переходами
(function() {
    const routeView = document.getElementById('routeView');
    const preloader = document.getElementById('preloader');
    let globalUiInited = false;

    const routes = {
        '/': { file: '/overall.html', selector: '#overall-content', tab: 'overall' },
        '/overall': { file: '/overall.html', selector: '#overall-content', tab: 'overall' },
        '/sword': { file: '/sword.html', selector: '#sword-content', tab: 'sword' },
        '/op': { file: '/op.html', selector: '#op-content', tab: 'op' },
        '/netherpot': { file: '/netherpot.html', selector: '#netherpot-content', tab: 'netherpot' }
    };

    function setActiveTab(tabName) {
        // Обновляем новый пикер категорий
        if (window.categoryPicker && typeof window.categoryPicker.setActiveCategoryByData === 'function') {
            try {
                window.categoryPicker.setActiveCategoryByData(tabName);
            } catch (error) {
                console.warn('Error setting active category:', error);
            }
        }
        
        // Обновляем старые вкладки если они еще есть (для совместимости)
        document.querySelectorAll('.category-tab').forEach(a => {
            if (a.dataset.category === tabName) a.classList.add('active');
            else a.classList.remove('active');
        });

        // Героблока больше нет — логика не требуется
    }

    function fadeSwap(element, updater) {
        element.classList.remove('visible');
        // force reflow
        void element.offsetWidth;
        updater();
        requestAnimationFrame(() => element.classList.add('visible'));
    }

    function mountContent(fragment) {
        // Извлекаем нужный раздел из загруженной страницы
        const tmp = document.createElement('div');
        tmp.innerHTML = fragment;
        return tmp;
    }

    async function loadRoute(pathname, replace = false) {
        // Защита от множественных одновременных загрузок
        if (window.isLoadingRoute) {
            console.log('Route already loading, skipping:', pathname);
            return;
        }
        
        window.isLoadingRoute = true;
        const route = routes[pathname] || routes['/overall'];
        setActiveTab(route.tab);

        // Показать скелетон при загрузке (без текста)
        const skeletonHtml = `<div class="loading-indicator"><div class="spinner"></div></div>`;
        if (!routeView.classList.contains('visible')) {
            routeView.classList.add('visible');
        }
        fadeSwap(routeView, () => {
            routeView.innerHTML = skeletonHtml;
        });

        try {
            const res = await fetch(route.file, { cache: 'no-store' });
            const html = await res.text();
            const tmp = mountContent(html);
            const section = tmp.querySelector(route.selector);
            const header = tmp.querySelector('header.navigation-header');
            const footer = tmp.querySelector('footer.site-footer');

            // Переносим только нужную секцию в текущую страницу
            fadeSwap(routeView, () => {
                routeView.innerHTML = '';
                if (section) routeView.appendChild(section);

                // Чистим возможные предыдущие клоны и возвращаем оригинальный пикер
                const oldClone = routeView.querySelector('.category-picker-clone');
                if (oldClone && oldClone.parentNode) oldClone.parentNode.removeChild(oldClone);
                const originalPicker = document.querySelector('.category-picker');
                if (originalPicker) originalPicker.classList.remove('has-clone-hidden');
            });

            // Инициализация логики после монтирования
            initRouteScripts(route.tab);

            // Скрыть прелоадер, если он есть
            if (preloader) {
                preloader.classList.add('hidden');
                preloader.remove(); // Убираем задержку
            }

            // Обновление истории
            const state = { path: pathname };
            if (replace) {
                // Сохраняем текущие query/hash при первом монтировании, чтобы не терять ?player=...
                const url = window.location.pathname + window.location.search + window.location.hash;
                history.replaceState(state, '', url);
            } else {
                history.pushState(state, '', pathname);
            }
        } catch (e) {
            routeView.innerHTML = '<div class="warning-text">Не удалось загрузить контент. Попробуйте позже.</div>';
            if (preloader) {
                preloader.classList.add('hidden');
                preloader.remove(); // Убираем задержку
            }
        } finally {
            window.isLoadingRoute = false;
        }
    }

    function initRouteScripts(tab) {
        // Очищаем старые обработчики перед инициализацией новых
        if (window.cleanupDropdownHandlers) {
            window.cleanupDropdownHandlers();
        }

        // общие элементы
        setupDiscordDropdown();
        setupSearch();
        setupMobileDropdown();
        // setupGlobalUiOnce(); // Убираем дублирование - уже вызывается в loadRoute

        // данные и отрисовка
        (async () => {
            // Очищаем кэш при переключении между категориями с разными лимитами
            // Только если это действительно переключение категории
            if (window.clearDataCache && window.currentTab !== tab) {
                window.clearDataCache();
            }
            window.currentTab = tab;
            
            // Загружаем данные для каждой категории
            console.log('SPA: Loading players for tab:', tab);
            
            // Показать локальный индикатор загрузки
            const sectionRoot = routeView.querySelector('[id$="-content"]') || routeView;
            const loadingIndicator = sectionRoot.querySelector('#loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'flex';
            }
            
            if (tab === 'sword' || tab === 'op' || tab === 'netherpot') {
                await loadPlayers({ limit: 0 });
            } else if (tab === 'overall') {
                await loadPlayers({ limit: 50 });
            } else {
                await loadPlayers();
            }
            console.log('SPA: Players loaded:', window.playersData.length);
            
            if (tab === 'overall') {
                console.log('SPA: Rendering overall cards');
                if (typeof renderOverallCards === 'function') {
                    renderOverallCards();
                } else {
                    console.error('renderOverallCards function not found');
                }
                enhanceAvatarLoading();
            }
            if (tab === 'sword') {
                if (typeof renderTiersGridSword === 'function') {
                    renderTiersGridSword('sword', 'sword-grid');
                } else {
                    console.error('renderTiersGridSword function not found');
                }
                enhanceAvatarLoading();
            }
            if (tab === 'op') {
                if (typeof renderTiersGridOp === 'function') {
                    renderTiersGridOp('op', 'op-grid');
                } else {
                    console.error('renderTiersGridOp function not found');
                }
                enhanceAvatarLoading();
            }
            if (tab === 'netherpot') {
                if (typeof renderTiersGridNetherPot === 'function') {
                    renderTiersGridNetherPot('netherpot-grid');
                } else {
                    console.error('renderTiersGridNetherPot function not found');
                }
                enhanceAvatarLoading();
            }

            // Скрыть локальный индикатор загрузки после рендера
            if (loadingIndicator) {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        loadingIndicator.style.display = 'none';
                    }, 80);
                });
            }
        })();
    }

    function setupGlobalUiOnce() {
        if (globalUiInited) return;
        globalUiInited = true;

        const mobileBtn = document.getElementById('mobileMenuBtn');
        const menuOverlay = document.getElementById('menuOverlay');
        const modalClose = document.getElementById('modalClose');
        const playerModal = document.getElementById('playerModal');
        const header = document.getElementById('navigationHeader');

        if (mobileBtn) mobileBtn.addEventListener('click', openMobileMenu);
        if (menuOverlay) menuOverlay.addEventListener('click', closeMobileMenu);
        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (playerModal) {
            playerModal.addEventListener('click', function (e) {
                if (e.target === playerModal) closeModal();
            });
        }

        // Обработчик прокрутки для Header
        if (header) {
            window.addEventListener('scroll', function () {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }
        
        // Включаем плавную прокрутку если функция доступна
        if (typeof enableSmoothScrolling === 'function') {
            enableSmoothScrolling();
        } else {
            console.warn('enableSmoothScrolling function not available');
        }
    }

    function interceptLinks(root) {
        let isProcessing = false;
        let isNavigating = false;
        
        function handleLinkClick(e) {
            if (isProcessing || isNavigating) return;
            
            const a = e.target.closest('a');
            if (!a) return;
            const href = a.getAttribute('href');
            if (!href) return;

            // Внешние ссылки пропускаем
            if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('#')) return;

            // Наши роуты
            if (href in routes) {
                e.preventDefault();
                isProcessing = true;
                isNavigating = true;
                
                const tab = a.dataset.category || routes[href].tab;
                setActiveTab(tab);
                loadRoute(href).finally(() => {
                    // Сбрасываем флаги после завершения навигации
                    setTimeout(() => {
                        isProcessing = false;
                        isNavigating = false;
                    }, 100);
                });
            }
        }
        
        root.addEventListener('click', handleLinkClick);
        
        // Добавляем обработчик touchstart для мобильных устройств
        root.addEventListener('touchstart', function(e) {
            const a = e.target.closest('a');
            if (!a) return;
            const href = a.getAttribute('href');
            if (!href) return;

            // Внешние ссылки пропускаем
            if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('#')) return;

            // Наши роуты
            if (href in routes) {
                e.preventDefault();
                handleLinkClick(e);
            }
        }, { passive: false });
    }

    function enhanceAvatarLoading() {
        const imgs = document.querySelectorAll('img.player-avatar, img.card-avatar');
        imgs.forEach(img => {
            if (img.complete && img.naturalWidth) {
                img.classList.add('loaded');
                return;
            }
            img.classList.remove('loaded');
            img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
            img.addEventListener('error', () => img.classList.add('loaded'), { once: true });
        });
    }

    window.addEventListener('popstate', function(e) {
        const path = (e.state && e.state.path) || window.location.pathname;
        loadRoute(path, true);
    });

    // Listen for SPA navigation events from category picker
    document.addEventListener('spaNavigate', function(e) {
        const { path, category } = e.detail;
        if (path in routes) {
            loadRoute(path);
        }
    });

    // Старт с задержкой для загрузки всех скриптов
    interceptLinks(document);
    const initialPath = routes[window.location.pathname] ? window.location.pathname : '/overall';
    setupGlobalUiOnce();
    
    
        // Загружаем начальный роут с задержкой для полной инициализации
    setTimeout(() => {
        loadRoute(initialPath, true);
        
            // Проверяем параметр player в URL для автоматического открытия профиля
            const urlParams = new URLSearchParams(window.location.search);
            const playerName = urlParams.get('player');
            if (playerName) {
                console.log('SPA: Found player parameter:', playerName);
                let attempts = 0;
                const maxAttempts = 20; // ~5 секунд при интервале 250ms
                const tryOpen = async () => {
                    attempts++;
                    console.log(`SPA: Attempt ${attempts} to open modal for player:`, playerName);
                    
                    // Пытаемся открыть профиль; если данных ещё нет, функция сама подстрахуется API-запросом
                    await openPlayerProfileByName(playerName);
                    
                    const modal = document.getElementById('playerModal');
                    const opened = modal && modal.classList.contains('open');
                    const haveData = Array.isArray(window.playersData) && window.playersData.length > 0;
                    
                    console.log('SPA: Modal opened:', opened, 'Have data:', haveData, 'Attempts:', attempts);
                    
                    if (!opened && attempts < maxAttempts) {
                        console.log('SPA: Retrying in 250ms...');
                        setTimeout(tryOpen, 250);
                    } else if (opened) {
                        console.log('SPA: Modal successfully opened for player:', playerName);
                    } else {
                        console.warn('SPA: Failed to open modal after', maxAttempts, 'attempts');
                    }
                };
                setTimeout(tryOpen, 500); // Увеличили задержку до 500ms
            }
    }, 100);
    
    // Функция для открытия профиля игрока по имени
    async function openPlayerProfileByName(playerName) {
        try {
            console.log('openPlayerProfileByName: Searching for player:', playerName);
            
            // Сначала ищем в текущих данных
            if (window.playersData && Array.isArray(window.playersData)) {
                console.log('openPlayerProfileByName: Current players data length:', window.playersData.length);
                const player = window.playersData.find(p => p && p.nickname === playerName);
                if (player) {
                    console.log('openPlayerProfileByName: Found player in current data:', player);
                    openPlayerModal(player);
                    return;
                }
            }
            
            console.log('openPlayerProfileByName: Player not found in current data, fetching from API...');
            
            // Если не найден в текущих данных, загружаем из API
            const response = await fetch(`/api/search_player.php?q=${encodeURIComponent(playerName)}`, { 
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('openPlayerProfileByName: API response:', data);
                if (data.found && data.player) {
                    console.log('openPlayerProfileByName: Found player via API:', data.player);
                    openPlayerModal(data.player);
                } else {
                    console.warn('openPlayerProfileByName: Player not found via API:', playerName);
                    // Можно показать уведомление пользователю
                }
            } else {
                console.error('openPlayerProfileByName: Failed to fetch player:', response.status);
            }
        } catch (error) {
            console.error('openPlayerProfileByName: Error opening player profile:', error);
        }
    }
    
    // Экспортируем функцию для использования в других скриптах
    window.openPlayerProfileByName = openPlayerProfileByName;
})();


