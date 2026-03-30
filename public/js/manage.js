import { applyTheme, toggleDarkMode } from './theme.js';
import { checkLogin, logout } from './auth.js';

const URL = 'https://script.google.com/macros/s/AKfycbwrcejldAoKiI2v0xUI24aXuf_ZdN78u94se0o46NEDFW-AhxG67LqvkvlDVfcPn3Rmgw/exec';

document.getElementById('themeLabel')?.addEventListener('click', toggleDarkMode);
document.querySelector('button[onclick="logout()"]')?.addEventListener('click', logout);

// ตรวจสอบ session และ theme
checkLogin();
applyTheme();

const loadingOverlay = document.getElementById('loadingOverlay');

function toggleLoading(show) {
    if (!loadingOverlay) return;
    if (show) {
        loadingOverlay.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
    }
}

async function fetchList(sheetName) {
  const res = await fetch(`${URL}?sheet=${sheetName}`);
  return await res.json();
}

async function renderLists() {
  toggleLoading(true);
  try {
    const categories = await fetchList("Categories");
    const cards = await fetchList("Cards");

    const categoryList = document.getElementById('categoryList');
    const cardList = document.getElementById('cardList');

    if (categoryList) {
        categoryList.innerHTML = categories.map(c => `
            <div class="flex justify-between items-center bg-slate-700/40 hover:bg-slate-700 transition px-5 py-4 rounded-xl group border border-slate-700/50">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-mint shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                    <span class="text-sm font-bold text-gray-200">${c.name}</span>
                </div>
                <button onclick="deleteItem('category','${c.name}')" class="text-xs font-extrabold text-gray-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 uppercase tracking-widest">
                    <i class="fa-solid fa-trash-can mr-1"></i> ลบ
                </button>
            </div>
        `).join('');
    }

    if (cardList) {
        cardList.innerHTML = cards.map(c => `
            <div class="flex justify-between items-center bg-slate-700/40 hover:bg-slate-700 transition px-5 py-4 rounded-xl group border border-slate-700/50">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
                    <span class="text-sm font-bold text-gray-200">${c.name}</span>
                </div>
                <button onclick="deleteItem('card','${c.name}')" class="text-xs font-extrabold text-gray-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 uppercase tracking-widest">
                    <i class="fa-solid fa-trash-can mr-1"></i> ลบ
                </button>
            </div>
        `).join('');
    }

  } catch (error) {
    console.error("Error rendering lists:", error);
    showToast("ไม่สามารถโหลดข้อมูลได้", "error");
  } finally {
    toggleLoading(false);
  }
}

window.addItem = async function(type) {
  const inputId = type === 'category' ? 'newCategory' : 'newCard';
  const inputElem = document.getElementById(inputId);
  const name = inputElem.value.trim();
  
  if (!name) {
    showToast("กรุณาระบุชื่อที่ต้องการเพิ่ม", "error");
    return;
  }

  toggleLoading(true);
  try {
    await fetch(URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        sheet: type === 'category' ? 'Categories' : 'Cards',
        name
      })
    });
    inputElem.value = '';
    showToast("เพิ่มข้อมูลเรียบร้อยแล้ว!");
    renderLists();
  } catch (error) {
    showToast("เกิดข้อผิดพลาดในการเพิ่มข้อมูล", "error");
    toggleLoading(false);
  }
};

window.deleteItem = async function(type, name) {
  if (!confirm(`ยืนยันการลบ "${name}" ?`)) return;

  toggleLoading(true);
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
      showToast("ลบข้อมูลเรียบร้อยแล้ว");
      renderLists();
    } else {
      showToast("ลบไม่สำเร็จ: " + text, "error");
      toggleLoading(false);
    }
  } catch (error) {
    showToast("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    toggleLoading(false);
  }
};

document.addEventListener('DOMContentLoaded', renderLists);

function showToast(message, type = "success") {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    
    if (type === "error") {
        toast.classList.remove('border-l-mint');
        toast.classList.add('border-l-red-500');
        toastIcon.className = "fa-solid fa-circle-exclamation text-red-500";
    } else {
        toast.classList.add('border-l-mint');
        toast.classList.remove('border-l-red-500');
        toastIcon.className = "fa-solid fa-circle-check text-mint";
    }

    toast.classList.remove('opacity-0', 'translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-10');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3000);
}
