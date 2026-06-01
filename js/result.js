/* ===========================================================
 * result.js — 결과 그룹 화면 전환 + 분석중 진행률 애니메이션
 * 화면 ID: loading, results, permit, report
 * =========================================================== */

const RESULT_SCREENS = ['loading', 'results', 'permit', 'cost', 'schedule', 'design-detail', 'report'];

/* ===== 모듈 → 결과 페이지 매핑 =====
   - permit:   인허가 (로딩 행 m-permit, 결과 카드 data-go="permit")
   - estimate: 견적·기간 (로딩 행 m-cost+m-time, 결과 카드 cost+schedule)
   - design:   디자인 (로딩 행 m-design, 결과 카드 design-detail)
   - bundle:   세 모듈 모두 */
const RESULT_MODULE_MAP = {
  permit:   { label: '인허가 법규 검토',   loadingRows: ['m-permit'],            moduleCards: ['permit'] },
  estimate: { label: '공사 견적 및 기간',    loadingRows: ['m-cost', 'm-time'],     moduleCards: ['cost', 'schedule'] },
  design:   { label: 'AI 디자인 시안',      loadingRows: ['m-design'],             moduleCards: ['design-detail'] },
  bundle:   { label: '풀세트 (3개 모듈)',   loadingRows: ['m-permit','m-cost','m-time','m-design'], moduleCards: ['permit','cost','schedule','design-detail'] }
};
const ALL_LOADING_ROWS = ['m-permit','m-design','m-time','m-cost'];

