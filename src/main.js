/* 貪食蛇畫面與操作：Canvas 繪製、鍵盤／觸控輸入、遊戲迴圈
 * 依賴 src/logic.js 提供的 window.SnakeLogic，需在它之後載入。
 */

/* ================= 最高分保存（Navi state，沒有時改用 localStorage） ================= */
const BestScore = {
  async load() {
    try {
      if (window.Navi && Navi.getState) {
        const s = await Navi.getState();
        return Number(s && s.bestScore) || 0;
      }
    } catch (e) { console.warn("讀取最高分失敗，改用本機儲存", e); }
    try { return Number(localStorage.getItem("snake.best")) || 0; } catch (e) { return 0; }
  },
  async save(score) {
    try {
      if (window.Navi && Navi.putState) {
        const s = (await Navi.getState()) || {};
        // 已存的紀錄比較高時不覆寫（例如頁面還沒讀到舊紀錄就結束了一局）
        if ((Number(s.bestScore) || 0) >= score) return;
        await Navi.putState({ ...s, bestScore: score });
        return;
      }
    } catch (e) { console.warn("儲存最高分失敗，改用本機儲存", e); }
    try {
      if ((Number(localStorage.getItem("snake.best")) || 0) >= score) return;
      localStorage.setItem("snake.best", String(score));
    } catch (e) {}
  },
};

/* ================= 畫面與操作 ================= */
(() => {
  const SnakeLogic = window.SnakeLogic;
  const COLS = 20, ROWS = 20;
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const $ = id => document.getElementById(id);
  const ui = {
    score: $("score"), best: $("best"), level: $("level"),
    overlay: $("overlay"), ovTitle: $("ov-title"), ovText: $("ov-text"), ovBtn: $("ov-btn"),
    pauseBtn: $("pause-btn"), restartBtn: $("restart-btn"),
  };

  let game = SnakeLogic.createGame(COLS, ROWS);
  let status = "ready"; // ready | running | paused | over
  let timer = null;
  let best = 0;

  // 依實際顯示尺寸與 DPR 調整解析度，避免模糊
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    draw();
  }

  function draw() {
    const cell = canvas.width / COLS;
    ctx.fillStyle = "#16213a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1a2744";
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if ((x + y) % 2 === 0) ctx.fillRect(x * cell, y * cell, cell, cell);

    if (game.food) {
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc((game.food.x + .5) * cell, (game.food.y + .5) * cell, cell * .38, 0, Math.PI * 2);
      ctx.fill();
    }

    game.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
      const pad = cell * .08;
      roundRect(p.x * cell + pad, p.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * .25);
    });

    // 眼睛
    const h = game.snake[0], d = SnakeLogic.DIRS[game.dir];
    const cx = (h.x + .5) * cell, cy = (h.y + .5) * cell;
    const ox = d.y !== 0 ? cell * .18 : 0, oy = d.x !== 0 ? cell * .18 : 0;
    ctx.fillStyle = "#0f172a";
    [1, -1].forEach(s => {
      ctx.beginPath();
      ctx.arc(cx + d.x * cell * .15 + ox * s, cy + d.y * cell * .15 + oy * s, cell * .07, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function updateHud() {
    ui.score.textContent = game.score;
    ui.best.textContent = best;
    ui.level.textContent = SnakeLogic.levelFor(game.score);
  }

  function showOverlay(title, text, btn) {
    ui.ovTitle.textContent = title;
    ui.ovText.innerHTML = text;
    ui.ovBtn.textContent = btn;
    ui.overlay.classList.remove("hidden");
  }
  function hideOverlay() { ui.overlay.classList.add("hidden"); }

  function tick() {
    SnakeLogic.step(game);
    draw();
    updateHud();
    if (game.over) return endGame();
    timer = setTimeout(tick, SnakeLogic.speedFor(game.score));
  }

  function start() {
    clearTimeout(timer);
    if (status === "over" || status === "ready") game = SnakeLogic.createGame(COLS, ROWS);
    status = "running";
    hideOverlay();
    ui.pauseBtn.textContent = "⏸ 暫停";
    draw(); updateHud();
    timer = setTimeout(tick, SnakeLogic.speedFor(game.score));
  }

  function restart() { status = "ready"; start(); }

  function togglePause() {
    if (status === "running") {
      status = "paused";
      clearTimeout(timer);
      ui.pauseBtn.textContent = "▶ 繼續";
      showOverlay("已暫停", "按空白鍵或下方按鈕繼續", "繼續");
    } else if (status === "paused") {
      start();
    }
  }

  function endGame() {
    status = "over";
    clearTimeout(timer);
    const isNew = game.score > best;
    if (isNew) { best = game.score; updateHud(); BestScore.save(best); }
    const title = game.won ? "🎉 你贏了！" : "遊戲結束";
    const text = `本局分數：<b>${game.score}</b>${isNew && game.score > 0 ? "<br>🏆 新紀錄！" : ""}<br>按 Enter 或下方按鈕再玩一次`;
    showOverlay(title, text, "再玩一次");
  }

  function turn(dir) {
    if (status === "ready") start();
    if (status === "running") SnakeLogic.queueDir(game, dir);
  }

  // 鍵盤
  const KEY_DIR = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
  };
  window.addEventListener("keydown", e => {
    if (KEY_DIR[e.key]) { e.preventDefault(); turn(KEY_DIR[e.key]); return; }
    if (e.key === " " || e.key === "p" || e.key === "P") {
      e.preventDefault();
      if (status === "running" || status === "paused") togglePause(); else start();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (status === "paused") togglePause(); else if (status !== "running") start();
    } else if (e.key === "r" || e.key === "R") {
      restart();
    }
  });

  // 觸控滑動
  let touchStart = null;
  canvas.addEventListener("touchstart", e => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
  canvas.addEventListener("touchend", e => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; // 太短視為點擊
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });

  // 螢幕方向鍵
  document.querySelectorAll(".dpad button").forEach(b => {
    b.addEventListener("pointerdown", e => { e.preventDefault(); turn(b.dataset.dir); });
  });

  ui.ovBtn.addEventListener("click", () => (status === "paused" ? togglePause() : start()));
  ui.pauseBtn.addEventListener("click", () => {
    if (status === "running" || status === "paused") togglePause(); else start();
  });
  ui.restartBtn.addEventListener("click", restart);

  // 切到別的分頁時自動暫停
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && status === "running") togglePause();
  });

  window.addEventListener("resize", resize);
  resize();
  updateHud();
  // 讀取可能比第一局結束還慢，取較大值，避免把剛打出的分數蓋掉
  BestScore.load().then(v => { best = Math.max(best, v); updateHud(); });
})();
