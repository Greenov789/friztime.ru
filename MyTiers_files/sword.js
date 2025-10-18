// Use global avatar loader from utils.js

// Intersection Observer for scroll-based loading
const swordObserverOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
};

const swordImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const playerName = img.dataset.playerName;
            if (playerName && !img.classList.contains('loaded')) {
                avatarLoader.loadAvatar(img, playerName, 30);
            }
            swordImageObserver.unobserve(img);
        }
    });
}, swordObserverOptions);

// Modified renderTiersGrid with headers above corresponding columns
function renderTiersGridSword(category, gridElementId) {
    // Ищем в основном DOM и в SPA контейнере
    let gridElement = document.getElementById(gridElementId);
    if (!gridElement) {
        const routeView = document.getElementById('routeView');
        if (routeView) {
            gridElement = routeView.querySelector(`#${gridElementId}`);
        }
    }
    
    if (!gridElement) {
        console.error(`Element with id '${gridElementId}' not found`);
        return;
    }
    
    // Проверяем, есть ли уже элементы в сетке
    const existingElements = gridElement.querySelectorAll('.sword-tier-header, .sword-tier-column');
    if (existingElements.length > 0) {
        console.log('Sword grid already rendered, skipping animation');
        return;
    }
    
    gridElement.innerHTML = '';

    // Создаем контейнер для заголовков
    const headersContainer = document.createElement('div');
    headersContainer.className = 'sword-headers-grid';

    // Создаем контейнер для контента
    const contentContainer = document.createElement('div');
    contentContainer.className = 'sword-content-grid';

    // Create 5 columns (Tier 1 - Tier 5)
    for (let tierLevel = 1; tierLevel <= 5; tierLevel++) {
        // Создаем заголовок колонки
        const tierHeader = document.createElement('div');
        tierHeader.className = `sword-tier-header tier-${tierLevel}`;
        tierHeader.textContent = `Tier ${tierLevel}`;
        
        // Устанавливаем начальное невидимое состояние ДО добавления в DOM
        tierHeader.style.opacity = '0';
        tierHeader.style.transform = 'translateY(-15px) scale(0.95)';
        
        // Добавляем анимацию для заголовка (только один раз)
        if (!tierHeader._animationApplied) {
            tierHeader.style.animation = `swordOpHeaderSlideIn 0.3s ease-out`; // Замедлили с 0.2s до 0.3s
            tierHeader.style.animationDelay = `${tierLevel * 0.05}s`; // Замедлили с 0.03s до 0.05s
            tierHeader.style.animationFillMode = 'both'; // Изменили с forwards на both
            tierHeader._animationApplied = true;
        }
        headersContainer.appendChild(tierHeader);

        // Создаем колонку контента
        const tierColumn = document.createElement('div');
        tierColumn.className = 'sword-tier-column';
        
        // Устанавливаем начальное невидимое состояние ДО добавления в DOM
        tierColumn.style.opacity = '0';
        tierColumn.style.transform = 'translateY(20px) scale(0.9)';
        
        // Добавляем анимацию для колонки (только один раз)
        if (!tierColumn._animationApplied) {
            tierColumn.style.animation = `swordOpColumnSlideIn 0.35s ease-out`; // Замедлили с 0.25s до 0.35s
            tierColumn.style.animationDelay = `${tierLevel * 0.05 + 0.08}s`; // Замедлили с 0.05s до 0.08s
            tierColumn.style.animationFillMode = 'both'; // Изменили с forwards на both
            tierColumn._animationApplied = true;
        }

        // Создаем заголовок для мобильной версии (внутри колонки)
        const mobileTierHeader = document.createElement('div');
        mobileTierHeader.className = `sword-tier-header tier-${tierLevel}`;
        mobileTierHeader.textContent = `Tier ${tierLevel}`;
        
        // Устанавливаем начальное невидимое состояние ДО добавления в DOM
        mobileTierHeader.style.opacity = '0';
        mobileTierHeader.style.transform = 'translateY(-15px) scale(0.95)';
        
        // Добавляем анимацию для мобильного заголовка (только один раз)
        if (!mobileTierHeader._animationApplied) {
            mobileTierHeader.style.animation = `swordOpHeaderSlideIn 0.3s ease-out`; // Замедлили с 0.2s до 0.3s
            mobileTierHeader.style.animationDelay = `${tierLevel * 0.05}s`; // Замедлили с 0.03s до 0.05s
            mobileTierHeader.style.animationFillMode = 'both'; // Изменили с forwards на both
            mobileTierHeader._animationApplied = true;
        }
        tierColumn.appendChild(mobileTierHeader);

        // Создаем контейнер для прокрутки
        const tierContent = document.createElement('div');
        tierContent.className = 'sword-tier-content';

        // Filter players by category and tier level
        const playersInTier = window.playersData.filter(player => {
            const tiers = category === 'sword' ? player.swordTiers : player.opTiers;
            const isRestricted = tiers.includes('Restricted');
            const hasRetiredTiers = tiers.some(t => t.startsWith('R'));
            
            // Исключаем игроков с Restricted или Retired тирами
            if (isRestricted || hasRetiredTiers) {
                return false;
            }
            
            // Проверяем есть ли активные тиры нужного уровня
            return tiers.some(t => {
                const tierForComparison = t.startsWith('R') ? t.substring(1) : t;
                return tierForComparison.endsWith(tierLevel);
            });
        });

        // If no players in this tier
        if (playersInTier.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-tier-message';
            emptyMessage.textContent = 'Нет игроков';
            emptyMessage.style.cssText = 'text-align: center; padding: 20px; color: rgba(255,255,255,0.5);';
            tierContent.appendChild(emptyMessage);
        } else {
            // Sort: HT first, then LT
            playersInTier.sort((a, b) => {
                const aTiers = category === 'sword' ? a.swordTiers : a.opTiers;
                const bTiers = category === 'sword' ? b.swordTiers : b.opTiers;

                const aTier = aTiers.find(t => t.endsWith(tierLevel));
                const bTier = bTiers.find(t => t.endsWith(tierLevel));

                if (aTier.startsWith('H') && bTier.startsWith('L')) return -1;
                if (aTier.startsWith('L') && bTier.startsWith('H')) return 1;

                return (bTiers.reduce((sum, t) => sum + (tierScores[t] || 0), 0) -
                    aTiers.reduce((sum, t) => sum + (tierScores[t] || 0), 0));
            });

            // Create player cards
            playersInTier.forEach((player, index) => {
                const playerCard = document.createElement('div');
                const tiers = category === 'sword' ? player.swordTiers : player.opTiers;
                const tier = tiers.find(t => t.endsWith(tierLevel));

                playerCard.className = 'sword-player-card';
                // Add HT/LT class based on tier type
                if (tier.startsWith('H')) {
                    playerCard.classList.add('ht');
                } else if (tier.startsWith('L')) {
                    playerCard.classList.add('lt');
                }
                playerCard.setAttribute('data-player', player.nickname);
                playerCard.setAttribute('data-tier', tier);
                
                // Добавляем обработчик клика СРАЗУ при создании карточки
                playerCard.addEventListener('click', () => openPlayerModal(player));
                
                // Создаем иконку тира
                const tierIcon = document.createElement('div');
                tierIcon.className = 'tier-icon';
                const iconType = tier.startsWith('H') ? 'ht' : 'lt';
                
                // Создаем img элемент без фильтров
                const imgIcon = document.createElement('img');
                imgIcon.src = `icon/${iconType.toUpperCase()}.svg`;
                imgIcon.alt = iconType.toUpperCase();
                
                tierIcon.style.cssText = `
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 16px;
                    height: 16px;
                    z-index: 10;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                    opacity: 1;
                `;
                
                imgIcon.style.cssText = `
                    width: 100%;
                    height: 100%;
                `;
                
                tierIcon.appendChild(imgIcon);
                playerCard.appendChild(tierIcon);
                
                // Создаем текстовый элемент для наведения
                const tierText = document.createElement('div');
                tierText.className = 'tier-text';
                tierText.style.cssText = `
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    color: #7173A6;
                    z-index: 11;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                `;
                tierText.textContent = iconType.toUpperCase();
                playerCard.appendChild(tierText);
                
                // Добавляем обработчики для изменения иконки при наведении
                playerCard.addEventListener('mouseenter', () => {
                    tierIcon.style.opacity = '0';
                    tierText.style.opacity = '1';
                });
                
                playerCard.addEventListener('mouseleave', () => {
                    tierIcon.style.opacity = '1';
                    tierText.style.opacity = '0';
                });
                
                // Предотвращаем всплытие кликов на тирах (если они есть)
                const tierElements = playerCard.querySelectorAll('.tiers');
                tierElements.forEach(tierElement => {
                    tierElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                });

                const cardPlayerInfo = document.createElement('div');
                cardPlayerInfo.className = 'sword-card-player-info';

                const cardAvatar = document.createElement('img');
                cardAvatar.className = 'sword-card-avatar';
                cardAvatar.dataset.playerName = player.nickname;
                cardAvatar.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE1IiB5PSIxNSIgZG9taW5hbnQtYmFzZWxpbmU9Im1iZGRsZSIgdGV4dC1hbmNob3I9Im1iZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTAiPkFWPzwvdGV4dD4KPC9zdmc+';
                cardAvatar.alt = player.nickname;

                const cardName = document.createElement('span');
                cardName.className = 'sword-card-player-name';
                cardName.textContent = player.nickname;

                cardPlayerInfo.appendChild(cardAvatar);
                cardPlayerInfo.appendChild(cardName);

                playerCard.appendChild(cardPlayerInfo);
                
                // Появление из заголовка
                const isMobile = window.innerWidth <= 870;
                playerCard.style.pointerEvents = 'auto';
                if (isMobile) {
                    // На мобильных отключаем анимацию, сразу делаем видимым
                    playerCard.style.opacity = '1';
                    playerCard.style.transform = 'translateY(0)';
                } else {
                    playerCard.style.opacity = '0';
                    playerCard.style.transform = 'translateY(-24px)';
                    // Во время анимации поднимаем слой, чтобы клики не ловил заголовок
                    playerCard.style.zIndex = '3';
                }

                tierContent.appendChild(playerCard);

                // Плавная анимация (только на десктопе). На мобильных клики не блокируем
                if (!isMobile) {
                    const msDelay = Math.round((tierLevel * 0.05 + 0.15 + (index * 0.02)) * 1000);
                    requestAnimationFrame(() => {
                        playerCard.style.transition = 'transform 0.35s ease-out, opacity 0.35s ease-out';
                        playerCard.getBoundingClientRect();
                        setTimeout(() => {
                            playerCard.style.opacity = '1';
                            playerCard.style.transform = 'translateY(0)';
                            const cleanup = () => {
                                playerCard.style.zIndex = '';
                                playerCard.removeEventListener('transitionend', cleanup);
                            };
                            playerCard.addEventListener('transitionend', cleanup);
                        }, msDelay);
                    });
                }

                // Add to intersection observer for lazy loading
                swordImageObserver.observe(cardAvatar);
            });
        }

        // Добавляем контейнер прокрутки в колонку
        tierColumn.appendChild(tierContent);
        contentContainer.appendChild(tierColumn);
    }

    // Добавляем контейнеры в основной элемент
    gridElement.appendChild(headersContainer);
    gridElement.appendChild(contentContainer);
    
    // Размещаем кнопку информации в правом верхнем углу блока категории
    try {
        const categoryBlock = gridElement.closest('.category-block');
        if (categoryBlock && typeof window.attachTierInfoButton === 'function') {
            window.attachTierInfoButton(categoryBlock);
        }
    } catch (e) {
        console.warn('attachTierInfoButton(sword) failed:', e);
    }
    
    // Обработчики кликов теперь добавляются сразу при создании карточек
    // Делегирование событий больше не нужно
}

