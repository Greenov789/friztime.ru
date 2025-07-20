<?php
// Настройки базы данных
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'statusbin_db');

// Настройки сайта
define('SITE_NAME', 'Status.bin');
define('SITE_URL', 'http://localhost/statusbin');
define('POSTS_PER_PAGE', 10);
define('MAX_POST_LENGTH', 10000);
define('MAX_TITLE_LENGTH', 100);

// Цветовая схема
define('PRIMARY_COLOR', '#2c3e50');
define('SECONDARY_COLOR', '#34495e');
define('ACCENT_COLOR', '#3498db');
define('BACKGROUND_COLOR', '#f8f9fa');
define('TEXT_COLOR', '#333333');

// Включить отладку
define('DEBUG_MODE', true);

// Старт сессии
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

date_default_timezone_set('Europe/Moscow');
?>