// Функция включения плавной прокрутки (отключена)
function enableSmoothScrolling() {
    console.log('Smooth scrolling disabled - using native scroll behavior');
}

// Основная функция инициализации
async function init() {
    const header = document.getElementById('navigationHeader');
    const preloader = document.getElementById('preloader');
    
    // Инициализация анимации заголовка
    header.style.opacity = '0';
    header.style.transform = 'translateX(-50%) translateY(-20px)';

    // Анимация заголовка без задержки
    header.style.transition = 'all 0.5s ease';
    header.style.opacity = '1';
    header.style.transform = 'translateX(-50%) translateY(0)';

    // Загружаем данные с сервера
    await loadPlayers();
    // Убираем рендеринг карточек из main.js - они рендерятся в своих файлах через SPA

    // Плавное появление секций
    document.querySelectorAll('.fade-in').forEach(el => {
        requestAnimationFrame(() => el.classList.add('visible'));
    });

    // Скрыть прелоадер
    if (preloader) {
        preloader.classList.add('hidden');
        preloader.remove(); // Убираем задержку
    }

    // Настройка навигации
    setupDiscordDropdown();
    setupSearch();
    setupMobileDropdown();

    // Обработка прокрутки для изменения навигации
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Переключение между категориями обрабатывается в spa.js
    // Убираем дублирующие обработчики чтобы избежать конфликтов

    // Обработчики для мобильного меню
    document.getElementById('mobileMenuBtn').addEventListener('click', openMobileMenu);
    document.getElementById('menuOverlay').addEventListener('click', closeMobileMenu);
    document.getElementById('modalClose').addEventListener('click', closeModal);

    // Закрытие модального окна при клике вне его
    document.getElementById('playerModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Обработчики для ссылок в футере
    document.querySelectorAll('.footer-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            switchCategory(category);
        });
    });
    
    // Включаем плавную прокрутку
    enableSmoothScrolling();
}

// Запуск инициализации при загрузке страницы
// Отключено для SPA режима - инициализация происходит в spa.js
// window.addEventListener('load', init);