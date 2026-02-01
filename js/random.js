// ===== Random page state =====
// R: A:B, D: C:D (Google Sheet ranges)
let currentMode = 'R';

// 선택된(추첨된) 행 인덱스(시트의 실제 row index, 0-based)
let selectedRowIndexA = null;
let selectedRowIndexB = null;

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

function syncCurrentModeFromBody() {
  const m = document.body.dataset.mode;
  // UI에서 선택 해제(none)인 경우는 R을 기본으로 사용(원하면 여기서 바꿀 수 있음)
  currentMode = (m === 'D' || m === 'R') ? m : 'R';
}

function setMode(mode) {
  const safeMode = mode === 'D' || mode === 'R' ? mode : 'none';

  const prevMode = document.body.dataset.mode || 'none';
  document.body.dataset.mode = safeMode;

  // 데이터 로딩에 사용할 모드도 같이 동기화
  syncCurrentModeFromBody();

  const toggle = document.getElementById('modeToggle');
  if (toggle) toggle.dataset.mode = safeMode;

  const options = document.querySelectorAll('#modeToggle .mode-toggle__option');
  options.forEach((btn) => {
    const pressed = btn.dataset.mode === safeMode;
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  });

  // 모드가 바뀌면 기존 데이터는 숨김(초기화)
  if (prevMode !== safeMode) {
    clearDisplayedData();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('modeToggle');
  if (!toggle) return;

  // 초기 상태: none(중앙/선택 없음)
  if (!document.body.dataset.mode) setMode('none');
  else setMode(document.body.dataset.mode);

  // PICK RANDOM 버튼
  const pickBtn = document.querySelector('.pick-random');
  if (pickBtn) {
    pickBtn.addEventListener('click', () => {
      syncCurrentModeFromBody();
      loadSheetData();
    });
  }

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-toggle__option');
    if (!btn) return;

    const next = btn.dataset.mode;
    const current = document.body.dataset.mode || 'none';

    // 같은 걸 다시 누르면 none으로(선택 해제)
    if (current === next) setMode('none');
    else setMode(next);
  });
});


// 시트 데이터 로드
const SHEET_ID = "16JFMvjIvOBLaO0z0gKxwGRowVXV2SavNhSMU0cUpjPY";
const API_KEY = "AIzaSyAaEN1SkcrS0dkzCJ4cJYpt9vlPwSCFwfw";

async function fetchSheetData(sheetId, range, apiKey) {
  try {
      const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`
      );
      const data = await response.json();
      return data.values;
  } catch (error) {
      console.error("데이터 로드 실패:", error);
      return [];
  }
}

// 셀 포맷 가져오는 함수 추가
async function getSheetCellFormats(sheetId, apiKey, range) {
  try {
      const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?ranges=${range}&fields=sheets.data.rowData.values.effectiveFormat.backgroundColor&key=${apiKey}`
      );
      return await response.json();
  } catch (error) {
      console.error("포맷 데이터 로드 실패:", error);
      return null;
  }
}

// 데이터 로드 함수
async function loadSheetData() {
  // 현재 모드 동기화(안전장치)
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

  // 로딩 시작: 기존 데이터 비우기(빈 값이면 CSS(:empty)로 박스 숨김)
  [elements.subject, elements.rule].forEach((el) => {
    el.textContent = '';
    el.style.display = '';
  });

  setLoading(true);

  try {
    const RANGE = currentMode === 'R' ? 'A:B' : 'C:D';

    // 데이터 + 셀 서식 동시에 가져오기
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

  // 헤더(1행) 제외: data[1]이 시트의 2번째 행
  // formatData도 같은 행 구조라고 가정하고, 실제 시트 row index를 같이 보관
  const candidates = data.slice(1).map((row, i) => {
    const sheetRowIndex = i + 1; // 0-based row index로 1이 '2번째 행'
    return { row, sheetRowIndex };
  });

  // 배경색(화이트가 아닌)이 들어간 행은 제외
  const availableRows = candidates.filter(({ sheetRowIndex }) => {
    const rowFormat = rowData[sheetRowIndex]?.values;
    if (!rowFormat) return true;

    return !rowFormat.some((cell) => {
      const bgColor = cell?.effectiveFormat?.backgroundColor;
      // Google Sheets는 흰색이 (1,1,1)
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

    // 나중에 updateCellBackground에 쓰려고 실제 row index 저장
    selectedRowIndexA = pickA.sheetRowIndex;
    selectedRowIndexB = pickB.sheetRowIndex;
  }
  } finally {
    // 기존 left/right loader가 있으면 숨김(없으면 무시)
    [elements.leftLoader, elements.rightLoader].forEach((el) => {
      if (el) el.style.display = 'none';
    });
    // 표시 여부는 CSS(:empty)로 제어
    [elements.subject, elements.rule].forEach((el) => (el.style.display = ''));
    setLoading(false);
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
                  endColumnIndex: currentMode === 'R' ? 2 : 4
              },
              cell: {
                  userEnteredFormat: {
                      backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                  }
              },
              fields: "userEnteredFormat.backgroundColor"
          }
      }]
  };

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error('업데이트 실패');
      return true;
  } catch (error) {
      console.error("셀 업데이트 실패:", error);
      return false;
  }
}

// (선택) 현재 뽑힌 항목을 회색 처리하고 싶을 때 사용
async function markPickedRows() {
  if (selectedRowIndexA != null) await updateCellBackground(SHEET_ID, API_KEY, selectedRowIndexA);
  if (selectedRowIndexB != null) await updateCellBackground(SHEET_ID, API_KEY, selectedRowIndexB);
}

