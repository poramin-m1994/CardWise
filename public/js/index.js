import { toggleDarkMode, applyTheme } from './theme.js';
import { loginUser } from './login-handler.js';

document.getElementById('loginForm').addEventListener('submit', loginUser);
document.getElementById('themeLabel').addEventListener('click', toggleDarkMode);

// โหลดธีมเมื่อเปิดหน้า
applyTheme();
