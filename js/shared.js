/* ===========================================================
 * shared.js — 모든 페이지가 공통으로 사용하는 아이콘 렌더러
 * 사용법: HTML에 <span data-icon="search" data-size="18"></span>
 *         이 스크립트가 DOMContentLoaded 시 자동으로 <svg>로 치환합니다.
 * =========================================================== */

const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  mapPin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  alert: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  shieldCheck: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><path d="M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><path d="M12 15V3"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  starFilled: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" fill="currentColor"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  hardHat: '<path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  filePdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13v4"/><path d="M9 13h2a1.5 1.5 0 1 1 0 3H9"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  briefcase: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
};

function buildIconSvg(name, size, color, stroke) {
  const path = ICON_PATHS[name];
  if (!path) return '';
  const fill = (name === 'starFilled' || name === 'palette') ? '' : 'fill="none"';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
    '" viewBox="0 0 24 24" ' + fill + ' stroke="' + (color || 'currentColor') +
    '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-linejoin="round"' +
    ' style="display:inline-block;flex-shrink:0;vertical-align:middle">' + path + '</svg>';
}

function renderIcons(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-icon]').forEach(function(el) {
    const name = el.getAttribute('data-icon');
    const size = parseInt(el.getAttribute('data-size') || '18', 10);
    const color = el.getAttribute('data-color') || '';
    const stroke = parseFloat(el.getAttribute('data-stroke') || '2');
    el.innerHTML = buildIconSvg(name, size, color, stroke);
  });
}

/* ===== MOOD IMAGE 렌더러 =====
 * 사용법: <div data-mood="warm" data-hue="30" data-height="100" data-label="warm wood"></div>
 * kind: modern | warm | vintage | minimal
 * 인테리어 요소: 벽/바닥/창문/조명/카운터·테이블/의자/식물 으로 구성
 */
