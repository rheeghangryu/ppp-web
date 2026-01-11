// 말풍선 문장 리스트
const speechMessages = [
    "Hello Punny Poster Pals!",
    "coming back one saturday ...",
    "ppp ㅍㅍㅍ"
  ];
  
  const speechBubble = document.getElementById('speechBubble');
  const speechText = document.getElementById('speechText');
  
  let currentIndex = 0;
  
  // 말풍선 보이기/숨기기 토글 함수
  function animateBubble() {
    // 숨김 → 보임
    speechBubble.classList.add('show');
  
    setTimeout(() => {
      // 보임 → 숨김
      speechBubble.classList.remove('show');
  
      setTimeout(() => {
        // 다음 문장 세팅
        currentIndex = (currentIndex + 1) % speechMessages.length;
        speechText.textContent = speechMessages[currentIndex];
  
        // 다음 애니메이션 예약
        scheduleNextChange();
      }, 400); // 숨김 애니메이션 400ms (CSS transition 기준)
    }, 2000); // 보임 유지 2000ms
  }
  
  // 다음 사이클 예약 함수
  function scheduleNextChange() {
    const delay = Math.random() * 1000 + 2000; // 2000 ~ 3000ms 랜덤
    setTimeout(() => {
      animateBubble();
    }, delay);
  }
  
  // 시작
  window.addEventListener('DOMContentLoaded', () => {
    scheduleNextChange();
  });