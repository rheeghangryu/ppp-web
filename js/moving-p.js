let x,y;
let vx, vy;
let speed = 5;

let waiting = false;   // 지금 대기 중인가?
let outTime = 0;       // 화면 밖으로 나간 시간
let delay = 3000;      // 3초 (ms)

let margin = 200;      // 글자 크기 여유

function setup() {
  createCanvas(windowWidth,windowHeight);
  textFont("arial-black");
  textSize(200);
  textAlign(CENTER, CENTER);
  
  spawn(); // ⭐ 최초 1회 등장
}

function spawn() {
  let side = int(random(4));

  if (side === 0) {
    // 위
    x = random(0, width);
    y = -margin;
    vx = random(-1, 1) * speed;
    vy = random(0.5, 2) * speed;

  } else if (side === 1) {
    // 아래
    x = random(0, width);
    y = height + margin;
    vx = random(-1, 1) * speed;
    vy = random(-2, -0.5) * speed;

  } else if (side === 2) {
    // 왼쪽
    x = -margin;
    y = random(0, height);
    vx = random(0.5, 2) * speed;
    vy = random(-1, 1) * speed;

  } else {
    // 오른쪽
    x = width + margin;
    y = random(0, height);
    vx = random(-2, -0.5) * speed;
    vy = random(-1, 1) * speed;
  }
}

function draw() {
  background(255);

  // ===== 대기 중이 아닐 때만 이동 =====
  if (!waiting) {
    x += vx;
    y += vy;
  }

  // ===== 화면 밖으로 완전히 나갔는지 체크 =====
  if (
    !waiting &&
    (x < -margin || x > width + margin || y < -margin || y > height + margin)
  ) {
    waiting = true;
    outTime = millis(); // 나간 시간 기록
  }

  // ===== 3초 후 다시 등장 =====
  if (waiting && millis() - outTime > delay) {
    spawn();
    waiting = false;
  }

  // ===== 그리기 =====
  if (!waiting) {
    fill(0);
    text("P", x, y);
  }
}

 