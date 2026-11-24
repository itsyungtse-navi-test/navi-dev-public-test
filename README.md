# navi-dev-public-test
Public test repository for the Navi dev environment

## 🐍 貪食蛇（Snake）

純前端的貪食蛇遊戲，HTML + Canvas + 原生 JavaScript，沒有任何外部依賴。

### 遊玩

直接用瀏覽器打開 `index.html` 即可（不需要伺服器）。

| 操作 | 按鍵 |
|---|---|
| 移動 | 方向鍵 / WASD；手機可滑動畫面或使用螢幕方向鍵 |
| 開始 | Enter |
| 暫停 / 繼續 | 空白鍵或 P |
| 重新開始 | R |

每吃一個食物 +10 分，每 50 分加速一次；最高分會存在瀏覽器（localStorage）。

### 檔案結構

```
index.html            頁面與樣式
src/logic.js          核心邏輯（純函式，不碰 DOM）：移動、轉向、吃食物、碰撞、計分
src/main.js           Canvas 繪製、鍵盤／觸控輸入、遊戲迴圈、最高分保存
tests/logic.test.js   核心邏輯單元測試
```

### 測試

需要 Node.js 18 以上，使用內建 test runner，不用安裝套件：

```bash
npm test
# 或
node --test tests/logic.test.js
```
