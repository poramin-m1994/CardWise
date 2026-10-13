import { applyTheme, toggleDarkMode } from './theme.js';
import { checkLogin, logout } from './auth.js';
import { fetchSheet, fetchExpenses, fetchFixedCosts, postFixedCost, deleteFixedCost } from './sheets.js';

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

let cachedCards = [];
let cachedFixedCosts = [];
let cachedExpenses = [];
let currentFilter = 'all';
let currentSearch = '';

/**
 * Format currency helper
 */
function formatMoney(amount) {
    const num = parseFloat(amount) || 0;
    return '฿' + num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Populate Cards dropdown in the add form
 */
function populateCards(cards) {
    cachedCards = cards || [];
    const select = document.getElementById('fcCard');
    if (!select) return;

    if (!Array.isArray(cards) || cards.length === 0) {
        select.innerHTML = '<option value="">ไม่มีข้อมูลบัตร (กรุณาเพิ่มในหน้าจัดการ)</option>';
        return;
    }

    select.innerHTML = '<option value="">เลือกบัตรที่ต้องการผูก</option>';
    cards.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        opt.className = 'bg-surface-1 text-white';
        select.appendChild(opt);
    });
}

/**
 * Calculate cumulative payments for a fixed cost item from Expenses history
 */
function calculateFixedCostProgress(item, expenses) {
    if (!Array.isArray(expenses)) return { totalPaid: 0, progressPercent: 0, remainingAmount: 0, isCompleted: false };

    const tagPattern = `[Fixed Cost: ${item.name}]`;
    let totalPaid = 0;

    expenses.forEach(exp => {
        const note = (exp.note || '').toString();
        if (note.includes(tagPattern)) {
            const amt = Math.abs(parseFloat(exp.amount) || 0);
            totalPaid += amt;
        }
    });

    const targetAmount = parseFloat(item.target_amount) || 0;
    const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((totalPaid / targetAmount) * 100)) : 0;
    const remainingAmount = targetAmount > 0 ? Math.max(0, targetAmount - totalPaid) : 0;
    const isCompleted = targetAmount > 0 && totalPaid >= targetAmount;

    return { totalPaid, progressPercent, remainingAmount, isCompleted, targetAmount };
}

/**
 * Update top metric cards
 */
function updateSummaryStats(fixedCosts, expenses) {
    const totalCountElem = document.getElementById('statTotalCount');
    const installmentCountElem = document.getElementById('statInstallmentCount');
    const totalTargetElem = document.getElementById('statTotalTargetAmount');
    const remainingDebtElem = document.getElementById('statRemainingDebt');

    const totalCount = fixedCosts.length;
    const installmentItems = fixedCosts.filter(fc => fc.type === 'ผ่อนบัตร');
    
    let totalTarget = 0;
    let totalRemaining = 0;

    fixedCosts.forEach(fc => {
        const { targetAmount, remainingAmount } = calculateFixedCostProgress(fc, expenses);
        if (targetAmount > 0) {
            totalTarget += targetAmount;
            totalRemaining += remainingAmount;
        }
    });

    if (totalCountElem) totalCountElem.textContent = `${totalCount} รายการ`;
    if (installmentCountElem) installmentCountElem.textContent = `${installmentItems.length} รายการ`;
    if (totalTargetElem) totalTargetElem.textContent = formatMoney(totalTarget);
    if (remainingDebtElem) remainingDebtElem.textContent = formatMoney(totalRemaining);

    // Update filter badge counters
    const countAll = document.getElementById('countFilterAll');
    const countGen = document.getElementById('countFilterGeneral');
    const countInst = document.getElementById('countFilterInstallment');

    if (countAll) countAll.textContent = totalCount;
    if (countGen) countGen.textContent = fixedCosts.filter(fc => fc.type !== 'ผ่อนบัตร').length;
    if (countInst) countInst.textContent = installmentItems.length;
}

/**
 * Render Fixed Cost List items
 */
