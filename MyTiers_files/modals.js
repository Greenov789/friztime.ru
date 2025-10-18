// Функция для открытия модального окна для полностью Restricted игроков
function openRestrictedPlayerModal(playerName) {
    const modal = document.getElementById('playerModal');
    const modalAvatar = document.getElementById('modalAvatar');
    // Оборачиваем аватарку для стабильного центрирования спиннера
    if (modalAvatar && !modalAvatar.parentElement.classList.contains('modal-avatar-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'modal-avatar-wrap';
        modalAvatar.parentElement.insertBefore(wrap, modalAvatar);
        wrap.appendChild(modalAvatar);
    }
    const modalPlayerName = document.getElementById('modalPlayerName');
    const modalTiers = document.getElementById('modalTiers');
    const modalRank = document.getElementById('modalRank');
    const modalScore = document.getElementById('modalScore');

    // Загружаем аватарку без мерцания предыдушего
    const avatarUrl = `https://render.crafty.gg/3d/bust/${playerName}`;
    loadModalAvatar(modalAvatar, avatarUrl, playerName);
    modalPlayerName.textContent = playerName;
    // сохраняем ник для кнопки share
    modal.dataset.nickname = playerName;

    // Скрываем позицию и очки
    if (modalRank) {
        modalRank.textContent = '';
        modalRank.style.display = 'none';
    }
    if (modalScore) {
        modalScore.textContent = '';
        modalScore.style.display = 'none';
    }
    
    // Скрываем весь блок с позицией (если есть)
    const modalPositionSection = document.querySelector('.modal-position-section');
    if (modalPositionSection) {
        modalPositionSection.style.display = 'none';
    }

    // Очищаем предыдущие тиры и показываем плашку Restricted
    modalTiers.innerHTML = `
        <div class="restricted-player-badge">
            <div class="restricted-text">Restricted</div>
        </div>
    `;

    // Обновляем метатеги для Discord embed
    updateMetaTags({ nickname: playerName });

    // Показываем модальное окно
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Обновляем URL, чтобы при перезагрузке модалка открылась снова
    try {
        const url = new URL(window.location.href);
        url.searchParams.set('player', playerName);
        history.replaceState(history.state || {}, '', url.toString());
    } catch (e) {
        console.warn('Failed to update URL for restricted player modal:', e);
    }
}

// Функция для проверки, должен ли игрок иметь градиентный никнейм
function shouldHaveGradientNickname(playerName, playerRank) {
    // Проверяем, является ли игрок топ-3 или shwedxhardy или Vespeeks
    return (playerRank && playerRank <= 3) || 
           playerName.toLowerCase() === 'shwedxhardy' || 
           playerName.toLowerCase() === 'vespeeks';
}

// Функция для открытия модального окна с информацией об игроке
function openPlayerModal(player) {
    const modal = document.getElementById('playerModal');
    
    // Проверяем существование модального окна
    if (!modal) {
        console.error('playerModal element not found');
        return;
    }
    
    const modalAvatar = document.getElementById('modalAvatar');
    // Оборачиваем аватарку для стабильного центрирования спиннера
    if (modalAvatar && !modalAvatar.parentElement.classList.contains('modal-avatar-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'modal-avatar-wrap';
        modalAvatar.parentElement.insertBefore(wrap, modalAvatar);
        wrap.appendChild(modalAvatar);
    }
    const modalPlayerName = document.getElementById('modalPlayerName');
    const modalTiers = document.getElementById('modalTiers');
    const modalRank = document.getElementById('modalRank');
    const modalScore = document.getElementById('modalScore');

    // Загружаем аватарку без мерцания предыдушего
    const avatarUrl = `https://render.crafty.gg/3d/bust/${player.nickname}`;
    loadModalAvatar(modalAvatar, avatarUrl, player.nickname);
    
    // Добавляем звезду для специального игрока
    if (player.nickname === 'shwedxhardy') {
        modalPlayerName.innerHTML = '<span class="star-icon">★</span> ' + player.nickname;
    } else {
        modalPlayerName.textContent = player.nickname;
    }
    // сохраняем ник для кнопки share
    modal.dataset.nickname = player.nickname;

    // Находим позицию игрока в общем рейтинге устойчиво (по overallScore)
    async function computeOverallRankByScore(targetName) {
        try {
            // Сначала пробуем найти в текущих данных
            const list = Array.isArray(window.playersData) ? window.playersData.slice() : [];
            if (list.length > 0) {
                list.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
                const idx = list.findIndex(p => p && p.nickname === targetName);
                if (idx >= 0) return idx + 1;
            }
            
            // Если не найден в текущих данных, загружаем все игроков для точного ранга
            try {
                const response = await fetch('/api/get_players.php?limit=0', { cache: 'no-store' });
                const data = await response.json();
                if (data.success && data.players && Array.isArray(data.players)) {
                    const allPlayers = data.players.slice();
                    allPlayers.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
                    const idx = allPlayers.findIndex(p => p && p.nickname === targetName);
                    return idx >= 0 ? idx + 1 : null;
                }
            } catch (apiError) {
                console.warn('Failed to fetch all players for ranking:', apiError);
            }
            
            return null;
        } catch (e) {
            return null;
        }
    }

    let rank = Number.isFinite(player.rank) && player.rank > 0 ? player.rank : null;
    if (!rank) {
        // пробуем найти по текущему списку
        const foundByIndex = (Array.isArray(window.playersData) ? window.playersData.findIndex(p => p && p.nickname === player.nickname) : -1);
        rank = foundByIndex >= 0 ? (foundByIndex + 1) : null;
    }
    
    // Если ранг не найден, показываем временный прочерк и вычисляем асинхронно
    if (!rank) {
        rank = '—';
        // Асинхронно вычисляем ранг и обновляем
        computeOverallRankByScore(player.nickname).then(computedRank => {
            if (computedRank && computedRank !== '—') {
                modalRank.textContent = `${computedRank}.`;
            }
        }).catch(e => {
            console.warn('Failed to compute rank:', e);
        });
    }

    // Получаем очки игрока (может быть undefined при поиске)
    let playerScore = player.overallScore || 0;
    
    // Если очки не предоставлены, вычисляем их на основе тиров
    if (!player.overallScore && (player.swordTiers || player.opTiers || player.netherpotTiers)) {
        let score = 0;
        
        // Добавляем очки только если тир НЕ Restricted
        if (player.swordTiers) {
            score += player.swordTiers.reduce((sum, tier) => {
                if (tier === 'Restricted') return sum;
                // Remove 'R' prefix for retired tiers when calculating score
                const tierForScore = tier.startsWith('R') ? tier.substring(1) : tier;
                return sum + (tierScores[tierForScore] || 0);
            }, 0);
        }
        
        if (player.opTiers) {
            score += player.opTiers.reduce((sum, tier) => {
                if (tier === 'Restricted') return sum;
                // Remove 'R' prefix for retired tiers when calculating score
                const tierForScore = tier.startsWith('R') ? tier.substring(1) : tier;
                return sum + (tierScores[tierForScore] || 0);
            }, 0);
        }
        
        if (player.netherpotTiers) {
            score += player.netherpotTiers.reduce((sum, tier) => {
                if (tier === 'Restricted') return sum;
                // Remove 'R' prefix for retired tiers when calculating score
                const tierForScore = tier.startsWith('R') ? tier.substring(1) : tier;
                return sum + (tierScores[tierForScore] || 0);
            }, 0);
        }
        
        playerScore = score;
    }
    
    // Применяем градиент к никнейму если нужно
    if (shouldHaveGradientNickname(player.nickname, rank)) {
        modalPlayerName.classList.add('gradient-nickname');
    } else {
        modalPlayerName.classList.remove('gradient-nickname');
    }
    
    // Проверяем существование элементов перед их использованием
    if (modalRank) {
        modalRank.textContent = `${rank}.`;
    }
    if (modalScore) {
        modalScore.textContent = `(${playerScore} очков)`;
    }
    
    // Обновляем фоновое изображение в зависимости от позиции
    const positionBackground = document.querySelector('.position-background');
    if (positionBackground) {
        const numericRank = parseInt(rank, 10);
        let backgroundImage = 'assets/back4.svg';
        if (!isNaN(numericRank) && numericRank >= 1) {
            if (numericRank === 1 || numericRank === 2 || numericRank === 3) {
                backgroundImage = `assets/back${numericRank}.svg`;
            } else {
                backgroundImage = 'assets/back4.svg';
            }
        }
        positionBackground.src = backgroundImage;
    }
    
    // Оставляем текст категории всегда как "OVERALL"
    const categoryText = document.querySelector('.position-category');
    if (categoryText) {
        categoryText.textContent = 'OVERALL';
    }

    // Очищаем предыдущие тиры
    modalTiers.innerHTML = '';


    // Проверяем наличие тиров в каждой категории
    const tierDisplayOrder = ['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'];
    const orderIndex = tierDisplayOrder.reduce((acc, t, i) => { acc[t] = i; return acc; }, {});
    const hasSwordTiers = player.swordTiers && player.swordTiers.length > 0 && !player.swordTiers.includes('Restricted');
    const hasOpTiers = player.opTiers && player.opTiers.length > 0 && !player.opTiers.includes('Restricted');
    const hasNetherpotTiers = player.netherpotTiers && player.netherpotTiers.length > 0 && !player.netherpotTiers.includes('Restricted');

    // Собираем и рендерим в общем порядке
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

    collected.forEach(({ tier, cat, retired }) => {
            const tierBadge = document.createElement('div');
            const tierClass = retired ? `tiers ${tier} retired` : `tiers ${tier}`;
            tierBadge.className = tierClass;
            // Remove 'R' prefix for score calculation
            const tierForScore = retired ? tier.substring(1) : tier;
            const tierScore = window.tierScores[tierForScore] || 0;
            const icon = cat === 'sword' ? 'icon/sword.png' : (cat === 'op' ? 'icon/OP.png' : 'icon/NETHERPOT.svg');
            tierBadge.innerHTML = `
                <div class="circle-container">
                    <img src="${icon}" alt="" class="circle-image">
                </div>
                <div class="tier-container">
                    <div class="tier">${tier}</div>
                </div>
                <div class="tier-tooltip" data-tier="${tierForScore}">${tierScore} очков</div>
            `;
            
            // Добавляем поддержку touch событий для мобильных устройств
            tierBadge.addEventListener('touchstart', (e) => {
                e.preventDefault();
                tierBadge.classList.add('touched');
            });
            
            tierBadge.addEventListener('touchend', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    tierBadge.classList.remove('touched');
                }, 2000);
            });
            
            modalTiers.appendChild(tierBadge);
    });

    // 4. Пустые плашки для отсутствующих категорий (всегда после имеющихся тиров)
    if (!hasSwordTiers) {
        const emptyBadge = document.createElement('div');
        emptyBadge.className = 'tiers empty';
        emptyBadge.innerHTML = `
            <div class="circle-container">
                <img src="icon/empty.png" alt="" class="circle-image">
            </div>
            <div class="tier-container">
                <div class="tier">—</div>
            </div>
            <div class="tier-tooltip" data-tier="—">Нет тиров</div>
        `;
        
        modalTiers.appendChild(emptyBadge);
    }

    if (!hasOpTiers) {
        const emptyBadge = document.createElement('div');
        emptyBadge.className = 'tiers empty';
        emptyBadge.innerHTML = `
            <div class="circle-container">
                <img src="icon/empty.png" alt="" class="circle-image">
            </div>
            <div class="tier-container">
                <div class="tier">—</div>
            </div>
            <div class="tier-tooltip" data-tier="—">Нет тиров</div>
        `;
        
        modalTiers.appendChild(emptyBadge);
    }

    if (!hasNetherpotTiers) {
        const emptyBadge = document.createElement('div');
        emptyBadge.className = 'tiers empty';
        emptyBadge.innerHTML = `
            <div class="circle-container">
                <img src="icon/empty.png" alt="" class="circle-image">
            </div>
            <div class="tier-container">
                <div class="tier">—</div>
            </div>
            <div class="tier-tooltip" data-tier="—">Нет тиров</div>
        `;
        
        modalTiers.appendChild(emptyBadge);
    }

    // Обновляем метатеги для Discord embed
    updateMetaTags(player);

    // Показываем модальное окно (без анимаций появления)
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    const modalContent = modal.querySelector('.modal-content');
    const modalHeader = modal.querySelector('.modal-header');
    const modalClose = modal.querySelector('.modal-close');
    const modalSections = modal.querySelectorAll('.modal-position-section, .modal-tiers-section');
    if (modalContent) { modalContent.style.animation = 'none'; modalContent.style.transition = 'none'; }
    if (modalHeader) { modalHeader.style.animation = 'none'; modalHeader.style.transition = 'none'; }
    if (modalClose) { modalClose.style.animation = 'none'; modalClose.style.transition = 'none'; }
    modalSections.forEach(section => { section.style.animation = 'none'; section.style.transition = 'none'; });
    
    // Обновляем URL, чтобы при перезагрузке модалка открылась снова
    try {
        const url = new URL(window.location.href);
        url.searchParams.set('player', player.nickname);
        history.replaceState(history.state || {}, '', url.toString());
    } catch (e) {
        console.warn('Failed to update URL for player modal:', e);
    }
}

