# 🌱 英文口說小練習

把今天的英文句子貼進來，聽標準發音、開口說，答對就有圖片和音效獎勵。可以加入 iPad 主畫面，沒有網路也能打開。

---

## 一、檔案說明

| 檔案 | 用途 | 平常要改嗎？ |
|---|---|---|
| `js/settings.js` | 版本號、10 組獎勵、題目小圖示、分享網址 | ✅ 主要改這裡 |
| `images/` | 獎勵圖片 | 想換圖時替換 |
| `index.html` | 畫面文字與版面 | 偶爾 |
| `css/style.css` | 顏色、大小等樣式 | 偶爾 |
| `js/app.js` | 主程式 | 通常不用 |
| `sw.js`、`js/pwa.js`、`manifest.webmanifest` | 離線與主畫面安裝 | 通常不用 |
| `icons/` | App 圖示 | 想換圖示時替換 |
| `CLAUDE.md` | 給 Claude Code 看的專案說明 | 不用 |

---

## 二、第一次設定（只需做一次）

### 1. 安裝 Git 和 GitHub CLI

**Mac**：打開「終端機」，依序執行：

```bash
xcode-select --install      # 安裝 Git（已安裝會顯示提示，略過即可）
brew install gh             # 安裝 GitHub CLI（需要先安裝 Homebrew：https://brew.sh）
```

**Windows**：打開「PowerShell」，依序執行：

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
```

安裝完請關掉終端機再重新打開。

### 2. 登入兩個 GitHub 帳號

```bash
gh auth login     # 第一次：登入帳號 A
gh auth login     # 第二次：登入帳號 B
gh auth setup-git # 讓 Git 推送時使用 GitHub CLI 的登入資訊
```

每次 `gh auth login` 選擇：GitHub.com → HTTPS → Login with a web browser，再到瀏覽器輸入畫面上的代碼。
⚠️ 用瀏覽器登入前，先確認瀏覽器目前登入的是**你要加的那個帳號**，否則會加到錯的帳號。

確認兩個帳號都登入了：

```bash
gh auth status
```

切換帳號：

```bash
gh auth switch --user 你的帳號名稱
```

### 3. 安裝 Claude Code

請依照官方說明安裝：https://docs.claude.com/en/docs/claude-code/overview

### 4. 放好資料夾

把這個 `english-speaking` 資料夾放到個人目錄，例如：

- Mac：`/Users/你的名字/english-speaking`
- Windows：`C:\Users\你的名字\english-speaking`

---

## 三、用 Claude Code 第一次推上 GitHub

在終端機進入資料夾並啟動 Claude Code：

```bash
cd ~/english-speaking
claude
```

把下面這段貼給 Claude Code（把 `你的帳號`、`你的信箱` 換成要使用的 GitHub 帳號）：

```text
請幫我把這個資料夾發布到 GitHub Pages：
1. 執行 gh auth status，確認目前帳號是「你的帳號」；不是的話用 gh auth switch 切換。
2. 在這個資料夾初始化 git，並只為這個專案設定 user.name 為「你的帳號」、user.email 為「你的信箱」。
3. 建立一個公開的 repository，名稱為 english-speaking，commit 所有檔案並推送到 main 分支。
4. 開啟 GitHub Pages，來源設為 main 分支的根目錄。
5. 完成後告訴我網站網址，並確認網址可以打開。
```

> 💡 信箱可以用 GitHub 提供的隱私信箱（在 GitHub → Settings → Emails 可以找到，格式類似 `12345+帳號@users.noreply.github.com`），避免真實信箱公開在 commit 紀錄中。

> 💡 免費帳號的 GitHub Pages 需要公開 repository，任何人都能看到程式碼。這個專案沒有密碼或個人資料，公開沒有問題。

網站網址會是：

```
https://你的帳號.github.io/english-speaking/
```

第一次開啟 Pages 後，網站大約需要 1～2 分鐘才會上線。

---

## 四、在 iPad 上使用

1. 用 **Safari** 打開網站網址。
2. 點分享按鈕 → 「加入主畫面」。
3. **重要**：iPadOS 26 以後，加入時會有一個「以網頁 App 打開」的開關（英文介面為 Open as Web App，中文名稱可能略有不同）。**請把它關掉**。

為什麼要關掉？iPad 在「網頁 App」模式下可能不提供語音辨識，麥克風按鈕會失效。關掉後，主畫面圖示會用 Safari 開啟，語音辨識就能正常運作，沒有網路時也一樣能打開練習畫面（但語音辨識本身可能需要網路）。

如果想試試看網頁 App 模式在你的 iPad 上能不能辨識，可以先保持開啟測試一次。若程式顯示「你正從主畫面以網頁 App 開啟……」的提示，或按麥克風沒有反應，就刪掉圖示重新加入並關閉開關。

---

## 五、以後要修改

### 用 Claude Code 修改（推薦）

```bash
cd ~/english-speaking
claude
```

直接用中文描述，例如：

```text
把第 3 組獎勵的說明改成「小火箭帶你飛上天，答對了！」，改完推上 GitHub。
```

```text
新增第 11 組獎勵，圖片用 images 資料夾裡的 reward-11.png，旋律輕快一點，改完推上 GitHub。
```

Claude Code 會讀 `CLAUDE.md`，自動把版本號加 1、推送前確認帳號。

### 自己修改

1. 改好檔案。
2. 打開 `js/settings.js`，把 `appVersion` 加 1（例如 `'1.0.0'` → `'1.0.1'`）。
3. 推上 GitHub（可以請 Claude Code 幫忙，或在 GitHub 網頁上直接上傳檔案）。
4. 等 1～2 分鐘，在 iPad 重新打開網站，看輸入畫面最下方的版本號有沒有變。

### 為什麼 iPad 會自動拿到新版？

有網路時，程式一律先抓網站上最新的檔案，並順便存一份到裝置；沒有網路時才用存下來的那份。所以只要 iPad 連上網路打開一次，就會是最新版。

---

## 六、從舊網站搬移紀錄

最近輸入紀錄是存在各網址底下的，換到 GitHub Pages 的新網址後不會自動出現。搬移方式：

1. 在**舊網站**按「📥 匯出紀錄」，得到一個 `.json` 檔。
2. 把檔案傳到 iPad（AirDrop、雲端硬碟等）。
3. 在**新網站**按「📤 匯入紀錄」，選擇那個檔案。

記得也把 Canva 上的連結改成新網址。

---

## 七、常見問題

**麥克風沒反應？**
確認是用 Safari 開啟（不是主畫面網頁 App 模式），並到「設定 → Siri」或「設定 → 一般 → 鍵盤」確認聽寫已啟用。辨識不成功時，可以展開「辨識不成功？改用鍵盤聽寫或輸入比對」。

**推送時出現權限錯誤（403）？**
多半是目前登入的帳號不對。執行 `gh auth status` 確認，再用 `gh auth switch --user 帳號` 切換。

**改了但 iPad 還是舊版？**
等 1～2 分鐘後，在 iPad 連網狀態下關掉網頁再重新打開。仍然沒變的話，在 Safari 網址列重新整理一次。
