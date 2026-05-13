/* ===========================================================
 * login.js — 로그인 / 회원가입 화면 전환
 * 화면 ID: login, signup
 * =========================================================== */

const LOGIN_SCREENS = ['login', 'signup'];

function showLoginScreen(id) {
  document.querySelectorAll('main > .screen').forEach(function(s) {
    s.classList.toggle('is-active', s.id === id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (history.replaceState) history.replaceState(null, '', '#' + id);
}

document.addEventListener('DOMContentLoaded', function() {
  const hash = (location.hash || '').replace('#', '');
  const initial = LOGIN_SCREENS.indexOf(hash) >= 0 ? hash : 'login';
  showLoginScreen(initial);

  document.querySelectorAll('[data-go]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      const target = btn.getAttribute('data-go');
      if (LOGIN_SCREENS.indexOf(target) >= 0) {
        e.preventDefault();
        showLoginScreen(target);
      }
    });
  });
});
