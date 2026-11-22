/* ============================================================
   英文口說小練習：主程式
   一般修改請改 js/settings.js，這個檔案通常不需要動。
   ============================================================ */

let questions = [];
let currentIndex = 0;
let correctCount = 0;
let recognition = null;
let isRecording = false;
let advanceTimer = null;
let speakTimer = null;
let recordingTimer = null;
let recordingState = 'idle';
let recordingQuestion = -1;
let receivedResult = false;
let recordingError = false;
const passedQuestions = new Set();
const skippedQuestions = new Set();
let audioContext = null;
let historyEntries = [];
const historyKey = SETTINGS.historyKey;
// 留空時自動使用目前網站的網址（搬到 GitHub Pages 後不用改程式）
const publicPracticeURL = SETTINGS.publicPracticeURL || (location.protocol.startsWith('http') ? location.origin + location.pathname.replace(/index\.html$/, '') : '');
const isAppleTouch = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// 從主畫面以「網頁 App」開啟時，iPad／iPhone 可能不提供語音辨識
const isStandalone = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
const standaloneAppleHint = '你正從主畫面以「網頁 App」開啟，iPad／iPhone 在這個模式下可能無法語音辨識。請改用 Safari 開啟：刪除主畫面圖示後重新加入，並關閉「以網頁 App 打開」。也可以先用下方的鍵盤聽寫備用方式。';
let currentReward = 0;
let previousReward = -1;
const rewards = SETTINGS.rewards;

// 每輪 10 組都出現一次，再重新洗牌；兩輪交界也不連續重複。
let rewardBag = [];
function chooseReward() {
    if (!rewardBag.length) {
        rewardBag = rewards.map((_,index) => index);
        for (let i=rewardBag.length-1;i>0;i--) {
            const j=Math.floor(Math.random()*(i+1));
            [rewardBag[i],rewardBag[j]]=[rewardBag[j],rewardBag[i]];
        }
        const last=rewardBag.length-1;
        if (rewardBag[last] === previousReward) [rewardBag[0],rewardBag[last]]=[rewardBag[last],rewardBag[0]];
    }
    previousReward = currentReward = rewardBag.pop();
    $('rewardImage').src = rewards[currentReward].image;
    $('rewardImage').alt = rewards[currentReward].alt;
}

