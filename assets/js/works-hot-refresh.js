/* assets/js/works-hot-refresh.js
   DUNGZAK — Works 이미지 즉시 반영 + 경로 폴백 로더 (Lightflow Ω.3)
   요구: 작품 그리드 컨테이너에 id="artworks-grid" 존재
*/

(function () {
  const ART_JSON = '/artworks.json';
  const GRID_SEL = '#artworks-grid';

  const stamp = () => String(Date.now()); // 캐시 버스터

  // 후보 경로 생성 (확장자/폴더 혼동 자동 보정)
  function candidatesFor(art) {
    const id = art.id || '';
    const listed = art.image || '';
    const base = [
      listed,
      `assets/artworks/${id}.jpg`,
      `assets/artworks/${id}.jpeg`,
      `assets/artworks/${id}.png`,
      `images/artworks/${id}.jpg`,
      `images/artworks/${id}.jpeg`,
      `images/artworks/${id}.png`
    ].filter(Boolean);
    return [...new Set(base)]; // 중복 제거
  }

  // 폴백 체인 로더
  function loadWithFallback(imgEl, art, v) {
    const cands = candidatesFor(art);
    let i = 0;
    const tryNext = () => {
      if (i >= cands.length) return;          // 더 이상 후보 없음
      imgEl.src = `${cands[i++]}?v=${v}`;     // 다음 후보 시도
    };
    imgEl.onerror = tryNext;                   // 실패하면 다음 후보
    tryNext();                                 // 첫 시도
  }

  // 그리드 렌더링
  function render(list, v) {
    const grid = document.querySelector(GRID_SEL);
    if (!grid) return;
    grid.innerHTML = '';

    list.forEach((a) => {
      const card = document.createElement('div');
      card.className = 'art-card';

      const img = document.createElement('img');
      img.alt = a.title || a.id || 'artwork';
      img.loading = 'lazy';
      img.decoding = 'async';
      loadWithFallback(img, a, v);

      const meta = document.createElement('div');
      meta.className = 'art-meta';
      meta.innerHTML = `
        <strong>Title:</strong> ${a.title || 'Untitled'}
        &nbsp;·&nbsp;<strong>Year:</strong> ${a.year || ''}
        <br><span>${a.series || ''} · ${a.size || ''} · ${a.medium || ''}</span>
      `;

      card.appendChild(img);
      card.appendChild(meta);
      grid.appendChild(card);
    });
  }

  // artworks.json 로드
  async function loadArtworks() {
    const v = localStorage.getItem('lastArtworksUpdate') || stamp();
    const res = await fetch(`${ART_JSON}?v=${v}`, { cache: 'no-store' });
    const list = await res.json().catch(() => []);
    render(list, v);
  }

  // Admin에서 저장/삭제 시 즉시 갱신 (admin-plus.html이 이 신호를 보냄)
  window.addEventListener('storage', (e) => {
    if (e.key === 'lastArtworksUpdate') loadArtworks();
  });

  // 최초 로드
  document.addEventListener('DOMContentLoaded', loadArtworks);

  // SPA/지연 마운트 대비 1회 재시도
  setTimeout(() => {
    const grid = document.querySelector(GRID_SEL);
    if (grid && !grid.querySelector('.art-card')) loadArtworks();
  }, 1200);
})();
