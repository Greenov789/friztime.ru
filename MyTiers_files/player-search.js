class PlayerSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.mobileSearchInput = document.getElementById('mobileSearchInput');
        this.searchForm = document.getElementById('searchForm');
        this.mobileSearchForm = document.getElementById('mobileSearchForm');
        this.clearBtn = document.getElementById('clearBtn');
        this.mobileClearBtn = document.getElementById('mobileClearBtn');
        this.suggestionsContainer = null;
        this.mobileSuggestionsContainer = null;
        this.allPlayers = [];
        this.currentSuggestions = [];
        this.selectedIndex = -1;
        this.isLoading = false;
        this.debounceTimer = null;
        this.avatarCache = new Map(); // Кэш для аватарок
        this.hideTimer = null; // Таймер для скрытия списка
        
        this.init();
    }

    init() {
        console.log('PlayerSearch initializing...');
        console.log('PlayerSearch elements found:', {
            searchInput: !!this.searchInput,
            mobileSearchInput: !!this.mobileSearchInput,
            searchForm: !!this.searchForm,
            mobileSearchForm: !!this.mobileSearchForm
        });
        
        this.createSuggestionsContainer();
        this.setupEventListeners();
        this.loadAllPlayers();
    }

    createSuggestionsContainer() {
        // Desktop suggestions container
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'player-search-suggestions';
        this.suggestionsContainer.style.display = 'none';
        document.body.appendChild(this.suggestionsContainer);

        // Mobile suggestions container
        this.mobileSuggestionsContainer = document.createElement('div');
        this.mobileSuggestionsContainer.className = 'player-search-suggestions mobile';
        this.mobileSuggestionsContainer.style.display = 'none';
        document.body.appendChild(this.mobileSuggestionsContainer);
    }

    setupEventListeners() {
        // Desktop search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleInput(e, 'desktop'));
            this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e, 'desktop'));
            this.searchInput.addEventListener('focus', () => this.handleFocus('desktop'));
            this.searchInput.addEventListener('blur', () => this.handleBlur('desktop'));
        }

        // Desktop clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearSearch('desktop'));
        }

        // Mobile search
        if (this.mobileSearchInput) {
            this.mobileSearchInput.addEventListener('input', (e) => this.handleInput(e, 'mobile'));
            this.mobileSearchInput.addEventListener('keydown', (e) => this.handleKeydown(e, 'mobile'));
            this.mobileSearchInput.addEventListener('focus', () => this.handleFocus('mobile'));
            this.mobileSearchInput.addEventListener('blur', () => this.handleBlur('mobile'));
        }

        // Mobile clear button
        if (this.mobileClearBtn) {
            this.mobileClearBtn.addEventListener('click', () => this.clearSearch('mobile'));
        }

        // Form submissions
        if (this.searchForm) {
            this.searchForm.addEventListener('submit', (e) => this.handleSubmit(e, 'desktop'));
        }
        if (this.mobileSearchForm) {
            this.mobileSearchForm.addEventListener('submit', (e) => this.handleSubmit(e, 'mobile'));
        }

        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-form') && !e.target.closest('.player-search-suggestions')) {
                this.hideSuggestions('desktop');
            }
            if (!e.target.closest('.mobile-search-form') && !e.target.closest('.player-search-suggestions.mobile')) {
                this.hideSuggestions('mobile');
            }
        });

        // Отменяем скрытие при клике на список
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.player-search-suggestions')) {
                if (this.hideTimer) {
                    clearTimeout(this.hideTimer);
                    this.hideTimer = null;
                }
            }
        });
    }

    async loadAllPlayers() {
        try {
            console.log('PlayerSearch loading all players...');
            // Load all players from the database
            const response = await fetch('/api/get_players.php?limit=0'); // Get all players
            const data = await response.json();
            
            console.log('PlayerSearch API response:', data);
            
            if (data.players && Array.isArray(data.players)) {
                this.allPlayers = data.players.map(player => ({
                    id: player.nickname ? crc32(player.nickname) : Math.random(),
                    nickname: player.nickname,
                    name: player.nickname
                }));
                console.log(`PlayerSearch loaded ${this.allPlayers.length} players for search`);
                
                // Show first few players for debugging
                if (this.allPlayers.length > 0) {
                    console.log('PlayerSearch sample players:', this.allPlayers.slice(0, 5));
                }
            } else {
                console.error('PlayerSearch failed to load players - API response:', data);
                console.error('PlayerSearch response keys:', Object.keys(data));
                console.error('PlayerSearch data.players:', data.players);
            }
        } catch (error) {
            console.error('PlayerSearch failed to load players for search:', error);
        }
    }

    handleInput(e, type) {
        const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
        const value = input.value.trim();
        
        console.log('PlayerSearch handleInput:', { type, value, length: value.length });
        
        // Кнопку очистки больше не показываем, сохраняем ширину формы неизменной
        this.toggleClearButton(type, false);
        
        // Clear previous debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        if (value.length === 0) {
            this.hideSuggestions(type);
            return;
        }

        // Если есть 2+ символа, сразу показываем список (даже если он пустой)
        if (value.length >= 2) {
            console.log('PlayerSearch showing suggestions for input');
            this.showSuggestions(type);
        } else {
            this.hideSuggestions(type);
        }

        // Debounce search to avoid too many API calls
        this.debounceTimer = setTimeout(() => {
            console.log('PlayerSearch debounced search:', { value, length: value.length });
            if (value.length >= 2) {
                this.searchPlayers(value, type);
            } else {
                this.hideSuggestions(type);
            }
        }, 300);
    }

    async searchPlayers(query, type) {
        console.log('PlayerSearch searchPlayers:', { query, type, isLoading: this.isLoading, allPlayersCount: this.allPlayers.length });
        
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // If no local data, try to load it first
            if (this.allPlayers.length === 0) {
                console.log('PlayerSearch no local data, trying to load...');
                await this.loadAllPlayers();
                console.log('PlayerSearch after loading, allPlayersCount:', this.allPlayers.length);
            }
            
            // Search in local array - ищем по вхождению подстроки, не только по началу
            const localResults = this.allPlayers.filter(player => 
                player.nickname && typeof player.nickname === 'string' && player.nickname.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 10);

            console.log('PlayerSearch localResults:', localResults.length);
            console.log('PlayerSearch sample local results:', localResults.slice(0, 3));

            if (localResults.length > 0) {
                this.currentSuggestions = localResults;
                console.log('PlayerSearch showing local suggestions:', this.currentSuggestions.length);
                this.showSuggestions(type);
            } else {
                console.log('PlayerSearch no local results, trying API search...');
                // Try API search as fallback
                try {
                    const response = await fetch(`/api/search_players.php?q=${encodeURIComponent(query)}&limit=10`);
                    const data = await response.json();
                    
                    console.log('PlayerSearch API search response:', data);
                    
                    if (data.success && data.players && data.players.length > 0) {
                        this.currentSuggestions = data.players;
                        console.log('PlayerSearch showing API suggestions:', this.currentSuggestions.length);
                        this.showSuggestions(type);
                    } else {
                        console.log('PlayerSearch no API results, hiding suggestions');
                        this.hideSuggestions(type);
                    }
                } catch (apiError) {
                    console.error('PlayerSearch API search error:', apiError);
                    this.hideSuggestions(type);
                }
            }
        } catch (error) {
            console.error('PlayerSearch error:', error);
            this.hideSuggestions(type);
        } finally {
            this.isLoading = false;
        }
    }

    showSuggestions(type) {
        const container = type === 'desktop' ? this.suggestionsContainer : this.mobileSuggestionsContainer;
        const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
        
        console.log('PlayerSearch showSuggestions:', { 
            type, 
            suggestionsCount: this.currentSuggestions.length, 
            container: container ? 'found' : 'not found',
            input: input ? 'found' : 'not found'
        });

        if (!container || !input) {
            console.error('PlayerSearch missing container or input:', { container, input });
            return;
        }

        container.innerHTML = '';
        
        // Create list element
        const list = document.createElement('ul');
        list.className = 'player-search-list';
        
        // Показываем список даже если нет результатов (для индикации загрузки)
        if (this.currentSuggestions.length > 0) {
            this.currentSuggestions.forEach((player, index) => {
                const item = document.createElement('li');
                item.className = 'player-search-item';
                item.dataset.index = index;
                item.dataset.playerId = player.id;
                
                const highlightedName = this.highlightMatch(player.nickname, input.value);
                const avatarUrl = this.getPlayerAvatarUrl(player.nickname);
                
                item.innerHTML = `
                    <div class="player-search-content">
                        <div class="player-search-avatar">
                            <img src="${avatarUrl}" alt="${player.nickname}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMkEyRDNBIi8+CjxwYXRoIGQ9Ik0xNiA0QzEwLjQ4IDQgNiA4LjQ4IDYgMTRTMTAuNDggMjQgMTYgMjRTMjYgMTkuNTIgMjYgMTRTMjEuNTIgNCAxNiA0Wk0xNiA3QzE4LjIxIDcgMjAgOC43OSAyMCAxMUMyMCAxMy4yMSAxOC4yMSAxNSAxNiAxNUMxMy43OSAxNSAxMiAxMy4yMSAxMiAxMUMxMiA4Ljc5IDEzLjc5IDcgMTYgN1pNMTYgMjUuNkMxMy42NyAyNS42IDExLjYyIDI0LjI0IDEwLjQxIDIyLjE2QzExLjIzIDIwLjIgMTQuMzMgMTguNjcgMTYgMTguNjdDMTcuNjcgMTguNjcgMjAuNzcgMjAuMiAyMS41OSAyMi4xNkMyMC4zOCAyNC4yNCAxOC4zMyAyNS42IDE2IDI1LjZaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo='">
                        </div>
                        <div class="player-search-name">${highlightedName}</div>
                    </div>
                `;

                item.addEventListener('click', () => this.selectPlayer(player, type));
                list.appendChild(item);
            });
        } else {
            // Показываем индикатор загрузки или "нет результатов"
            const item = document.createElement('li');
            item.className = 'player-search-item loading';
            item.innerHTML = `
                <div class="player-search-content">
                    <div class="player-search-name">Поиск игроков...</div>
                </div>
            `;
            list.appendChild(item);
        }
        
        container.appendChild(list);

        // Position container as continuation of search input
        const searchForm = input.closest('.search-form') || input.closest('.mobile-search-form');
        const formRect = searchForm ? searchForm.getBoundingClientRect() : input.getBoundingClientRect();
        
        if (type === 'mobile') {
            // Для мобильной версии позиционируем под формой поиска
            container.style.position = 'fixed';
            container.style.top = `${formRect.bottom + 4}px`;
            container.style.bottom = 'auto';
            container.style.left = `${formRect.left}px`;
            container.style.right = `${window.innerWidth - formRect.right}px`;
            container.style.width = 'auto';
        } else {
            // Для desktop версии позиционируем под формой поиска
            container.style.position = 'fixed';
            container.style.top = `${formRect.bottom + 4}px`;
            container.style.left = `${formRect.left}px`;
            container.style.width = `${formRect.width}px`;
        }
        
        container.style.display = 'block';
        container.style.zIndex = '999';

        console.log('PlayerSearch container positioned:', {
            top: container.style.top,
            left: container.style.left,
            width: container.style.width,
            display: container.style.display,
            zIndex: container.style.zIndex
        });

        this.selectedIndex = -1;
    }

    hideSuggestions(type) {
        const container = type === 'desktop' ? this.suggestionsContainer : this.mobileSuggestionsContainer;
        container.style.display = 'none';
        this.selectedIndex = -1;
    }

    handleFocus(type) {
        // Отменяем скрытие списка при фокусе
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        
        // Показываем список если есть текст
        const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
        if (input.value.trim().length >= 2) {
            this.showSuggestions(type);
        }
    }

    handleBlur(type) {
        // Добавляем небольшую задержку перед скрытием, чтобы можно было кликнуть по списку
        this.hideTimer = setTimeout(() => {
            this.hideSuggestions(type);
        }, 150);
    }

    toggleClearButton(type, show) {
        const clearBtn = type === 'desktop' ? this.clearBtn : this.mobileClearBtn;
        const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
        const form = type === 'desktop' ? this.searchForm : this.mobileSearchForm;
        
        if (clearBtn && input && form) {
            // Держим кнопку скрытой и ширину форм фиксированной
            clearBtn.style.display = 'none';
            clearBtn.style.opacity = '0';
            clearBtn.style.transform = 'scale(0.8)';
            if (type === 'desktop') {
                form.style.width = '200px';
            } else {
                form.style.width = '150px';
            }
        }
    }

    clearSearch(type) {
        const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
        if (input) {
            input.value = '';
            input.focus();
            this.hideSuggestions(type);
            this.toggleClearButton(type, false);
        }
    }

    updateSuggestionsPosition(type) {
        const container = type === 'desktop' ? this.suggestionsContainer : this.mobileSuggestionsContainer;
        const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
        
        // Обновляем позицию только если список видим
        if (container.style.display === 'none') return;
        
        const searchForm = input.closest('.search-form') || input.closest('.mobile-search-form');
        const formRect = searchForm ? searchForm.getBoundingClientRect() : input.getBoundingClientRect();
        
        container.style.top = `${formRect.bottom + 4}px`; // Чуть пониже поиска
        container.style.left = `${formRect.left}px`;
        container.style.width = `${formRect.width}px`;
        
        console.log('PlayerSearch position updated:', {
            top: container.style.top,
            left: container.style.left,
            width: container.style.width
        });
    }

    handleKeydown(e, type) {
        const container = type === 'desktop' ? this.suggestionsContainer : this.mobileSuggestionsContainer;
        
        if (container.style.display === 'none') return;

        const items = container.querySelectorAll('.player-search-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    const playerId = items[this.selectedIndex].dataset.playerId;
                    const player = this.currentSuggestions.find(p => p.id == playerId);
                    if (player) {
                        this.selectPlayer(player, type);
                    }
                } else {
                    this.handleSubmit(e, type);
                }
                break;
            case 'Escape':
                this.hideSuggestions(type);
                break;
        }
    }

    updateSelection(items) {
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }

    selectPlayer(player, type) {
        const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
        
        console.log('PlayerSearch selectPlayer:', { player: player.nickname, type });
        
        // Set the selected player's nickname in the input
        input.value = player.nickname;
        
        // Close suggestions
        this.hideSuggestions(type);
        
        // Trigger search immediately
        this.performSearch(player.nickname, type);
    }

    handleSubmit(e, type) {
        e.preventDefault();
        const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
        const query = input.value.trim();
        
        if (query) {
            this.performSearch(query, type);
        }
    }

    performSearch(query, type) {
        console.log('PlayerSearch performSearch:', { query, type });
        
        // Выполняем поиск через существующую систему поиска
        // Используем функцию handleSearch из navigation.js
        if (typeof window.handleSearch === 'function') {
            console.log('PlayerSearch calling window.handleSearch');
            window.handleSearch(query);
        } else {
            console.log('PlayerSearch window.handleSearch not found, trying form submit');
            // Fallback: отправляем форму
            const input = type === 'desktop' ? this.searchInput : this.mobileSearchInput;
            const form = input.closest('form');
            
            if (form) {
                // Создаем событие submit для формы
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
            }
        }
        
        // Также эмитируем кастомное событие для других обработчиков
        const event = new CustomEvent('playerSearch', {
            detail: { query, type }
        });
        document.dispatchEvent(event);
    }

    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    getPlayerAvatarUrl(nickname) {
        // Проверяем кэш
        if (this.avatarCache.has(nickname)) {
            return this.avatarCache.get(nickname);
        }
        
        const encodedNickname = encodeURIComponent(nickname);
        
        // Используем Minotar API - он работает с никнеймами напрямую
        // Параметры:
        // - размер 32x32 пикселя
        // - дефолтная аватарка Steve если игрок не найден
        const avatarUrl = `https://minotar.net/avatar/${encodedNickname}/32.png`;
        
        // Кэшируем URL
        this.avatarCache.set(nickname, avatarUrl);
        
        return avatarUrl;
    }

    // Альтернативный метод для получения UUID игрока (если понадобится)
    async getPlayerUUID(nickname) {
        try {
            const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(nickname)}`);
            if (response.ok) {
                const data = await response.json();
                return data.id;
            }
        } catch (error) {
            console.log('Failed to get UUID for player:', nickname);
        }
        return null;
    }
}

// Simple CRC32 hash function for generating IDs
function crc32(str) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

// CRC32 lookup table
const crc32Table = (() => {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
})();

// Initialize player search
document.addEventListener('DOMContentLoaded', () => {
    new PlayerSearch();
});