function showDeviceHelp() {
    const message = location.protocol === 'file:'
        ? '你目前開啟的是本機 HTML 檔。跨裝置使用或錄音請直接開啟公開網站' + (publicPracticeURL ? '：' : '。')
        : isAppleTouch && isStandalone ? standaloneAppleHint
        : isAppleTouch ? 'iPad／iPhone 請直接用 Safari 開啟此網站，允許麥克風，並確認系統 Siri／聽寫已啟用。先按「聽一次」播放發音，等播放完再開始說話。若辨識失敗，可用鍵盤聽寫或跳過。' : '';
    if (!message) return;
    $('deviceHelp').hidden = false;
    $('deviceHelp').textContent = message;
    if (location.protocol === 'file:' && publicPracticeURL) {
        const link = document.createElement('a');
        link.href = publicPracticeURL; link.textContent = '開啟公開練習網站';
        $('deviceHelp').append(link);
    }
}
function encodeLesson(text) {
    const bytes = new TextEncoder().encode(JSON.stringify({version:1,text}));
    return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function readSharedLesson() {
    if (!location.hash.startsWith('#lesson=')) return;
    try {
        const encoded = location.hash.slice(8);
        if (encoded.length > 12000) throw new Error('too large');
        const binary = atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
        const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));
        if (data.version !== 1 || typeof data.text !== 'string' || data.text.length > 8000) throw new Error('invalid');
        $('practiceInput').value = data.text;
        notify('已帶入分享的練習內容。按「開始練習」後會保存到本裝置。');
    } catch { notify('這個練習連結無法讀取，請重新複製連結或改用匯出／匯入。'); }
}
async function sharePractice() {
    const text = $('practiceInput').value.trim();
    if (!text) { notify('請先輸入或選取要分享的練習內容。'); return; }
    const encoded = encodeLesson(text);
    if (encoded.length > 12000) { notify('內容較長，請先開始練習保存紀錄，再用「匯出紀錄」搬移。'); return; }
    if (!publicPracticeURL) { notify('請在 js/settings.js 填入 publicPracticeURL，才能產生練習連結。'); return; }
    const url = publicPracticeURL + '#lesson=' + encoded;
    $('shareLinkField').value = url;
    try {
        await navigator.clipboard.writeText(url);
        $('shareLinkField').hidden = true;
        notify('練習連結已複製，傳到 iPad 並用 Safari 開啟即可帶入。取得連結的人也能看到其中的練習文字。');
    } catch {
        $('shareLinkField').hidden = false;
        $('shareLinkField').focus(); $('shareLinkField').select();
        notify('請長按或選取下方連結複製，再傳到另一台裝置。');
    }
}
function exportHistory() {
    if (!historyEntries.length) { notify('目前沒有紀錄；請先開始一次練習再匯出。'); return; }
    const blob = new Blob([JSON.stringify({version:1,entries:historyEntries},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'english-practice-history.json';
    document.body.append(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    notify('紀錄已匯出。把檔案傳到另一台裝置，再按「匯入紀錄」。');
}
function mergeImportedHistory(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > 100) throw new Error('invalid');
    const entries = data.entries.map(e => {
        if (!e || typeof e.text !== 'string' || !e.text.trim() || e.text.length > 50000 || typeof e.date !== 'string' || !Number.isFinite(Date.parse(e.date))) throw new Error('invalid');
        return {text:e.text, date:e.date};
    });
    const seen = new Set();
    historyEntries = [...entries,...historyEntries].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).filter(e => {
        if (seen.has(e.text)) return false;
        seen.add(e.text); return true;
    }).slice(0,8);
    localStorage.setItem(historyKey,JSON.stringify(historyEntries));
    renderHistory();
    return entries.length;
}
async function importHistoryFile(input) {
    const file = input.files[0];
    if (!file) return;
    try {
        if (file.size > 1024*1024) throw new Error('large');
        const count = mergeImportedHistory(JSON.parse(await file.text()));
        notify(`已讀取 ${count} 筆紀錄，與本裝置合併後保留最近 8 筆。`);
    } catch { notify('無法匯入。請選擇本網站匯出的 JSON 檔，並確認瀏覽器允許保存資料。'); }
    finally { input.value = ''; }
}
function compareBackup() {
    if (recordingState !== 'idle') { notify('請先結束錄音，或按跳過離開本題。'); return; }
    const text = $('backupText').value.trim();
    if (!text) { notify('請先聽寫或輸入英文。'); return; }
    unlockSound();
    evaluateAnswer(text,0);
}
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const $ = id => document.getElementById(id);

function notify(message) {
    $('notice').textContent = message;
    $('notice').hidden = false;
}
function clearNotice() {
    $('notice').hidden = true;
    $('notice').textContent = '';
}
function setMicState(recording) {
    isRecording = recording;
    $('micButton').classList.toggle('recording', recording);
    $('micIdle').hidden = recording;
    $('micActive').hidden = !recording;
}
function loadHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(historyKey) || '[]');
        historyEntries = Array.isArray(saved) ? saved.filter(e => e && typeof e.text === 'string' && typeof e.date === 'string').slice(0,8) : [];
    } catch { historyEntries = []; }
    renderHistory();
}
function renderHistory() {
    const list = $('historyList');
    list.replaceChildren();
    if (!historyEntries.length) {
        const empty = document.createElement('p');
        empty.className = 'history-note';
        empty.textContent = '開始第一次練習後，就會顯示在這裡。';
        list.append(empty);
    }
    historyEntries.forEach(entry => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'history-item';
        const title = document.createElement('strong');
        title.textContent = entry.text.split('\n')[0];
        const meta = document.createElement('small');
        const date = new Date(entry.date);
        meta.textContent = `${entry.text.split('\n').filter(line => line.trim()).length} 題 · ${Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-TW')}`;
        button.append(title,meta);
        button.addEventListener('click', () => {
            $('practiceInput').value = entry.text;
            $('practiceInput').focus();
            clearNotice();
        });
        const row = document.createElement('div');
        row.className = 'history-row';
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'history-add';
        add.textContent = '加入目前輸入 ＋';
        add.setAttribute('aria-label', `加入紀錄：${entry.text.split('\n')[0]}`);
        add.addEventListener('click', () => appendHistory(entry.text));
        row.append(button, add);
        list.append(row);
    });
}
function appendHistory(text) {
    const input = $('practiceInput');
    const current = input.value.trimEnd();
    input.value = current ? current + '\n' + text : text;
    input.focus();
    clearNotice();
    notify('已加入舊紀錄，你可以繼續修改或新增句子。按「開始練習」後會保存成新的紀錄。');
}
function saveHistory(text) {
    historyEntries = [{text, date:new Date().toISOString()}, ...historyEntries.filter(e => e.text !== text)].slice(0,8);
    try { localStorage.setItem(historyKey, JSON.stringify(historyEntries)); }
    catch { notify('這個瀏覽器無法保存最近輸入；本次仍可正常練習。'); }
    renderHistory();
}
function unlockSound() {
    if (!$('soundEnabled').checked) return;
    try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        audioContext ||= new Audio();
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch { /* Visual reward still works when audio is unavailable. */ }
}
function playSuccessSound() {
    if (!$('soundEnabled').checked || !audioContext || audioContext.state !== 'running') return;
    try {
        rewards[currentReward].notes.forEach((frequency,i) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const time = audioContext.currentTime + i*.13;
            oscillator.type = rewards[currentReward].type; oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0,time);
            gain.gain.linearRampToValueAtTime(.12,time+.015);
            gain.gain.exponentialRampToValueAtTime(.001,time+.22);
            oscillator.connect(gain); gain.connect(audioContext.destination);
            oscillator.start(time); oscillator.stop(time+.24);
            oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        });
    } catch { /* Sound errors must not interrupt practice. */ }
}
if (publicPracticeURL) $('openPracticeLink').href = publicPracticeURL;
$('appVersion').textContent = '版本 ' + SETTINGS.appVersion;
loadHistory();
showDeviceHelp();
readSharedLesson();

