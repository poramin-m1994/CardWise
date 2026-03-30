
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
    const { year, month } = parseYearMonth(item.date);
    if (!year || !month) return;
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
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
  data.forEach(item => {
    const amt = parseFloat(item.amount);
    categoryData[item.category] = (categoryData[item.category] || 0) + amt;
    cardData[item.card] = (cardData[item.card] || 0) + amt;
  });

  // รวมยอดเบื้องต้น (ทั้งหมด)
  const totalCategory = Object.values(categoryData).reduce((a, b) => a + b, 0);
  const totalCard = Object.values(cardData).reduce((a, b) => a + b, 0);

  // แสดงยอดรวมเริ่มต้น
  document.getElementById('totalAmount').textContent = `ยอดรวม: ${totalCategory.toLocaleString()} บาท`;
  document.getElementById('totalCardAmount').textContent = `ยอดรวม: ${totalCard.toLocaleString()} บาท`;

  if (pie1) pie1.destroy();
  if (pie2) pie2.destroy();

  pie1 = new Chart(document.getElementById('pieChartCategory'), {
    type: 'pie',
    data: {
      labels: Object.keys(categoryData),
      datasets: [{
        data: Object.values(categoryData),
        backgroundColor: ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#f472b6', '#a3e635', '#64748b', '#7c3aed']
      }]
    },
    options: {
      plugins: {
        legend: {
          onClick: function (e, legendItem, legend) {
            const chart = legend.chart;
            const datasetIndex = legendItem.datasetIndex;
            const index = legendItem.index;

            const meta = chart.getDatasetMeta(datasetIndex);

            // ✅ toggle visibility using toggleDataVisibility
            chart.toggleDataVisibility(index);

            // ✅ คำนวณยอดใหม่จาก slice ที่ยังแสดงอยู่
            let newTotal = 0;
            chart.data.datasets[0].data.forEach((val, i) => {
              if (chart.isDatasetVisible(datasetIndex) && !chart.getDataVisibility(i)) return;
              if (chart.getDataVisibility(i)) {
                newTotal += val;
              }
            });

            chart.update();
            document.getElementById('totalAmount').textContent = `ยอดรวม: ${newTotal.toLocaleString()} บาท`;
          }

        }
      }
    }
  });

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
  return `${thaiMonths[parseInt(month, 10) - 1]} ${toBuddhistYear(year)}`;
}

function formatDateToDDMMYYYY(dateStr) {
  const parsed = parseDateParts(dateStr);
  if (!parsed) return dateStr;
  const { day, month, year } = parsed;
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

  const monthKeys = Object.keys(grouped);

  // หาเดือนปัจจุบันในรูปแบบ YYYY-MM
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentKey = `${today.getFullYear()}-${currentMonth}`;
  const currentBuddhistKey = `${today.getFullYear() + 543}-${currentMonth}`;

  // ถ้าเดือนปัจจุบันมีอยู่ในข้อมูล ให้เลือกอันนั้น
  const selectedMonth = monthKeys.includes(currentKey)
    ? currentKey
    : monthKeys.includes(currentBuddhistKey)
      ? currentBuddhistKey
      : monthKeys[0];

  if (selectedMonth) {
    select.value = selectedMonth;
    const selectedData = grouped[selectedMonth];
    populateDropdowns(selectedData);
    renderTable(selectedData);
    renderCharts(selectedData);
    attachFilterEvents(selectedData);
    document.getElementById('loadingOverlay').classList.add('hidden');
  }

})();

function parseYearMonth(dateStr) {
  const parsed = parseDateParts(dateStr);
  if (!parsed) return {};
  return {
    year: parsed.year,
    month: Number(parsed.month)
  };
}

function parseDateParts(dateStr) {
  if (!dateStr) return null;

  try {
    const str = dateStr.toString().split(/[T ]/)[0];
    const parts = str.split(/[\/\-.]/);

    if (parts.length >= 3) {
      let p0 = parseInt(parts[0], 10);
      let p1 = parseInt(parts[1], 10);
      let p2 = parseInt(parts[2], 10);

      let year, month, day;
      if (p2 >= 2400 || p2 > 1900) {
        year = p2; month = p1; day = p0;
      } else {
        year = p0; month = p1; day = p2;
      }

      if (year >= 2400) year -= 543;

      const d = dayjs().year(year).month(month - 1).date(day).startOf('day').add(1, 'day');

      if (d && d.isValid()) {
        return {
          day: String(d.date()).padStart(2, '0'),
          month: String(d.month() + 1).padStart(2, '0'),
          year: String(d.year())
        };
      }
    }
  } catch (e) {
    console.error("Error parsing date:", dateStr, e);
  }

  // Fallback to native Date (Local Numeric)
  const fParts = dateStr.toString().split(/[T ]/)[0].split(/[\/\-.]/);
  if (fParts.length >= 3) {
    let y = parseInt(fParts[0], 10);
    let m = parseInt(fParts[1], 10);
    let d = parseInt(fParts[2], 10);
    if (d >= 2400 || d > 1900) { let tmp = y; y = d; d = tmp; }
    if (y >= 2400) y -= 543;
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) {
      return {
        day: String(date.getDate()).padStart(2, '0'),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        year: String(date.getFullYear())
      };
    }
  }

  return null;
}

function toBuddhistYear(year) {
  const numericYear = Number(year);
  if (Number.isNaN(numericYear)) return year;
  return numericYear >= 2400 ? numericYear : numericYear + 543;
}
