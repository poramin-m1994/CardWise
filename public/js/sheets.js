const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwrcejldAoKiI2v0xUI24aXuf_ZdN78u94se0o46NEDFW-AhxG67LqvkvlDVfcPn3Rmgw/exec';

const CACHE_KEYS = {
  EXPENSES: 'cardwise_cache_expenses',
  CARDS: 'cardwise_cache_cards',
  CATEGORIES: 'cardwise_cache_categories',
  LAST_SYNC: 'cardwise_last_sync_time'
};

/**
 * Get cached data from localStorage
 */
function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn(`[Cache] Error reading ${key}:`, e);
    return null;
  }
}

/**
 * Save data to localStorage
 */
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.warn(`[Cache] Error saving ${key}:`, e);
  }
}

/**
 * Invalidate a specific cache or all caches
 */
function invalidateCache(key = null) {
  try {
    if (key) {
      localStorage.removeItem(key);
    } else {
      Object.values(CACHE_KEYS).forEach(k => localStorage.removeItem(k));
    }
  } catch (e) {
    console.warn('[Cache] Error clearing cache:', e);
  }
}

/**
 * Get formatted last sync time string
 */
function getLastSyncTime() {
  const raw = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
  if (!raw) return null;
  try {
    const date = new Date(raw);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return null;
  }
}

/**
 * Fetch a specific sheet (e.g., Cards, Categories) with SWR Caching
 */
async function fetchSheet(sheetName, { onFreshData = null, forceRefresh = false } = {}) {
  const cacheKey = sheetName.toLowerCase() === 'cards' ? CACHE_KEYS.CARDS : CACHE_KEYS.CATEGORIES;
  const cachedData = getCache(cacheKey);

  // Background fetcher function
  const fetchFresh = async () => {
    try {
      const res = await fetch(`${SHEET_URL}?sheet=${sheetName}`);
      const freshData = await res.json();
      if (Array.isArray(freshData)) {
        const isDifferent = JSON.stringify(cachedData) !== JSON.stringify(freshData);
        setCache(cacheKey, freshData);
        if (isDifferent && typeof onFreshData === 'function') {
          onFreshData(freshData);
        }
      }
      return freshData;
    } catch (err) {
      console.error(`[Sheets] Error fetching sheet ${sheetName}:`, err);
      return cachedData || [];
    }
  };

  // If cache exists and forceRefresh is false, return cached data immediately and revalidate in background
  if (cachedData && !forceRefresh) {
    fetchFresh(); // SWR background revalidate
    return cachedData;
  }

  // Otherwise, await fresh data
  return await fetchFresh();
}

/**
 * Fetch all transaction rows (Expenses) with SWR Caching
 */
async function fetchExpenses({ onFreshData = null, forceRefresh = false } = {}) {
  const cachedData = getCache(CACHE_KEYS.EXPENSES);

  // Background fetcher function
  const fetchFresh = async () => {
    try {
      const res = await fetch(SHEET_URL);
      const freshData = await res.json();
      if (Array.isArray(freshData)) {
        const isDifferent = JSON.stringify(cachedData) !== JSON.stringify(freshData);
        setCache(CACHE_KEYS.EXPENSES, freshData);
        if (isDifferent && typeof onFreshData === 'function') {
          onFreshData(freshData);
        }
      }
      return freshData;
    } catch (err) {
      console.error('[Sheets] Error fetching expenses:', err);
      return cachedData || [];
    }
  };

  // If cache exists and forceRefresh is false, return cached data immediately and revalidate in background
  if (cachedData && !forceRefresh) {
    fetchFresh(); // SWR background revalidate
    return cachedData;
  }

  // Otherwise, await fresh data
  return await fetchFresh();
}

/**
 * Post a new expense to the spreadsheet and update cache
 */
async function postExpense(data) {
  // Optimistically append to local cache if available
  const cachedExpenses = getCache(CACHE_KEYS.EXPENSES) || [];
  const optimisticItem = { ...data };
  const updatedCache = [optimisticItem, ...cachedExpenses];
  setCache(CACHE_KEYS.EXPENSES, updatedCache);

  try {
    const res = await fetch(SHEET_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // Invalidate and fetch latest accurate data
    const fresh = await fetch(SHEET_URL).then(r => r.json());
    if (Array.isArray(fresh)) {
      setCache(CACHE_KEYS.EXPENSES, fresh);
    }
    return res;
  } catch (err) {
    console.error('[Sheets] Error posting expense:', err);
    throw err;
  }
}

// Explicit Exports
export {
  SHEET_URL,
  CACHE_KEYS,
  fetchSheet,
  fetchExpenses,
  postExpense,
  getCache,
  setCache,
  invalidateCache,
  getLastSyncTime
};
