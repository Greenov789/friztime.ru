// Источник данных теперь серверный API
let playersData = [];

const tierScores = {
    "HT1": 60, "LT1": 45,
    "HT2": 30, "LT2": 20,
    "HT3": 10, "LT3": 6,
    "HT4": 4, "LT4": 3,
    "HT5": 2, "LT5": 1
};

// Делаем tierScores глобально доступным
window.tierScores = tierScores;

async function loadPlayers(options = {}) {
    // Защита от множественных одновременных запросов
    if (window.isLoadingPlayers) {
        console.log('Players already loading, waiting...');
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!window.isLoadingPlayers) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
        });
    }
    
    window.isLoadingPlayers = true;

    try {
        const params = new URLSearchParams();
        if (typeof options.limit === 'number') {
            params.set('limit', String(options.limit));
        }
        const url = params.toString() ? `/api/get_players.php?${params.toString()}` : '/api/get_players.php';
        console.log('Loading players from:', url);
        const res = await fetch(url, { 
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        console.log('API response status:', res.status);
        if (!res.ok) {
            const text = await res.text();
            console.error('API error:', res.status, text);
            toastManager && toastManager.show(`API ${res.status}: ${text || 'Ошибка загрузки игроков'}`);
            throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        console.log('API response data:', json);
        playersData = Array.isArray(json.players) ? json.players : [];
        window.playersData = playersData;
        
        if (playersData.length === 0) {
            toastManager && toastManager.show('Данные игроков пусты. Проверьте БД/таблицы.');
        }
    } catch (e) {
        playersData = [];
        window.playersData = playersData;
        console.error('Failed to load players', e);
        toastManager && toastManager.show('Не удалось получить данные игроков. Проверьте API.');
    } finally {
        window.isLoadingPlayers = false;
    }
}

// Функция для очистки данных
function clearDataCache() {
    playersData = [];
    window.playersData = playersData;
}

// Экспорт для использования в других модулях
window.clearDataCache = clearDataCache;
window.loadPlayers = loadPlayers;
window.playersData = playersData;