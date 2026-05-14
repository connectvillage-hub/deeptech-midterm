/* ===========================================================
 * aidesign.js — AI 디자인 시안 생성 페이지
 *   기능: AI 챗 시나리오 (인사/질문 2개/요약) +
 *         사용자 답변·입력·레퍼런스·도면을 종합 분석하는 척하는
 *         "맞춤 시안 생성" 시뮬레이션 (단일 시안, 매 생성마다 고유 ID)
 *
 *   주의: 시안 종류는 내부적으로 키워드 매칭으로 결정하지만
 *         UI에는 프리셋 명칭(Warm Mid-Century 등)을 노출하지 않음.
 *         사용자에게는 "당신만의 시안"으로 인식되게 함.
 * =========================================================== */

/* ----- AI 챗 시나리오 ----- */
const AI_DIALOGUE = [
  {
    text: '안녕하세요! 입력하신 디자인 콘셉트를 분석했어요. 몇 가지 더 여쭤볼게요 😊'
  },
  {
    text: '"모던, 따뜻한, 빈티지 한 스푼"이라고 적어주셨는데요 — 빈티지 느낌이 구체적으로 어떤 요소를 의미하시나요?\n\n예를 들어:\n• 노출 벽돌 + 블랙 메탈 조명 (인더스트리얼 빈티지)\n• 원목 가구 + 가죽 소파 + 황동 (미드센추리)\n• 빛바랜 컬러 + 레트로 타일 (레트로 빈티지)'
  },
  {
    text: '좋아요, 그럼 조명은 어떤 분위기를 원하시나요?\n\n• 따뜻한 펜던트 조명 (아늑함)\n• 트랙 + 라인 조명 (모던)\n• 에디슨 전구 + 다운라이트 (빈티지 강조)'
  }
];

/* ----- 생성 진행 단계 (시뮬레이션) ----- */
const PROGRESS_STEPS = [
  { text: '입력 데이터 분석 중', sub: '평면치수 · 마감재 · 무드 종합' },
  { text: '레퍼런스 이미지 분석 중', sub: '3장의 색조·공간감 추출' },
  { text: '도면 자동 인식', sub: '8.4 × 11.2m · 층고 2.7m 매핑' },
  { text: 'ControlNet 추론 중', sub: '구조 보존 + LoRA 스타일 적용' }
];

/* ----- 상태 ----- */
let dialogueIdx = 0;
let chatBusy = false;
let userAnswers = [];
let chosenMood = null;        // 내부적으로 결정되는 무드 (UI 미노출)
let currentDesignId = null;
let hasGeneratedOnce = false;

/* ----- 분위기 매핑 (내부용 · UI에 라벨 노출 안 함) ----- */
function detectMoodFromAnswers(answers) {
  const text = (answers.join(' ') || '').toLowerCase();
  if (/인더스트리얼|industrial|벽돌|brick|loft|노출|트러스|블랙\s*메탈|metal/.test(text)) {
    return { kind: 'vintage', hue: '20', desc: '노출 벽돌 + 블랙 메탈 + 에디슨 전구' };
  }
  if (/레트로|retro|빛바랜|타일|tile/.test(text)) {
    return { kind: 'vintage', hue: '40', desc: '빛바랜 톤 + 레트로 타일 + 따뜻한 조명' };
  }
  if (/미드센추리|midcentury|mid-century|미드|원목|가죽|황동|wood/.test(text)) {
    return { kind: 'warm', hue: '30', desc: '원목 + 가죽 + 황동 액센트 + 펜던트 조명' };
  }
  if (/모던|modern|미니멀|minimal|화이트|white|그레이|grey|gray/.test(text)) {
    return { kind: 'modern', hue: '220', desc: '미니멀 + 메탈 + 트랙 조명' };
  }
  // 매칭 없으면 입력 데이터 평균값 기반 기본 분위기
  return { kind: 'warm', hue: '30', desc: '원목 + 가죽 + 황동 액센트 + 펜던트 조명' };
}