// Предзагрузка аватарки для модалки с плавной подменой без мерцания предыдущего изображения
function loadModalAvatar(imgElement, url, altText = '') {
    if (!imgElement) return;
    try {
        // Помечаем как загрузку и скрываем текущую картинку до готовности новой
        imgElement.classList.add('loading');
        imgElement.crossOrigin = 'anonymous';
        // Прячем alt-текст на время загрузки
        const originalAlt = imgElement.getAttribute('alt') || '';
        imgElement.setAttribute('data-original-alt', originalAlt);
        imgElement.alt = '';
        // Ставим полностью прозрачный плейсхолдер, чтобы не мелькала старая аватарка
        // Оставляем текущий src, просто скрываем (не меняем размер/поток) — предотвращает смещение спиннера
        // imgElement.src = transparentPlaceholder; // не трогаем src, чтобы не было перерисовки контейнера

        // Показать локальный спиннер в области аватара (жёстко центрированный обёрткой)
        const wrapper = imgElement.closest('.modal-avatar-wrap') || imgElement.parentElement;
        if (wrapper) {
            // Включаем кольцевую анимацию на обёртке
            wrapper.classList.add('loading');
        }
        const loader = new Image();
        loader.crossOrigin = 'anonymous';
        // Добавляем cache-busting параметр, чтобы избежать задержек из-за кэша CDN
        const u = new URL(url, window.location.origin);
        u.searchParams.set('t', Date.now());
        loader.onload = function () {
            // Только после полной загрузки подменяем src
            imgElement.src = u.toString();
            // даём браузеру применить src, затем показываем
            requestAnimationFrame(() => {
                imgElement.classList.remove('loading');
                // Вернём alt-текст
                imgElement.alt = altText || imgElement.getAttribute('data-original-alt') || '';
                const wrapper = imgElement.closest('.modal-avatar-wrap') || imgElement.parentElement;
                if (wrapper) {
                    wrapper.classList.remove('loading');
                }
            });
        };
        loader.onerror = function () {
            imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1iZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiPkFWPzwvdGV4dD4KPC9zdmc+';
            imgElement.classList.remove('loading');
            imgElement.alt = altText || imgElement.getAttribute('data-original-alt') || '';
            const wrapper = imgElement.closest('.modal-avatar-wrap') || imgElement.parentElement;
            if (wrapper) {
                wrapper.classList.remove('loading');
            }
        };
        loader.src = u.toString();
    } catch (e) {
        // В случае ошибки сразу показываем заглушку
        imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1iZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiPkFWPzwvdGV4dD4KPC9zdmc+';
        imgElement.classList.remove('loading');
    }
}

