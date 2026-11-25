/* 打地鼠核心邏輯：純函式，不碰 DOM，可在瀏覽器與 Node 中測試 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WhackLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DIFFICULTIES = {
    easy:   { label: '簡單', stayMs: 1200, intervalMs: 1000 },
    normal: { label: '普通', stayMs: 900,  intervalMs: 800 },
    hard:   { label: '困難', stayMs: 600,  intervalMs: 550 }
  };
  var DEFAULT_DIFFICULTY = 'normal';
  var GAME_SECONDS = 30;
  var HIGH_SCORE_KEY = 'whack-a-mole:highscore';

  function isValidDifficulty(name) {
    return Object.prototype.hasOwnProperty.call(DIFFICULTIES, name);
  }

  function getDifficulty(name) {
    return isValidDifficulty(name) ? DIFFICULTIES[name] : DIFFICULTIES[DEFAULT_DIFFICULTY];
  }

  /* 選出下一個洞，保證不與上一個相同（洞數 > 1 時） */
  function pickHole(holeCount, lastIndex, rand) {
    rand = rand || Math.random;
    if (holeCount <= 1) return 0;
    var hasLast = lastIndex != null && lastIndex >= 0 && lastIndex < holeCount;
    var range = hasLast ? holeCount - 1 : holeCount;
    var idx = Math.min(Math.floor(rand() * range), range - 1);
    if (hasLast && idx >= lastIndex) idx += 1;
    return idx;
  }

  function createState(difficulty) {
    return {
      score: 0,
      timeLeft: GAME_SECONDS,
      running: true,
      difficulty: isValidDifficulty(difficulty) ? difficulty : DEFAULT_DIFFICULTY,
      activeHole: -1,
      moleId: 0,
      hitMoleId: -1
    };
  }

  /* 地鼠冒出：moleId 用來防止同一隻重複計分 */
  function popMole(state, holeIndex) {
    if (!state.running) return state;
    return Object.assign({}, state, { activeHole: holeIndex, moleId: state.moleId + 1 });
  }

  function hideMole(state) {
    return Object.assign({}, state, { activeHole: -1 });
  }

  /* 敲擊：只有遊戲進行中、敲到目前地鼠且尚未被敲過才得分 */
  function hit(state, holeIndex) {
    if (!state.running || state.activeHole !== holeIndex || state.hitMoleId === state.moleId) {
      return { state: state, scored: false };
    }
    return {
      state: Object.assign({}, state, { score: state.score + 1, hitMoleId: state.moleId, activeHole: -1 }),
      scored: true
    };
  }

  /* 倒數一秒；到 0 時結束遊戲 */
  function tick(state) {
    if (!state.running) return state;
    var t = Math.max(0, state.timeLeft - 1);
    return Object.assign({}, state, {
      timeLeft: t,
      running: t > 0,
      activeHole: t > 0 ? state.activeHole : -1
    });
  }

  /* 讀取最高分；storage 不可用或資料損毀時視為 0 */
  function loadHighScore(storage) {
    try {
      var v = parseInt(storage && storage.getItem(HIGH_SCORE_KEY), 10);
      return isFinite(v) && v > 0 ? v : 0;
    } catch (e) {
      return 0;
    }
  }

  /* 只有破紀錄才寫入；回傳最新最高分 */
  function saveHighScore(storage, score) {
    var best = loadHighScore(storage);
    if (score <= best) return best;
    try {
      if (storage) storage.setItem(HIGH_SCORE_KEY, String(score));
    } catch (e) { /* 儲存失敗不影響遊戲 */ }
    return score;
  }

  return {
    DIFFICULTIES: DIFFICULTIES,
    DEFAULT_DIFFICULTY: DEFAULT_DIFFICULTY,
    GAME_SECONDS: GAME_SECONDS,
    HIGH_SCORE_KEY: HIGH_SCORE_KEY,
    getDifficulty: getDifficulty,
    pickHole: pickHole,
    createState: createState,
    popMole: popMole,
    hideMole: hideMole,
    hit: hit,
    tick: tick,
    loadHighScore: loadHighScore,
    saveHighScore: saveHighScore
  };
});