function startPractice() {
    const input = $('practiceInput').value.trim();
    if (!input) {
        notify('請先輸入今天的英文練習。');
        return;
    }
    questions = input.split(/\n+/).map(line => line.trim()).filter(Boolean);
    if (!questions.length) {
        notify('沒有找到英文題目。');
        return;
    }
    clearNotice();
    saveHistory(input);
    unlockSound();
    currentIndex = 0;
    correctCount = 0;
    passedQuestions.clear();
    skippedQuestions.clear();
    $('parentScreen').style.display = 'none';
    $('finishScreen').style.display = 'none';
    $('practiceScreen').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    clearTimeout(speakTimer);
    clearTimeout(advanceTimer);
    const question = questions[currentIndex];
    $('questionNumber').textContent = `第 ${currentIndex + 1} 題`;
    $('progressText').textContent = `第 ${currentIndex + 1} / ${questions.length} 題`;
    $('scoreText').textContent = `答對 ${correctCount} 題`;
    $('question').textContent = question;
    $('correctText').textContent = question;
    $('result').style.display = 'none';
    $('reward').hidden = true;
    $('backupText').value = '';
    $('skipButton').hidden = false;
    $('skipButton').textContent = passedQuestions.has(currentIndex) ? '下一題 →' : '先跳過這題 →';
    $('prevButton').disabled = currentIndex === 0;
    clearNotice();
    if (passedQuestions.has(currentIndex)) notify('這題之前已經答對了。可以再練習一次，或按「下一題」。');
    $('progressInner').style.width = currentIndex / questions.length * 100 + '%';
    $('emoji').textContent = SETTINGS.questionEmojis[Math.floor(Math.random() * SETTINGS.questionEmojis.length)];
    if (!isAppleTouch) speakTimer = setTimeout(() => {
        if ($('practiceScreen').style.display === 'block') speakQuestion();
    }, 400);
}

// 挑選朗讀聲音：依 settings.js 的 preferredVoices 順序找，找不到就用系統的英文聲音。
// 聲音清單在部分瀏覽器是稍後才載入的，所以用 voiceschanged 重新挑一次。
let chosenVoice = null;
function pickVoice() {
    if (!window.speechSynthesis) return null;
    const englishVoices = window.speechSynthesis.getVoices().filter(voice => /^en\b|^en[-_]/i.test(voice.lang));
    if (!englishVoices.length) return null;
    for (const wanted of (SETTINGS.preferredVoices || [])) {
        const match = englishVoices.find(voice => voice.name.toLowerCase().includes(wanted.toLowerCase()));
        if (match) return match;
    }
    // 沒有指定的聲音時，優先用美式英文，再退回任何英文聲音。
    return englishVoices.find(voice => /^en[-_]US/i.test(voice.lang)) || englishVoices[0];
}
function refreshVoice() { chosenVoice = pickVoice(); }
if (window.speechSynthesis) {
    refreshVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoice);
}

