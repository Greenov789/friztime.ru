// Функция для отображения таблицы Overall
function renderOverallTable() {
    const tableBody = document.getElementById('overall-table-body');
    tableBody.innerHTML = '';

    if (!window.playersData || window.playersData.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.style.textAlign = 'center';
        td.style.color = 'rgba(255,255,255,0.6)';
        td.textContent = 'Нет данных';
        tr.appendChild(td);
        tableBody.appendChild(tr);
        return;
    }

    window.playersData.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Добавляем обработчик клика на строку
        row.addEventListener('click', () => openPlayerModal(player));
        row.style.cursor = 'pointer';

        // Место в рейтинге
        const rankCell = document.createElement('td');
        rankCell.className = 'player-rank';
        rankCell.textContent = index + 1;

        // Информация об игроке (аватарка и никнейм)
        const playerCell = document.createElement('td');
        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';

        const avatar = document.createElement('img');
        avatar.className = 'player-avatar';
        avatar.src = `https://render.crafty.gg/3d/bust/${player.nickname}`;
        avatar.alt = player.nickname;
        avatar.onerror = function () {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTQiPkFWPzwvdGV4dD4KPC9zdmc+';
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = player.nickname;

        // Добавляем количество очков под никнейм
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'player-score';
        scoreSpan.textContent = `Количество очков: ${player.overallScore}`;

        // Контейнер для текстовой информации
        const textContainer = document.createElement('div');
        textContainer.style.display = 'flex';
        textContainer.style.flexDirection = 'column';
        textContainer.style.gap = '4px';
        textContainer.appendChild(nameSpan);
        textContainer.appendChild(scoreSpan);

        playerInfo.appendChild(avatar);
        playerInfo.appendChild(textContainer);
        playerCell.appendChild(playerInfo);

        // Ранги игрока
        const tiersCell = document.createElement('td');
        tiersCell.className = 'player-tiers';

        // Контейнер для красивых бейджей тиров
        const tiersContainer = document.createElement('div');
        tiersContainer.className = 'tiers-container';

        // Добавляем Sword тиры (только если игрок НЕ Restricted в Sword)
        if (player.swordTiers && player.swordTiers.length > 0 && !player.swordTiers.includes('Restricted')) {
            player.swordTiers.forEach(tier => {
                const tierBadge = document.createElement('div');
                const isRetired = tier.startsWith('R');
                const tierClass = isRetired ? `tiers ${tier} retired` : `tiers ${tier}`;
                tierBadge.className = tierClass;
                // Remove 'R' prefix for score calculation
                const tierForScore = isRetired ? tier.substring(1) : tier;
                const tierScore = tierScores[tierForScore] || 0;
                tierBadge.innerHTML = `
                    <div class="circle-container">
                        <img src="icon/sword.png" alt="" class="circle-image">
                    </div>
                    <div class="tier-container">
                        <div class="tier">${tier}</div>
                    </div>
                    <div class="tier-tooltip">Sword ${tierForScore}<br>${tierScore} очков</div>
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
                
                tiersContainer.appendChild(tierBadge);
            });
        }

        // Добавляем OP тиры (только если игрок НЕ Restricted в OP)
        if (player.opTiers && player.opTiers.length > 0 && !player.opTiers.includes('Restricted')) {
            player.opTiers.forEach(tier => {
                const tierBadge = document.createElement('div');
                const isRetired = tier.startsWith('R');
                const tierClass = isRetired ? `tiers ${tier} retired` : `tiers ${tier}`;
                tierBadge.className = tierClass;
                // Remove 'R' prefix for score calculation
                const tierForScore = isRetired ? tier.substring(1) : tier;
                const tierScore = tierScores[tierForScore] || 0;
                tierBadge.innerHTML = `
                    <div class="circle-container">
                        <img src="icon/OP.png" alt="" class="circle-image">
                    </div>
                    <div class="tier-container">
                        <div class="tier">${tier}</div>
                    </div>
                    <div class="tier-tooltip">OP ${tierForScore}<br>${tierScore} очков</div>
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
                
                tiersContainer.appendChild(tierBadge);
            });
        }

        tiersCell.appendChild(tiersContainer);

        // Добавляем ячейки в строку
        row.appendChild(rankCell);
        row.appendChild(playerCell);
        row.appendChild(tiersCell);

        // Добавляем строку в таблицу
        tableBody.appendChild(row);
    });
}

