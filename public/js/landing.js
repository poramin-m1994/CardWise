import { applyTheme, toggleDarkMode } from './theme.js';
import { checkLogin, logout } from './auth.js';
import { fetchSheet, fetchExpenses, postExpense } from './sheets.js';

document.getElementById('themeLabel')?.addEventListener('click', toggleDarkMode);
document.querySelector('button[onclick="logout()"]')?.addEventListener('click', logout);

// เช็ค session และโหลดธีม
checkLogin();
applyTheme();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const cards = await fetchSheet("Cards");
        const categories = await fetchSheet("Categories");

        const cardSelect = document.getElementById('cardSelect');
        if (cardSelect && cards) {
            cardSelect.innerHTML = '<option value="">เลือกบัตร</option>';
            cards.forEach(card => {
                const option = document.createElement('option');
                option.value = card.name;
                option.textContent = card.name;
                cardSelect.appendChild(option);
            });
        }

        const categoryContainer = document.getElementById('categoryContainer');
        if (categoryContainer && categories) {
            categoryContainer.innerHTML = ''; // Clear loading
            categories.forEach((cat, index) => {
                const pill = document.createElement('div');
                pill.textContent = cat.name;
                pill.dataset.value = cat.name;
                
                const defaultClass = "px-4 py-2 bg-[#23304a] text-gray-300 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-600 transition flex items-center gap-2 category-pill";
                const selectedClass = "px-4 py-2 bg-mint rounded-lg text-slate-900 text-xs font-bold cursor-pointer flex items-center gap-2 category-pill selected";
                
                pill.className = index === 0 ? selectedClass : defaultClass;

                pill.addEventListener('click', () => {
                    document.querySelectorAll('.category-pill').forEach(p => {
                        p.className = defaultClass;
                        p.classList.remove('selected');
                    });
                    pill.className = selectedClass;
                });

                categoryContainer.appendChild(pill);
            });
        }

        // Fetch all expenses initially
        const expenses = await fetchExpenses();

        // Setup Global Month/Year Filter
        initGlobalFilter(expenses);
        
        // Setup Filter Bar (for search/category/card)
        initFilterBar();

        // Initialize Modal Logic
        initTransactionModal();

    } catch (err) {
        console.error("Error loading dashboard data:", err);
    }
});

let doughnutChart;
let barChart;
let loadedExpenses = []; // Store current month's expenses for sub-filtering
const CHART_COLORS = ['#4ade80', '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', '#818cf8', '#fbbf24', '#f87171', '#94a3b8'];

function initGlobalFilter(expenses) {
    const select = document.getElementById('globalMonthSelect');
    if (!select) return;

    // Group available months from data
    const monthMap = {};
    expenses.forEach(item => {
        const d = parseSheetDate(item.date);
        if (!d) return;
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthMap[key]) {
            monthMap[key] = d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
        }
    });

    const sortedKeys = Object.keys(monthMap).sort().reverse();
    select.innerHTML = sortedKeys.map(k => `<option value="${k}">${monthMap[k]}</option>`).join('');

    // Default to current month if available, else latest
    const today = new Date();
    const currentKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (sortedKeys.includes(currentKey)) {
        select.value = currentKey;
    } else if (sortedKeys.length > 0) {
        select.value = sortedKeys[0];
    }

    // Initial Render
    refreshDashboard(expenses, select.value);

    // Event Listener
    select.addEventListener('change', () => {
        refreshDashboard(expenses, select.value);
    });
}

function refreshDashboard(allExpenses, monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    
    // Update all components with selected month/year
    updateDashboardTotals(allExpenses, month, year);
    renderTransactionHistory(allExpenses, month, year);
    updateCategorySpending(allExpenses, month, year);
    updateMonthlyInsights(allExpenses, month, year);
}