function buildSummaryMessage() {
  const mood = detectMoodFromAnswers(userAnswers);
  return {
    text:
      '콘셉트가 정리됐어요! ✨\n\n' +
      '분석된 요소를 종합해 시안을 생성합니다:\n' +
      '• ' + mood.desc + '\n' +
      '• 평수 28.5평 · 레퍼런스 3장 · 도면 1장 인식됨\n\n' +
      '우측의 "이미지 생성"을 눌러주세요.',
    final: true,
    mood: mood
  };
}

/* ----- 디자인 ID 생성 (매 생성마다 새 ID) ----- */
function generateDesignId() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return '#' + yyyy + mm + dd + '-D' + rand;
}

/* ----- 유틸 ----- */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, function(c) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
  }).replace(/\n/g, '<br/>');
}

function scrollChatToBottom() {
  const c = document.getElementById('chat-messages');
  if (c) c.scrollTop = c.scrollHeight;
}

/* ----- 챗 메시지 ----- */
function addTypingIndicator() {
  const container = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.className = 'chat-bubble-row animate-in';
  row.dataset.typing = '1';
  row.innerHTML =
    '<span class="chat-avatar"><span data-icon="sparkles" data-size="14"></span></span>' +
    '<div class="chat-bubble chat-bubble-ai"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
  container.appendChild(row);
  renderIcons(row);
  scrollChatToBottom();
  return row;
}

function addAIMessage(text) {
  const container = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.className = 'chat-bubble-row animate-in';
  row.innerHTML =
    '<span class="chat-avatar"><span data-icon="sparkles" data-size="14"></span></span>' +
    '<div class="chat-bubble chat-bubble-ai">' + escapeHtml(text) + '</div>';
  container.appendChild(row);
  renderIcons(row);
  scrollChatToBottom();
}

function addUserMessage(text) {
  const container = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.className = 'chat-bubble-row is-user animate-in';
  row.innerHTML = '<div class="chat-bubble chat-bubble-user">' + escapeHtml(text) + '</div>';
  container.appendChild(row);
  scrollChatToBottom();
}

/* ----- 챗 흐름 ----- */
function showNextAITurn(autoChain) {
  chatBusy = true;
  let msg;
  if (dialogueIdx < AI_DIALOGUE.length) {
    msg = AI_DIALOGUE[dialogueIdx];
  } else if (dialogueIdx === AI_DIALOGUE.length) {
    msg = buildSummaryMessage();
    chosenMood = msg.mood;
  } else {
    chatBusy = false;
    return;
  }
  const typing = addTypingIndicator();
  setTimeout(function() {
    typing.remove();
    addAIMessage(msg.text);
    dialogueIdx++;
    chatBusy = false;
    if (msg.final) enableGeneration();
    if (autoChain && dialogueIdx === 1) {
      setTimeout(function() { showNextAITurn(false); }, 700);
    }
  }, 1100);
}

function handleUserSend() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || chatBusy) return;
  addUserMessage(text);
  userAnswers.push(text);
  input.value = '';
  if (dialogueIdx <= AI_DIALOGUE.length) {
    setTimeout(function() { showNextAITurn(false); }, 350);
  }
}

/* ----- 생성 활성/실행 ----- */
function enableGeneration() {
  const btn = document.getElementById('generate-btn');
  const hint = document.getElementById('gen-hint');
  if (btn) btn.disabled = false;
  if (hint) {
    hint.textContent = '✨ 콘셉트 정리 완료 · 맞춤 시안 생성 가능';
    hint.classList.add('gen-hint-ready');
  }
}

function renderProgressStep(step) {
  return '<span class="spinner" data-icon="refresh" data-size="32" data-color="var(--brand)"></span>' +
    '<div class="text-14 fw-700 text-default">' + escapeHtml(step.text) + '</div>' +
    '<div class="text-12 text-subtle">' + escapeHtml(step.sub) + '</div>';
}

