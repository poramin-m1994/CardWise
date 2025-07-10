const sessionKey = 'userSession';

export function checkLogin() {
  if (!localStorage.getItem(sessionKey)) {
    window.location.href = 'login.html';
  }
}

export function logout() {
  localStorage.removeItem(sessionKey);
  window.location.href = 'login.html';
}