function speakQuestion() {
    if (recordingState !== 'idle') return;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        notify('這個瀏覽器不支援語音播放。');
        return;
    }
    clearNotice();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(questions[currentIndex]);
    if (!chosenVoice) refreshVoice();
    if (chosenVoice) { utterance.voice = chosenVoice; utterance.lang = chosenVoice.lang; }
    else utterance.lang = 'en-US';
    utterance.rate = SETTINGS.speechRate ?? 0.7;
    utterance.pitch = SETTINGS.speechPitch ?? 1;
    window.speechSynthesis.speak(utterance);
}

const micButton = $('micButton');
micButton.setAttribute('aria-label', '開始說話');
micButton.setAttribute('aria-pressed', 'false');
function updateRecordingState(state) {
    recordingState = state;
    setMicState(state === 'listening');
    micButton.disabled = state === 'starting' || state === 'stopping';
    micButton.setAttribute('aria-pressed', String(state === 'listening'));
    micButton.setAttribute('aria-label', state === 'listening' ? '結束說話' : '開始說話');
    document.querySelector('[data-template-id="mic-instructions"]').textContent = {
        idle: '點一下開始說話，再點一下結束；請等按鈕變紅再說話。',
        starting: '正在啟動，首次使用請在瀏覽器提示中允許麥克風。',
        listening: '正在聽你說話，說完請點紅色按鈕。',
        stopping: '正在辨識，請稍候…'
    }[state];
    document.querySelector('[data-template-id="listen-button"]').disabled = state !== 'idle';
    $('retryButton').disabled = state !== 'idle';
    $('nextButton').disabled = state !== 'idle';
    $('backupCompare').disabled = state !== 'idle';
    $('prevButton').disabled = state !== 'idle' || currentIndex === 0;
}
function startRecording() {
    if (recordingState !== 'idle') return;
    if (!window.isSecureContext) {
        notify('麥克風需要安全連線。請使用獨立的 HTTPS 網址開啟本頁。');
        return;
    }
    const policy = document.permissionsPolicy || document.featurePolicy;
    if (policy && !policy.allowsFeature('microphone')) {
        notify('這個內嵌畫面未獲平台允許使用麥克風。請在新分頁直接開啟練習網站；反覆開啟 Chrome 權限無法解除外層限制。');
        $('openPracticeLink').hidden = false;
        return;
    }
    if (!SpeechRecognition) {
        if (isAppleTouch && isStandalone) { notify(standaloneAppleHint); return; }
        notify('這個瀏覽器不支援網頁語音辨識。iPad 請改用 Safari；也可展開下方備用方式，以鍵盤聽寫後比對。');
        return;
    }
    if (window.speechSynthesis?.speaking) { notify('請等標準發音播放完畢，再按麥克風。'); return; }
    clearTimeout(speakTimer);
    window.speechSynthesis?.cancel();
    clearNotice();
    unlockSound();
    setupRecognition();
    recordingQuestion = currentIndex;
    receivedResult = false;
    recordingError = false;
    updateRecordingState('starting');
    recordingTimer = setTimeout(() => recoverRecognition('語音辨識沒有回應。iPad 請確認 Siri／聽寫及麥克風設定，也可用下方備用方式或跳過。'), 15000);
    try {
        recognition.start();
    } catch (error) {
        clearTimeout(recordingTimer);
        updateRecordingState('idle');
        notify('語音辨識尚未就緒，請稍後重試。錯誤：' + error.name);
    }
}
function stopRecording() {
    if (recordingState !== 'listening') return;
    clearTimeout(recordingTimer);
    updateRecordingState('stopping');
    recordingTimer = setTimeout(() => recoverRecognition('等待辨識結果逾時，請重試、使用備用方式或跳過。'), 12000);
    try {
        recognition.stop();
    } catch (error) {
        updateRecordingState('idle');
        notify('錄音未能完成，請再試一次。錯誤：' + error.name);
    }
}
micButton.addEventListener('click', () => {
    if (recordingState === 'listening') stopRecording();
    else startRecording();
});
function recoverRecognition(message) {
    clearTimeout(recordingTimer);
    const session = recognition;
    recognition = null;
    recordingError = true;
    try { session?.abort(); } catch {}
    updateRecordingState('idle');
    notify(message);
}
function setupRecognition() {
    const session = new SpeechRecognition();
    recognition = session;
    session.lang = 'en-US';
    session.continuous = false;
    session.interimResults = false;
    session.maxAlternatives = 3;
    recognition.onstart = () => {
        if (recognition !== session) return;
        clearTimeout(recordingTimer);
        updateRecordingState('listening');
        recordingTimer = setTimeout(stopRecording, 15000);
    };
    recognition.onresult = event => {
        if (recognition !== session) return;
        if (recordingQuestion !== currentIndex) return;
        const result = event.results[event.resultIndex || 0][0];
        receivedResult = true;
        evaluateAnswer(result.transcript.trim(), result.confidence || 0);
    };
    recognition.onerror = event => {
        if (recognition !== session) return;
        recordingError = true;
        clearTimeout(recordingTimer);
        const messages = {
            'not-allowed': '語音辨識被拒絕。請檢查此獨立網站及系統對 Chrome 的麥克風權限；若在平台預覽中，請改用新分頁直接開啟。',
            'service-not-allowed': '語音辨識服務被拒絕，這不一定是麥克風權限。iPad 請用 Safari 直接開啟，確認 Siri／聽寫已啟用；也可用下方備用方式。',
            'audio-capture': '無法取得麥克風，請確認裝置可用及系統麥克風設定。',
            'network': '語音辨識服務連線失敗，請檢查網路後重試。',
            'no-speech': '沒有聽到聲音。請等按鈕變紅後再說話。',
            'aborted': '錄音已中止，請重新開始。',
            'language-not-supported': '目前語音辨識服務不支援英文（en-US）。'
        };
        const standaloneExtra = isAppleTouch && isStandalone && ['not-allowed','service-not-allowed'].includes(event.error) ? ' ' + standaloneAppleHint : '';
        recoverRecognition((messages[event.error] || '語音辨識發生問題，請再試一次。') + '（' + event.error + '）' + standaloneExtra);
    };
    recognition.onend = () => {
        if (recognition !== session) return;
        clearTimeout(recordingTimer);
        updateRecordingState('idle');
        if (!receivedResult && !recordingError) notify('沒有辨識到內容，請再說一次。');
    };
}
document.addEventListener('visibilitychange', () => {
    if (document.hidden && recordingState === 'listening') stopRecording();
});
function normalizeText(text) {
    const small = {zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19};
    const tens = {twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
    const tokens = text.toLowerCase().replace(/(\d),(?=\d{3}\b)/g,'$1').replace(/[.,!?;:'"“”‘’]/g,'').replace(/[-–—]/g,' ').split(/\s+/).filter(Boolean);
    const output = [];
    for (let i=0; i<tokens.length; i++) {
        if (tokens[i] in small || tokens[i] in tens) {
            let value = tokens[i] in small ? small[tokens[i]] : tens[tokens[i]];
            if (tokens[i] in tens && tokens[i+1] in small && small[tokens[i+1]] > 0 && small[tokens[i+1]] < 10) value += small[tokens[++i]];
            if (tokens[i+1] === 'hundred' && value > 0 && value < 10) {
                value *= 100; i++;
                if (tokens[i+1] === 'and' && (tokens[i+2] in small || tokens[i+2] in tens)) i++;
                if (tokens[i+1] in small || tokens[i+1] in tens) {
                    const next = tokens[++i]; value += next in small ? small[next] : tens[next];
                    if (next in tens && tokens[i+1] in small && small[tokens[i+1]] > 0 && small[tokens[i+1]] < 10) value += small[tokens[++i]];
                }
            }
            output.push(String(value));
        } else output.push(tokens[i]);
    }
    return output.join(' ');
}
function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
                ? matrix[i - 1][j - 1]
                : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
}
function similarity(a, b) {
    if (!a && !b) return 1;
    const maxLength = Math.max(a.length, b.length);
    return maxLength ? 1 - levenshtein(a, b) / maxLength : 1;
}
function evaluateAnswer(heard, confidence) {
    const correct = questions[currentIndex];
    const normalizedHeard = normalizeText(heard);
    const normalizedCorrect = normalizeText(correct);
    const similarityScore = similarity(normalizedHeard, normalizedCorrect);
    const heardNumbers = normalizedHeard.match(/\b\d+\b/g) || [];
    const correctNumbers = normalizedCorrect.match(/\b\d+\b/g) || [];
    const sameNumbers = JSON.stringify(heardNumbers) === JSON.stringify(correctNumbers);
    const passed = sameNumbers && (normalizedHeard === normalizedCorrect || similarityScore >= 0.88);
    let score = Math.round(similarityScore * 100);
    if (confidence > 0) score = Math.round(score * 0.75 + confidence * 100 * 0.25);
    score = Math.max(0, Math.min(100, score));
    showResult(heard, correct, score, passed);
}
function showResult(heard, correct, score, passed) {
    clearNotice();
    $('result').style.display = 'block';
    $('heardText').textContent = heard || '沒有辨識到內容';
    $('correctText').textContent = correct;
    $('pronunciationScore').textContent = `🗣️ 句子辨識符合度：${score}`;
    $('feedback').className = 'feedback ' + (passed ? 'success' : 'fail');
    $('pronunciationScore').className = 'score ' + (passed ? 'success' : 'fail');
    $('reward').hidden = !passed;
    $('skipButton').hidden = passed;
    $('feedbackSuccess').hidden = !passed;
    $('feedbackFail').hidden = passed;
    $('retryButton').style.display = passed ? 'none' : 'block';
    $('nextButton').style.display = passed ? 'block' : 'none';
    if (passed) {
        chooseReward();
        playSuccessSound();
        if (!passedQuestions.has(currentIndex)) {   // 同一題重複答對只計一次分數
            passedQuestions.add(currentIndex);
            correctCount++;
            $('scoreText').textContent = `答對 ${correctCount} 題`;
        }
        advanceTimer = setTimeout(advanceAfterSuccess, 2200);
    }
}
function advanceAfterSuccess() {
    if (recordingState !== 'idle') {
        advanceTimer = setTimeout(advanceAfterSuccess, 200);
        return;
    }
    nextQuestion();
}
// 離開目前這題前：停掉播放、錄音與各種計時器
function stopCurrentQuestion() {
    clearTimeout(speakTimer);
    clearTimeout(advanceTimer);
    clearTimeout(recordingTimer);
    window.speechSynthesis?.cancel();
    const oldSession = recognition;
    recognition = null; // Ignore late callbacks from the question we are leaving.
    recordingQuestion = -1;
    try { oldSession?.abort(); } catch {}
    updateRecordingState('idle');
}
function skipQuestion() {
    stopCurrentQuestion();
    if (!passedQuestions.has(currentIndex)) skippedQuestions.add(currentIndex);
    nextQuestion();
}
function previousQuestion() {
    if (currentIndex === 0) return;
    stopCurrentQuestion();
    currentIndex--;
    showQuestion();
}
function retryQuestion() {
    speakQuestion();
}
function nextQuestion() {
    if (recordingState !== 'idle') return;
    clearTimeout(advanceTimer);
    currentIndex++;
    if (currentIndex >= questions.length) showFinish();
    else showQuestion();
}
function showFinish() {
    clearTimeout(speakTimer);
    clearTimeout(advanceTimer);
    $('practiceScreen').style.display = 'none';
    $('finishScreen').style.display = 'block';
    $('progressInner').style.width = '100%';
    $('finalScore').textContent = `答對 ${correctCount} / ${questions.length} 題 · 跳過 ${skippedQuestions.size} 題`;
    const ratio = correctCount / questions.length;
    const starCount = ratio >= 1 ? 5 : ratio >= .8 ? 4 : ratio >= .6 ? 3 : ratio >= .4 ? 2 : 1;
    $('stars').textContent = '⭐'.repeat(starCount);
}
function backToParent() {
    clearTimeout(speakTimer);
    clearTimeout(advanceTimer);
    clearNotice();
    window.speechSynthesis?.cancel();
    $('finishScreen').style.display = 'none';
    $('parentScreen').style.display = 'block';
}