// Функция для закрытия модального окна
function closeModal() {
    const modal = document.getElementById('playerModal');
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
    
    // Восстанавливаем исходное название страницы и описание
    document.title = 'MyTiers';
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
        descMeta.setAttribute('content', 'Лучший Minecraft тир-лист России');
    }
    
    // Восстанавливаем исходные метатеги для социальных сетей
    const metaTags = [
        { property: 'og:title', content: 'MyTiers' },
        { property: 'og:description', content: 'Прокачивай скилл, соревнуйся с другими игроками и докажи свой скилл! Наша сеть тирлистов позволяет отслеживать прогресс и бросать вызов сообществу.' },
        { property: 'og:image', content: 'https://mytiers.ru/icon/OVERALL.png' },
        { property: 'og:url', content: 'https://mytiers.ru/' },
        { name: 'twitter:title', content: 'MyTiers' },
        { name: 'twitter:description', content: 'Прокачивай скилл, соревнуйся с другими игроками и докажи свой скилл! Наша сеть тирлистов позволяет отслеживать прогресс и бросать вызов сообществу.' },
        { name: 'twitter:image', content: 'https://mytiers.ru/icon/OVERALL.png' }
    ];

    metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${tag.property || tag.name}"]`);
        if (meta) {
            meta.setAttribute('content', tag.content);
        }
    });

    // Удаляем параметр player из URL, чтобы не открывать модалку после перезагрузки
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete('player');
        history.replaceState(history.state || {}, '', url.pathname + url.search + url.hash);
    } catch (e) {
        console.warn('Failed to clean URL after closing modal:', e);
    }
}

