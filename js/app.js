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
  
  // 햄버거 메뉴 토글
  const menuToggle = document.getElementById('menuToggle');
  const menu = document.getElementById('menu');
  
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      menu.classList.toggle('active');
    });
    
    // 메뉴 링크 클릭 시 메뉴 닫기 (모바일)
    const menuLinks = menu.querySelectorAll('.menu_a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          menuToggle.classList.remove('active');
          menu.classList.remove('active');
        }
      });
    });
    
    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && 
          !menu.contains(e.target) && 
          !menuToggle.contains(e.target) && 
          menu.classList.contains('active')) {
        menuToggle.classList.remove('active');
        menu.classList.remove('active');
      }
    });
  }

  // 준비중 메시지 2초 후 숨기기
  const comingSoon = document.getElementById('comingSoon');
  if (comingSoon) {
    setTimeout(() => {
      comingSoon.classList.add('hidden');
    }, 2000); // 2초 후 숨김
  }

  // 시작
  window.addEventListener('DOMContentLoaded', () => {
    scheduleNextChange();
  });