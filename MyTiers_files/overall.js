// Use global avatar loader from utils.js

// Intersection Observer for scroll-based loading
const overallObserverOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
};

const overallImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const playerName = img.dataset.playerName;
            if (playerName && !img.classList.contains('loaded')) {
                avatarLoader.loadAvatar(img, playerName, 40);
            }
            overallImageObserver.unobserve(img);
        }
    });
}, overallObserverOptions);

// Modified renderOverallCards with lazy loading
function renderOverallCards() {
    console.log('renderOverallCards called');
    
    // Защита от множественных одновременных вызовов
    if (window.isRenderingOverall) {
        console.log('renderOverallCards already in progress, skipping');
        return;
    }
    window.isRenderingOverall = true;
    // Ищем в основном DOM и в SPA контейнере
    let cardsContainer = document.getElementById('overall-cards-container');
    if (!cardsContainer) {
        const routeView = document.getElementById('routeView');
        if (routeView) {
            cardsContainer = routeView.querySelector('#overall-cards-container');
        }
    }
    
    if (!cardsContainer) {
        console.error('overall-cards-container not found');
        window.isRenderingOverall = false;
        return;
    }
    cardsContainer.innerHTML = '';

    console.log('playersData:', window.playersData);
    if (!window.playersData || window.playersData.length === 0) {
        console.log('No players data available');
        window.isRenderingOverall = false;
        return;
    }

    window.playersData.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.setAttribute('role', 'button');
        card.setAttribute('aria-haspopup', 'dialog');
        
        card.addEventListener('click', () => openPlayerModal(player));

        // Определяем фон для ранга
        let backgroundImage = 'assets/back4.svg'; // по умолчанию
        if (index === 0) backgroundImage = 'assets/back1.svg';
        else if (index === 1) backgroundImage = 'assets/back2.svg';
        else if (index === 2) backgroundImage = 'assets/back3.svg';

        card.innerHTML = `
            <div class="player-content">
                <!-- Левая часть - ранг и аватар -->
                <div class="player-rank-section">
                    <div class="rank-badge">
                        <img class="rank-bg" alt="rank background" src="${backgroundImage}">
                        <h1 class="rank-number">${index + 1}.</h1>
                        <img width="60" height="60" loading="eager" alt="${player.nickname}'s Skin" class="player-avatar"
                            src="" data-src="https://render.crafty.gg/3d/bust/${player.nickname}">
                    </div>
                    
                    <!-- Информация игрока -->
                    <div class="player-info">
                        <h2 class="player-name">${player.nickname}</h2>
                        <div class="player-title">
                            <img width="16" height="16" alt="points" src="assets/points.svg" class="points-icon">
                            <span class="points">Количество очков: <span class="points-num">${player.overallScore}</span></span>
                        </div>
                    </div>
                </div>

                <!-- Правая часть - тиры -->
                <div class="player-stats">
                    <div class="tiers-section">
                        <h3 class="tiers-label">Tiers</h3>
                        <div class="tiers-container">
                            ${generateTierItems(player)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Начальное невидимое состояние до добавления в DOM
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px) scale(0.9)';

        cardsContainer.appendChild(card);

        // Применяем анимацию появления с небольшим каскадом
        if (!card._animationApplied) {
            card.classList.add('animating');
            card.style.animation = 'none';
            card.style.transition = 'none';
            card.offsetHeight; // reflow
            const animationDelay = 0.12 + (index * 0.02);
            card.style.animation = `swordOpCardSlideIn 0.3s ease-out`;
            card.style.animationDelay = `${animationDelay}s`;
            card.style.animationFillMode = 'both';
            card._animationApplied = true;
            card.addEventListener('animationend', () => {
                card.classList.remove('animating');
                // Очистим инлайновые стили, чтобы не мешать hover-транзишенам
                card.style.opacity = '';
                card.style.transform = '';
                card.style.animation = '';
                card.style.animationDelay = '';
                card.style.animationFillMode = '';
                card.style.transition = '';
            }, { once: true });
        }

        // Добавляем обработчики кликов для тиров (предотвращаем всплытие)
        const tierElements = card.querySelectorAll('.tiers');
        tierElements.forEach(tierElement => {
            tierElement.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Add to intersection observer for lazy loading
        const avatar = card.querySelector('.player-avatar');
        avatar.dataset.playerName = player.nickname;
        // скелетон состояние до загрузки
        avatar.style.opacity = '0.0';
        // lazy через IntersectionObserver
        overallImageObserver.observe(avatar);
        // загрузка изображения
        const src = avatar.getAttribute('data-src');
        const img = new Image();
        img.onload = () => {
            avatar.src = src;
            requestAnimationFrame(() => avatar.style.opacity = '1');
            avatar.classList.add('loaded');
        };
        img.onerror = () => {
            // заглушка: инициалы
            const initials = (player.nickname || '?').slice(0, 2).toUpperCase();
            const canvas = document.createElement('canvas');
            canvas.width = 60; canvas.height = 60;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1d2030';
            ctx.fillRect(0,0,60,60);
            ctx.fillStyle = '#ffe65f';
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(initials, 30, 32);
            avatar.src = canvas.toDataURL('image/png');
            requestAnimationFrame(() => avatar.style.opacity = '1');
            avatar.classList.add('loaded');
        };
        img.src = src;
    });
    
    // Добавляем кнопку информации в правом верхнем углу блока категории (внешний контейнер)
    try {
        const categoryBlock = cardsContainer.closest('.category-block');
        if (categoryBlock && typeof window.attachTierInfoButton === 'function') {
            window.attachTierInfoButton(categoryBlock);
        }
    } catch (e) {
        console.warn('attachTierInfoButton(overall) failed:', e);
    }

    // Сбрасываем флаг рендеринга
    window.isRenderingOverall = false;
}

// Функция для генерации элементов тиров
function generateTierItems(player) {
    let tierItems = '';
    const tierDisplayOrder = ['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'];
    const orderIndex = tierDisplayOrder.reduce((acc, t, i) => { acc[t] = i; return acc; }, {});

    const hasSwordTiers = Array.isArray(player.swordTiers) && player.swordTiers.length > 0 && !player.swordTiers.includes('Restricted');
    const hasOpTiers = Array.isArray(player.opTiers) && player.opTiers.length > 0 && !player.opTiers.includes('Restricted');
    const hasNetherpotTiers = Array.isArray(player.netherpotTiers) && player.netherpotTiers.length > 0 && !player.netherpotTiers.includes('Restricted');

    // Собираем все реальные тиры в единый список и сортируем по силе тира
    const collected = [];
    if (hasSwordTiers) player.swordTiers.forEach(t => collected.push({ tier: t, cat: 'sword', retired: t.startsWith('R') }));
    if (hasOpTiers) player.opTiers.forEach(t => collected.push({ tier: t, cat: 'op', retired: t.startsWith('R') }));
    if (hasNetherpotTiers) player.netherpotTiers.forEach(t => collected.push({ tier: t, cat: 'netherpot', retired: t.startsWith('R') }));

    collected.sort((a, b) => {
        // Remove 'R' prefix for sorting
        const tierA = a.tier.startsWith('R') ? a.tier.substring(1) : a.tier;
        const tierB = b.tier.startsWith('R') ? b.tier.substring(1) : b.tier;
        return (orderIndex[tierA] ?? 999) - (orderIndex[tierB] ?? 999);
    });

    // Рендерим реальные тиры в нужном порядке
    collected.forEach(({ tier, cat, retired }) => {
        // Remove 'R' prefix for score calculation
        const tierForScore = retired ? tier.substring(1) : tier;
        const tierScore = window.tierScores[tierForScore] || 0;
        const tierClass = retired ? `tiers ${tier} retired` : `tiers ${tier}`;
        const icon = cat === 'sword' ? 'icon/sword.png' : (cat === 'op' ? 'icon/OP.png' : 'icon/NETHERPOT.svg');
        tierItems += `
            <div class="${tierClass}">
                <div class="circle-container">
                    <img src="${icon}" alt="" class="circle-image">
                </div>
                <div class="tier-container">
                    <div class="tier">${tier}</div>
                </div>
                <div class="tier-tooltip" data-tier="${tierForScore}">${tierScore} очков</div>
            </div>
        `;
    });

    // Добавляем пустые плейсхолдеры для отсутствующих категорий в самом конце
    if (!hasSwordTiers) tierItems += `
        <div class="tiers empty">
            <div class="circle-container">
                <img src="icon/empty.png" alt="" class="circle-image">
            </div>
            <div class="tier-container">
                <div class="tier">—</div>
            </div>
            <div class="tier-tooltip" data-tier="—">Нет тиров</div>
        </div>
    `;
    if (!hasOpTiers) tierItems += `
        <div class="tiers empty">
            <div class="circle-container">
                <img src="icon/empty.png" alt="" class="circle-image">
            </div>
            <div class="tier-container">
                <div class="tier">—</div>
            </div>
            <div class="tier-tooltip" data-tier="—">Нет тиров</div>
        </div>
    `;
    if (!hasNetherpotTiers) tierItems += `
        <div class="tiers empty">
            <div class="circle-container">
                <img src="icon/empty.png" alt="" class="circle-image">
            </div>
            <div class="tier-container">
                <div class="tier">—</div>
            </div>
            <div class="tier-tooltip" data-tier="—">Нет тиров</div>
        </div>
    `;

    return tierItems;
}

// Экспорт функции глобально
window.renderOverallCards = renderOverallCards;
console.log('overall.js loaded, renderOverallCards exported:', typeof window.renderOverallCards);

// Main initialization for Overall page
async function initOverall() {
    const header = document.getElementById('navigationHeader');
    const preloader = document.getElementById('preloader');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Show loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }

    // Load data
    await loadPlayers();
    renderOverallCards();

    // Hide loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    // Fade in content
    document.querySelectorAll('.fade-in').forEach(el => {
        requestAnimationFrame(() => el.classList.add('visible'));
    });

    // Hide preloader
    if (preloader) {
        preloader.classList.add('hidden');
        setTimeout(() => preloader.remove(), 400);
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

    // Modal handlers
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
}

// Start when page loads (only if not in SPA mode)
// Отключено для SPA режима - инициализация происходит в spa.js
// if (window.location.pathname === '/overall.html' || window.location.pathname.endsWith('/overall.html')) {
//     window.addEventListener('load', initOverall);
// }