function parseActiveResultModules() {
  const qs = new URLSearchParams(location.search);
  const raw = (qs.get('modules') || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
  const valid = raw.filter(function(m){ return RESULT_MODULE_MAP[m]; });
  return valid.length ? valid : ['bundle'];
}

const ACTIVE_RESULT_MODULES = parseActiveResultModules();

function getActiveResultScope() {
  const rows = {};
  const cards = {};
  const labels = [];
  ACTIVE_RESULT_MODULES.forEach(function(m) {
    const info = RESULT_MODULE_MAP[m];
    info.loadingRows.forEach(function(r){ rows[r] = true; });
    info.moduleCards.forEach(function(c){ cards[c] = true; });
    labels.push(info.label);
  });
  const isBundle = ACTIVE_RESULT_MODULES.indexOf('bundle') >= 0;
  const singles = ACTIVE_RESULT_MODULES.filter(function(m){return m !== 'bundle';});
  return {
    isBundle: isBundle,
    singleCount: singles.length,
    loadingRows: Object.keys(rows),
    moduleCards: Object.keys(cards),
    labels: labels,
    moduleNamesText: labels.join(' · ')
  };
}

const ACTIVE_SCOPE = getActiveResultScope();

/* 결제 시 가격 계산 (단건 모듈수 × 29,000원, 풀세트는 60,000원) */
function calcResultPaymentAmount() {
  if (ACTIVE_SCOPE.isBundle) return 60000;
  return ACTIVE_SCOPE.singleCount * 29000;
}

/* 모듈별 paywall "결제 시 포함 항목" 정의 */
const PAYWALL_ITEMS_BY_MODULE = {
  permit: [
    '인허가 법규 검토 상세 페이지',
    '위반 항목별 권장 조치 사항 & 법적 근거',
    '신호등 판정 (적/황/녹) 상세 근거'
  ],
  estimate: [
    '공사 견적 및 기간 상세 페이지',
    '항목별 단가 내역 (BoQ)',
    '공정별 일정 · 간트차트',
    '평당 비교 + 지역 평균 대비'
  ],
  design: [
    'AI 디자인 시안 상세 페이지',
    'AI 디자인 시안 1안 원본 (4096×2304)',
    '무드보드 · 조명·마감 가이드'
  ]
};
const PAYWALL_COMMON_ITEM = '브랜드 PDF 다운로드 + 공유 링크 (90일 유효)';

function getPaywallItems() {
  if (ACTIVE_SCOPE.isBundle) {
    return [].concat(
      PAYWALL_ITEMS_BY_MODULE.permit,
      PAYWALL_ITEMS_BY_MODULE.estimate,
      PAYWALL_ITEMS_BY_MODULE.design,
      [PAYWALL_COMMON_ITEM]
    );
  }
  const items = [];
  ACTIVE_RESULT_MODULES.forEach(function(m){
    if (PAYWALL_ITEMS_BY_MODULE[m]) items.push.apply(items, PAYWALL_ITEMS_BY_MODULE[m]);
  });
  items.push(PAYWALL_COMMON_ITEM);
  return items;
}

/* 결과 페이지에 활성 모듈만 보이도록 적용 */
function applyActiveResultModules() {
  // 1) 로딩 화면: 비활성 모듈 행 숨김
  ALL_LOADING_ROWS.forEach(function(id) {
    const row = document.getElementById(id);
    if (!row) return;
    row.classList.toggle('is-hidden', ACTIVE_SCOPE.loadingRows.indexOf(id) < 0);
  });

  // 2) 결과 화면 module-card: 비활성만 숨김
  document.querySelectorAll('#results .module-card[data-go]').forEach(function(card) {
    const go = card.getAttribute('data-go');
    card.classList.toggle('is-hidden', ACTIVE_SCOPE.moduleCards.indexOf(go) < 0);
  });

  // 3) "4개 분석 모듈 결과" 헤더 동적
  const header = document.querySelector('#results h2.fw-800');
  if (header) header.textContent = ACTIVE_SCOPE.moduleCards.length + '개 분석 모듈 결과';

  // 4) 활성 모듈 1개면 그리드 1열로
  const grid = document.querySelector('#results .grid.cols-2');
  if (grid && ACTIVE_SCOPE.moduleCards.length === 1) {
    grid.classList.remove('cols-2');
    grid.classList.add('cols-1');
  }

  // 5) 로딩 헤딩 — 모듈명으로 더 구체화
  const loadingH1 = document.querySelector('#loading .page-title');
  if (loadingH1 && ACTIVE_SCOPE.labels.length > 0) {
    loadingH1.textContent = ACTIVE_SCOPE.moduleNamesText + ' 분석 중입니다';
  }

  // 6) 결제 배너의 금액 + paywall 모달의 단건 가격 동적
  const amount = calcResultPaymentAmount();
  const amountText = amount.toLocaleString('ko-KR') + '원';
  const ctaLabel = ACTIVE_SCOPE.isBundle ? '풀세트 결제' : '단건 결제';

  // 결제 CTA 배너 (결과 페이지 상단)
  const bannerBtn = document.querySelector('.paid-cta-banner .btn-primary');
  if (bannerBtn) {
    bannerBtn.innerHTML = '<span data-icon="lock" data-size="14"></span> ' + amountText + ' 결제하기';
    if (typeof renderIcons === 'function') renderIcons(bannerBtn);
  }

  // 리포트(#report) 화면의 모듈 섹션 — 활성 모듈만 표시 + 번호 자동 재지정
  const reportSections = document.querySelectorAll('.report-module-section[data-module]');
  let reportNum = 0;
  reportSections.forEach(function(sec){
    const mod = sec.getAttribute('data-module');
    const isActive = ACTIVE_RESULT_MODULES.indexOf(mod) >= 0 || ACTIVE_SCOPE.isBundle;
    sec.classList.toggle('is-hidden', !isActive);
    if (isActive) {
      reportNum += 1;
      const numBadge = sec.querySelector('.section-num-badge');
      if (numBadge) numBadge.textContent = String(reportNum).padStart(2, '0');
    }
  });

  // paywall 모달 "결제 시 포함 항목" 동적 생성
  const checklist = document.querySelector('.paywall-checklist');
  if (checklist) {
    const items = getPaywallItems();
    checklist.innerHTML = items.map(function(text){
      return '<li><span class="pc-check"><span data-icon="check" data-size="12" data-stroke="3"></span></span>' + text + '</li>';
    }).join('');
    if (typeof renderIcons === 'function') renderIcons(checklist);
  }

  // paywall 모달의 단건 결제 버튼
  const singleBtn = document.getElementById('pay-single');
  if (singleBtn) {
    const popularSpan = singleBtn.querySelector('.paywall-plan-bar-popular');
    const txtSpan = singleBtn.querySelector('span:not(.paywall-plan-bar-popular)');
    if (txtSpan) txtSpan.textContent = ctaLabel + ' — ' + amountText;
    if (popularSpan) popularSpan.classList.toggle('is-hidden', !ACTIVE_SCOPE.isBundle);
    // 결제 페이지가 어떤 모듈을 받는지 알 수 있도록 modules 쿼리 부착
    const modulesParam = encodeURIComponent(ACTIVE_RESULT_MODULES.join(','));
    singleBtn.setAttribute('href', '7_결제.html?plan=single&modules=' + modulesParam + '&return=results');
  }
}

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
    { id:'m-permit',  iconActive:'shieldCheck', sActive:'건축물대장 분석 중',     sDone:'부산시 건축조례 검색 완료', factor:2.5, doneAt:40, activeAt:30 },
    { id:'m-design',  iconActive:'palette',     sActive:'ControlNet 추론 중',     sDone:'시안 생성 완료',           factor:1.8, doneAt:65, activeAt:50 },
    { id:'m-time',    iconActive:'calendar',    sActive:'시안 기준 간트 보정 중',   sDone:'간트차트 완료',             factor:1.3, doneAt:80, activeAt:70 },
    { id:'m-cost',    iconActive:'receipt',     sActive:'시안 기준 단가 적용 중',   sDone:'단가 적용 완료',           factor:1.0, doneAt:90, activeAt:85 },
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
    '<a href="1_5_모듈선택.html" class="btn btn-primary btn-sm">내 분석 시작 →</a>';
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
      '<button class="btn btn-primary btn-md w-full show-paywall-btn">잠금 해제 (' + calcResultPaymentAmount().toLocaleString('ko-KR') + '원)</button>' +
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
  // 1.5초 후 맞춤 리포트로 자동 이동
  setTimeout(function() {
    showResultScreen('report');
  }, 1500);
}

