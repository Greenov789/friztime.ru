// Category Picker functionality
class CategoryPicker {
    constructor() {
        // Возврат к оригинальному контейнеру
        this.basePicker = document.querySelector('.category-picker');
        this.pickerItems = this.basePicker ? this.basePicker.querySelectorAll('.category-picker-item') : [];
        this.isSyncing = false; // Флаг для предотвращения прокрутки при синхронизации
        this.init();
    }

    init() {
        this.createIndicator();
        this.createFixedPicker();
        this.setupEventListeners();
        this.setInitialActiveState();
        this.setupScrollHandler();
    }

    setupEventListeners() {
        this.pickerItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleItemClick(item);
            });
        });
    }

    handleItemClick(clickedItem) {
        // Remove active class from all items
        this.pickerItems.forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked item
        clickedItem.classList.add('active');

        // Move indicator to active item
        this.moveIndicator(clickedItem);

        // Get the target category
        const target = clickedItem.getAttribute('href');
        const category = clickedItem.getAttribute('data-category');

        // Handle SPA navigation + URL sync + localStorage
        if (target && target.startsWith('/')) {
            this.navigateToCategory(target, category);
        }

        // Синхронизируем URL, если SPA не перехватил
        try {
            if (window.history && typeof history.pushState === 'function' && window.location.pathname !== target) {
                history.pushState({ path: target }, '', target);
            }
        } catch (_) {}

        // Сохраняем последнюю категорию
        try { localStorage.setItem('lastCategory', category); } catch (_) {}

        // Плавная прокрутка наверх
        this.smoothScrollToTop();

        // Trigger custom event for other components
        this.dispatchCategoryChangeEvent(clickedItem);
    }

    navigateToCategory(path, category) {
        // Use existing SPA navigation system
        if (window.location.pathname !== path) {
            // Trigger SPA navigation by dispatching a custom event
            const navigationEvent = new CustomEvent('spaNavigate', {
                detail: { path, category }
            });
            document.dispatchEvent(navigationEvent);
        }
    }

    setInitialActiveState() {
        // Восстанавливаем по URL или localStorage
        const stored = (() => { try { return localStorage.getItem('lastCategory'); } catch(_) { return null; } })();
        const map = { '/': 'overall', '/overall': 'overall', '/sword': 'sword', '/op': 'op', '/netherpot': 'netherpot' };
        const byUrl = map[window.location.pathname];

        if (byUrl) {
            const el = this.basePicker && this.basePicker.querySelector(`[data-category="${byUrl}"]`);
            if (el) {
                el.classList.add('active');
                this.moveIndicator(el);
                return;
            }
        } else if (stored) {
            const el = this.basePicker && this.basePicker.querySelector(`[data-category="${stored}"]`);
            if (el) {
                el.classList.add('active');
                this.moveIndicator(el);
                return;
            }
        }

        // Set first item as active if no active item exists
        const activeItem = this.basePicker ? this.basePicker.querySelector('.category-picker-item.active') : null;
        if (!activeItem && this.pickerItems.length > 0) {
            this.pickerItems[0].classList.add('active');
            this.moveIndicator(this.pickerItems[0]);
        } else if (activeItem) {
            this.moveIndicator(activeItem);
        }
    }

    createIndicator() {
        // Create indicator element
        this.indicator = document.createElement('div');
        this.indicator.className = 'category-picker-indicator';
        
        // Add indicator to original picker container
        const pickerContainer = this.basePicker || document.querySelector('.category-picker');
        if (pickerContainer) {
            pickerContainer.style.position = 'relative';
            pickerContainer.appendChild(this.indicator);
        }
    }

    createFixedPicker() {
        // Create fixed picker element
        this.fixedPicker = document.createElement('div');
        this.fixedPicker.className = 'category-picker-fixed';
        
        // Clone the original picker structure
        const originalPicker = document.querySelector('.category-picker');
        if (originalPicker) {
            this.fixedPicker.innerHTML = originalPicker.innerHTML;
        }
        
        // Add to body
        document.body.appendChild(this.fixedPicker);
        
        // Create indicator for fixed picker
        this.createFixedIndicator();
        
        // Setup event listeners for fixed picker
        this.setupFixedPickerEventListeners();
    }

    createFixedIndicator() {
        // Create indicator element for fixed picker
        this.fixedIndicator = document.createElement('div');
        this.fixedIndicator.className = 'category-picker-indicator';
        
        // Add indicator to fixed picker container
        if (this.fixedPicker) {
            // НЕ меняем position - он должен остаться fixed из CSS
            this.fixedPicker.appendChild(this.fixedIndicator);
        }
    }

    setupFixedPickerEventListeners() {
        const fixedPickerItems = this.fixedPicker.querySelectorAll('.category-picker-item');
        fixedPickerItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFixedItemClick(item);
            });
        });
    }

    handleFixedItemClick(clickedItem) {
        // Get the data-category attribute
        const category = clickedItem.getAttribute('data-category');
        
        // Find corresponding item in original picker and click it
        const originalItem = document.querySelector(`.category-picker-item[data-category="${category}"]`);
        if (originalItem) {
            originalItem.click();
        }
    }

    smoothScrollToTop() {
        // Плавная прокрутка наверх только если не синхронизируем
        if (!this.isSyncing) {
            if (typeof smoothScrollToTop === 'function') {
                smoothScrollToTop();
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }
    }

    moveIndicator(activeItem) {
        if (!this.indicator || !activeItem) return;
        
        const updateIndicatorPosition = () => {
            const itemRect = activeItem.getBoundingClientRect();
            const container = (this.basePicker || document.querySelector('.category-picker'));
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            
            // Calculate position relative to container
            const left = itemRect.left - containerRect.left;
            const width = itemRect.width;
            
            // Set indicator with spring-like transform
            this.indicator.style.left = `0px`;
            this.indicator.style.width = `${width}px`; // width через layout
            this.indicator.style.transform = `translate3d(${left}px, 0, 0)`;
        };
        
        // Обновляем позицию сразу
        updateIndicatorPosition();
        
        // Обновляем индикатор в фиксированном пикере если он есть
        if (this.fixedIndicator && this.fixedPicker) {
            const category = activeItem.getAttribute('data-category');
            const fixedActiveItem = this.fixedPicker.querySelector(`[data-category="${category}"]`);
            
            if (fixedActiveItem) {
                const fixedItemRect = fixedActiveItem.getBoundingClientRect();
                const fixedContainerRect = this.fixedPicker.getBoundingClientRect();
                
                const fixedLeft = fixedItemRect.left - fixedContainerRect.left;
                const fixedWidth = fixedItemRect.width;
                
                this.fixedIndicator.style.left = `0px`;
                this.fixedIndicator.style.width = `${fixedWidth}px`;
                this.fixedIndicator.style.transform = `translate3d(${fixedLeft}px, 0, 0)`;
            }
        }
    }

    dispatchCategoryChangeEvent(activeItem) {
        const event = new CustomEvent('categoryChanged', {
            detail: {
                activeItem: activeItem,
                category: activeItem.querySelector('.category-picker-text').textContent,
                href: activeItem.getAttribute('href'),
                dataCategory: activeItem.getAttribute('data-category')
            }
        });
        document.dispatchEvent(event);
    }

    // Method to programmatically set active category
    setActiveCategory(categoryIndex) {
        if (categoryIndex >= 0 && categoryIndex < this.pickerItems.length) {
            this.handleItemClick(this.pickerItems[categoryIndex]);
        }
    }

    // Method to get current active category
    getActiveCategory() {
            const activeItem = this.basePicker ? this.basePicker.querySelector('.category-picker-item.active') : null;
        if (activeItem) {
            return {
                element: activeItem,
                category: activeItem.querySelector('.category-picker-text').textContent,
                href: activeItem.getAttribute('href'),
                dataCategory: activeItem.getAttribute('data-category')
            };
        }
        return null;
    }

    // Method to set active category by data-category attribute
    setActiveCategoryByData(categoryName) {
        const targetItem = document.querySelector(`[data-category="${categoryName}"]`);
        const fixedTargetItem = this.fixedPicker.querySelector(`[data-category="${categoryName}"]`);
        
        if (targetItem) {
            // Устанавливаем флаг синхронизации
            this.isSyncing = true;
            
            // Remove active class from all items in both pickers
            this.pickerItems.forEach(item => {
                item.classList.remove('active');
            });
            
            if (this.fixedPicker) {
                const fixedItems = this.fixedPicker.querySelectorAll('.category-picker-item');
                fixedItems.forEach(item => {
                    item.classList.remove('active');
                });
            }
            
            // Add active class to target items
            targetItem.classList.add('active');
            if (fixedTargetItem) {
                fixedTargetItem.classList.add('active');
            }
            
            // Move indicator to target item
            this.moveIndicator(targetItem);
            
            // Сбрасываем флаг синхронизации через небольшую задержку
            setTimeout(() => {
                this.isSyncing = false;
            }, 100);
        }
    }

    setupScrollHandler() {
        const picker = document.querySelector('.category-picker');
        const mainContent = document.querySelector('.main-content');
        const header = document.querySelector('.navigation-header');
        
        if (!picker || !mainContent || !header || !this.fixedPicker) return;

        let isVisible = false;
        const headerHeight = 64; // Фиксированная высота Header

        const handleScroll = () => {
            // Получаем текущую позицию пикера относительно экрана
            const pickerRect = picker.getBoundingClientRect();
            const pickerTop = pickerRect.top;
            
            // Фиксированный пикер должен появиться когда оригинальный пикер уходит за верх экрана
            const shouldShow = pickerTop < headerHeight;

            if (shouldShow && !isVisible) {
                // Показываем фиксированный пикер без изменения контента
                this.fixedPicker.classList.add('visible');
                isVisible = true;
                
                // Синхронизируем активное состояние
                setTimeout(() => {
                    const activeItem = document.querySelector('.category-picker-item.active');
                    if (activeItem) {
                        const category = activeItem.getAttribute('data-category');
                        this.setActiveCategoryByData(category);
                    }
                }, 50);
                
            } else if (!shouldShow && isVisible) {
                // Скрываем фиксированный пикер
                this.fixedPicker.classList.remove('visible');
                isVisible = false;
            }
        };

        // Добавляем обработчик скролла
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Вызываем сразу для проверки начального состояния
        setTimeout(handleScroll, 100);
        
        // Обработчик для SPA навигации
        document.addEventListener('spaNavigate', () => {
            setTimeout(handleScroll, 200);
        });
    }
}