function initFilterBar() {
    const filterPanel = document.getElementById('filterPanel');
    const toggleFilterBtn = document.getElementById('toggleFilterBtn');
    const toggleSearchBtn = document.getElementById('toggleSearchBtn');
    
    if (!filterPanel || !toggleFilterBtn || !toggleSearchBtn) return;

    const toggle = () => {
        if (filterPanel.classList.contains('max-h-0')) {
            filterPanel.classList.remove('max-h-0', 'opacity-0', 'mb-0');
            filterPanel.classList.add('max-h-96', 'opacity-100', 'mb-6');
        } else {
            filterPanel.classList.add('max-h-0', 'opacity-0', 'mb-0');
            filterPanel.classList.remove('max-h-96', 'opacity-100', 'mb-6');
        }
    };

    toggleFilterBtn.addEventListener('click', toggle);
    toggleSearchBtn.addEventListener('click', toggle);

    // Setup filter listeners
    const searchInput = document.getElementById('historySearch');
    const catFilter = document.getElementById('historyCategoryFilter');
    const cardFilter = document.getElementById('historyCardFilter');

    const runFilter = () => {
        const query = (searchInput.value || "").toLowerCase();
        const cat = catFilter.value;
        const card = cardFilter.value;

        const filtered = loadedExpenses.filter(item => {
            const matchesSearch = !query || (item.note && item.note.toLowerCase().includes(query)) || (item.category && item.category.toLowerCase().includes(query));
            const matchesCat = !cat || item.category === cat;
            const matchesCard = !card || item.card === card;
            return matchesSearch && matchesCat && matchesCard;
        });

        renderTransactionList(filtered);
    };

    searchInput.addEventListener('input', runFilter);
    catFilter.addEventListener('change', runFilter);
    cardFilter.addEventListener('change', runFilter);
}

function updateFilterDropdowns(expenses) {
    const catFilter = document.getElementById('historyCategoryFilter');
    const cardFilter = document.getElementById('historyCardFilter');
    
    if (!catFilter || !cardFilter) return;

    const categories = [...new Set(expenses.map(e => e.category))].filter(Boolean).sort();
    const cards = [...new Set(expenses.map(e => e.card))].filter(Boolean).sort();

    catFilter.innerHTML = '<option value="">ทุกหมวดหมู่</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');
    cardFilter.innerHTML = '<option value="">ทุกบัตร</option>' + cards.map(c => `<option value="${c}">${c}</option>`).join('');
}

let selectedCategory = '';

function initTransactionModal() {
    const modal = document.getElementById('expenseModal');
    const fab = document.getElementById('fab');
    const closeBtn = document.getElementById('closeModal');
    const recordBtn = document.getElementById('recordExpense');
    const dateInput = document.getElementById('modalDate');

    if (!modal || !fab || !closeBtn || !recordBtn) return;

    // Set default date to today (yyyy-mm-dd for input type="date")
    if (dateInput) {
        dateInput.value = dayjs().format('YYYY-MM-DD');
    }

    const toggleModal = () => {
        if (modal.classList.contains('opacity-0')) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.firstElementChild.classList.remove('translate-y-5');
        } else {
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.firstElementChild.classList.add('translate-y-5');
        }
    };

    fab.addEventListener('click', toggleModal);
    closeBtn.addEventListener('click', toggleModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) toggleModal(); });

    // Handle record button click
    recordBtn.addEventListener('click', async () => {
        const amount = document.getElementById('modalAmount').value;
        const dateVal = document.getElementById('modalDate').value;
        const card = document.getElementById('cardSelect').value;
        const note = document.getElementById('modalNote').value;

        // Get selected category from pills
        const activePill = document.querySelector('.category-pill.selected');
        const category = activePill ? activePill.dataset.value : '';

        if (!amount || isNaN(amount)) {
            showToast("กรุณาระบุจำนวนเงินให้ถูกต้อง", "error");
            return;
        }
        if (!card) {
            showToast("กรุณาเลือกบัตร/บัญชี", "error");
            return;
        }

        recordBtn.disabled = true;
        recordBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...';

        try {
            // Format date for backend (YYYY+543/MM/DD)
            const d = dayjs(dateVal);
            const formattedDate = `${d.year() + 543}/${String(d.month() + 1).padStart(2, '0')}/${String(d.date()).padStart(2, '0')}`;

            const data = {
                date: formattedDate,
                amount: amount,
                card: card,
                category: category,
                note: note
            };

            await postExpense(data);
            
            showToast("บันทึกข้อมูลเรียบร้อยแล้ว!");
            toggleModal();
            
            // Reset fields
            document.getElementById('modalAmount').value = '';
            document.getElementById('modalNote').value = '';
            
            // Refresh Dashboard
            const freshExpenses = await fetchExpenses();
            updateDashboardTotals(freshExpenses);
            renderTransactionHistory(freshExpenses);
            updateCategorySpending(freshExpenses);
            updateMonthlyInsights(freshExpenses);

        } catch (err) {
            console.error("Error posting expense:", err);
            showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
        } finally {
            recordBtn.disabled = false;
            recordBtn.innerHTML = 'บันทึกรายจ่าย';
        }
    });
}

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


