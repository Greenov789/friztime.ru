// Настройки администратора (ЗАМЕНИТЕ НА СВОИ!)
const ADMIN_CREDENTIALS = {
    login: "kgjoiefjeoi",      // Ваш логин
    password: "gehjgefkefieefje" // Ваш пароль
};

// Проверка входа
document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const login = document.getElementById('adminLogin').value;
    const password = document.getElementById('adminPassword').value;
    
    if (login === ADMIN_CREDENTIALS.login && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('statusbin_admin', 'true');
        window.location.href = 'admin-panel.html';
    } else {
        alert('Wrong login or password!');
    }
});