// Initialize category picker when DOM is loaded
function initCategoryPicker() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCategoryPicker);
        return;
    }
    
    // Check if category picker exists
    const pickerContainer = document.querySelector('.category-picker');
    if (!pickerContainer) {
        console.warn('Category picker container not found');
        return;
    }
    
    try {
        window.categoryPicker = new CategoryPicker();
        
        // Listen for SPA navigation events
        document.addEventListener('spaNavigate', (e) => {
            const { path, category } = e.detail;
            if (window.categoryPicker && category) {
                window.categoryPicker.setActiveCategoryByData(category);
            }
        });
        
        // Set initial active state based on current URL
        const currentPath = window.location.pathname;
        const categoryMap = {
            '/': 'overall',
            '/overall': 'overall',
            '/sword': 'sword', 
            '/op': 'op',
            '/netherpot': 'netherpot'
        };
        
        const currentCategory = categoryMap[currentPath];
        if (currentCategory && window.categoryPicker) {
            window.categoryPicker.setActiveCategoryByData(currentCategory);
        }
        
        console.log('Category picker initialized successfully');
    } catch (error) {
        console.error('Error initializing category picker:', error);
    }
}

// Start initialization with delay to ensure SPA is loaded
setTimeout(initCategoryPicker, 50);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryPicker;
}
