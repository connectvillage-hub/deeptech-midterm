(function(){
  const cards = document.querySelectorAll('.plan-card--check');
  const countEl = document.getElementById('sel-count');
  const totalEl = document.getElementById('sel-total');
  const startBtn = document.getElementById('start-btn');
  const bundleHint = document.getElementById('bundle-hint');
  const switchBundleBtn = document.getElementById('switch-bundle');

  const singles = ['permit','estimate','design'];
  const fmt = n => n.toLocaleString('ko-KR') + '원';

  function getSelected(){
    return Array.from(cards).filter(c => c.classList.contains('is-selected'));
  }

  function update(){
    const sel = getSelected();
    const total = sel.reduce((s,c)=> s + parseInt(c.dataset.price,10), 0);
    countEl.textContent = '선택된 모듈 ' + sel.length + '개';
    totalEl.textContent = fmt(total);
    startBtn.disabled = sel.length === 0;
    // 단건 3개 모두 선택은 이제 자동 전환되므로 hint는 항상 숨김
    if (bundleHint) bundleHint.classList.add('is-hidden');
  }

  function autoSwitchToBundleIfAllSingles(){
    // 3개 단건 모두 선택된 상태 → 자동으로 풀세트로 전환
    const selected = getSelected().map(c => c.dataset.module);
    const allSingles = singles.every(k => selected.includes(k)) && !selected.includes('bundle');
    if (!allSingles) return false;
    cards.forEach(c => {
      if (singles.includes(c.dataset.module)) c.classList.remove('is-selected');
      if (c.dataset.module === 'bundle') c.classList.add('is-selected');
    });
    // 자동 전환 안내 토스트
    showBundleAutoToast();
    return true;
  }

  function showBundleAutoToast(){
    let toast = document.getElementById('bundle-auto-toast');
    if (!toast){
      toast = document.createElement('div');
      toast.id = 'bundle-auto-toast';
      toast.className = 'bundle-auto-toast';
      toast.innerHTML = '<span data-icon="check" data-size="14" data-stroke="3"></span> 더 저렴한 풀세트로 자동 전환했어요 (27,000원 절약)';
      document.body.appendChild(toast);
      if (typeof renderIcons === 'function') renderIcons(toast);
    }
    toast.classList.remove('is-leaving');
    toast.classList.add('is-shown');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function(){
      toast.classList.remove('is-shown');
      toast.classList.add('is-leaving');
    }, 2600);
  }

  cards.forEach(card => {
    card.addEventListener('click', e => {
      const key = card.dataset.module;
      const willSelect = !card.classList.contains('is-selected');

      if (key === 'bundle' && willSelect){
        cards.forEach(c => { if (c.dataset.module !== 'bundle') c.classList.remove('is-selected'); });
      }
      if (singles.includes(key) && willSelect){
        const bundleCard = document.querySelector('[data-module="bundle"]');
        if (bundleCard) bundleCard.classList.remove('is-selected');
      }

      card.classList.toggle('is-selected');
      // 단건 3개 모두 선택됐으면 자동 전환
      autoSwitchToBundleIfAllSingles();
      update();
    });
  });

  if (switchBundleBtn){
    switchBundleBtn.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('is-selected'));
      const b = document.querySelector('[data-module="bundle"]');
      if (b) b.classList.add('is-selected');
      update();
    });
  }

  // 선택한 모듈 조합 → 해당 입력 페이지로 라우팅
  // 단건 1개  : 그 모듈 전용 페이지 (인허가/견적/디자인)
  // 2개 이상   : 풀세트 페이지 (어차피 입력은 다 받음)
  // bundle    : 풀세트 페이지
  const PAGE_BY_MODULE = {
    permit:   '2_입력_인허가.html',
    estimate: '2_입력_견적.html',
    design:   '2_입력_디자인.html',
    bundle:   '2_입력_풀세트.html'
  };

  startBtn.addEventListener('click', () => {
    const sel = getSelected().map(c => c.dataset.module);
    let target;
    if (sel.length === 1) {
      target = PAGE_BY_MODULE[sel[0]] || '2_입력_풀세트.html';
    } else {
      target = '2_입력_풀세트.html';
    }
    location.href = target;
  });

  update();
})();
