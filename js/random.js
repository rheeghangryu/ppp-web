// =============================================================================
// Constants & state
// =============================================================================
// R mode: sheet range A:B | D mode: sheet range C:D

const SHEET_ID = '16JFMvjIvOBLaO0z0gKxwGRowVXV2SavNhSMU0cUpjPY';
const API_KEY = 'AIzaSyAaEN1SkcrS0dkzCJ4cJYpt9vlPwSCFwfw';

let currentMode = 'R';

// 선택된(추첨된) 행 인덱스 — 시트 실제 row index, 0-based
let selectedRowIndexA = null;
let selectedRowIndexB = null;


// =============================================================================
// Google Sheets API
// =============================================================================

async function fetchSheetData(sheetId, range, apiKey) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`
    );
    const data = await response.json();
    return data.values;
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    return [];
  }
}

async function getSheetCellFormats(sheetId, apiKey, range) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?ranges=${range}&fields=sheets.data.rowData.values.effectiveFormat.backgroundColor&key=${apiKey}`
    );
    return await response.json();
  } catch (error) {
    console.error('포맷 데이터 로드 실패:', error);
    return null;
  }
}

async function updateCellBackground(sheetId, apiKey, rowIndex) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate?key=${apiKey}`;

  const requestBody = {
    requests: [{
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: currentMode === 'R' ? 0 : 2,
          endColumnIndex: currentMode === 'R' ? 2 : 4,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
          },
        },
        fields: 'userEnteredFormat.backgroundColor',
      },
    }],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error('업데이트 실패');
    return true;
  } catch (error) {
    console.error('셀 업데이트 실패:', error);
    return false;
  }
}

// (선택) 현재 뽑힌 항목을 회색 처리하고 싶을 때 사용
async function markPickedRows() {
  if (selectedRowIndexA != null) await updateCellBackground(SHEET_ID, API_KEY, selectedRowIndexA);
  if (selectedRowIndexB != null) await updateCellBackground(SHEET_ID, API_KEY, selectedRowIndexB);
}


// =============================================================================
// Utilities
// =============================================================================

function isNonWhite(bgColor) {
  if (!bgColor) return false;
  const { red: r, green: g, blue: b } = bgColor;
  // white is (1,1,1); undefined means default
  return r !== 1 || g !== 1 || b !== 1;
}

// Fisher–Yates shuffle (in-place)
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function animatePanelsIn() {
  const panels = document.querySelectorAll('.quarter-panel');
  panels.forEach((panel) => {
    panel.classList.remove('is-animating-in');
    void panel.offsetWidth; // reflow로 애니메이션 재시작
    panel.classList.add('is-animating-in');
  });
}


// =============================================================================
// Mode (R / D / none)
// =============================================================================

function syncCurrentModeFromBody() {
  const m = document.body.dataset.mode;
  // UI에서 선택 해제(none)인 경우는 R을 기본으로 사용
  currentMode = m === 'D' || m === 'R' ? m : 'R';
}

function clearDisplayedData() {
  const subject = document.querySelector('#subject-data');
  const rule = document.querySelector('#rule-data');
  if (subject) {
    subject.textContent = '';
    subject.style.display = '';
  }
  if (rule) {
    rule.textContent = '';
    rule.style.display = '';
  }
  selectedRowIndexA = null;
  selectedRowIndexB = null;
}

function setMode(mode) {
  const safeMode = mode === 'D' || mode === 'R' ? mode : 'none';

  const prevMode = document.body.dataset.mode || 'none';
  document.body.dataset.mode = safeMode;

  syncCurrentModeFromBody();

  const toggle = document.getElementById('modeToggle');
  if (toggle) toggle.dataset.mode = safeMode;

  const options = document.querySelectorAll('#modeToggle .mode-toggle__option');
  options.forEach((btn) => {
    const pressed = btn.dataset.mode === safeMode;
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  });

  if (prevMode !== safeMode) {
    clearDisplayedData();
  }

  const pickBtn = document.querySelector('.pick-random');
  if (pickBtn) {
    const disabled = safeMode === 'none';
    pickBtn.disabled = disabled;
    pickBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    pickBtn.style.pointerEvents = disabled ? 'none' : '';
  }

  if (safeMode === 'none') {
    setPanelTitles('none');
    clearListPanels();
  } else {
    setPanelTitles(safeMode);
    loadListData();
    animatePanelsIn();
  }
}


// =============================================================================
// List panels (A/C = left, B/D = right)
// ============================================================================

function clearListPanels() {
  const left = document.getElementById('list-left');
  const right = document.getElementById('list-right');
  if (left) left.innerHTML = '';
  if (right) right.innerHTML = '';
}

function renderList(ul, items) {
  if (!ul) return;
  ul.innerHTML = '';

  const frag = document.createDocumentFragment();

  items.forEach((item) => {
    const text = typeof item === 'string' ? item : item?.text;
    const disabled = typeof item === 'string' ? false : Boolean(item?.disabled);

    const li = document.createElement('li');
    li.className = 'quarter-panel__item' + (disabled ? ' quarter-panel__item--disabled' : '');
    li.textContent = text ?? '';
    frag.appendChild(li);
  });

  ul.appendChild(frag);
}

function setPanelTitles(mode) {
  const leftTitle = document.getElementById('panel-title-left');
  const rightTitle = document.getElementById('panel-title-right');
  if (!leftTitle || !rightTitle) return;

  if (mode === 'R') {
    leftTitle.textContent = "Rheeghang's Subjects";
    rightTitle.textContent = "Rheeghang's Rules";
  } else if (mode === 'D') {
    leftTitle.textContent = "Dandan's Subjects";
    rightTitle.textContent = "Dandan's Rules";
  } else {
    leftTitle.textContent = '';
    rightTitle.textContent = '';
  }
}

async function loadListData() {
  syncCurrentModeFromBody();

  const leftUl = document.getElementById('list-left');
  const rightUl = document.getElementById('list-right');
  if (!leftUl || !rightUl) return;

  if (document.body.dataset.mode === 'none') {
    setPanelTitles('none');
    clearListPanels();
    return;
  }

  setPanelTitles(currentMode);

  const RANGE = currentMode === 'R' ? 'A:B' : 'C:D';

  const [data, formatData] = await Promise.all([
    fetchSheetData(SHEET_ID, RANGE, API_KEY),
    getSheetCellFormats(SHEET_ID, API_KEY, RANGE),
  ]);

  const rowData = formatData?.sheets?.[0]?.data?.[0]?.rowData;

  if (!Array.isArray(data) || data.length === 0 || !Array.isArray(rowData)) {
    renderList(leftUl, ['데이터를 불러오지 못했어요']);
    renderList(rightUl, ['데이터를 불러오지 못했어요']);
    return;
  }

  const rows = data.slice(1); // 1행 헤더 제외

  const leftItems = [];
  const rightItems = [];

  rows.forEach((r, i) => {
    const rowIndex = i + 1;
    const formats = rowData[rowIndex]?.values || [];

    const leftText = (r?.[0] ?? '').trim();
    const rightText = (r?.[1] ?? '').trim();

    const leftBg = formats?.[0]?.effectiveFormat?.backgroundColor;
    const rightBg = formats?.[1]?.effectiveFormat?.backgroundColor;

    if (leftText.length > 0) {
      leftItems.push({ text: leftText, disabled: isNonWhite(leftBg) });
    }
    if (rightText.length > 0) {
      rightItems.push({ text: rightText, disabled: isNonWhite(rightBg) });
    }
  });

  shuffleInPlace(leftItems);
  shuffleInPlace(rightItems);

  renderList(leftUl, leftItems.length ? leftItems : ['(비어있음)']);
  renderList(rightUl, rightItems.length ? rightItems : ['(비어있음)']);
}


// =============================================================================
// Pick random (subject + rule)
// =============================================================================

async function loadSheetData() {
  syncCurrentModeFromBody();

  const loadingOverlay = document.getElementById('loadingOverlay');
  const setLoading = (isLoading) => {
    if (!loadingOverlay) return;
    loadingOverlay.classList.toggle('show', isLoading);
    loadingOverlay.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
  };

  const elements = {
    subject: document.querySelector('#subject-data'),
    rule: document.querySelector('#rule-data'),
    leftLoader: document.querySelector('#left-loader'),
    rightLoader: document.querySelector('#right-loader'),
  };

  if (!elements.subject || !elements.rule) return;

  [elements.subject, elements.rule].forEach((el) => {
    el.textContent = '';
    el.style.display = '';
  });

  setLoading(true);

  try {
    const RANGE = currentMode === 'R' ? 'A:B' : 'C:D';

    const [data, formatData] = await Promise.all([
      fetchSheetData(SHEET_ID, RANGE, API_KEY),
      getSheetCellFormats(SHEET_ID, API_KEY, RANGE),
    ]);

    // 로딩 연출(원치 않으면 0으로)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const rowData = formatData?.sheets?.[0]?.data?.[0]?.rowData;

    if (!Array.isArray(data) || data.length === 0 || !Array.isArray(rowData)) {
      elements.subject.textContent = '데이터를 불러오지 못했어요';
      elements.rule.textContent = '데이터를 불러오지 못했어요';
      return;
    }

    const candidates = data.slice(1).map((row, i) => ({
      row,
      sheetRowIndex: i + 1,
    }));

    const availableRows = candidates.filter(({ sheetRowIndex }) => {
      const rowFormat = rowData[sheetRowIndex]?.values;
      if (!rowFormat) return true;

      return !rowFormat.some((cell) => {
        const bgColor = cell?.effectiveFormat?.backgroundColor;
        return bgColor && (bgColor.red !== 1 || bgColor.green !== 1 || bgColor.blue !== 1);
      });
    });

    if (availableRows.length === 0) {
      elements.subject.textContent = '사용 가능한 항목이 없습니다';
      elements.rule.textContent = '사용 가능한 항목이 없습니다';
      selectedRowIndexA = null;
      selectedRowIndexB = null;
    } else {
      const pickA = availableRows[Math.floor(Math.random() * availableRows.length)];
      const pickB = availableRows[Math.floor(Math.random() * availableRows.length)];

      elements.subject.textContent = pickA.row?.[0] || '';
      elements.rule.textContent = pickB.row?.[1] || '';

      selectedRowIndexA = pickA.sheetRowIndex;
      selectedRowIndexB = pickB.sheetRowIndex;
    }
  } finally {
    [elements.leftLoader, elements.rightLoader].forEach((el) => {
      if (el) el.style.display = 'none';
    });
    [elements.subject, elements.rule].forEach((el) => (el.style.display = ''));
    setLoading(false);
  }
}


// =============================================================================
// DOM init
// =============================================================================

window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('modeToggle');
  if (!toggle) return;

  if (!document.body.dataset.mode) setMode('none');
  else setMode(document.body.dataset.mode);

  const pickBtn = document.querySelector('.pick-random');
  if (pickBtn) {
    pickBtn.addEventListener('click', () => {
      syncCurrentModeFromBody();
      loadSheetData();
      loadListData();
    });
  }

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-toggle__option');
    if (!btn) return;

    const next = btn.dataset.mode;
    const current = document.body.dataset.mode || 'none';

    if (current === next) setMode('none');
    else setMode(next);
  });
});
