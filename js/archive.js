// js/archive.js
// archive.html 전용 — 그리드 렌더링 + 팝업 + 태그 필터 + 이전/다음 이동

window.addEventListener('DOMContentLoaded', () => {
  let activeTag = 'all';
  let currentFiltered = [];
  let currentPopupIndex = -1;

  const filterBar = document.getElementById('filterBar');
  const grid = document.getElementById('posterGrid');

  const overlay = document.getElementById('popupOverlay');
  const popupImage = document.getElementById('popupImage');
  const popupTitle = document.getElementById('popupTitle');
  const popupDesigner = document.getElementById('popupDesigner');
  const popupDate = document.getElementById('popupDate');
  const popupSubject = document.getElementById('popupSubject');
  const popupRule = document.getElementById('popupRule');
  const popupDesc = document.getElementById('popupDescription');
  const popupClose = document.getElementById('popupClose');
  const popupPrev = document.getElementById('popupPrev');
  const popupNext = document.getElementById('popupNext');

  function updateNavState() {
    if (!popupPrev || !popupNext) return;
    const atStart = currentPopupIndex <= 0;
    const atEnd = currentPopupIndex >= currentFiltered.length - 1;
    popupPrev.disabled = atStart;
    popupNext.disabled = atEnd;
  }

  function openPopup(index) {
    const poster = currentFiltered[index];
    if (!poster) return;

    currentPopupIndex = index;

    popupImage.src = poster.imageUrl;
    popupImage.alt = poster.title;
    popupTitle.textContent = poster.title;
    popupDesigner.textContent = poster.designer;
    popupDate.textContent = poster.date;
    popupSubject.textContent = poster.subject;
    popupRule.textContent = poster.rule;
    popupDesc.textContent = poster.description;

    updateNavState();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePopup() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    currentPopupIndex = -1;
  }

  function renderGrid() {
    currentFiltered = activeTag === 'all'
      ? POSTERS
      : POSTERS.filter((p) => p.tags.includes(activeTag));

    grid.innerHTML = '';

    currentFiltered.forEach((poster, index) => {
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.innerHTML = `
        <div class="poster-card__image-wrap">
          <img src="${poster.imageUrl}" alt="${poster.title}" loading="lazy" />
        </div>
        <div class="poster-card__info">
          <p class="poster-card__title">${poster.title}</p>
          <p class="poster-card__designer">${poster.designer}</p>
        </div>
      `;

      card.addEventListener('click', () => openPopup(index));
      grid.appendChild(card);
    });
  }

  const allTags = ['all', ...new Set(POSTERS.flatMap((p) => p.tags))];
  allTags.forEach((tag) => {
    const btn = document.createElement('button');
    btn.className = `filter-btn${tag === 'all' ? ' active' : ''}`;
    btn.dataset.tag = tag;
    btn.textContent = tag === 'all' ? 'ALL' : tag.toUpperCase();

    btn.addEventListener('click', () => {
      activeTag = tag;
      filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });

    filterBar.appendChild(btn);
  });

  popupClose.addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePopup();
  });

  if (popupPrev) {
    popupPrev.addEventListener('click', () => {
      if (currentPopupIndex > 0) openPopup(currentPopupIndex - 1);
    });
  }

  if (popupNext) {
    popupNext.addEventListener('click', () => {
      if (currentPopupIndex < currentFiltered.length - 1) openPopup(currentPopupIndex + 1);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') closePopup();
    if (e.key === 'ArrowLeft' && popupPrev) popupPrev.click();
    if (e.key === 'ArrowRight' && popupNext) popupNext.click();
  });

  renderGrid();
});