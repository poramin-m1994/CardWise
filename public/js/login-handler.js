import { getGoogleSheetUrl, getConfig } from './config.js';

export async function loginUser(e) {
  e.preventDefault();

  const loading = document.getElementById('loadingOverlay');
  const error = document.getElementById('errorMsg');
  const toast = document.getElementById('toast');

  loading.classList.remove('hidden');
  error.classList.add('hidden');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const sheetUrl = await getGoogleSheetUrl();
    const usersSheetName = await getConfig('google_sheets.sheets.users', 'Users');
    const res = await fetch(`${sheetUrl}?sheet=${usersSheetName}`);
    const users = await res.json();
    const found = users.find(user => user.username === username && user.password === password);

    if (found) {
      localStorage.setItem("userSession", JSON.stringify({ username }));

      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
        window.location.href = 'landing.html';
      }, 1500);
    } else {
      error.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      error.classList.remove('hidden');
    }
  } catch (err) {
    console.error("Login error:", err);
    error.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    error.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
}
