// Функции для мобильного меню (устарели, оставлены для совместимости)
function openMobileMenu() {
    // Функция больше не используется
}

function closeMobileMenu() {
    // Функция больше не используется
}

// Управление выпадающим меню Discord
function setupDiscordDropdown() {
    const discordLink = document.getElementById('discordLink');
    const discordDropdown = document.getElementById('discordDropdown');
    const dropdownArrow = document.querySelector('.dropdown-arrow');

    if (!discordLink || !discordDropdown || !dropdownArrow) {
        console.warn('Discord dropdown elements not found, retrying...');
        // Попробуем еще раз через небольшую задержку
        setTimeout(() => {
            const retryDiscordLink = document.getElementById('discordLink');
            const retryDiscordDropdown = document.getElementById('discordDropdown');
            const retryDropdownArrow = document.querySelector('.dropdown-arrow');
            
            if (retryDiscordLink && retryDiscordDropdown && retryDropdownArrow) {
                console.log('Discord dropdown elements found on retry');
                setupDropdownHandlers(retryDiscordLink, retryDiscordDropdown, retryDropdownArrow);
            } else {
                console.error('Discord dropdown elements still not found after retry');
            }
        }, 100);
        return;
    }

    // Очищаем старые обработчики, если они есть
    if (discordLink._dropdownHandler) {
        discordLink.removeEventListener('click', discordLink._dropdownHandler);
    }
    if (discordLink._outsideClickHandler) {
        document.removeEventListener('click', discordLink._outsideClickHandler);
    }

    setupDropdownHandlers(discordLink, discordDropdown, dropdownArrow);
}

function setupDropdownHandlers(discordLink, discordDropdown, dropdownArrow) {
    // Создаем обработчик клика
    const clickHandler = function (e) {
        e.preventDefault();
        const isOpen = discordDropdown.classList.toggle('open');
        dropdownArrow.classList.toggle('rotated', isOpen);
    };

    // Создаем обработчик клика вне меню
    const outsideClickHandler = function (e) {
        if (!discordLink.contains(e.target) && !discordDropdown.contains(e.target)) {
            discordDropdown.classList.remove('open');
            dropdownArrow.classList.remove('rotated');
        }
    };

    // Сохраняем ссылки на обработчики для возможного удаления
    discordLink._dropdownHandler = clickHandler;
    discordLink._outsideClickHandler = outsideClickHandler;

    // Добавляем обработчики
    discordLink.addEventListener('click', clickHandler);
    document.addEventListener('click', outsideClickHandler);
}