function showPaidToast() {
  const t = document.createElement('div');
  t.className = 'toast-paid animate-in';
  t.innerHTML =
    '<span class="toast-paid-icon"><span data-icon="check" data-size="18" data-stroke="3"></span></span>' +
    '<div><div class="text-13 fw-700 text-strong">결제가 완료되었습니다</div><div class="text-12 text-subtle">맞춤 리포트로 이동합니다…</div></div>';
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

/* ===========================================================
 * 견적표 다운로드 (Excel/CSV + PDF)
 * =========================================================== */
function downloadEstimateCSV() {
  const rows = [
    ['표준 견적서 — 인테리어 첫단추'],
    ['견적 ID', '#20260514-A720-EST'],
    ['발행일', '2026-05-14'],
    ['유효기간', '발행일로부터 30일'],
    ['현장', '부산 해운대구 우동 일대 1층 상가'],
    ['전용면적', '28.5평 (94.2㎡) · 평면 8.4 × 11.2m · 층고 2.7m'],
    ['업종·용도', '1종 근린생활시설 · 카페 (휴게음식점)'],
    [''],
    ['분류', '세부 항목', '단위', '수량', '단가(원)', '금액(원)', '비고'],
    ['가설·철거', '현장 보양 · 가설 자재', '평', '28.5', '21000', '600000', '바닥·벽 양생, 안전휀스'],
    ['가설·철거', '기존 마감재 · 칸막이 철거', '평', '28.5', '91000', '2600000', '폐기물 운반비 포함'],
    ['목공·천장', '경량 칸막이 (석고보드 2P)', '㎡', '26', '158000', '4100000', '화장실 분리벽 포함'],
    ['목공·천장', '천장 틀·우물천장 마감', '평', '28.5', '73700', '2100000', 'SMC + 등기구 마감'],
    ['도장·페인트', '벽체 · 천장 도장 (수성)', '㎡', '142', '16200', '2300000', '노출 벽돌 영역 별도'],
    ['바닥·타일', '화장실 · 주방 타일 (300×300)', '㎡', '11', '118000', '1300000', '접착시공 · 줄눈 포함'],
    ['바닥·타일', '홀 강화마루 + 걸레받이', '평', '22', '172700', '3800000', '8mm · 평탄 작업 포함'],
    ['전기·소방', '조명 기구 · 펜던트 설치', '개소', '18', '211100', '3800000', '메인 라인 + 부속 포함'],
    ['전기·소방', '스프링클러 위치 변경 · 추가', '개소', '7', '600000', '4200000', '관할 소방서 협의 필요'],
    ['전기·소방', '콘센트 · 통신 배선', '식', '1', '600000', '600000', 'POS · 카운터 라인'],
    ['가구·사인', '카운터 · 선반 · 외부 사인', '식', '1', '3200000', '3200000', '원목 + LED 채널 사인'],
    ['주방·집기', '주방기기 · 후드 · 트렌치', '식', '1', '7600000', '7600000', '중고 활용 시 ▼30%'],
    ['잡공사·기타', '현장 청소 · 준공 검수', '식', '1', '300000', '300000', '준공 보고서 작성'],
    [''],
    ['', '', '', '', '소계', '36500000', ''],
    ['', '', '', '', '부가세(10%)', '3650000', '사업자 등록 후 환급 가능'],
    ['', '', '', '', '합계 (VAT 포함)', '40150000', ''],
    [''],
    ['※ 본 견적은 부산 지역 평균 시세 기준 참고 견적입니다. 실제 공사 금액은 시공사·자재·현장 여건에 따라 ±20~30% 변동될 수 있습니다.']
  ];

  const csv = rows.map(function(r) {
    return r.map(function(c) {
      const s = String(c == null ? '' : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',');
  }).join('\r\n');

  // Excel 한글 BOM
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '표준견적서_20260514_A720.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}

function setupEstimateDownload() {
  const excelBtn = document.getElementById('dl-excel');
  if (excelBtn) excelBtn.addEventListener('click', downloadEstimateCSV);

  const pdfBtn = document.getElementById('dl-pdf');
  if (pdfBtn) pdfBtn.addEventListener('click', function() { window.print(); });
}

/* ===========================================================
 * 시공 일정 — 월간 캘린더 뷰 빌더 + 뷰 토글
 * =========================================================== */
const SCHEDULE_TASKS = [
  { name: '철거·가설', cls: 'gantt-bar-orange', start: new Date(2026,4,14), end: new Date(2026,4,20), lane: 1 },
  { name: '목공·천장', cls: 'gantt-bar-green',  start: new Date(2026,4,14), end: new Date(2026,5,3),  lane: 2 },
  { name: '전기·소방', cls: 'gantt-bar-blue',   start: new Date(2026,4,28), end: new Date(2026,5,17), lane: 1 },
  { name: '마감·도장', cls: 'gantt-bar-purple', start: new Date(2026,5,4),  end: new Date(2026,5,24), lane: 3 },
  { name: '주방·집기', cls: 'gantt-bar-teal',   start: new Date(2026,5,11), end: new Date(2026,5,30), lane: 2 }
];
const SCHEDULE_MONTHS = [
  { year: 2026, month: 4, label: '2026년 5월' },
  { year: 2026, month: 5, label: '2026년 6월' }
];
let scheduleCalIdx = 0;

function renderScheduleCalendar() {
  const container = document.getElementById('schedule-calendar');
  if (!container) return;
  const m = SCHEDULE_MONTHS[scheduleCalIdx];

  function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function sameOrBefore(a, b) { return a.getTime() <= b.getTime(); }
  function maxDate(a, b) { return a.getTime() >= b.getTime() ? a : b; }
  function minDate(a, b) { return a.getTime() <= b.getTime() ? a : b; }

  function buildWeekRow(weekStart, currentMonth) {
    let cells = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const inMonth = d.getMonth() === currentMonth;
      const dow = d.getDay();
      const cls = 'cal-date-cell'
        + (inMonth ? '' : ' is-out')
        + (dow === 0 ? ' is-sun' : (dow === 6 ? ' is-sat' : ''));
      cells += '<div class="' + cls + '">' + d.getDate() + '</div>';
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    let bars = '';
    SCHEDULE_TASKS.forEach(function(t) {
      if (t.end < weekStart || t.start > weekEnd) return;
      const segStart = maxDate(t.start, weekStart);
      const segEnd = minDate(t.end, weekEnd);
      const startCol = segStart.getDay() + 1;
      const endCol = segEnd.getDay() + 2;
      const row = t.lane + 1;
      bars += '<div class="cal-bar ' + t.cls + '"'
        + ' data-col="' + startCol + ' / ' + endCol + '"'
        + ' data-row="' + row + '"'
        + ' title="' + escapeHtml(t.name) + '">'
        + escapeHtml(t.name) + '</div>';
    });

    return '<div class="cal-week-row">' + cells + bars + '</div>';
  }

  const monthStart = new Date(m.year, m.month, 1);
  const monthEnd = new Date(m.year, m.month + 1, 0);
  const cursor = new Date(monthStart);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  let weeks = '';
  while (sameOrBefore(cursor, monthEnd)) {
    weeks += buildWeekRow(new Date(cursor), m.month);
    cursor.setDate(cursor.getDate() + 7);
  }

  const prevDisabled = scheduleCalIdx === 0 ? ' disabled' : '';
  const nextDisabled = scheduleCalIdx === SCHEDULE_MONTHS.length - 1 ? ' disabled' : '';

  container.innerHTML =
      '<div class="cal-month-header">'
    +   '<button type="button" class="cal-nav-btn" id="cal-prev" aria-label="이전 달"' + prevDisabled + '><span data-icon="chevronLeft" data-size="16"></span></button>'
    +   '<div class="cal-month-title">' + m.label + '</div>'
    +   '<button type="button" class="cal-nav-btn" id="cal-next" aria-label="다음 달"' + nextDisabled + '><span data-icon="chevronRight" data-size="16"></span></button>'
    + '</div>'
    + '<div class="cal-weekday-row">'
    +   '<span class="cal-weekday cal-weekday-sun">일</span>'
    +   '<span class="cal-weekday">월</span>'
    +   '<span class="cal-weekday">화</span>'
    +   '<span class="cal-weekday">수</span>'
    +   '<span class="cal-weekday">목</span>'
    +   '<span class="cal-weekday">금</span>'
    +   '<span class="cal-weekday cal-weekday-sat">토</span>'
    + '</div>'
    + '<div class="cal-weeks">' + weeks + '</div>';

  container.querySelectorAll('.cal-bar').forEach(function(el) {
    el.style.gridColumn = el.dataset.col;
    el.style.gridRow = el.dataset.row;
  });
  if (typeof renderIcons === 'function') renderIcons(container);

  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  if (prevBtn) prevBtn.addEventListener('click', function() {
    if (scheduleCalIdx > 0) { scheduleCalIdx--; renderScheduleCalendar(); }
  });
  if (nextBtn) nextBtn.addEventListener('click', function() {
    if (scheduleCalIdx < SCHEDULE_MONTHS.length - 1) { scheduleCalIdx++; renderScheduleCalendar(); }
  });
}

function buildScheduleCalendar() {
  const container = document.getElementById('schedule-calendar');
  if (!container || container.dataset.built === 'true') return;
  scheduleCalIdx = 0;
  renderScheduleCalendar();
  container.dataset.built = 'true';
}

function setupScheduleViewToggle() {
  const btns = document.querySelectorAll('.schedule-view-btn');
  const ganttView = document.getElementById('schedule-view-gantt');
  const calView = document.getElementById('schedule-view-calendar');
  if (!btns.length || !ganttView || !calView) return;

  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      btns.forEach(function(b) { b.classList.toggle('is-active', b === btn); });
      const view = btn.dataset.view;
      ganttView.hidden = (view !== 'gantt');
      calView.hidden = (view !== 'calendar');
      if (view === 'calendar') buildScheduleCalendar();
    });
  });
}