function buildMoodSvg(kind, hue) {
  var h = hue || 220;

  if (kind === 'warm') {
    // 따뜻한 우드 카페 — 자연광 + 우드 카운터
    return [
      // 벽 + 바닥
      '<rect x="0" y="0" width="400" height="170" fill="#EFE0C4"/>',
      '<rect x="0" y="170" width="400" height="70" fill="#B8895A"/>',
      '<line x1="0" y1="195" x2="400" y2="195" stroke="#9E7349" stroke-width="0.6"/>',
      '<line x1="0" y1="218" x2="400" y2="218" stroke="#9E7349" stroke-width="0.6"/>',
      // 창문 + 햇살
      '<circle cx="80" cy="80" r="44" fill="#FFD27A" opacity="0.28"/>',
      '<rect x="30" y="40" width="100" height="80" fill="#FFF6E0" stroke="#8B6E45" stroke-width="2"/>',
      '<line x1="80" y1="40" x2="80" y2="120" stroke="#8B6E45" stroke-width="1.5"/>',
      '<line x1="30" y1="80" x2="130" y2="80" stroke="#8B6E45" stroke-width="1.5"/>',
      // 펜던트 조명
      '<line x1="180" y1="0" x2="180" y2="48" stroke="#665040" stroke-width="1.2"/>',
      '<path d="M168 48 L192 48 L186 66 L174 66 Z" fill="#8B6E45"/>',
      '<ellipse cx="180" cy="72" rx="11" ry="5" fill="#FFC97A" opacity="0.85"/>',
      // 우측 우드 카운터
      '<rect x="230" y="125" width="150" height="50" fill="#8B6E45" rx="2"/>',
      '<rect x="230" y="118" width="150" height="9" fill="#A3845C"/>',
      // 의자 (왼쪽)
      '<rect x="160" y="185" width="32" height="42" fill="#8B6E45" rx="3"/>',
      '<rect x="160" y="178" width="32" height="9" fill="#A3845C" rx="2"/>',
      // 식물
      '<circle cx="372" cy="100" r="14" fill="#4A7A4A"/>',
      '<circle cx="380" cy="92" r="8" fill="#5A8A5A"/>',
      '<rect x="365" y="111" width="14" height="14" fill="#5A3F26"/>'
    ].join('');
  }

  if (kind === 'vintage') {
    // 빈티지 노출 벽돌 + 에디슨 전구
    var bricks = '';
    var shades = ['#8A5A3A', '#7A4A2A', '#9A6A4A', '#854F2C', '#7C4C2C', '#8E6240'];
    for (var r = 0; r < 5; r++) {
      var offset = (r % 2 === 0) ? 0 : 20;
      for (var c = -1; c < 11; c++) {
        var x = c * 40 + offset;
        var y = r * 28;
        var shade = shades[(r * 7 + c * 3) % shades.length];
        bricks += '<rect x="' + x + '" y="' + y + '" width="38" height="26" fill="' + shade + '" stroke="#3A2010" stroke-width="0.6"/>';
      }
    }
    return [
      bricks,
      // 노출 트러스 (천장)
      '<rect x="0" y="0" width="400" height="5" fill="#1A0F0A"/>',
      '<rect x="56" y="0" width="6" height="28" fill="#1A0F0A"/>',
      '<rect x="196" y="0" width="6" height="28" fill="#1A0F0A"/>',
      '<rect x="336" y="0" width="6" height="28" fill="#1A0F0A"/>',
      // 바닥
      '<rect x="0" y="150" width="400" height="90" fill="#2A1F1A"/>',
      '<line x1="0" y1="172" x2="400" y2="172" stroke="#10070A" stroke-width="0.8"/>',
      // 에디슨 전구
      '<line x1="130" y1="5" x2="130" y2="62" stroke="#444" stroke-width="1"/>',
      '<ellipse cx="130" cy="70" rx="9" ry="11" fill="#FFC97A" opacity="0.9"/>',
      '<circle cx="130" cy="70" r="5" fill="#FFE9B8"/>',
      '<line x1="270" y1="5" x2="270" y2="62" stroke="#444" stroke-width="1"/>',
      '<ellipse cx="270" cy="70" rx="9" ry="11" fill="#FFC97A" opacity="0.9"/>',
      '<circle cx="270" cy="70" r="5" fill="#FFE9B8"/>',
      // 바 카운터
      '<rect x="80" y="160" width="240" height="38" fill="#3C2A1A"/>',
      '<rect x="80" y="156" width="240" height="6" fill="#5A3F26"/>',
      // 스툴 3개
      '<rect x="100" y="200" width="12" height="40" fill="#1A0F0A"/>',
      '<circle cx="106" cy="200" r="11" fill="#3C2A1A"/>',
      '<rect x="194" y="200" width="12" height="40" fill="#1A0F0A"/>',
      '<circle cx="200" cy="200" r="11" fill="#3C2A1A"/>',
      '<rect x="288" y="200" width="12" height="40" fill="#1A0F0A"/>',
      '<circle cx="294" cy="200" r="11" fill="#3C2A1A"/>'
    ].join('');
  }

  if (kind === 'minimal') {
    // 밝은 미니멀 — 큰 창 + 화이트 + 우드 액센트
    return [
      // 벽 + 바닥
      '<rect x="0" y="0" width="400" height="180" fill="#F4F1EC"/>',
      '<rect x="0" y="180" width="400" height="60" fill="#DCD6CB"/>',
      '<line x1="0" y1="204" x2="400" y2="204" stroke="#B8B1A5" stroke-width="0.6"/>',
      // 큰 창문
      '<rect x="40" y="20" width="180" height="120" fill="#E8F4FF" stroke="#D9D4CC" stroke-width="2"/>',
      '<line x1="130" y1="20" x2="130" y2="140" stroke="#D9D4CC" stroke-width="1.5"/>',
      '<line x1="40" y1="80" x2="220" y2="80" stroke="#D9D4CC" stroke-width="1"/>',
      // 햇살 자국
      '<rect x="80" y="60" width="64" height="80" fill="#FFFFFF" opacity="0.45"/>',
      // 떠 있는 선반
      '<rect x="260" y="60" width="110" height="5" fill="#8B6E45"/>',
      '<rect x="282" y="38" width="20" height="24" fill="#5A8A5A"/>',
      '<rect x="320" y="32" width="14" height="30" fill="#C9925C"/>',
      '<rect x="346" y="44" width="16" height="18" fill="#E8E2D6"/>',
      // 미니멀 린 조명
      '<line x1="240" y1="0" x2="240" y2="100" stroke="#222" stroke-width="2"/>',
      '<rect x="195" y="98" width="90" height="3" fill="#222"/>',
      // 의자 (오른쪽)
      '<rect x="280" y="178" width="44" height="50" fill="#EFE9DF" stroke="#D9D4CC" stroke-width="1.5" rx="3"/>',
      '<rect x="280" y="170" width="44" height="9" fill="#D9D4CC" rx="2"/>',
      // 화분
      '<rect x="100" y="200" width="22" height="22" fill="#FFFFFF" stroke="#D9D4CC" stroke-width="1"/>',
      '<circle cx="111" cy="195" r="10" fill="#6BA66B"/>'
    ].join('');
  }

  // modern (default) — 그레이 모던 + 메탈
  return [
    // 벽 (콘크리트 톤) + 얼룩
    '<rect x="0" y="0" width="400" height="170" fill="hsl(' + h + ',8%,86%)"/>',
    '<circle cx="80" cy="40" r="14" fill="hsl(' + h + ',8%,80%)" opacity="0.5"/>',
    '<circle cx="280" cy="80" r="20" fill="hsl(' + h + ',8%,80%)" opacity="0.4"/>',
    '<circle cx="180" cy="120" r="12" fill="hsl(' + h + ',8%,80%)" opacity="0.4"/>',
    // 바닥
    '<rect x="0" y="170" width="400" height="70" fill="hsl(' + h + ',6%,30%)"/>',
    '<line x1="0" y1="192" x2="400" y2="192" stroke="hsl(' + h + ',6%,20%)" stroke-width="1"/>',
    // 창문
    '<rect x="40" y="30" width="140" height="90" fill="hsl(' + h + ',24%,75%)" stroke="hsl(' + h + ',10%,40%)" stroke-width="1.5"/>',
    '<line x1="110" y1="30" x2="110" y2="120" stroke="hsl(' + h + ',10%,40%)" stroke-width="1.5"/>',
    '<line x1="40" y1="75" x2="180" y2="75" stroke="hsl(' + h + ',10%,40%)" stroke-width="1"/>',
    // 트랙 조명
    '<rect x="0" y="0" width="400" height="5" fill="hsl(' + h + ',6%,25%)"/>',
    '<circle cx="100" cy="13" r="4" fill="#FFE4A3"/>',
    '<circle cx="200" cy="13" r="4" fill="#FFE4A3"/>',
    '<circle cx="300" cy="13" r="4" fill="#FFE4A3"/>',
    // 메탈 테이블
    '<rect x="220" y="150" width="120" height="40" fill="hsl(' + h + ',6%,55%)" rx="2"/>',
    '<rect x="220" y="144" width="120" height="8" fill="hsl(' + h + ',6%,72%)"/>',
    '<line x1="232" y1="190" x2="232" y2="232" stroke="hsl(' + h + ',6%,40%)" stroke-width="2"/>',
    '<line x1="328" y1="190" x2="328" y2="232" stroke="hsl(' + h + ',6%,40%)" stroke-width="2"/>',
    // 식물 (오른쪽 위)
    '<rect x="368" y="130" width="14" height="40" fill="hsl(' + h + ',6%,30%)"/>',
    '<circle cx="375" cy="125" r="16" fill="#4A7A4A"/>',
    '<circle cx="385" cy="118" r="9" fill="#5A8A5A"/>'
  ].join('');
}

