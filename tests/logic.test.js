// 執行：npm test 或 node --test tests/（Node 18+，不需額外套件）
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../src/logic.js");

const fixed = v => () => v;

test("初始化：長度 3、朝右、食物不在蛇身", () => {
  const g = L.createGame(20, 20, fixed(0));
  assert.equal(g.snake.length, 3);
  assert.equal(g.dir, "right");
  assert.ok(!g.snake.some(p => p.x === g.food.x && p.y === g.food.y));
});

test("每一步往前一格、長度不變", () => {
  const g = L.createGame(20, 20); g.food = { x: 0, y: 0 };
  const h = { ...g.snake[0] };
  L.step(g);
  assert.deepEqual(g.snake[0], { x: h.x + 1, y: h.y });
  assert.equal(g.snake.length, 3);
});

test("禁止 180 度回頭", () => {
  const g = L.createGame(20, 20);
  assert.equal(L.queueDir(g, "left"), false);
  assert.equal(L.queueDir(g, "up"), true);
});

test("同一 tick 快速連按 上→左 不會自撞", () => {
  const g = L.createGame(20, 20); g.food = { x: 0, y: 0 };
  L.queueDir(g, "up"); L.queueDir(g, "left");
  L.step(g); L.step(g);
  assert.equal(g.over, false);
});

test("吃到食物：變長、加 10 分、食物重生", () => {
  const g = L.createGame(20, 20); const h = g.snake[0];
  g.food = { x: h.x + 1, y: h.y };
  assert.equal(L.step(g, fixed(0)).ate, true);
  assert.equal(g.snake.length, 4);
  assert.equal(g.score, 10);
  assert.ok(!g.snake.some(p => p.x === g.food.x && p.y === g.food.y));
});

test("撞牆結束", () => {
  const g = L.createGame(10, 10); g.food = { x: 0, y: 0 }; let r;
  for (let i = 0; i < 10 && !g.over; i++) r = L.step(g);
  assert.equal(g.over, true);
  assert.equal(r.reason, "wall");
});

test("撞到自己結束", () => {
  const g = L.createGame(20, 20); g.food = { x: 0, y: 0 };
  g.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }]; g.dir = "down";
  const r = L.step(g);
  assert.equal(g.over, true);
  assert.equal(r.reason, "self");
});

test("走進尾巴剛離開的格子不算撞", () => {
  const g = L.createGame(20, 20); g.food = { x: 0, y: 0 };
  g.snake = [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }]; g.dir = "down";
  L.step(g);
  assert.equal(g.over, false);
});

test("食物不會生成在蛇身上（隨機 1000 次）", () => {
  const g = L.createGame(6, 6);
  for (let i = 0; i < 1000; i++) {
    const f = L.spawnFood(g);
    assert.ok(!g.snake.some(p => p.x === f.x && p.y === f.y));
  }
});

test("蛇佔滿全場 → 勝利", () => {
  const g = L.createGame(2, 2);
  g.snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]; g.food = { x: 0, y: 1 }; g.dir = "down";
  L.step(g);
  assert.equal(g.over, true);
  assert.equal(g.won, true);
});

test("速度隨分數變快，且有下限", () => {
  assert.equal(L.speedFor(0), 150);
  assert.equal(L.speedFor(100), 130);
  assert.equal(L.speedFor(99999), 60);
});