// Обработка поиска
function setupSearch() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const mobileSearchForm = document.getElementById('mobileSearchForm');
    const mobileSearchInput = document.getElementById('mobileSearchInput');

    // Проверяем, что поиск уже настроен
    if (searchForm._searchSetup) {
        return;
    }
    searchForm._searchSetup = true;

    // Простой флаг для предотвращения множественных запросов
    let isSearching = false;

    async function handleSearch(nickname) {
        // Делаем функцию доступной глобально для других скриптов
        window.handleSearch = handleSearch;
        const q = nickname.trim();
        if (!q || isSearching) return;
        
        // Устанавливаем флаг загрузки
        isSearching = true;
        
        try {
            const res = await fetch(`/api/search_player.php?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
            const data = await res.json();
            console.log('Search API response:', data); // Отладка
            if (data && data.found && data.player) {
                // Проверяем и вычисляем общий счет если он не предоставлен
                let overallScore = data.player.overallScore;
                if (!overallScore && (data.player.swordTiers || data.player.opTiers || data.player.netherpotTiers)) {
                    // Вычисляем общий счет на основе тиров (исключаем Restricted категории)
                    let score = 0;
                    
                    // Добавляем очки только если тир НЕ Restricted
                    if (data.player.swordTiers) {
                        score += data.player.swordTiers.reduce((sum, tier) => {
                            if (tier === 'Restricted') return sum;
                            // Remove 'R' prefix for retired tiers when calculating score
                            const tierForScore = tier.startsWith('R') ? tier.substring(1) : tier;
                            return sum + (tierScores[tierForScore] || 0);
                        }, 0);
                    }
                    
                    if (data.player.opTiers) {
                        score += data.player.opTiers.reduce((sum, tier) => {
                            if (tier === 'Restricted') return sum;
                            // Remove 'R' prefix for retired tiers when calculating score
                            const tierForScore = tier.startsWith('R') ? tier.substring(1) : tier;
                            return sum + (tierScores[tierForScore] || 0);
                        }, 0);
                    }
                    if (data.player.netherpotTiers) {
                        score += data.player.netherpotTiers.reduce((sum, tier) => {
                            if (tier === 'Restricted') return sum;
                            // Remove 'R' prefix for retired tiers when calculating score
                            const tierForScore = tier.startsWith('R') ? tier.substring(1) : tier;
                            return sum + (tierScores[tierForScore] || 0);
                        }, 0);
                    }
                    
                    overallScore = score;
                }
                
                // Проверяем, Restricted ли игрок во всех категориях
                const hasSwordTiers = (data.player.swordTiers && data.player.swordTiers.length > 0);
                const hasOpTiers = (data.player.opTiers && data.player.opTiers.length > 0);
                const hasNetherpotTiers = (data.player.netherpotTiers && data.player.netherpotTiers.length > 0);

                let isFullyRestricted = false;
                const presentRestrictions = [];
                
                // Check if all tiers are "Restricted"
                if (hasSwordTiers) {
                    presentRestrictions.push(data.player.swordTiers.includes('Restricted') && data.player.swordTiers.length === 1);
                }
                if (hasOpTiers) {
                    presentRestrictions.push(data.player.opTiers.includes('Restricted') && data.player.opTiers.length === 1);
                }
                if (hasNetherpotTiers) {
                    presentRestrictions.push(data.player.netherpotTiers.includes('Restricted') && data.player.netherpotTiers.length === 1);
                }
                
                if (presentRestrictions.length > 0) {
                    isFullyRestricted = presentRestrictions.every(Boolean);
                }
                
                if (isFullyRestricted) {
                    // Показываем специальное модальное окно для полностью Restricted игроков
                    openRestrictedPlayerModal(data.player.nickname);
                } else {
                    // Находим позицию игрока в общем рейтинге для определения градиента
                    const playerIndex = window.playersData.findIndex(p => p.nickname === data.player.nickname);
                    const rank = playerIndex !== -1 ? playerIndex + 1 : null;
                    
                    openPlayerModal({
                        nickname: data.player.nickname,
                        name: data.player.name, // Для совместимости
                        swordTiers: data.player.swordTiers || [],
                        opTiers: data.player.opTiers || [],
                        netherpotTiers: data.player.netherpotTiers || [],
                        overallScore: overallScore || 0,
                        rank: rank // Передаем ранг для определения градиента
                    });
                }
            } else {
                // Добавляем тряску экрана
                document.body.classList.add('shake');
                setTimeout(() => {
                    document.body.classList.remove('shake');
                }, 400);
                toastManager.show(`Игрок с никнеймом "${q}" не найден.`);
            }
        } catch (e) {
            // Добавляем тряску экрана при ошибке
            document.body.classList.add('shake');
            setTimeout(() => {
                document.body.classList.remove('shake');
            }, 400);
            toastManager.show('Ошибка поиска. Попробуйте позже.');
        } finally {
            // Сбрасываем флаг загрузки сразу после завершения
            isSearching = false;
        }
    }

    searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleSearch(searchInput.value);
    });

    mobileSearchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        handleSearch(mobileSearchInput.value);
        // Закрываем мобильное dropdown меню, если оно открыто
        const mobileDiscordDropdown = document.getElementById('mobileDiscordDropdown');
        if (mobileDiscordDropdown && mobileDiscordDropdown.classList.contains('open')) {
            mobileDiscordDropdown.classList.remove('open');
        }
    });
}

// Управление выпадающим меню в мобильной версии
function setupMobileDropdown() {
    const mobileDiscordBtn = document.getElementById('mobileDiscordBtn');
    const mobileDiscordDropdown = document.getElementById('mobileDiscordDropdown');
    
    if (!mobileDiscordBtn || !mobileDiscordDropdown) {
        console.warn('Mobile Discord elements not found');
        return;
    }

    // Очищаем старые обработчики
    if (mobileDiscordBtn._mobileDropdownHandler) {
        mobileDiscordBtn.removeEventListener('click', mobileDiscordBtn._mobileDropdownHandler);
    }
    if (mobileDiscordBtn._outsideClickHandler) {
        document.removeEventListener('click', mobileDiscordBtn._outsideClickHandler);
    }

    // Флаг для отслеживания состояния меню
    let isDropdownOpen = false;

    // Обработчик клика по кнопке Discord
    const clickHandler = function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        isDropdownOpen = !isDropdownOpen;
        mobileDiscordDropdown.classList.toggle('open', isDropdownOpen);
    };

    // Обработчик клика вне меню
    const outsideClickHandler = function (e) {
        // Проверяем, что клик не по кнопке Discord и не по dropdown меню
        if (isDropdownOpen && 
            !mobileDiscordBtn.contains(e.target) && 
            !mobileDiscordDropdown.contains(e.target)) {
            
            isDropdownOpen = false;
            mobileDiscordDropdown.classList.remove('open');
        }
    };

    // Обработчик клика внутри dropdown меню
    const dropdownClickHandler = function (e) {
        // Предотвращаем закрытие меню при клике на ссылки
        e.stopPropagation();
    };

    // Сохраняем ссылки на обработчики
    mobileDiscordBtn._mobileDropdownHandler = clickHandler;
    mobileDiscordBtn._outsideClickHandler = outsideClickHandler;
    mobileDiscordBtn._dropdownClickHandler = dropdownClickHandler;

    // Добавляем обработчики
    mobileDiscordBtn.addEventListener('click', clickHandler);
    document.addEventListener('click', outsideClickHandler);
    mobileDiscordDropdown.addEventListener('click', dropdownClickHandler);
}

// Функция для очистки всех обработчиков dropdown меню
function cleanupDropdownHandlers() {
    const discordLink = document.getElementById('discordLink');
    const mobileDiscordBtn = document.getElementById('mobileDiscordBtn');
    const mobileDiscordDropdown = document.getElementById('mobileDiscordDropdown');

    if (discordLink) {
        if (discordLink._dropdownHandler) {
            discordLink.removeEventListener('click', discordLink._dropdownHandler);
            delete discordLink._dropdownHandler;
        }
        if (discordLink._outsideClickHandler) {
            document.removeEventListener('click', discordLink._outsideClickHandler);
            delete discordLink._outsideClickHandler;
        }
    }

    if (mobileDiscordBtn) {
        if (mobileDiscordBtn._mobileDropdownHandler) {
            mobileDiscordBtn.removeEventListener('click', mobileDiscordBtn._mobileDropdownHandler);
            delete mobileDiscordBtn._mobileDropdownHandler;
        }
        if (mobileDiscordBtn._outsideClickHandler) {
            document.removeEventListener('click', mobileDiscordBtn._outsideClickHandler);
            delete mobileDiscordBtn._outsideClickHandler;
        }
        if (mobileDiscordBtn._dropdownClickHandler && mobileDiscordDropdown) {
            mobileDiscordDropdown.removeEventListener('click', mobileDiscordBtn._dropdownClickHandler);
            delete mobileDiscordBtn._dropdownClickHandler;
        }
    }
}

// Экспортируем функцию для использования в SPA
window.cleanupDropdownHandlers = cleanupDropdownHandlers;