function renderMoodImages(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-mood]').forEach(function(el) {
    const kind = el.getAttribute('data-mood');
    const hue = parseInt(el.getAttribute('data-hue') || '220', 10);
    const height = parseInt(el.getAttribute('data-height') || '200', 10);
    const label = el.getAttribute('data-label') || '';
    el.classList.add('mood-img-wrap');
    // height는 data-height에 의해 결정되는 동적 값 (각 인스턴스마다 다름)
    el.style.height = height + 'px';
    var labelHtml = label ? '<div class="mood-img-label">' + label + '</div>' : '';
    el.innerHTML = '<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" class="mood-img-svg">' + buildMoodSvg(kind, hue) + '</svg>' + labelHtml;
  });
}

/* ===== SPARKLINE 렌더러 =====
 * 사용법: <span data-sparkline="success"></span>  (success | warning | error)
 */
function renderSparklines(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-sparkline]').forEach(function(el) {
    const status = el.getAttribute('data-sparkline');
    const color = status === 'success' ? 'var(--ws-success)' : (status === 'warning' ? 'var(--ws-warning)' : 'var(--ws-error)');
    const pts = status === 'success' ? '0,20 10,18 20,15 30,16 40,14 50,12 60,10 70,9 80,8 90,7 100,6' :
                status === 'warning' ? '0,18 10,16 20,18 30,15 40,17 50,14 60,16 70,13 80,15 90,14 100,12' :
                '0,12 10,14 20,12 30,16 40,15 50,18 60,17 70,20 80,18 90,21 100,20';
    el.innerHTML = '<svg viewBox="0 0 100 24" class="sparkline-svg"><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.5"/></svg>';
  });
}

document.addEventListener('DOMContentLoaded', function() {
  renderIcons();
  renderMoodImages();
  renderSparklines();
});
