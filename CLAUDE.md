# 給 Claude Code 的專案說明

這是一個給孩子用的英文口說練習網頁（PWA），發布在 GitHub Pages。純 HTML／CSS／JavaScript，沒有建置步驟，也不要加入任何框架或套件。

## 檔案結構
- `index.html`：畫面
- `css/style.css`：樣式
- `js/settings.js`：使用者平常會改的設定（版本號、獎勵、題目小圖示、分享網址）
- `js/app.js`：主程式
- `js/pwa.js`、`sw.js`、`manifest.webmanifest`：離線與主畫面安裝
- `images/`：獎勵圖片；`icons/`：App 圖示

## 修改規則
- 每次修改後，把 `js/settings.js` 的 `appVersion` 加 1（例如 1.0.0 → 1.0.1）。
- 新增檔案時，把路徑加進 `sw.js` 的 `PRECACHE` 清單。
- 所有路徑都用相對路徑（不要以 `/` 開頭），因為網站放在 `/repo 名稱/` 底下。
- 介面文字使用繁體中文（台灣用語）。

## 推送規則
- 這台電腦可能登入多個 GitHub 帳號。push 之前一定先執行 `gh auth status`，確認目前帳號是使用者指定的帳號；不是的話用 `gh auth switch --user 帳號` 切換，並告訴使用者。
- commit 訊息用繁體中文，簡短說明改了什麼。