function renderFixedCostList(fixedCosts, expenses) {
    const container = document.getElementById('fixedCostListContainer');
    if (!container) return;

    updateSummaryStats(fixedCosts, expenses);

    // Filter
    let filtered = fixedCosts.filter(item => {
        if (currentFilter === 'ทั่วไป' && item.type === 'ผ่อนบัตร') return false;
        if (currentFilter === 'ผ่อนบัตร' && item.type !== 'ผ่อนบัตร') return false;
        if (currentSearch) {
            const kw = currentSearch.toLowerCase();
            const matchName = (item.name || '').toLowerCase().includes(kw);
            const matchCard = (item.card || '').toLowerCase().includes(kw);
            if (!matchName && !matchCard) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="glass-card p-10 rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                <div class="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center text-2xl text-slate-500 mb-3 border border-slate-border">
                    <i class="fa-solid fa-folder-open"></i>
                </div>
                <h3 class="text-sm font-bold text-white mb-1">ไม่พบรายการ Fixed Cost</h3>
                <p class="text-xs text-slate-400">คุณสามารถเพิ่มรายการใหม่ได้จากแบบฟอร์มด้านซ้าย</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(item => {
        const { totalPaid, progressPercent, remainingAmount, isCompleted, targetAmount } = calculateFixedCostProgress(item, expenses);
        const isInstallment = item.type === 'ผ่อนบัตร';

        return `
            <div class="glass-card glass-card-hover p-4 sm:p-5 rounded-2xl border border-slate-border flex flex-col gap-3 group transition-all duration-200">
                
                <!-- Top Row: Name, Type Badge, and Actions -->
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl ${isInstallment ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-mint/10 text-mint border-mint/20'} flex items-center justify-center text-sm flex-shrink-0 border">
                            <i class="fa-solid ${isInstallment ? 'fa-credit-card' : 'fa-receipt'}"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <h3 class="text-sm sm:text-base font-extrabold text-white truncate">${item.name}</h3>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                    isInstallment 
                                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' 
                                        : 'bg-surface-2 text-slate-300 border-slate-border'
                                }">
                                    ${item.type || 'ทั่วไป'}
                                </span>
                                ${isCompleted ? `
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-mint/15 text-mint border border-mint/30 flex items-center gap-1">
                                        <i class="fa-solid fa-circle-check text-[9px]"></i> ครบแล้ว
                                    </span>
                                ` : ''}
                            </div>
                            <div class="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                                <span class="flex items-center gap-1 font-semibold text-slate-300">
                                    <i class="fa-regular fa-credit-card text-[11px] text-mint"></i>
                                    ${item.card || 'ไม่ระบุบัตร'}
                                </span>
                                <span>•</span>
                                <span class="flex items-center gap-1">
                                    <i class="fa-regular fa-calendar-check text-[11px]"></i>
                                    จ่ายทุกวันที่ <strong class="text-white">${item.due_day || 1}</strong>
                                </span>
                                ${item.end_date ? `
                                    <span>•</span>
                                    <span class="flex items-center gap-1">
                                        <i class="fa-regular fa-calendar-xmark text-[11px] text-coral"></i>
                                        ถึงวันที่ ${item.end_date}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Delete Button -->
                    <button onclick="handleDeleteFixedCost('${item.id || ''}', '${item.name}')" type="button"
                        class="text-xs font-bold text-slate-400 hover:text-coral transition-colors px-2.5 py-1.5 rounded-xl hover:bg-coral-dim cursor-pointer flex items-center gap-1 flex-shrink-0" title="ลบรายการนี้">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                        <span class="hidden sm:inline">ลบ</span>
                    </button>
                </div>

                <!-- Progress Bar Section (If Target Amount is set) -->
                ${targetAmount > 0 ? `
                    <div class="bg-surface-0/70 p-3 rounded-xl border border-slate-border/50 flex flex-col gap-2 mt-1">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-400 font-medium">ความคืบหน้าการผ่อนชำระ</span>
                            <span class="font-bold text-white tabular-numbers">
                                ชำระแล้ว <strong class="text-mint">${formatMoney(totalPaid)}</strong> / ${formatMoney(targetAmount)}
                            </span>
                        </div>
                        
                        <!-- Progress Bar Track -->
                        <div class="w-full bg-surface-2 rounded-full h-2.5 overflow-hidden border border-slate-border/40 relative">
                            <div class="h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-mint' : 'bg-gradient-to-r from-mint-dark via-mint to-mint-light shadow-glow-mint'}"
                                style="width: ${progressPercent}%;"></div>
                        </div>

                        <div class="flex items-center justify-between text-[11px]">
                            <span class="text-mint font-bold">${progressPercent}% สำเร็จ</span>
                            <span class="text-slate-400">
                                ${isCompleted ? '<span class="text-mint font-bold">ผ่อนชำระครบตามเป้าหมายแล้ว</span>' : `ขาดอีก <strong class="text-coral tabular-numbers">${formatMoney(remainingAmount)}</strong>`}
                            </span>
                        </div>
                    </div>
                ` : ''}

            </div>
        `;
    }).join('');
}

/**
 * Handle Add Fixed Cost submission
 */
async function handleAddFixedCost(e) {
    e.preventDefault();

    const name = document.getElementById('fcName').value.trim();
    const card = document.getElementById('fcCard').value;
    const type = document.querySelector('input[name="fcType"]:checked')?.value || 'ทั่วไป';
    const dueDay = parseInt(document.getElementById('fcDueDay').value, 10);
    const targetAmountInput = document.getElementById('fcTargetAmount').value;
    const endDate = document.getElementById('fcEndDate').value;

    if (!name) {
        showToast("กรุณาระบุชื่อรายการ Fixed Cost", "error");
        return;
    }
    if (!card) {
        showToast("กรุณาเลือกบัตรที่ต้องการผูก", "error");
        return;
    }
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        showToast("กรุณาระบุวันที่ต้องจ่ายระหว่าง 1 ถึง 31", "error");
        return;
    }

    let formattedEndDate = '';
    if (endDate) {
        const dEnd = dayjs(endDate);
        if (dEnd.isValid()) {
            formattedEndDate = `${String(dEnd.date()).padStart(2, '0')}/${String(dEnd.month() + 1).padStart(2, '0')}/${dEnd.year() + 543}`;
        }
    }
    const now = dayjs();
    const formattedCreatedAt = `${String(now.date()).padStart(2, '0')}/${String(now.month() + 1).padStart(2, '0')}/${now.year() + 543}`;

    const itemData = {
        id: 'fc_' + Date.now(),
        name: name,
        card: card,
        type: type,
        due_day: dueDay,
        end_date: formattedEndDate,
        target_amount: targetAmountInput ? parseFloat(targetAmountInput) : '',
        created_at: formattedCreatedAt
    };

    toggleLoading(true);

    try {
        await postFixedCost(itemData);
        showToast("เพิ่ม Fixed Cost เรียบร้อยแล้ว!");

        // Reset form
        document.getElementById('addFixedCostForm').reset();
        document.querySelector('input[name="fcType"][value="ทั่วไป"]').checked = true;

        // Refresh list
        await loadAllData(true);
    } catch (err) {
        console.error("Error adding fixed cost:", err);
        showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
        toggleLoading(false);
    }
}

/**
 * Handle Delete Fixed Cost
 */
window.handleDeleteFixedCost = async function(id, name) {
    if (!confirm(`คุณต้องการลบรายการ Fixed Cost "${name}" หรือไม่?`)) return;

    toggleLoading(true);
    try {
        await deleteFixedCost(id, name);
        showToast(`ลบรายการ "${name}" เรียบร้อยแล้ว`);
        await loadAllData(true);
    } catch (err) {
        console.error("Error deleting fixed cost:", err);
        showToast("เกิดข้อผิดพลาดในการลบ", "error");
    } finally {
        toggleLoading(false);
    }
};

/**
 * Fetch and load all data
 */
async function loadAllData(forceRefresh = false) {
    try {
        // 1. Fetch Cards
        const cards = await fetchSheet("Cards", {
            onFreshData: (freshCards) => populateCards(freshCards),
            forceRefresh
        });
        populateCards(cards);

        // 2. Fetch Expenses (to calculate payments & progress)
        const expenses = await fetchExpenses({
            onFreshData: (freshExp) => {
                cachedExpenses = freshExp;
                renderFixedCostList(cachedFixedCosts, freshExp);
            },
            forceRefresh
        });
        cachedExpenses = expenses;

        // 3. Fetch Fixed Costs
        const fixedCosts = await fetchFixedCosts({
            onFreshData: (freshFc) => {
                cachedFixedCosts = freshFc;
                renderFixedCostList(freshFc, cachedExpenses);
            },
            forceRefresh
        });
        cachedFixedCosts = fixedCosts;

        renderFixedCostList(cachedFixedCosts, cachedExpenses);

    } catch (err) {
        console.error("Error loading fixed cost data:", err);
        showToast("ไม่สามารถโหลดข้อมูลได้", "error");
    }
}

/**
 * Show Toast Notification
 */
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

// Event Listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Form submit
    document.getElementById('addFixedCostForm')?.addEventListener('submit', handleAddFixedCost);

    // Sync button
    document.getElementById('syncFixedCostBtn')?.addEventListener('click', async () => {
        toggleLoading(true);
        await loadAllData(true);
        toggleLoading(false);
        showToast("รีเฟรชข้อมูลล่าสุดเรียบร้อย!");
    });

    // Scroll to form button
    document.getElementById('openAddModalBtn')?.addEventListener('click', () => {
        document.getElementById('fcName')?.focus();
        document.getElementById('addFixedCostForm')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Filter Buttons
    document.querySelectorAll('.fc-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fc-filter-btn').forEach(b => {
                b.className = 'fc-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-surface-2 transition cursor-pointer';
            });
            btn.className = 'fc-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-mint text-void shadow-sm transition cursor-pointer';
            currentFilter = btn.dataset.filter;
            renderFixedCostList(cachedFixedCosts, cachedExpenses);
        });
    });

    // Search input
    document.getElementById('fcSearchInput')?.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim();
        renderFixedCostList(cachedFixedCosts, cachedExpenses);
    });

    // Initial load
    loadAllData(false);
});