/* ===========================================================
 * 재산정 (3D 시안 업로드 → 견적·일정 갱신)
 * =========================================================== */
function setupRecalcFlow() {
  const card = document.getElementById('recalc-card');
  const openBtn = document.getElementById('open-recalc-modal');
  const modal = document.getElementById('recalc-modal');
  const backdrop = document.getElementById('recalc-backdrop');
  const closeBtn = document.getElementById('recalc-close');
  const cancelBtn = document.getElementById('recalc-cancel');
  const dropzone = document.getElementById('recalc-dropzone');
  const fileInput = document.getElementById('recalc-file-input');
  const filenameEl = document.getElementById('recalc-filename');
  const submitBtn = document.getElementById('recalc-submit');
  const stepUpload = document.getElementById('recalc-step-upload');
  const stepProgress = document.getElementById('recalc-step-progress');
  const stepDone = document.getElementById('recalc-step-done');
  const progressMsg = document.getElementById('recalc-progress-msg');
  const confirmBtn = document.getElementById('recalc-confirm');
  if (!modal) return;

  const STORAGE_KEY = 'firstbutton-recalc-used';

  function applyUsedState() {
    if (!card) return;
    card.classList.add('is-used');
    card.querySelector('.recalc-card-title').textContent = '재산정이 완료되었습니다';
    card.querySelector('.recalc-card-desc').innerHTML = '업로드한 시안 기준으로 시공 기간·견적이 갱신되었습니다. <strong>추가 재산정은 프로 구독 시 무제한</strong>으로 이용 가능합니다.';
    card.querySelector('.recalc-card-meta').textContent = '1회 무료 재산정 사용 완료';
    if (openBtn) {
      openBtn.textContent = '프로 구독으로 추가 재산정';
      openBtn.classList.remove('btn-primary');
      openBtn.classList.add('btn-outline');
    }
  }

  if (localStorage.getItem(STORAGE_KEY) === 'true') applyUsedState();

  function open() {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      const subModal = document.getElementById('design-sub-modal');
      if (subModal) {
        subModal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
      return;
    }
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    stepUpload.hidden = false;
    stepProgress.hidden = true;
    stepDone.hidden = true;
    if (fileInput) fileInput.value = '';
    if (filenameEl) filenameEl.textContent = '';
    if (submitBtn) submitBtn.disabled = true;
  }
  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', function() { fileInput.click(); });
    dropzone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
    dropzone.addEventListener('dragleave', function() {
      dropzone.classList.remove('is-dragover');
    });
    dropzone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFile(fileInput.files[0]);
      }
    });
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length) handleFile(fileInput.files[0]);
    });
  }

  function handleFile(file) {
    const okTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (okTypes.indexOf(file.type) < 0) {
      alert('PNG · JPG · PDF 파일만 업로드 가능합니다.');
      fileInput.value = '';
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('파일은 최대 20MB까지 업로드 가능합니다.');
      fileInput.value = '';
      return;
    }
    filenameEl.textContent = '선택됨: ' + file.name;
    submitBtn.disabled = false;
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      stepUpload.hidden = true;
      stepProgress.hidden = false;
      const steps = ['마감재 영역 추출 중', '가구·조명 사양 매칭 중', '단가 계산 및 일정 보정 중'];
      let i = 0;
      progressMsg.textContent = steps[0];
      const t = setInterval(function() {
        i++;
        if (i >= steps.length) {
          clearInterval(t);
          setTimeout(function() {
            stepProgress.hidden = true;
            stepDone.hidden = false;
          }, 600);
          return;
        }
        progressMsg.textContent = steps[i];
      }, 900);
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      localStorage.setItem(STORAGE_KEY, 'true');
      const costSignal = document.getElementById('cost-signal');
      if (costSignal) costSignal.innerHTML = '<span class="pulse"></span> 4,210만 · 평당 148만 · 갱신됨';
      const scheduleSignal = document.getElementById('schedule-signal');
      if (scheduleSignal) scheduleSignal.innerHTML = '<span class="pulse"></span> 50일 · 5개 공정 · 갱신됨';
      const scheduleBase = document.getElementById('schedule-base-label');
      if (scheduleBase) scheduleBase.innerHTML = '<strong class="text-strong">업로드하신 최종 3D 시안</strong>';
      const costBase = document.getElementById('cost-base-label');
      if (costBase) costBase.innerHTML = '<strong class="text-strong">업로드하신 최종 3D 시안</strong>';
      const totalDays = document.getElementById('schedule-total-days');
      if (totalDays) totalDays.textContent = '50일(영업일 기준)';
      applyUsedState();
      close();
      alert('재산정이 완료되었습니다. 견적·일정이 갱신되었습니다.');
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}

/* ===========================================================
 * 프로 구독 모달 (디자인 시안 무제한)
 * =========================================================== */
function setupDesignSubModal() {
  const modal = document.getElementById('design-sub-modal');
  const openBtn = document.getElementById('open-design-sub-modal');
  const closeBtn = document.getElementById('design-sub-close');
  const backdrop = document.getElementById('design-sub-backdrop');
  if (!modal) return;

  function open() {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}

document.addEventListener('DOMContentLoaded', function() {
  applyActiveResultModules();
  setupSampleMode();
  setupPaywall();
  setupPrintButton();
  setupShareButtons();
  setupEstimateDownload();
  setupDesignSubModal();
  setupRecalcFlow();
  setupScheduleViewToggle();

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
