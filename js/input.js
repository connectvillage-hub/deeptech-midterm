/* ===========================================================
 * input.js — 입력 그룹 5단계
 *   기능: 화면 전환 / localStorage 자동 저장·복원 / 필수항목 검증 /
 *         카드 접기·펼치기 / 칩·카드 선택 토글
 * 화면 ID: address, biztype, basic, reference, design
 * =========================================================== */

function setupOwnDesignUpload() {
  const dropzone = document.getElementById('own-design-dropzone');
  const input = document.getElementById('own-design-input');
  const filename = document.getElementById('own-design-filename');
  if (!dropzone || !input) return;

  function handleFile(file) {
    const okTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (okTypes.indexOf(file.type) < 0) {
      alert('PNG · JPG · PDF 파일만 업로드 가능합니다.');
      input.value = '';
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('파일은 최대 20MB까지 업로드 가능합니다.');
      input.value = '';
      return;
    }
    if (filename) filename.textContent = file.name;
  }

  dropzone.addEventListener('click', function() { input.click(); });
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
      input.files = e.dataTransfer.files;
      handleFile(input.files[0]);
    }
  });
  input.addEventListener('change', function() {
    if (input.files.length) handleFile(input.files[0]);
  });
}


const STEP_ORDER = ['address', 'biztype', 'basic', 'reference', 'design'];
const STORAGE_KEY = 'interior_input_state_v1';

/* ----- 화면 전환 ----- */
const STEP_LABELS = { address:'주소', biztype:'업종', basic:'기본', reference:'참고', design:'디자인' };

