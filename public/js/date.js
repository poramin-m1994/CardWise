// รับ yyyy-MM-dd และแปลงเป็น DD/MM/YYYY
export function toFormattedDate(dateStr) {
  return dayjs(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY');
}

// รับ DD/MM/YYYY และแปลงเป็น yyyy-MM-dd
export function toInputDate(dateStr) {
  //check ถ้า dateStr มีเครื่องหมาย / หรือไม่
  if (!dateStr.includes('/')) {
    return dateStr;
  }

  const [day, month, year] = dateStr.trim().split('/');
  return `${year}-${month}-${day}`;
}
