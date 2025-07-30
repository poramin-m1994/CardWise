const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwrcejldAoKiI2v0xUI24aXuf_ZdN78u94se0o46NEDFW-AhxG67LqvkvlDVfcPn3Rmgw/exec';

export async function fetchSheet(sheetName) {
  const res = await fetch(`${SHEET_URL}?sheet=${sheetName}`);
  return await res.json();
}

export async function postExpense(data) {
  await fetch(SHEET_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
