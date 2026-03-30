const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwrcejldAoKiI2v0xUI24aXuf_ZdN78u94se0o46NEDFW-AhxG67LqvkvlDVfcPn3Rmgw/exec';

/**
 * Fetch a specific sheet (e.g., Cards, Categories)
 */
async function fetchSheet(sheetName) {
  const res = await fetch(`${SHEET_URL}?sheet=${sheetName}`);
  return await res.json();
}

/**
 * Fetch all transaction rows (Expenses)
 */
async function fetchExpenses() {
  const res = await fetch(SHEET_URL);
  return await res.json();
}

/**
 * Post a new expense to the spreadsheet
 */
async function postExpense(data) {
  await fetch(SHEET_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Explicit Exports
export { fetchSheet, fetchExpenses, postExpense };

