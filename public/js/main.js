import { applyTheme, toggleDarkMode } from './theme.js';
import { checkLogin, logout } from './auth.js';
import { fetchSheet, postExpense } from './sheets.js';
import { toFormattedDate, toInputDate } from './date.js';

document.getElementById('themeLabel').addEventListener('click', toggleDarkMode);
document.querySelector('button[onclick="logout()"]').addEventListener('click', logout);

// check login & apply theme
checkLogin();
applyTheme();

const formContainer = document.getElementById('mainFormContainer');
const loading = document.getElementById('loadingOverlay');
const form = document.getElementById('expenseForm');
const dateInput = document.getElementById('dateInput');

async function populateDropdowns() {
  const cards = await fetchSheet("Cards");
  const categories = await fetchSheet("Categories");

  const cardSelect = form.card;
  const categorySelect = form.category;

  cards.forEach(card => {
    const option = document.createElement('option');
    option.value = card.name;
    option.textContent = card.name;
    cardSelect.appendChild(option);
  });

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });

  loading.classList.add('hidden');
  formContainer.classList.remove('hidden');
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  loading.classList.remove('hidden');

  const isoDate = toInputDate(dateInput.value); // ใช้ helper function ใหม่

  const data = {
    date: isoDate,
    amount: form.amount.value,
    card: form.card.value,
    category: form.category.value,
    note: form.note.value
  };

  await postExpense(data);
  alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
  form.reset();
  loading.classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
  populateDropdowns();

  dateInput.addEventListener('focus', () => {
    dateInput.type = 'date';
    const val = dateInput.value;
    if (val.includes('/')) {
        dateInput.value = toInputDate(val); // => yyyy-MM-dd
    }
   });

  dateInput.addEventListener('blur', () => {
    if (dateInput.value && dateInput.type === 'date') {
        const rawVal = dateInput.value; // yyyy-MM-dd
        dateInput.type = 'text'; // ❗ เปลี่ยน type ก่อน!
        dateInput.value = toFormattedDate(rawVal); // แสดงเป็น DD/MM/YYYY
    } else {
        dateInput.type = 'text';
    }
});




  const isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.getElementById('themeLabel').textContent = 'ปิดโหมดกลางคืน';
  }
});