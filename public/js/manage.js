import { applyTheme, toggleDarkMode } from './theme.js';
import { checkLogin, logout } from './auth.js';
import { fetchSheet, getGoogleSheetUrl, setCache, CACHE_KEYS } from './sheets.js';


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

const categoryIcons = {
    "อาหาร": "fa-utensils",
    "Food": "fa-utensils",
    "Dining": "fa-utensils",
    "เดินทาง": "fa-car",
    "Transport": "fa-car",
    "Travel": "fa-car",
    "ช้อปปิ้ง": "fa-bag-shopping",
    "Shopping": "fa-bag-shopping",
    "บันเทิง": "fa-gamepad",
    "Entertainment": "fa-gamepad",
    "ที่พัก": "fa-house",
    "Housing": "fa-house",
    "Rent": "fa-house",
    "สุขภาพ": "fa-heart-pulse",
    "Health": "fa-heart-pulse",
    "รายได้": "fa-money-bill-wave",
    "Income": "fa-money-bill-wave"
};

function getIconForCategory(category) {
    return categoryIcons[category] || "fa-tag";
}

function updateCategoryDOM(categories) {
    const categoryList = document.getElementById('categoryList');
    const categoryCountBadge = document.getElementById('categoryCountBadge');

    if (categoryCountBadge && Array.isArray(categories)) {
        categoryCountBadge.textContent = `${categories.length} รายการ`;
    }

    if (categoryList) {
        if (!categories || categories.length === 0) {
            categoryList.innerHTML = '<div class="text-center py-8 text-xs text-slate-400 font-medium">ยังไม่มีหมวดหมู่</div>';
        } else {
            categoryList.innerHTML = categories.map(c => {
                const icon = getIconForCategory(c.name);
                return `
                <div class="flex justify-between items-center bg-surface-0/70 hover:bg-surface-2 transition-all duration-200 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl group border border-slate-border/50 hover:border-mint/30">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-xl bg-surface-2 group-hover:bg-mint/10 text-mint flex items-center justify-center text-xs transition-colors flex-shrink-0 border border-slate-border/50">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <span class="text-xs sm:text-sm font-bold text-white truncate">${c.name}</span>
                    </div>
                    <button onclick="deleteItem('category','${c.name}')" type="button" class="text-xs font-bold text-slate-400 hover:text-coral transition-colors px-2.5 py-1.5 rounded-xl hover:bg-coral-dim cursor-pointer flex items-center gap-1">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                        <span class="hidden sm:inline">ลบ</span>
                    </button>
                </div>
            `;}).join('');
        }
    }
}

function updateCardDOM(cards) {
    const cardList = document.getElementById('cardList');
    const cardCountBadge = document.getElementById('cardCountBadge');

    if (cardCountBadge && Array.isArray(cards)) {
        cardCountBadge.textContent = `${cards.length} ใบ`;
    }

    if (cardList) {
        if (!cards || cards.length === 0) {
            cardList.innerHTML = '<div class="text-center py-8 text-xs text-slate-400 font-medium">ยังไม่มีข้อมูลบัตร</div>';
        } else {
            cardList.innerHTML = cards.map(c => `
                <div class="flex justify-between items-center bg-surface-0/70 hover:bg-surface-2 transition-all duration-200 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl group border border-slate-border/50 hover:border-indigo-400/30">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-xl bg-surface-2 group-hover:bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs transition-colors flex-shrink-0 border border-slate-border/50">
                            <i class="fa-solid fa-credit-card"></i>
                        </div>
                        <span class="text-xs sm:text-sm font-bold text-white truncate">${c.name}</span>
                    </div>
                    <button onclick="deleteItem('card','${c.name}')" type="button" class="text-xs font-bold text-slate-400 hover:text-coral transition-colors px-2.5 py-1.5 rounded-xl hover:bg-coral-dim cursor-pointer flex items-center gap-1">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                        <span class="hidden sm:inline">ลบ</span>
                    </button>
                </div>
            `).join('');
        }
    }
}

async function renderLists(showOverlay = false) {
  if (showOverlay) toggleLoading(true);
  try {
    // SWR fetch with instant cache return and background revalidation
    const categories = await fetchSheet("Categories", {
        onFreshData: updateCategoryDOM,
        forceRefresh: showOverlay
    });
    updateCategoryDOM(categories);

    const cards = await fetchSheet("Cards", {
        onFreshData: updateCardDOM,
        forceRefresh: showOverlay
    });
    updateCardDOM(cards);

  } catch (error) {
    console.error("Error rendering lists:", error);
    showToast("ไม่สามารถโหลดข้อมูลได้", "error");
  } finally {
    if (showOverlay) toggleLoading(false);
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
    const sheetUrl = await getGoogleSheetUrl();
    await fetch(sheetUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        sheet: type === 'category' ? 'Categories' : 'Cards',
        name
      })
    });
    inputElem.value = '';
    showToast("เพิ่มข้อมูลเรียบร้อยแล้ว!");
    await renderLists(true);
  } catch (error) {
    showToast("เกิดข้อผิดพลาดในการเพิ่มข้อมูล", "error");
    toggleLoading(false);
  }
};

window.deleteItem = async function(type, name) {
  if (!confirm(`ยืนยันการลบ "${name}" ?`)) return;

  toggleLoading(true);
  try {
    const sheetUrl = await getGoogleSheetUrl();
    const res = await fetch(sheetUrl, {
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
      await renderLists(true);
    } else {
      showToast("ลบไม่สำเร็จ: " + text, "error");
      toggleLoading(false);
    }
  } catch (error) {
    showToast("เกิดข้อผิดพลาดในการลบข้อมูล", "error");
    toggleLoading(false);
  }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initial instant render from cache without blocking loading overlay
    renderLists(false);

    // Support Enter key on input fields
    document.getElementById('newCategory')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.addItem('category');
        }
    });

    document.getElementById('newCard')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.addItem('card');
        }
    });
});

function showToast(message, type = "success") {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    
    if (type === "error") {
        toast.classList.remove('border-l-mint');
        toast.classList.add('border-l-coral');
        toastIcon.className = "fa-solid fa-circle-exclamation text-coral";
    } else {
        toast.classList.add('border-l-mint');
        toast.classList.remove('border-l-coral');
        toastIcon.className = "fa-solid fa-circle-check text-mint";
    }

    toast.classList.remove('opacity-0', '-translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-10');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 3000);
}
