/* ===========================================================
 * mypage.js — 마이페이지 4탭 (대시보드/결제내역/프로필/가격) +
 *             리포트 필터 + 플랜 선택
 * 화면 ID: mypage, payment-history, profile, plans
 * =========================================================== */

const MYPAGE_SCREENS = ['mypage', 'payment-history', 'profile', 'plans'];

function showMyPageScreen(id) {
  document.querySelectorAll('main > .screen').forEach(function(s) {
    s.classList.toggle('is-active', s.id === id);
  });
  // 상단 탭 is-selected 동기화
  document.querySelectorAll('#mp-tabs [data-go]').forEach(function(chip) {
    chip.classList.toggle('is-selected', chip.getAttribute('data-go') === id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (history.replaceState) history.replaceState(null, '', '#' + id);
}

function selectPlan(key) {
  document.querySelectorAll('.plan-card').forEach(function(card) {
    card.classList.toggle('is-selected', card.getAttribute('data-plan') === key);
  });
}

function filterReports(status) {
  document.querySelectorAll('#report-filters [data-filter]').forEach(function(chip) {
    chip.classList.toggle('is-selected', chip.getAttribute('data-filter') === status);
  });
  document.querySelectorAll('tr[data-status]').forEach(function(row) {
    const match = (status === 'all' || row.getAttribute('data-status') === status);
    row.classList.toggle('is-hidden', !match);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const hash = (location.hash || '').replace('#', '');
  const initial = MYPAGE_SCREENS.indexOf(hash) >= 0 ? hash : 'mypage';
  showMyPageScreen(initial);

  document.querySelectorAll('[data-go]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      const target = btn.getAttribute('data-go');
      if (MYPAGE_SCREENS.indexOf(target) >= 0) {
        e.preventDefault();
        showMyPageScreen(target);
      }
    });
  });

  // 플랜 카드 클릭 시 선택 + 결제 버튼 URL 갱신
  const checkoutBtn = document.getElementById('plan-checkout-btn');
  function updateCheckoutHref() {
    if (!checkoutBtn) return;
    const selected = document.querySelector('.plan-card.is-selected');
    const plan = selected ? selected.getAttribute('data-plan') : 'single';
    if (plan === 'single') {
      checkoutBtn.setAttribute('href', '1_5_모듈선택.html');
    } else if (plan === 'bundle') {
      checkoutBtn.setAttribute('href', '7_결제.html?plan=single&modules=bundle&return=results');
    } else if (plan === 'pro') {
      checkoutBtn.setAttribute('href', '7_결제.html?plan=subscription&return=mypage');
    }
  }
  document.querySelectorAll('.plan-card').forEach(function(card) {
    card.addEventListener('click', function() {
      selectPlan(card.getAttribute('data-plan'));
      updateCheckoutHref();
    });
  });

  // 리포트 필터 칩
  document.querySelectorAll('#report-filters [data-filter]').forEach(function(chip) {
    chip.addEventListener('click', function() {
      filterReports(chip.getAttribute('data-filter'));
    });
  });

  selectPlan('single');
  if (typeof updateCheckoutHref === 'function') updateCheckoutHref();
});
