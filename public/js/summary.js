
const sessionKey = 'userSession';
if (!localStorage.getItem(sessionKey)) {
  window.location.href = 'login.html';
}

const currentUser = JSON.parse(localStorage.getItem(sessionKey));
console.log('เข้าสู่ระบบในชื่อ:', currentUser.username);

function logout() {
  localStorage.removeItem("userSession");
  window.location.href = "login.html";
}

function toggleDarkMode() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const isNowDark = html.classList.contains('dark');
  localStorage.setItem('theme', isNowDark ? 'dark' : 'light');
  document.getElementById('themeLabel').textContent = isNowDark ? 'ปิดโหมดกลางคืน' : 'เปิดโหมดกลางคืน';
}

document.addEventListener('DOMContentLoaded', () => {
  const isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.getElementById('themeLabel').textContent = 'ปิดโหมดกลางคืน';
  }
});

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwrcejldAoKiI2v0xUI24aXuf_ZdN78u94se0o46NEDFW-AhxG67LqvkvlDVfcPn3Rmgw/exec';
let pie1, pie2;

async function fetchExpenses() {
  const res = await fetch(SHEET_URL);
  return await res.json();
}

function groupByMonth(data) {
  const grouped = {};
  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(item);
  });
  return grouped;
}

function renderTable(data) {
  const tbody = document.getElementById('summaryBody');
  tbody.innerHTML = '';
  data.forEach(item => {
    tbody.innerHTML += `
      <tr>
        <td class="p-2 border">${formatDateToDDMMYYYY(item.date)}</td>
        <td class="p-2 border">${item.amount}</td>
        <td class="p-2 border">${item.card}</td>
        <td class="p-2 border">${item.category}</td>
        <td class="p-2 border">${item.note}</td>
      </tr>
    `;
  });
}

function renderCharts(data) {
  const categoryData = {}, cardData = {};
  let total = 0;
  data.forEach(item => {
    const amt = parseFloat(item.amount);
    total += amt;
    categoryData[item.category] = (categoryData[item.category] || 0) + amt;
    cardData[item.card] = (cardData[item.card] || 0) + amt;
  });

  document.getElementById('totalAmount').textContent = `ยอดรวม: ${total.toLocaleString()} บาท`;
  document.getElementById('totalCardAmount').textContent = `ยอดรวม: ${Object.values(cardData).reduce((a, b) => a + b, 0).toLocaleString()} บาท`;

  if (pie1) pie1.destroy();
  pie1 = new Chart(document.getElementById('pieChartCategory'), {
    type: 'pie',
    data: {
      labels: Object.keys(categoryData),
      datasets: [{
        data: Object.values(categoryData),
        backgroundColor: ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc']
      }]
    }
  });

  if (pie2) pie2.destroy();
  pie2 = new Chart(document.getElementById('pieChartCard'), {
    type: 'pie',
    data: {
      labels: Object.keys(cardData),
      datasets: [{
        data: Object.values(cardData),
        backgroundColor: ['#fcd34d', '#818cf8', '#f472b6', '#4ade80', '#38bdf8']
      }]
    }
  });
}

function sortTable(col) {
  const tbody = document.getElementById("summaryBody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const sorted = rows.sort((a, b) => {
    const aText = a.children[col].textContent;
    const bText = b.children[col].textContent;
    return isNaN(aText) ? aText.localeCompare(bText) : bText - aText;
  });
  tbody.innerHTML = '';
  sorted.forEach(row => tbody.appendChild(row));
}

function formatThaiMonth(ym) {
  const [year, month] = ym.split('-');
  const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${thaiMonths[parseInt(month) - 1]} ${parseInt(year) + 543}`;
}

function formatDateToDDMMYYYY(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// --- ฟิลเตอร์ ---

const cardFilter = document.getElementById("cardFilter");
const categoryFilter = document.getElementById("categoryFilter");

function populateDropdowns(data) {
  const cards = [...new Set(data.map(d => d.card))];
  const categories = [...new Set(data.map(d => d.category))];

  cardFilter.innerHTML = `<option value="">ทั้งหมด</option>`;
  cards.forEach(card => {
    cardFilter.innerHTML += `<option value="${card}">${card}</option>`;
  });

  categoryFilter.innerHTML = `<option value="">ทั้งหมด</option>`;
  categories.forEach(cat => {
    categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function filterData(data) {
  return data.filter(item => {
    const card = cardFilter.value;
    const category = categoryFilter.value;

    const matchCard = card ? item.card === card : true;
    const matchCategory = category ? item.category === category : true;

    return matchCard && matchCategory;
  });
}

function attachFilterEvents(data) {
  [cardFilter, categoryFilter].forEach(el => {
    el.addEventListener('change', () => {
      const filtered = filterData(data);
      renderTable(filtered);
      renderCharts(filtered);
    });
  });
}

// --- MAIN ---
(async () => {
  const data = await fetchExpenses();
  const grouped = groupByMonth(data);
  const select = document.getElementById('monthSelect');

  Object.keys(grouped).forEach(month => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = formatThaiMonth(month);
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    const selectedData = grouped[select.value];
    populateDropdowns(selectedData);
    renderTable(selectedData);
    renderCharts(selectedData);
    attachFilterEvents(selectedData);
    document.getElementById('loadingOverlay').classList.add('hidden');
  });

  const firstMonth = Object.keys(grouped)[0];
  if (firstMonth) {
    select.value = firstMonth;
    const selectedData = grouped[firstMonth];
    populateDropdowns(selectedData);
    renderTable(selectedData);
    renderCharts(selectedData);
    attachFilterEvents(selectedData);
    document.getElementById('loadingOverlay').classList.add('hidden');
  }
})();
