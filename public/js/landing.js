import { applyTheme, toggleDarkMode } from './theme.js';
import { checkLogin, logout } from './auth.js';

document.getElementById('themeLabel').addEventListener('click', toggleDarkMode);
document.querySelector('button[onclick="logout()"]').addEventListener('click', logout);

// เช็ค session และโหลดธีม
checkLogin();
applyTheme();