async function updateMonthlyInsights(expenses, refMonth, refYear) {
    const chartCanvas = document.getElementById('barChart');
    if (!chartCanvas) return;

    const today = new Date();
    const refDate = (refMonth && refYear) ? new Date(refYear, refMonth - 1, 1) : today;
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
        last6Months.push({
            month: d.getMonth() + 1,
            year: d.getFullYear(),
            label: d.toLocaleDateString('th-TH', { month: 'short' }).toUpperCase(),
            amount: 0
        });
    }

    expenses.forEach(item => {
        const d = parseSheetDate(item.date);
        if (!d) return;
        
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const amt = Math.abs(parseFloat(item.amount) || 0);

        // Record spending if not income
        if (item.category !== 'รายได้' && item.category !== 'Income') {
            const found = last6Months.find(l => l.month === m && l.year === y);
            if (found) found.amount += amt;
        }
    });

    const labels = last6Months.map(l => l.label);
    const data = last6Months.map(l => l.amount);

    if (barChart) {
        barChart.data.labels = labels;
        barChart.data.datasets[0].data = data;
        barChart.update();
    } else {
        const ctx = chartCanvas.getContext('2d');
        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: (ctx) => {
                        return ctx.dataIndex === 5 ? '#4ade80' : '#23304a';
                    },
                    borderRadius: 4,
                    barThickness: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { 
                    callbacks: {
                        label: function(context) {
                            return '฿' + context.parsed.y.toLocaleString('th-TH');
                        }
                    }
                } },
                scales: {
                    y: { display: false },
                    x: { 
                      grid: { display: false, drawBorder: false },
                      ticks: { 
                        color: (ctx) => ctx.index === 5 ? '#4ade80' : '#9ca3af',
                        font: { size: 10, weight: 'bold' }
                      }
                    }
                }
            }
        });
    }
}

async function updateCategorySpending(expenses, refMonth, refYear) {
    const today = new Date();
    const currentM = refMonth || today.getMonth() + 1;
    const currentY = refYear || today.getFullYear();

    const spendingMonthElem = document.getElementById('spendingMonth');
    const spendingTotalElem = document.getElementById('spendingTotal');
    const categoryLegend = document.getElementById('categoryLegend');
    const chartCanvas = document.getElementById('doughnutChart');

    if (!chartCanvas || !categoryLegend) return;

    // Include all transactions in spending unless it's categorized as Income
    const currentMonthExpenses = expenses.filter(item => {
        const d = parseSheetDate(item.date);
        const isNotIncome = item.category !== 'รายได้' && item.category !== 'Income';
        return d && d.getFullYear() === currentY && (d.getMonth() + 1) === currentM && isNotIncome;
    });

    const categoryMap = {};
    let totalSpending = 0;

    currentMonthExpenses.forEach(item => {
        const amt = Math.abs(parseFloat(item.amount) || 0);
        categoryMap[item.category] = (categoryMap[item.category] || 0) + amt;
        totalSpending += amt;
    });

    const sortedCategories = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedCategories.map(c => c[0]);
    const data = sortedCategories.map(c => c[1]);
    const backgroundColors = sortedCategories.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    // Update Center Text
    if (spendingMonthElem) {
        spendingMonthElem.textContent = today.toLocaleDateString('th-TH', { month: 'short' });
    }
    if (spendingTotalElem) {
        spendingTotalElem.textContent = '฿' + (totalSpending >= 1000 ? (totalSpending/1000).toFixed(1) + 'k' : totalSpending.toFixed(0));
    }

    // Update Legend
    categoryLegend.innerHTML = '';
    sortedCategories.forEach(([cat, val], i) => {
        const percent = ((val / totalSpending) * 100).toFixed(0);
        const color = backgroundColors[i];
        
        const legendItem = document.createElement('div');
        legendItem.className = "flex items-center gap-4 text-xs font-extrabold text-white";
        legendItem.innerHTML = `
            <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></div>
            ${cat} (${percent}%)
        `;
        categoryLegend.appendChild(legendItem);
    });

    // Update or Init Chart
    if (doughnutChart) {
        doughnutChart.data.labels = labels;
        doughnutChart.data.datasets[0].data = data;
        doughnutChart.data.datasets[0].backgroundColor = backgroundColors;
        doughnutChart.update();
    } else {
        const ctx = chartCanvas.getContext('2d');
        doughnutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== null) {
                                    label += '฿' + context.parsed.toLocaleString('th-TH');
                                }
                                return label;
                            }
                        }
                    }
                },
                cutout: '80%'
            }
        });
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
    return categoryIcons[category] || "fa-tags";
}

