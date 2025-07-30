const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwrcejldAoKiI2v0xUI24aXuf_ZdN78u94se0o46NEDFW-AhxG67LqvkvlDVfcPn3Rmgw/exec';

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
    const res = await fetch(`${SHEET_URL}?sheet=Users`);
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
