// Use global avatar loader from utils.js

// Intersection Observer for scroll-based loading
const netherpotObserverOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
};

const netherpotImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const playerName = img.dataset.playerName;
            if (playerName && !img.classList.contains('loaded')) {
                avatarLoader.loadAvatar(img, playerName, 30);
            }
            netherpotImageObserver.unobserve(img);
        }
    });
}, netherpotObserverOptions);

function renderTiersGridNetherPot(gridElementId) {
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

    const existing = gridElement.querySelectorAll('.op-tier-header, .op-tier-column');
    if (existing.length > 0) return;

    gridElement.innerHTML = '';

    const headersContainer = document.createElement('div');
    headersContainer.className = 'op-headers-grid';
    const contentContainer = document.createElement('div');
    contentContainer.className = 'op-content-grid';

    for (let tierLevel = 1; tierLevel <= 5; tierLevel++) {
        const tierHeader = document.createElement('div');
        tierHeader.className = `op-tier-header tier-${tierLevel}`;
        tierHeader.textContent = `Tier ${tierLevel}`;
        // Начальное состояние и анимация как на OP
        tierHeader.style.opacity = '0';
        tierHeader.style.transform = 'translateY(-15px) scale(0.95)';
        if (!tierHeader._animationApplied) {
            tierHeader.style.animation = `swordOpHeaderSlideIn 0.3s ease-out`;
            tierHeader.style.animationDelay = `${tierLevel * 0.05}s`;
            tierHeader.style.animationFillMode = 'both';
            tierHeader._animationApplied = true;
        }
        headersContainer.appendChild(tierHeader);

        const tierColumn = document.createElement('div');
        tierColumn.className = 'op-tier-column';
        tierColumn.style.opacity = '0';
        tierColumn.style.transform = 'translateY(20px) scale(0.9)';
        if (!tierColumn._animationApplied) {
            tierColumn.style.animation = `swordOpColumnSlideIn 0.35s ease-out`;
            tierColumn.style.animationDelay = `${tierLevel * 0.05 + 0.08}s`;
            tierColumn.style.animationFillMode = 'both';
            tierColumn._animationApplied = true;
        }

        const mobileTierHeader = document.createElement('div');
        mobileTierHeader.className = `op-tier-header tier-${tierLevel}`;
        mobileTierHeader.textContent = `Tier ${tierLevel}`;
        mobileTierHeader.style.opacity = '0';
        mobileTierHeader.style.transform = 'translateY(-15px) scale(0.95)';
        if (!mobileTierHeader._animationApplied) {
            mobileTierHeader.style.animation = `swordOpHeaderSlideIn 0.3s ease-out`;
            mobileTierHeader.style.animationDelay = `${tierLevel * 0.05}s`;
            mobileTierHeader.style.animationFillMode = 'both';
            mobileTierHeader._animationApplied = true;
        }
        tierColumn.appendChild(mobileTierHeader);

        const tierContent = document.createElement('div');
        tierContent.className = 'op-tier-content';

        const playersInTier = window.playersData.filter(player => {
            const tiers = player.netherpotTiers || [];
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

        if (playersInTier.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-tier-message';
            emptyMessage.textContent = 'Нет игроков';
            emptyMessage.style.cssText = 'text-align: center; padding: 20px; color: rgba(255,255,255,0.5)';
            tierContent.appendChild(emptyMessage);
        } else {
            playersInTier.sort((a, b) => {
                const aTiers = a.netherpotTiers || [];
                const bTiers = b.netherpotTiers || [];
                const aTier = aTiers.find(t => {
                    const tierForComparison = t.startsWith('R') ? t.substring(1) : t;
                    return tierForComparison.endsWith(tierLevel);
                });
                const bTier = bTiers.find(t => {
                    const tierForComparison = t.startsWith('R') ? t.substring(1) : t;
                    return tierForComparison.endsWith(tierLevel);
                });
                if (aTier && bTier) {
                    const aTierClean = aTier.startsWith('R') ? aTier.substring(1) : aTier;
                    const bTierClean = bTier.startsWith('R') ? bTier.substring(1) : bTier;
                    if (aTierClean.startsWith('H') && bTierClean.startsWith('L')) return -1;
                    if (aTierClean.startsWith('L') && bTierClean.startsWith('H')) return 1;
                }
                return (bTiers.reduce((s, t) => {
                    const tierForScore = t.startsWith('R') ? t.substring(1) : t;
                    return s + (tierScores[tierForScore] || 0);
                }, 0) - aTiers.reduce((s, t) => {
                    const tierForScore = t.startsWith('R') ? t.substring(1) : t;
                    return s + (tierScores[tierForScore] || 0);
                }, 0));
            });

            playersInTier.forEach((player, index) => {
                const playerCard = document.createElement('div');
                const tiers = player.netherpotTiers || [];
                const tier = tiers.find(t => {
                    const tierForComparison = t.startsWith('R') ? t.substring(1) : t;
                    return tierForComparison.endsWith(tierLevel);
                });
                const tierClean = tier ? (tier.startsWith('R') ? tier.substring(1) : tier) : '';
                playerCard.className = 'op-player-card';
                if (tierClean && tierClean.startsWith('H')) playerCard.classList.add('ht');
                else if (tierClean && tierClean.startsWith('L')) playerCard.classList.add('lt');
                playerCard.setAttribute('data-player', player.nickname);
                playerCard.setAttribute('data-tier', tierClean || '');
                playerCard.addEventListener('click', () => openPlayerModal(player));
                const isMobile = window.innerWidth <= 870;
                if (isMobile) {
                    playerCard.style.opacity = '1';
                    playerCard.style.transform = 'translateY(0)';
                } else {
                    playerCard.style.opacity = '0';
                    playerCard.style.transform = 'translateY(-24px)';
                }

                // Создаем иконку тира и текст как на OP
                const tierIcon = document.createElement('div');
                tierIcon.className = 'tier-icon';
                const iconType = tierClean.startsWith('H') ? 'ht' : 'lt';

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

                playerCard.addEventListener('mouseenter', () => {
                    tierIcon.style.opacity = '0';
                    tierText.style.opacity = '1';
                });
                playerCard.addEventListener('mouseleave', () => {
                    tierIcon.style.opacity = '1';
                    tierText.style.opacity = '0';
                });

                const cardPlayerInfo = document.createElement('div');
                cardPlayerInfo.className = 'op-card-player-info';
                const cardAvatar = document.createElement('img');
                cardAvatar.className = 'op-card-avatar';
                cardAvatar.dataset.playerName = player.nickname;
                cardAvatar.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE1IiB5PSIxNSIgZG9taW5hbnQtYmFzZWxpbmU9Im1iZGRsZSIgdGV4dC1hbmNob3I9Im1iZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTAiPkFWPzwvdGV4dD4KPC9zdmc+';
                cardAvatar.alt = player.nickname;
                const cardName = document.createElement('span');
                cardName.className = 'op-card-player-name';
                cardName.textContent = player.nickname;
                cardPlayerInfo.appendChild(cardAvatar);
                cardPlayerInfo.appendChild(cardName);
                playerCard.appendChild(cardPlayerInfo);

                tierContent.appendChild(playerCard);
                // Плавная анимация без keyframes: сдвиг из-под заголовка вниз
                const msDelay = Math.round((tierLevel * 0.05 + 0.15 + (index * 0.02)) * 1000);
                if (!isMobile) {
                    requestAnimationFrame(() => {
                        playerCard.style.transition = 'transform 0.28s ease-out, opacity 0.28s ease-out';
                        setTimeout(() => {
                            playerCard.style.opacity = '1';
                            playerCard.style.transform = 'translateY(0)';
                        }, msDelay);
                    });
                }
                netherpotImageObserver.observe(cardAvatar);
            });
        }

        tierColumn.appendChild(tierContent);
        contentContainer.appendChild(tierColumn);
    }

    gridElement.appendChild(headersContainer);
    gridElement.appendChild(contentContainer);
    
    // Размещаем кнопку информации в правом верхнем углу блока категории
    try {
        const categoryBlock = gridElement.closest('.category-block');
        if (categoryBlock && typeof window.attachTierInfoButton === 'function') {
            window.attachTierInfoButton(categoryBlock);
        }
    } catch (e) {
        console.warn('attachTierInfoButton(netherpot) failed:', e);
    }
}

window.renderTiersGridNetherPot = renderTiersGridNetherPot;

async function initNetherPot() {
    const header = document.getElementById('navigationHeader');
    const preloader = document.getElementById('preloader');
    const loadingIndicator = document.getElementById('loadingIndicator');

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const modalClose = document.getElementById('modalClose');
    const playerModal = document.getElementById('playerModal');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMobileMenu);
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (playerModal) {
        playerModal.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
    }

    if (loadingIndicator) loadingIndicator.style.display = 'flex';

    await loadPlayers({ limit: 0 });
    renderTiersGridNetherPot('netherpot-grid');

    if (loadingIndicator) loadingIndicator.style.display = 'none';

    document.querySelectorAll('.fade-in').forEach(el => {
        requestAnimationFrame(() => el.classList.add('visible'));
    });

    if (preloader) {
        preloader.classList.add('hidden');
        preloader.remove();
    }

    setupDiscordDropdown();
    setupSearch();
    setupMobileDropdown();

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });
}

// Отключено для SPA режима - инициализация происходит в spa.js
// if (window.location.pathname === '/netherpot.html' || window.location.pathname.endsWith('/netherpot.html')) {
//     window.addEventListener('load', initNetherPot);
// }