// Функция для обновления метатегов Discord embed
function updateMetaTags(player) {
    const nickname = player.nickname;
    const avatarUrl = `https://render.crafty.gg/3d/bust/${nickname}?size=400&format=png`;
    const currentUrl = `${window.location.origin}/?player=${encodeURIComponent(nickname)}`;
    
    // Генерируем описание тиров
    const tierDescriptions = [];
    if (player.swordTiers && player.swordTiers.length > 0) {
        tierDescriptions.push('Sword: ' + player.swordTiers.join(', '));
    }
    if (player.opTiers && player.opTiers.length > 0) {
        tierDescriptions.push('OP: ' + player.opTiers.join(', '));
    }
    if (player.netherpotTiers && player.netherpotTiers.length > 0) {
        tierDescriptions.push('NetherPot: ' + player.netherpotTiers.join(', '));
    }
    
    const description = tierDescriptions.length > 0 
        ? 'Тиры: ' + tierDescriptions.join(' | ')
        : 'Игрок в MyTiers';

    // Обновляем или создаём метатеги
    const metaTags = [
        { property: 'og:title', content: `${nickname} — MyTiers` },
        { property: 'og:description', content: description },
        { property: 'og:image', content: avatarUrl },
        { property: 'og:url', content: currentUrl },
        { name: 'twitter:title', content: `${nickname} — MyTiers` },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: avatarUrl }
    ];

    metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${tag.property || tag.name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            if (tag.property) {
                meta.setAttribute('property', tag.property);
            } else {
                meta.setAttribute('name', tag.name);
            }
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
    });

    // Обновляем title и description
    document.title = `${nickname} — MyTiers`;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
        descMeta.setAttribute('content', description);
    }
}