function startGeneration() {
  const btn = document.getElementById('generate-btn');
  const status = document.getElementById('gen-status');
  const display = document.getElementById('image-display');
  if (!btn || btn.disabled || !chosenMood) return;

  // 매번 새 ID
  currentDesignId = generateDesignId();

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" data-icon="refresh" data-size="14"></span> 생성 중...';
  renderIcons(btn);
  status.textContent = '생성 중';
  status.className = 'badge badge-blue';

  // 진행 단계 순환
  display.className = 'placeholder-image image-display';
  display.innerHTML = renderProgressStep(PROGRESS_STEPS[0]);
  renderIcons(display);

  let stepIdx = 0;
  const stepTimer = setInterval(function() {
    stepIdx++;
    if (stepIdx >= PROGRESS_STEPS.length) {
      clearInterval(stepTimer);
      return;
    }
    display.innerHTML = renderProgressStep(PROGRESS_STEPS[stepIdx]);
    renderIcons(display);
  }, 700);

  setTimeout(function() {
    clearInterval(stepTimer);
    renderMainImage(chosenMood.kind, chosenMood.hue, currentDesignId);
    btn.disabled = false;
    btn.innerHTML = '<span data-icon="refresh" data-size="14"></span> 다시 생성';
    renderIcons(btn);
    status.textContent = '생성 완료';
    status.className = 'badge badge-success';

    // 첫 생성 후 분석 요소 카드 노출
    if (!hasGeneratedOnce) {
      hasGeneratedOnce = true;
      const card = document.getElementById('analyzed-card');
      if (card) {
        card.classList.remove('is-hidden');
        const chatSummary = document.getElementById('analyzed-chat-summary');
        if (chatSummary) {
          chatSummary.textContent = userAnswers.length
            ? userAnswers.map(function(a) { return '"' + a + '"'; }).join(' · ')
            : '—';
        }
      }
    }
  }, PROGRESS_STEPS.length * 700);
}

/* ----- 메인 이미지 렌더 + 별점 + 디자인 ID 배지 ----- */
function renderMainImage(kind, hue, designId) {
  const display = document.getElementById('image-display');
  display.className = 'image-display-ready';
  display.innerHTML =
    '<div data-mood="' + kind + '" data-hue="' + hue + '" data-height="340"></div>' +
    '<div class="img-id-badge"><span class="text-11 fw-700">' + escapeHtml(designId) + '</span></div>' +
    '<div class="img-rating-badge">' +
    '<span class="text-12 fw-700">이 시안 평가</span>' +
    '<div class="star-rating" id="star-rating">' +
    '<span class="star" data-star="1">★</span><span class="star" data-star="2">★</span><span class="star" data-star="3">★</span><span class="star" data-star="4">★</span><span class="star" data-star="5">★</span>' +
    '</div></div>';
  renderMoodImages(display);
  setupStarRating();
}

function setupStarRating() {
  const wrap = document.getElementById('star-rating');
  if (!wrap) return;
  const stars = wrap.querySelectorAll('.star');
  let locked = 0;
  function paint(n) {
    stars.forEach(function(s) {
      const sn = parseInt(s.getAttribute('data-star'));
      s.classList.toggle('is-active', sn <= n);
    });
  }
  stars.forEach(function(star) {
    star.addEventListener('mouseenter', function() {
      paint(parseInt(star.getAttribute('data-star')));
    });
    star.addEventListener('click', function() {
      locked = parseInt(star.getAttribute('data-star'));
      paint(locked);
    });
  });
  wrap.addEventListener('mouseleave', function() { paint(locked); });
}

/* ----- 초기화 ----- */
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() { showNextAITurn(true); }, 400);

  document.getElementById('chat-send').addEventListener('click', handleUserSend);
  document.getElementById('chat-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserSend(); }
  });

  document.getElementById('generate-btn').addEventListener('click', startGeneration);

  const savePdfBtn = document.getElementById('save-pdf-btn');
  if (savePdfBtn) {
    savePdfBtn.addEventListener('click', function() { window.print(); });
  }
});