// Экспорт функции глобально
window.renderTiersGridSword = renderTiersGridSword;

// Main initialization for Sword page
async function initSword() {
    const header = document.getElementById('navigationHeader');
    const preloader = document.getElementById('preloader');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Modal handlers - инициализируем сразу
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const modalClose = document.getElementById('modalClose');
    const playerModal = document.getElementById('playerModal');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileMenu);
    }
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMobileMenu);
    }
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    if (playerModal) {
        playerModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }

    // Show loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }

    // Load data (no limit for Sword page)
    await loadPlayers({ limit: 0 });
    renderTiersGridSword('sword', 'sword-grid');

    // Hide loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    // Fade in content
    document.querySelectorAll('.fade-in').forEach(el => {
        requestAnimationFrame(() => el.classList.add('visible'));
    });

    // Hide preloader immediately
    if (preloader) {
        preloader.classList.add('hidden');
        preloader.remove(); // Убираем задержку
    }

    // Setup navigation
    setupDiscordDropdown();
    setupSearch();
    setupMobileDropdown();

    // Scroll handler
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Start when page loads (only if not in SPA mode)
// Отключено для SPA режима - инициализация происходит в spa.js
// if (window.location.pathname === '/sword.html' || window.location.pathname.endsWith('/sword.html')) {
//     window.addEventListener('load', initSword);
// }