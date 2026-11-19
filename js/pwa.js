/* ============================================================
   離線功能：註冊 Service Worker（sw.js）
   這個檔案通常不需要動。
   ============================================================ */

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // 註冊失敗不影響練習，只是無法離線開啟。
        });
    });
}
