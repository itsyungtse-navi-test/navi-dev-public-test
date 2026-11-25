/* 執行方式（Node 18+）：node --test whack-a-mole/game-logic.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const L = require('./game-logic.js');

function memStorage(init) {
  const m = Object.assign({}, init);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    _m: m
  };
}

test('選洞不會連續重複', () => {
  let last = -1;
  for (let i = 0; i < 5000; i++) {
    const n = L.pickHole(9, last);
    assert.ok(n >= 0 && n < 9);
    assert.notStrictEqual(n, last);
    last = n;
  }
  assert.notStrictEqual(L.pickHole(9, 8, () => 0.9999), 8);
  assert.strictEqual(L.pickHole(1, 0), 0);
});

test('選洞能涵蓋所有其他洞', () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(L.pickHole(9, 4));
  assert.deepStrictEqual([...seen].sort(), [0, 1, 2, 3, 5, 6, 7, 8]);
});

test('同一隻地鼠只能得一次分', () => {
  let s = L.popMole(L.createState('normal'), 3);
  let r = L.hit(s, 3);
  assert.ok(r.scored);
  s = r.state;
  r = L.hit(s, 3);
  assert.ok(!r.scored);
  assert.strictEqual(r.state.score, 1);
  s = L.popMole(s, 3);
  r = L.hit(s, 3);
  assert.ok(r.scored);
  assert.strictEqual(r.state.score, 2);
});

test('敲錯洞或沒地鼠不得分', () => {
  const s = L.popMole(L.createState('easy'), 2);
  assert.ok(!L.hit(s, 5).scored);
  assert.ok(!L.hit(L.hideMole(s), 2).scored);
});

test('倒數到 0 結束，之後不能得分也不會冒地鼠', () => {
  let s = L.createState('hard');
  for (let i = 0; i < L.GAME_SECONDS; i++) s = L.tick(s);
  assert.strictEqual(s.timeLeft, 0);
  assert.strictEqual(s.running, false);
  s = L.tick(s);
  assert.strictEqual(s.timeLeft, 0);
  assert.strictEqual(L.popMole(s, 1).activeHole, -1);
  assert.ok(!L.hit(Object.assign({}, s, { activeHole: 1, moleId: 9 }), 1).scored);
});

test('三種難度停留時間由長到短，無效難度改用普通', () => {
  const d = L.DIFFICULTIES;
  assert.ok(d.easy.stayMs > d.normal.stayMs && d.normal.stayMs > d.hard.stayMs);
  assert.strictEqual(L.getDifficulty('xxx'), d.normal);
  assert.strictEqual(L.getDifficulty(undefined), d.normal);
  assert.strictEqual(L.createState('bogus').difficulty, 'normal');
});

test('最高分只在破紀錄時更新，讀取失敗視為 0', () => {
  const st = memStorage();
  assert.strictEqual(L.loadHighScore(st), 0);
  assert.strictEqual(L.saveHighScore(st, 5), 5);
  assert.strictEqual(L.saveHighScore(st, 3), 5);
  assert.strictEqual(st._m[L.HIGH_SCORE_KEY], '5');
  assert.strictEqual(L.saveHighScore(st, 8), 8);
  assert.strictEqual(L.loadHighScore(memStorage({ [L.HIGH_SCORE_KEY]: 'abc' })), 0);
  const broken = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); }
  };
  assert.strictEqual(L.loadHighScore(broken), 0);
  assert.strictEqual(L.saveHighScore(broken, 4), 4);
  assert.strictEqual(L.loadHighScore(null), 0);
});