// Функция для отображения плиточной сетки Sword/OP
function renderTiersGrid(category, gridElementId) {
    const gridElement = document.getElementById(gridElementId);
    gridElement.innerHTML = '';

    // Создаем 5 колонок (Tier 1 - Tier 5)
    for (let tierLevel = 1; tierLevel <= 5; tierLevel++) {
        const tierColumn = document.createElement('div');
        tierColumn.className = 'tier-column';

        const tierTitle = document.createElement('div');
        tierTitle.className = `tier-title tier-${tierLevel}`;
        tierTitle.textContent = `Tier ${tierLevel}`;
        tierColumn.appendChild(tierTitle);

        // Фильтруем игроков по категории и уровню тира (исключаем restricted и retired)
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

        // Если нет игроков в этом тире
        if (playersInTier.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-tier-message';
            emptyMessage.textContent = 'Нет игроков';
            emptyMessage.style.cssText = 'text-align: center; padding: 20px; color: rgba(255,255,255,0.5);';
            tierColumn.appendChild(emptyMessage);
        } else {
            // Сортируем: сначала HT, затем LT
            playersInTier.sort((a, b) => {
                const aTiers = category === 'sword' ? a.swordTiers : a.opTiers;
                const bTiers = category === 'sword' ? b.swordTiers : b.opTiers;

                const aTier = aTiers.find(t => t.endsWith(tierLevel));
                const bTier = bTiers.find(t => t.endsWith(tierLevel));

                // Сначала сравниваем по типу (HT > LT)
                if (aTier.startsWith('H') && bTier.startsWith('L')) return -1;
                if (aTier.startsWith('L') && bTier.startsWith('H')) return 1;

                // Если тип одинаковый, сравниваем по очкам
                return (bTiers.reduce((sum, t) => sum + (tierScores[t] || 0), 0) -
                    aTiers.reduce((sum, t) => sum + (tierScores[t] || 0), 0));
            });

            // Создаем карточки для каждого игрока
            playersInTier.forEach(player => {
                const playerCard = document.createElement('div');
                const tiers = category === 'sword' ? player.swordTiers : player.opTiers;
                const tier = tiers.find(t => t.endsWith(tierLevel));

                playerCard.className = 'player-card';
                // Add HT/LT class based on tier type
                if (tier.startsWith('H')) {
                    playerCard.classList.add('ht');
                } else if (tier.startsWith('L')) {
                    playerCard.classList.add('lt');
                }
                playerCard.setAttribute('data-player', player.nickname);
                playerCard.addEventListener('click', () => openPlayerModal(player));

                const cardPlayerInfo = document.createElement('div');
                cardPlayerInfo.className = 'card-player-info';

                const cardAvatar = document.createElement('img');
                cardAvatar.className = 'card-avatar';
                cardAvatar.src = `https://render.crafty.gg/3d/bust/${player.nickname}`;
                cardAvatar.alt = player.nickname;
                cardAvatar.onerror = function() {
                    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE1IiB5PSIxNSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1iZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTAiPkFWPzwvdGV4dD4KPC9zdmc+';
                };

                const cardName = document.createElement('span');
                cardName.className = 'card-player-name';
                cardName.textContent = player.nickname;

                cardPlayerInfo.appendChild(cardAvatar);
                cardPlayerInfo.appendChild(cardName);

                playerCard.appendChild(cardPlayerInfo);

                tierColumn.appendChild(playerCard);
            });
        }

        gridElement.appendChild(tierColumn);
    }
}

// Функция для отображения плашек Overall
function renderOverallCards() {
    console.log('renderOverallCards called');
    const cardsContainer = document.getElementById('overall-cards-container');
    if (!cardsContainer) {
        console.error('overall-cards-container not found');
        return;
    }
    cardsContainer.innerHTML = '';

    console.log('playersData:', window.playersData);
    if (!window.playersData || window.playersData.length === 0) {
        console.log('No players data available');
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
                            src="https://render.crafty.gg/3d/bust/${player.nickname}">
                    </div>
                    
                    <!-- Информация игрока -->
                    <div class="player-info">
                        <h2 class="player-name">${player.nickname}</h2>
                        <div class="player-title">
                            <img width="16" height="16" alt="points" src="assets/points.svg" class="points-icon">
                            <span class="points">Количество очков: ${player.overallScore}</span>
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

        cardsContainer.appendChild(card);

        // Add to intersection observer for lazy loading
        const avatar = card.querySelector('.player-avatar');
        avatar.dataset.playerName = player.nickname;
        if (window.imageObserver) {
            window.imageObserver.observe(avatar);
        }
    });
}

// Функция для генерации элементов тиров
function generateTierItems(player) {
    let tierItems = '';
    
    // Sword тиры
    player.swordTiers.forEach(tier => {
        const tierScore = tierScores[tier] || 0;
        tierItems += `
            <div class="tiers ${tier}">
                <div class="circle-container">
                    <img src="icon/sword.png" alt="sword" class="circle-image">
                </div>
                <div class="tier-container">
                    <div class="tier">${tier}</div>
                </div>
            </div>
        `;
    });
    
    // OP тиры
    player.opTiers.forEach(tier => {
        const tierScore = tierScores[tier] || 0;
        tierItems += `
            <div class="tiers ${tier}">
                <div class="circle-container">
                    <img src="icon/OP.png" alt="op" class="circle-image">
                </div>
                <div class="tier-container">
                    <div class="tier">${tier}</div>
                </div>
            </div>
        `;
    });
    
    return tierItems;
}

// Экспорт функций глобально
window.renderOverallCards = renderOverallCards;