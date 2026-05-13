/* ===========================================================
 * result.js — 결과 그룹 화면 전환 + 분석중 진행률 애니메이션
 * 화면 ID: loading, results, permit, report
 * =========================================================== */

const RESULT_SCREENS = ['loading', 'results', 'permit', 'cost', 'schedule', 'design-detail', 'report'];

function showResultScreen(id) {
  document.querySelectorAll('main > .screen').forEach(function(s) {
    s.classList.toggle('is-active', s.id === id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (history.replaceState) history.replaceState(null, '', '#' + id);

  if (id === 'loading') startLoadingAnimation();
}

/* 분석 중 진행률 애니메이션 (원본 useEffect 로직 이식) */
let loadingTimer = null;
function startLoadingAnimation() {
  if (loadingTimer) clearInterval(loadingTimer);
  let progress = 0;
  updateLoading(progress);
  loadingTimer = setInterval(function() {
    progress += 2;
    if (progress >= 100) {
      progress = 100;
      updateLoading(progress);
      clearInterval(loadingTimer);
      loadingTimer = null;
      setTimeout(function() { showResultScreen('results'); }, 400);
      return;
    }
    updateLoading(progress);
  }, 80);
}

function updateLoading(progress) {
  const pctEl = document.getElementById('loading-pct');
  if (pctEl) pctEl.textContent = progress + '%';

  const circle = document.getElementById('loading-progress-circle');
  if (circle) circle.setAttribute('stroke-dashoffset', String(339 - (339 * progress / 100)));

  const modules = [
    { id:'m-permit',  iconActive:'shieldCheck', sActive:'건축물대장 분석 중', sDone:'부산시 건축조례 검색 완료', factor:2.5, doneAt:40, activeAt:30 },
    { id:'m-cost',    iconActive:'receipt',     sActive:'벽 마감재 단가 적용 중', sDone:'단가 적용 완료',             factor:1.8, doneAt:60, activeAt:50 },
    { id:'m-time',    iconActive:'calendar',    sActive:'공정별 간트 보정 중',     sDone:'간트차트 완료',               factor:1.3, doneAt:80, activeAt:70 },
    { id:'m-design',  iconActive:'palette',     sActive:'ControlNet 추론 중',     sDone:'시안 생성 완료',               factor:1.0, doneAt:90, activeAt:85 },
  ];

  modules.forEach(function(m) {
    const row = document.getElementById(m.id);
    if (!row) return;
    const isDone = progress > m.doneAt;
    const pct = Math.min(100, progress * m.factor);

    const iconWrap = row.querySelector('.mod-icon');
    const subEl = row.querySelector('.mod-sub');
    const barEl = row.querySelector('.mod-bar');

    if (isDone) {
      iconWrap.classList.add('is-done');
      iconWrap.innerHTML = '<span data-icon="check" data-size="18" data-stroke="3"></span>';
      renderIcons(iconWrap);
      subEl.textContent = m.sDone;
      barEl.classList.add('is-done');
    } else {
      iconWrap.classList.remove('is-done');
      iconWrap.innerHTML = '<span data-icon="' + m.iconActive + '" data-size="18"></span>';
      renderIcons(iconWrap);
      subEl.textContent = m.sActive;
      barEl.classList.remove('is-done');
    }
    // width는 진행률 계산값이라 동적 — CSS 변수로도 가능하지만 단순화
    barEl.style.width = pct + '%';
  });
}

/* 샘플 모드: ?sample=true 진입 시 본인 분석이 아닌 샘플 리포트 뷰로 표시 */
function setupSampleMode() {
  if (location.search.indexOf('sample=true') < 0) return;
  document.body.classList.add('is-sample');
  const reportPage = document.querySelector('#report .page');
  if (!reportPage) return;
  const notice = document.createElement('div');
  notice.className = 'sample-notice';
  notice.innerHTML =
    '<div class="flex items-center gap-8 text-13 fw-700" style="color:var(--brand)">' +
    '<span data-icon="info" data-size="16"></span>' +
    '이건 샘플 리포트입니다. 실제 분석은 본인 자리 정보 기반으로 생성됩니다.' +
    '</div>' +
    '<a href="2_입력.html" class="btn btn-primary btn-sm">내 분석 시작 →</a>';
  reportPage.insertBefore(notice, reportPage.firstChild);
  renderIcons(notice);
}

/* ============================================================
 * 결제 paywall — 본인 분석 잠금/해제
 * ============================================================ */
const PAID_KEY = 'interior_paid_report_v1';
const DETAIL_SCREENS = ['permit', 'cost', 'schedule', 'design-detail', 'report'];

function isPaid() {
  try { return localStorage.getItem(PAID_KEY) === '1'; } catch (e) { return false; }
}

function setPaid(paid) {
  try {
    if (paid) localStorage.setItem(PAID_KEY, '1');
    else localStorage.removeItem(PAID_KEY);
  } catch (e) {}
}

/* 각 detail 화면의 .page를 paid-unlock-wrap으로 만들고 콘텐츠/오버레이 분리 */
function wrapDetailScreensForPaywall() {
  DETAIL_SCREENS.forEach(function(id) {
    const screen = document.getElementById(id);
    if (!screen) return;
    const page = screen.querySelector('.page');
    if (!page || page.dataset.paywallWrapped === '1') return;
    page.dataset.paywallWrapped = '1';
    page.classList.add('paid-unlock-wrap');

    // 헤더로 유지할 자식 수 (#report는 header-banner 1개, 나머지는 back link + title row 2개)
    const keepCount = (id === 'report') ? 1 : 2;
    const children = Array.prototype.slice.call(page.children);
    const headerNodes = children.slice(0, keepCount);
    const bodyNodes = children.slice(keepCount);

    // 본문을 paid-locked로 감싸기
    const locked = document.createElement('div');
    locked.className = 'paid-locked';
    bodyNodes.forEach(function(n) { locked.appendChild(n); });

    // 잠금 오버레이
    const overlay = document.createElement('div');
    overlay.className = 'paid-unlock-overlay';
    overlay.innerHTML =
      '<div class="paid-unlock-card">' +
      '<span class="eyebrow">UNLOCK</span>' +
      '<h3 class="section-title mt-12 mb-8"><span data-icon="lock" data-size="14"></span> 상세 분석 잠김</h3>' +
      '<p class="text-13 text-muted mb-20" style="margin-bottom:20px">결제 후 전체 분석을 확인할 수 있습니다.</p>' +
      '<button class="btn btn-primary btn-md w-full show-paywall-btn">잠금 해제 (50,000원)</button>' +
      '</div>';

    // 다시 조립: 헤더 → paid-locked → overlay
    page.appendChild(locked);
    page.appendChild(overlay);
    renderIcons(overlay);
  });
}

/* 결제 모달 열기/닫기 */
function openPaywallModal() {
  const m = document.getElementById('paywall-modal');
  if (m) m.classList.add('is-open');
}
function closePaywallModal() {
  const m = document.getElementById('paywall-modal');
  if (m) m.classList.remove('is-open');
}

/* 결제 완료 처리 — 7_결제.html에서 ?paid=true로 돌아왔을 때 호출 */
function completePayment() {
  setPaid(true);
  document.body.classList.remove('is-locked');
  closePaywallModal();
  // URL의 ?paid=true 제거 (중복 처리 방지)
  if (history.replaceState) {
    history.replaceState(null, '', location.pathname + location.hash);
  }
  showPaidToast();
  // 1.5초 후 통합 리포트로 자동 이동
  setTimeout(function() {
    showResultScreen('report');
  }, 1500);
}

function showPaidToast() {
  const t = document.createElement('div');
  t.className = 'toast-paid animate-in';
  t.innerHTML =
    '<span class="toast-paid-icon"><span data-icon="check" data-size="18" data-stroke="3"></span></span>' +
    '<div><div class="text-13 fw-700 text-strong">결제가 완료되었습니다</div><div class="text-12 text-subtle">통합 리포트로 이동합니다…</div></div>';
  document.body.appendChild(t);
  renderIcons(t);
  setTimeout(function() {
    t.classList.add('is-leaving');
    setTimeout(function() { t.remove(); }, 350);
  }, 2800);
}

function setupPaywall() {
  // 샘플 모드면 paywall 적용 안 함
  if (document.body.classList.contains('is-sample')) return;

  // 데모용: ?reset=paid 로 진입하면 결제 상태 초기화
  if (location.search.indexOf('reset=paid') >= 0) {
    setPaid(false);
    if (history.replaceState) {
      history.replaceState(null, '', location.pathname + location.hash);
    }
  }

  // ?paid=true (7_결제.html에서 돌아온 경우) → 결제 완료 처리
  if (location.search.indexOf('paid=true') >= 0) {
    setPaid(true);
  }

  if (!isPaid()) document.body.classList.add('is-locked');

  wrapDetailScreensForPaywall();

  // 결제 직후 진입이면 토스트 + #report 자동 이동
  if (location.search.indexOf('paid=true') >= 0) {
    if (history.replaceState) {
      history.replaceState(null, '', location.pathname + location.hash);
    }
    showPaidToast();
    setTimeout(function() { showResultScreen('report'); }, 1500);
  }

  // 결제 모달 트리거: .show-paywall-btn 클릭, 모듈 카드/리포트 버튼/공유/PDF 클릭 (잠금 상태일 때만)
  document.body.addEventListener('click', function(e) {
    const trigger = e.target.closest('.show-paywall-btn');
    if (trigger) { e.preventDefault(); openPaywallModal(); return; }
    if (!document.body.classList.contains('is-locked')) return;
    const card = e.target.closest('.module-card[data-go]');
    if (card) { e.preventDefault(); e.stopPropagation(); openPaywallModal(); return; }
    const reportNavBtn = e.target.closest('[data-go="report"]');
    if (reportNavBtn) { e.preventDefault(); e.stopPropagation(); openPaywallModal(); return; }
    const shareBtn = e.target.closest('#share-link-btn-results, #share-link-btn-report');
    if (shareBtn) { e.preventDefault(); e.stopPropagation(); openPaywallModal(); return; }
    const printBtn = e.target.closest('#print-report-btn');
    if (printBtn) { e.preventDefault(); e.stopPropagation(); openPaywallModal(); return; }
  }, true);

  // 모달 닫기 (배경/X 버튼). 플랜 카드는 <a> 링크이므로 자연스럽게 7_결제.html로 이동
  const close = document.getElementById('paywall-close');
  const backdrop = document.getElementById('paywall-backdrop');
  if (close) close.addEventListener('click', closePaywallModal);
  if (backdrop) backdrop.addEventListener('click', closePaywallModal);
}

/* PDF 저장 (브라우저 인쇄 다이얼로그) */
function setupPrintButton() {
  const printBtn = document.getElementById('print-report-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function() {
      showResultScreen('report');
      setTimeout(function() { window.print(); }, 200);
    });
  }
}

/* 공유 링크 발급 — 8_공유리포트.html URL 클립보드 복사 */
function setupShareButtons() {
  const shareUrl = location.origin + location.pathname.replace(/[^/]+$/, '') + '8_공유리포트.html';
  ['share-link-btn-results', 'share-link-btn-report'].forEach(function(id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function() {
      if (!navigator.clipboard) { alert('공유 링크: ' + shareUrl); return; }
      navigator.clipboard.writeText(shareUrl).then(function() {
        const original = btn.innerHTML;
        btn.innerHTML = '<span data-icon="check" data-size="14"></span> 링크 복사됨';
        renderIcons(btn);
        setTimeout(function() {
          btn.innerHTML = original;
          renderIcons(btn);
        }, 1500);
      }).catch(function() { alert('공유 링크: ' + shareUrl); });
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setupSampleMode();
  setupPaywall();
  setupPrintButton();
  setupShareButtons();

  const hash = (location.hash || '').replace('#', '');
  let initial = RESULT_SCREENS.indexOf(hash) >= 0 ? hash : 'loading';
  // 샘플 모드에서는 hash 없으면 바로 report로
  if (location.search.indexOf('sample=true') >= 0 && RESULT_SCREENS.indexOf(hash) < 0) {
    initial = 'report';
  }
  showResultScreen(initial);

  document.querySelectorAll('[data-go]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      const target = btn.getAttribute('data-go');
      if (RESULT_SCREENS.indexOf(target) >= 0) {
        e.preventDefault();
        showResultScreen(target);
      }
    });
  });
});
