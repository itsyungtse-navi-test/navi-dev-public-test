/* 貪食蛇核心邏輯（純函式，不碰 DOM）
 * 瀏覽器：以 <script> 載入後掛在 window.SnakeLogic
 * Node：require("./src/logic.js")
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SnakeLogic = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

  function createGame(cols, rows, rng) {
    const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
    const state = {
      cols, rows,
      snake: [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }],
      dir: "right", queue: [], score: 0, over: false, won: false, food: null,
    };
    state.food = spawnFood(state, rng);
    return state;
  }

  // 只從空格中挑選，保證食物不會出現在蛇身上；沒有空格時回傳 null（代表勝利）
  function spawnFood(state, rng) {
    rng = rng || Math.random;
    const occupied = new Set(state.snake.map(p => p.x + "," + p.y));
    const free = [];
    for (let y = 0; y < state.rows; y++)
      for (let x = 0; x < state.cols; x++)
        if (!occupied.has(x + "," + y)) free.push({ x, y });
    if (free.length === 0) return null;
    return free[Math.min(free.length - 1, Math.floor(rng() * free.length))];
  }

  // 方向指令排入佇列。以「最後排入的方向」判斷 180 度回頭，
  // 避免同一個 tick 內快速連按（例如 右→上→左）讓蛇直接撞進自己。
  function queueDir(state, dir) {
    if (!DIRS[dir] || state.over) return false;
    const last = state.queue.length ? state.queue[state.queue.length - 1] : state.dir;
    if (dir === last || dir === OPPOSITE[last]) return false;
    if (state.queue.length >= 3) return false;
    state.queue.push(dir);
    return true;
  }

  function step(state, rng) {
    if (state.over) return { ate: false };
    if (state.queue.length) state.dir = state.queue.shift();
    const d = DIRS[state.dir];
    const head = state.snake[0];
    const next = { x: head.x + d.x, y: head.y + d.y };

    if (next.x < 0 || next.y < 0 || next.x >= state.cols || next.y >= state.rows) {
      state.over = true;
      return { ate: false, reason: "wall" };
    }
    const ate = !!state.food && next.x === state.food.x && next.y === state.food.y;
    // 沒吃到食物時尾巴這一步會離開，所以判定撞到自己時不算尾巴那一格
    const body = ate ? state.snake : state.snake.slice(0, -1);
    if (body.some(p => p.x === next.x && p.y === next.y)) {
      state.over = true;
      return { ate: false, reason: "self" };
    }
    state.snake.unshift(next);
    if (ate) {
      state.score += 10;
      state.food = spawnFood(state, rng);
      if (!state.food) { state.over = true; state.won = true; }
    } else {
      state.snake.pop();
    }
    return { ate };
  }

  // 每 50 分快 10ms，最快 60ms 一格
  function speedFor(score) { return Math.max(60, 150 - Math.floor(score / 50) * 10); }
  function levelFor(score) { return 1 + (150 - speedFor(score)) / 10; }

  return { DIRS, OPPOSITE, createGame, spawnFood, queueDir, step, speedFor, levelFor };
});
