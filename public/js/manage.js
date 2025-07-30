import { applyTheme, toggleDarkMode } from './theme.js';
import { checkLogin, logout } from './auth.js';

const URL = 'https://script.google.com/macros/s/AKfycbwrcejldAoKiI2v0xUI24aXuf_ZdN78u94se0o46NEDFW-AhxG67LqvkvlDVfcPn3Rmgw/exec';

document.getElementById('themeLabel').addEventListener('click', toggleDarkMode);
document.querySelector('button[onclick="logout()"]').addEventListener('click', logout);

// ตรวจสอบ session และ theme
checkLogin();
applyTheme();

const loading = document.getElementById('loadingScreen');
const content = document.getElementById('mainContent');

async function fetchList(sheetName) {
  const res = await fetch(`${URL}?sheet=${sheetName}`);
  return await res.json();
}

async function renderLists() {
  const categories = await fetchList("Categories");
  const cards = await fetchList("Cards");

  document.getElementById('categoryList').innerHTML = categories.map(c =>
    `<li class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md">
      <span>${c.name}</span>
      <button onclick="deleteItem('category','${c.name}')" class="text-red-600 dark:text-red-400 hover:underline text-sm">ลบ</button>
    </li>`).join('');

  document.getElementById('cardList').innerHTML = cards.map(c =>
    `<li class="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md">
      <span>${c.name}</span>
      <button onclick="deleteItem('card','${c.name}')" class="text-red-600 dark:text-red-400 hover:underline text-sm">ลบ</button>
    </li>`).join('');

  loading.style.display = 'none';
  content.classList.remove('hidden');
}

window.addItem = async function(type) {
  const inputId = type === 'category' ? 'newCategory' : 'newCard';
  const name = document.getElementById(inputId).value.trim();
  if (!name) return alert('กรุณากรอกชื่อ');

  loading.style.display = 'flex';
  try {
    await fetch(URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        sheet: type === 'category' ? 'Categories' : 'Cards',
        name
      })
    });
    document.getElementById(inputId).value = '';
    showToast("✅ เพิ่มข้อมูลเรียบร้อยแล้ว!");
  } catch (error) {
    showToast("❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
  }
  loading.style.display = 'none';
  renderLists();
};

window.deleteItem = async function(type, name) {
  if (!confirm(`ลบ "${name}" ใช่ไหม?`)) return;

  loading.style.display = 'flex';
  try {
    const res = await fetch(URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete',
        sheet: type === 'category' ? 'Categories' : 'Cards',
        name
      })
    });
    const text = await res.text();
    if (text === 'Deleted') {
      showToast("✅ ลบข้อมูลเรียบร้อยแล้ว");
    } else {
      showToast("❌ ลบไม่สำเร็จ: " + text);
    }
  } catch (error) {
    showToast("❌ เกิดข้อผิดพลาดในการลบข้อมูล");
  }
  loading.style.display = 'none';
  renderLists();
};

document.addEventListener('DOMContentLoaded', renderLists);

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');

  // ซ่อนหลัง 3 วินาที
  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 3000);
}