function showStep(id) {
  document.querySelectorAll('main > .screen').forEach(function(s) {
    s.classList.toggle('is-active', s.id === id);
  });
  updateTopProgress(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (history.replaceState) history.replaceState(null, '', '#' + id);
  saveState();
}

function updateTopProgress(stepId) {
  const idx = STEP_ORDER.indexOf(stepId);
  if (idx < 0) return;
  const pct = ((idx + 1) / STEP_ORDER.length) * 100;
  const label = document.getElementById('top-progress-label');
  const pctEl = document.getElementById('top-progress-pct');
  const bar = document.getElementById('top-progress-bar');
  if (label) label.textContent = (idx + 1) + ' / 5 · ' + (STEP_LABELS[stepId] || stepId);
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';
  if (bar) bar.style.width = pct + '%';
}

function getCurrentStep() {
  const active = document.querySelector('main > .screen.is-active');
  return active ? active.id : STEP_ORDER[0];
}

/* ----- 상태 저장/복원 ----- */
function saveState() {
  const state = { step: getCurrentStep(), inputs: {}, chips: {}, cards: {} };
  document.querySelectorAll('main input, main select').forEach(function(el, i) {
    if (el.type === 'file') return; // 파일 input은 보안상 직렬화 불가
    state.inputs[i] = (el.type === 'checkbox') ? el.checked : el.value;
  });
  document.querySelectorAll('main .chip, main .chip-square').forEach(function(el, i) {
    state.chips[i] = el.classList.contains('is-selected');
  });
  document.querySelectorAll('main .choice-card').forEach(function(el, i) {
    state.cards[i] = el.classList.contains('is-selected');
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function restoreState(state) {
  if (!state) return;
  document.querySelectorAll('main input, main select').forEach(function(el, i) {
    if (el.type === 'file') return; // 파일 input에 문자열 할당 시 보안 예외
    if (state.inputs && i in state.inputs) {
      try {
        if (el.type === 'checkbox') el.checked = !!state.inputs[i];
        else el.value = state.inputs[i];
      } catch (e) { /* 인덱스 어긋남 등 무시 */ }
    }
  });
  document.querySelectorAll('main .chip, main .chip-square').forEach(function(el, i) {
    if (state.chips && i in state.chips) el.classList.toggle('is-selected', !!state.chips[i]);
  });
  document.querySelectorAll('main .choice-card').forEach(function(el, i) {
    if (state.cards && i in state.cards) el.classList.toggle('is-selected', !!state.cards[i]);
  });
}

function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

/* ----- "이어서 작성" 배너 ----- */
function showResumeBanner() {
  if (document.getElementById('resume-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'resume-banner';
  banner.className = 'resume-banner animate-in';
  banner.innerHTML =
    '<div class="resume-banner-text flex items-center gap-6">' +
    '<span data-icon="refresh" data-size="14"></span> 이전에 작성하시던 내용을 불러왔습니다.' +
    '</div>' +
    '<div class="flex gap-8">' +
    '<button class="btn btn-ghost btn-sm" id="resume-reset">처음부터 다시</button>' +
    '<button class="btn btn-ghost btn-sm" id="resume-dismiss">닫기</button>' +
    '</div>';
  const firstScreen = document.querySelector('main > .screen.is-active .page-narrow') || document.querySelector('main');
  firstScreen.insertBefore(banner, firstScreen.firstChild);
  renderIcons(banner);
  document.getElementById('resume-reset').addEventListener('click', function() {
    if (confirm('입력한 내용을 모두 지우고 처음부터 다시 작성할까요?')) {
      clearState();
      location.hash = '';
      location.reload();
    }
  });
  document.getElementById('resume-dismiss').addEventListener('click', function() {
    banner.remove();
  });
}

/* ----- 검증 ----- */
function validateStep(stepId) {
  const screen = document.getElementById(stepId);
  if (!screen) return true;
  screen.querySelectorAll('.is-error').forEach(function(el) { el.classList.remove('is-error'); });
  screen.querySelectorAll('.field-error').forEach(function(el) { el.remove(); });

  let firstError = null;
  screen.querySelectorAll('.field-label').forEach(function(label) {
    if (!label.querySelector('.req')) return;
    const target = label.nextElementSibling;
    if (!target) return;
    if (!checkFieldValue(target)) {
      markError(target);
      if (!firstError) firstError = target;
    }
  });
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

function checkFieldValue(el) {
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
    return !!(el.value && el.value.trim().length > 0);
  }
  const inputs = el.querySelectorAll('input, select');
  if (inputs.length > 0) {
    return Array.prototype.every.call(inputs, function(i) {
      return !!(i.value && i.value.trim().length > 0);
    });
  }
  const chips = el.querySelectorAll('.chip, .chip-square, .choice-card');
  if (chips.length > 0) {
    return Array.prototype.some.call(chips, function(c) {
      return c.classList.contains('is-selected');
    });
  }
  return true;
}

function markError(target) {
  if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
    target.classList.add('is-error');
  } else {
    target.querySelectorAll('input, select').forEach(function(i) { i.classList.add('is-error'); });
  }
  const msg = document.createElement('div');
  msg.className = 'field-error';
  msg.innerHTML = '<span data-icon="alert" data-size="12"></span> 필수 항목입니다';
  target.parentNode.insertBefore(msg, target.nextSibling);
  renderIcons(msg);
}

function clearErrors(screen) {
  if (!screen) return;
  screen.querySelectorAll('.is-error').forEach(function(el) { el.classList.remove('is-error'); });
  screen.querySelectorAll('.field-error').forEach(function(el) { el.remove(); });
}

/* ----- 카드 접기 ----- */
function setupCollapseToggle() {
  document.querySelectorAll('.collapse-header').forEach(function(header) {
    header.addEventListener('click', function() {
      const card = header.closest('.collapse');
      if (card) card.classList.toggle('is-open');
    });
  });
}

/* ----- 칩 / 카드 선택 ----- */
function setupSelectToggle() {
  document.querySelectorAll('main .chip:not([data-dim-mode]), main .chip-square').forEach(function(chip) {
    chip.addEventListener('click', function() {
      chip.classList.toggle('is-selected');
      clearErrors(chip.closest('.screen'));
      saveState();
    });
  });
  document.querySelectorAll('main .choice-card').forEach(function(card) {
    card.addEventListener('click', function() {
      const parent = card.parentElement;
      if (parent) {
        parent.querySelectorAll('.choice-card').forEach(function(c) { c.classList.remove('is-selected'); });
      }
      card.classList.add('is-selected');
      clearErrors(card.closest('.screen'));
      saveState();
    });
  });
}

/* ----- 평면치수 mm ↔ 평수 토글 ----- */
function setupDimModeToggle() {
  document.querySelectorAll('[data-dim-mode]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-dim-mode]').forEach(function(b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
      const mode = btn.getAttribute('data-dim-mode');
      const mmEl = document.getElementById('dim-mm-fields');
      const pyeongEl = document.getElementById('dim-pyeong-fields');
      if (mmEl) mmEl.classList.toggle('is-hidden', mode !== 'mm');
      if (pyeongEl) pyeongEl.classList.toggle('is-hidden', mode !== 'pyeong');
      saveState();
    });
  });
}

/* ----- 초기화 ----- */
document.addEventListener('DOMContentLoaded', function() {
  let saved = null;
  try { saved = loadState(); } catch (e) { saved = null; }
  if (saved) {
    try { restoreState(saved); } catch (e) { /* 저장 데이터 손상 시 무시하고 진행 */ }
  }

  const hash = (location.hash || '').replace('#', '');
  let initial = STEP_ORDER[0];
  if (STEP_ORDER.indexOf(hash) >= 0) initial = hash;
  else if (saved && STEP_ORDER.indexOf(saved.step) >= 0) initial = saved.step;
  showStep(initial);

  if (saved && saved.step && saved.step !== STEP_ORDER[0]) {
    showResumeBanner();
  }

  document.querySelectorAll('[data-go]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      const target = btn.getAttribute('data-go');
      if (STEP_ORDER.indexOf(target) < 0) return;
      e.preventDefault();
      const current = getCurrentStep();
      const goingForward = STEP_ORDER.indexOf(target) > STEP_ORDER.indexOf(current);
      if (goingForward && !validateStep(current)) return;
      showStep(target);
    });
  });

  // 최종 제출 (디자인 단계 → AI 시안 생성 / 결과 페이지)
  document.querySelectorAll('a[href^="2_5_AI시안"], a[href^="3_결과.html"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (getCurrentStep() === 'design' && !validateStep('design')) {
        e.preventDefault();
      }
    });
  });

  setupSelectToggle();
  setupCollapseToggle();
  setupDimModeToggle();
  setupOwnDesignUpload();

  document.querySelectorAll('main input, main select').forEach(function(el) {
    el.addEventListener('input', function() {
      el.classList.remove('is-error');
      const screen = el.closest('.screen');
      if (screen) {
        screen.querySelectorAll('.field-error').forEach(function(e2) { e2.remove(); });
      }
      saveState();
    });
    el.addEventListener('change', saveState);
  });
});
