// DOMContentLoaded: "HTML이 전부 로드됐을 때 이 안의 코드를 실행해"
// 모든 DOM 접근(getElementById 등)은 반드시 이 안에서
window.addEventListener('DOMContentLoaded', () => {

  // =============================================
  // 말풍선
  // =============================================
  const speechMessages = [
    "Hello Punny Poster Pals!",
    "coming back one saturday ...",
    "ppp ㅍㅍㅍ"
  ];

  // 이제 DOMContentLoaded 안이라 HTML이 확실히 존재함
  const speechBubble = document.getElementById('speechBubble');
  const speechText = document.getElementById('speechText');
  let currentIndex = 0;

  function animateBubble() {
    speechBubble.classList.add('show');

    setTimeout(() => {
      speechBubble.classList.remove('show');

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % speechMessages.length;
        speechText.textContent = speechMessages[currentIndex];
        scheduleNextChange();
      }, 400);
    }, 2000);
  }

  function scheduleNextChange() {
    const delay = Math.random() * 1000 + 2000;
    setTimeout(animateBubble, delay);
  }

  // speechBubble이 있는 페이지에서만 실행
  // index, about에는 있고 random에는 없을 수도 있으니 체크
  if (speechBubble && speechText) {
    scheduleNextChange();
  }

  // =============================================
  // 햄버거 메뉴
  // =============================================
  const mainNavToggle = document.getElementById('mainNavToggle');
  const mainNav = document.getElementById('mainNav');

  // if로 감싸는 이유: 나중에 특정 페이지에 메뉴가 없어도 에러 안 남
  if (mainNavToggle && mainNav) {

    mainNavToggle.addEventListener('click', () => {
      mainNavToggle.classList.toggle('active');
      mainNav.classList.toggle('active');

      // 접근성: aria-expanded로 열림/닫힘 상태 알려주기
      const isOpen = mainNav.classList.contains('active');
      mainNavToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // 메뉴 링크 클릭 시 닫기 (모바일)
    mainNav.querySelectorAll('.main-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          mainNavToggle.classList.remove('active');
          mainNav.classList.remove('active');
          mainNavToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (
        window.innerWidth <= 768 &&
        !mainNav.contains(e.target) &&
        !mainNavToggle.contains(e.target) &&
        mainNav.classList.contains('active')
      ) {
        mainNavToggle.classList.remove('active');
        mainNav.classList.remove('active');
        mainNavToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // =============================================
  // coming-soon 숨기기
  // =============================================
  const comingSoon = document.getElementById('comingSoon');

  // comingSoon이 없는 페이지(index, about, random)에서는 그냥 넘어감
  if (comingSoon) {
    setTimeout(() => {
      comingSoon.classList.add('hidden');
    }, 2000);
  }

}); // DOMContentLoaded 끝