// Toast уведомления
function showToast(message, type = 'info', duration = 3000) {
    // Создаём контейнер для стека, если его нет
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Ограничиваем количество видимых уведомлений
    const maxToasts = 4;
    const toasts = Array.from(container.querySelectorAll('.toast'));
    if (toasts.length >= maxToasts) {
        // Удаляем самый старый (первый)
        const oldest = toasts[0];
        oldest.classList.remove('show');
        setTimeout(() => oldest.remove(), 250);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Анимация появления
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Автоудаление
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 250);
    }, duration);
}

// Скриншот модального окна
(function initModalScreenshot() {
    const btn = document.getElementById('modalScreenshotBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        try {
            const modal = document.getElementById('playerModal');
            const content = modal ? modal.querySelector('.modal-content') : null;
            if (!content) {
                showToast('Ошибка: модальное окно не найдено', 'error');
                return;
            }

            showToast('Создаём скриншот...', 'info', 2000);

            // Отключаем анимации/тени на время снимка для стабильности
            const prevBoxShadow = content.style.boxShadow;
            content.style.boxShadow = 'none';

            // Скрываем все кнопки в модальном окне для скриншота
            const buttons = content.querySelectorAll('button');
            const buttonStyles = [];
            buttons.forEach((btn, index) => {
                buttonStyles[index] = btn.style.display;
                btn.style.display = 'none';
            });

            // Делаем градиентные никнеймы белыми для скриншота
            const gradientNicknames = content.querySelectorAll('.gradient-nickname');
            const gradientStyles = [];
            gradientNicknames.forEach((element, index) => {
                // Сохраняем текущие стили
                gradientStyles[index] = {
                    background: element.style.background,
                    backgroundClip: element.style.backgroundClip,
                    webkitBackgroundClip: element.style.webkitBackgroundClip,
                    webkitTextFillColor: element.style.webkitTextFillColor,
                    color: element.style.color,
                    animation: element.style.animation
                };
                
                // Устанавливаем белый цвет для скриншота
                element.style.background = 'none';
                element.style.backgroundClip = 'initial';
                element.style.webkitBackgroundClip = 'initial';
                element.style.webkitTextFillColor = 'initial';
                element.style.color = 'white';
                element.style.animation = 'none';
            });

            const options = { 
                backgroundColor: null, 
                useCORS: true, 
                scale: 2,
                allowTaint: true,
                logging: false,
                width: content.offsetWidth,
                height: content.offsetHeight
            };
            const canvas = await (window.html2canvas ? window.html2canvas(content, options) : null);
            
            // Восстанавливаем отображение кнопок
            buttons.forEach((btn, index) => {
                btn.style.display = buttonStyles[index];
            });
            
            // Восстанавливаем градиентные стили
            gradientNicknames.forEach((element, index) => {
                if (gradientStyles[index]) {
                    const styles = gradientStyles[index];
                    element.style.background = styles.background;
                    element.style.backgroundClip = styles.backgroundClip;
                    element.style.webkitBackgroundClip = styles.webkitBackgroundClip;
                    element.style.webkitTextFillColor = styles.webkitTextFillColor;
                    element.style.color = styles.color;
                    element.style.animation = styles.animation;
                }
            });
            
            content.style.boxShadow = prevBoxShadow;
            
            if (!canvas) {
                showToast('Ошибка: не удалось создать скриншот', 'error');
                return;
            }

            canvas.toBlob((blob) => {
                if (!blob) {
                    showToast('Ошибка: не удалось сохранить скриншот', 'error');
                    return;
                }
                const a = document.createElement('a');
                const url = URL.createObjectURL(blob);
                a.href = url;
                const ts = new Date().toISOString().replace(/[:.]/g, '-');
                a.download = `mytiers-modal-${ts}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                showToast('Скриншот сохранён!', 'success');
            }, 'image/png');
        } catch (e) {
            console.warn('Failed to capture modal screenshot:', e);
            showToast('Ошибка при создании скриншота', 'error');
        }
    });
})();

// Поделиться ссылкой на профиль из модалки
(function initModalShare() {
    const btn = document.getElementById('modalShareBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        try {
            const modal = document.getElementById('playerModal');
            const nickname = modal && modal.dataset ? modal.dataset.nickname : '';
            if (!nickname) {
                showToast('Ошибка: никнейм не найден', 'error');
                return;
            }

            // Формируем ссылку на профиль
            const base = window.location.origin;
            const url = `${base}/?player=${encodeURIComponent(nickname)}`;

            // Если доступен Web Share API — используем его
            if (navigator.share) {
                try {
                    // Даже при наличии Web Share API копируем текст и показываем единое уведомление
                    const textToCopy = `Посмотри профиль ${nickname} на сайте MyTiers - ${url}`;
                    await navigator.clipboard.writeText(textToCopy);
                    showToast('Ссылка успешно скопирована!', 'success');
                    return;
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        console.warn('Share API/Clipboard error:', e);
                    }
                }
            }

            // Fallback — копируем ссылку в буфер обмена
            try {
                const textToCopy = `Посмотри профиль ${nickname} на сайте MyTiers - ${url}`;
                await navigator.clipboard.writeText(textToCopy);
                showToast('Ссылка успешно скопирована!', 'success');
            } catch (clipboardError) {
                console.warn('Clipboard API error:', clipboardError);
                showToast('Ошибка: не удалось скопировать ссылку', 'error');
            }
        } catch (e) {
            console.warn('Failed to share profile link:', e);
            showToast('Ошибка при создании ссылки', 'error');
        }
    });
})();

// Простейшее предупреждающее модальное окно
function openWarningModal(message) {
    const modal = document.getElementById('playerModal');
    const modalAvatar = document.getElementById('modalAvatar');
    const modalPlayerName = document.getElementById('modalPlayerName');
    const modalTiers = document.getElementById('modalTiers');
    const modalRank = document.getElementById('modalRank');
    const modalScore = document.getElementById('modalScore');

    modalAvatar.src = 'icons/op.svg';
    modalPlayerName.textContent = 'Внимание';
    
    // Очищаем или скрываем элементы позиции для предупреждения
    if (modalRank) modalRank.textContent = '';
    if (modalScore) modalScore.textContent = '';
    
    modalTiers.innerHTML = `<div class="warning-text">${message}</div>`;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// Функция для переключения категорий
function switchCategory(category) {
    // Убираем активный класс у всех вкладок
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    
    // Добавляем активный класс к нужной вкладке
    document.querySelector(`.category-tab[data-category="${category}"]`).classList.add('active');

    // Скрываем весь контент
    document.querySelectorAll('.category-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Показываем соответствующий контент
    document.getElementById(`${category}-content`).classList.remove('hidden');

    // Убираем повторный рендеринг Sword и OP - они уже рендерятся в spa.js
    
    // Прокручиваем к началу контента
    const mainContent = document.querySelector('.main-content');
    if (mainContent && typeof smoothScrollTo === 'function') {
        smoothScrollTo(mainContent, 100); // 100px offset for header
    } else if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth' });
    }
}

// Обработчик закрытия модального окна по клавише Esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('playerModal');
        if (modal && modal.classList.contains('open')) {
            closeModal();
        }
    }
});
