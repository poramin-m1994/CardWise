export function toggleDarkMode() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const isNowDark = html.classList.contains('dark');
  localStorage.setItem('theme', isNowDark ? 'dark' : 'light');
  document.getElementById('themeLabel').textContent = isNowDark ? 'ปิดโหมดกลางคืน' : 'เปิดโหมดกลางคืน';
}

export function applyTheme() {
  const isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = 'ปิดโหมดกลางคืน';
  }
}
