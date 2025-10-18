// Управление подвижным фоном для вкладок категорий
class SlidingTabs {
    constructor() {
        this.tabsContainer = document.querySelector('.category-tabs');
        this.tabs = document.querySelectorAll('.category-tab');
        this.slidingBackground = null;
        this.init();
    }

    init() {
        if (!this.tabsContainer || this.tabs.length === 0) return;

        // Гарантируем контекст позиционирования для абсолютного фона
        if (!this.tabsContainer.style.position) {
            this.tabsContainer.style.position = 'relative';
        }

        // Создаем подвижный фон
        this.createSlidingBackground();
        
        // Устанавливаем начальную позицию
        this.updateSlidingPosition();
        
        // Добавляем обработчики событий
        this.addEventListeners();
        
        // Обрабатываем изменения размера окна
        window.addEventListener('resize', () => {
            this.updateSlidingPosition();
        });
    }

    createSlidingBackground() {
        // Удаляем существующий фон, если есть
        const existingBg = this.tabsContainer.querySelector('.sliding-bg');
        if (existingBg) {
            existingBg.remove();
        }

        // Создаем новый подвижный фон
        this.slidingBackground = document.createElement('div');
        this.slidingBackground.className = 'sliding-bg';
        this.slidingBackground.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            height: calc(100% - 10px);
            background-color: #0D0F16;
            border-radius: 45px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 0;
            pointer-events: none;
        `;

        // Вставляем фон в контейнер
        this.tabsContainer.appendChild(this.slidingBackground);
    }

    addEventListeners() {
        this.tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                this.setActiveTab(index);
            });
        });

        // Добавляем обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.updateSlidingPosition();
        });
    }

    setActiveTab(index) {
        // Убираем активный класс у всех вкладок
        this.tabs.forEach(tab => tab.classList.remove('active'));
        
        // Добавляем активный класс к выбранной вкладке
        this.tabs[index].classList.add('active');
        
        // Обновляем позицию подвижного фона
        this.updateSlidingPosition();
    }

    updateSlidingPosition() {
        if (!this.slidingBackground) return;

        const activeTab = this.tabsContainer.querySelector('.category-tab.active');
        if (!activeTab) {
            // Если нет активной вкладки, делаем первую активной
            this.tabs[0]?.classList.add('active');
            this.updateSlidingPosition();
            return;
        }

        const containerRect = this.tabsContainer.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        
        // Вычисляем позицию относительно контейнера
        const left = tabRect.left - containerRect.left;
        const width = tabRect.width;
        
        // Применяем стили к подвижному фону
        this.slidingBackground.style.left = `${left}px`;
        this.slidingBackground.style.width = `${width}px`;

        // Для мобильных устройств (вертикальная раскладка)
        if (window.innerWidth <= 480) {
            const top = tabRect.top - containerRect.top;
            const height = tabRect.height;
            
            this.slidingBackground.style.top = `${top}px`;
            this.slidingBackground.style.height = `${height}px`;
            this.slidingBackground.style.left = `${left}px`; // Используем реальную позицию вкладки
            this.slidingBackground.style.width = `${width}px`; // Используем реальную ширину вкладки
            this.slidingBackground.style.borderRadius = '36px';
        } else {
            this.slidingBackground.style.top = '5px';
            this.slidingBackground.style.height = 'calc(100% - 10px)';
            this.slidingBackground.style.borderRadius = '45px';
        }
    }

    // Публичный метод для обновления позиции (можно вызывать извне)
    refresh() {
        this.updateSlidingPosition();
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.slidingTabs = new SlidingTabs();
});

// Экспорт для использования в других модулях
window.SlidingTabs = SlidingTabs;