async function renderTransactionHistory(expenses, refMonth, refYear) {
    const today = new Date();
    const currentM = refMonth || today.getMonth() + 1;
    const currentY = refYear || today.getFullYear();

    // Filter for current month
    loadedExpenses = expenses.filter(item => {
        const d = parseSheetDate(item.date);
        return d && d.getFullYear() === currentY && (d.getMonth() + 1) === currentM;
    });

    // Populate dropdowns based on this month's data
    updateFilterDropdowns(loadedExpenses);

    // Initial render
    renderTransactionList(loadedExpenses);
}

function renderTransactionList(expensesToRender) {
    const transactionList = document.getElementById('transactionList');
    if (!transactionList) return;

    // Sort by date descending
    const sorted = [...expensesToRender].sort((a, b) => {
        const dateA = parseSheetDate(a.date) || new Date(0);
        const dateB = parseSheetDate(b.date) || new Date(0);
        return dateB - dateA;
    });

    transactionList.innerHTML = '';

    if (sorted.length === 0) {
        transactionList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-40 text-gray-500 font-medium">
                <i class="fa-solid fa-receipt text-3xl mb-3 opacity-20"></i>
                <p>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            </div>
        `;
        return;
    }

    sorted.forEach(item => {
        const date = parseSheetDate(item.date);
        const dateStr = date ? date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : item.date;
        const timeStr = date ? date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
        const amount = parseFloat(item.amount) || 0;
        const isIncome = amount > 0;
        const icon = getIconForCategory(item.category);

        const row = document.createElement('div');
        row.className = "grid grid-cols-12 gap-4 items-center py-4 px-2 hover:bg-slate-700/50 rounded-xl transition cursor-pointer";
        row.innerHTML = `
            <div class="col-span-3 flex flex-col">
                <span class="text-xs font-bold text-white mb-0.5">${dateStr}</span>
                <span class="text-[10px] text-gray-400 font-bold tracking-wide">${timeStr}</span>
            </div>
            <div class="col-span-3 flex items-center gap-3 w-full">
                <div class="w-8 h-8 rounded-lg bg-slate-700 flex-shrink-0 flex items-center justify-center ${isIncome ? 'text-mint' : 'text-gray-400'} text-xs">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <span class="text-xs font-bold text-white truncate">${item.category || 'ทั่วไป'}</span>
            </div>
            <div class="col-span-4 flex items-center">
                <span class="text-xs font-medium text-gray-300 truncate">${item.note || '-'}</span>
            </div>
            <div class="col-span-2 text-right">
                <span class="text-sm font-bold ${isIncome ? 'text-mint' : 'text-white'}">
                    ${isIncome ? '+' : ''}${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
        `;
        transactionList.appendChild(row);
    });
}

function parseSheetDate(dateStr) {
    if (!dateStr) return null;

    try {
        const str = dateStr.toString().split(/[T ]/)[0]; // Remove time if present
        const parts = str.split(/[\/\-.]/);

        if (parts.length >= 3) {
            let p0 = parseInt(parts[0], 10);
            let p1 = parseInt(parts[1], 10);
            let p2 = parseInt(parts[2], 10);

            let year, month, day;
            // Year Detection (BE years usually >= 2400, CE years 1900-2100)
            if (p2 >= 2400 || p2 > 1900) { 
                year = p2; month = p1; day = p0;
            } else { 
                year = p0; month = p1; day = p2;
            }

            if (year >= 2400) year -= 543;
            
            // USE NUMERIC SETTERS FOR MAXIMUM RELIABILITY
            // .month() is 0-indexed in dayjs
            // MANUALLY SHIFTING +1 DAY as requested by user to fix the 1-day back shift
            const d = dayjs().year(year).month(month - 1).date(day).startOf('day').add(1, 'day');
            
            if (d.isValid()) return d.toDate();
        }
    } catch (e) {
        console.error("Error parsing date:", dateStr, e);
    }

    // Ultra-safe fallback using native Date constructor with numeric parts
    const fallbackParts = dateStr.toString().split(/[T ]/)[0].split(/[\/\-.]/);
    if (fallbackParts.length >= 3) {
        let y = parseInt(fallbackParts[0], 10);
        let m = parseInt(fallbackParts[1], 10);
        let d = parseInt(fallbackParts[2], 10);
        if (d >= 2400 || d > 1900) { let tmp = y; y = d; d = tmp; }
        if (y >= 2400) y -= 543;
        return new Date(y, m - 1, d);
    }

    return null;
}

async function updateDashboardTotals(expenses, refMonth, refYear) {
    try {
        if (!expenses) expenses = await fetchExpenses();
        
        const today = new Date();
        const currentM = refMonth || today.getMonth() + 1;
        const currentY = refYear || today.getFullYear();
        const prevM = currentM === 1 ? 12 : currentM - 1;
        const prevY = currentM === 1 ? currentY - 1 : currentY;

        let currentTotal = 0;
        let prevTotal = 0;

        expenses.forEach(item => {
            const d = parseSheetDate(item.date);
            if (!d) return;

            const sheetYear = d.getFullYear();
            const sheetMonth = d.getMonth() + 1;
            const amt = parseFloat(item.amount) || 0;
            
            if(sheetYear === currentY && sheetMonth === currentM) {
                currentTotal += amt;
            } else if (sheetYear === prevY && sheetMonth === prevM) {
                prevTotal += amt;
            }
        });

        const balanceElem = document.getElementById('totalBalanceAmount');
        const percentElem = document.getElementById('totalBalancePercent');
        
        if (balanceElem) {
            balanceElem.textContent = '฿' + currentTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        if (percentElem) {
            if (prevTotal === 0) {
                if (currentTotal > 0) {
                    percentElem.textContent = '+100%';
                    percentElem.className = 'bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-md mb-1';
                } else {
                    percentElem.textContent = '0%';
                    percentElem.className = 'bg-slate-700 text-gray-400 text-xs font-bold px-2 py-1 rounded-md mb-1';
                }
            } else {
                const diff = currentTotal - prevTotal;
                const pct = (diff / prevTotal) * 100;
                let sign = pct > 0 ? '+' : '';
                percentElem.textContent = sign + pct.toFixed(1) + '%';
                
                // Color Logic: - = Green (Mint), + = Red
                if (pct < 0) {
                    percentElem.className = 'bg-[#103020] text-mint text-xs font-bold px-2 py-1 rounded-md mb-1';
                } else if (pct > 0) {
                    percentElem.className = 'bg-red-500/20 text-red-500 text-xs font-bold px-2 py-1 rounded-md mb-1';
                } else {
                    percentElem.className = 'bg-slate-700 text-gray-400 text-xs font-bold px-2 py-1 rounded-md mb-1';
                }
            }
        }

    } catch(err) {
        console.error("Error in updateDashboardTotals:", err);
    }
}

