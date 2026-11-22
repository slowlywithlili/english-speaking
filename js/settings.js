/* ============================================================
   英文口說小練習：設定檔
   平常想修改的內容都在這裡，改完存檔、推上 GitHub 即可。
   ============================================================ */

const SETTINGS = {

    // 版本號：每次修改後加 1（例如 '1.0.1' → '1.0.2'）。
    // 輸入畫面最下方會顯示這個版本號，方便確認 iPad 已經拿到新版。
    appVersion: '1.0.4',

    // 朗讀速度的「預設值」：1 是正常速度，數字越小越慢。
    // 練習畫面有語速滑桿，調過之後會記在那台裝置上，就以滑桿為準；
    // 這裡只影響還沒調過的新裝置。太慢（低於 0.4）聲音會變得不自然。
    speechRate: 0.45,

    // 逐字模式：是否預設「一個字一個字慢慢唸」。練習畫面可以勾選，勾過就以那裡為準。
    wordByWord: false,

    // 逐字模式裡，每個字中間停多久（毫秒）。數字越大停越久、整體越慢。
    wordGapMs: 450,

    // 朗讀音高：1 是原本的高低，調高一點（例如 1.05）聽起來比較親切。
    speechPitch: 1.05,

    // 想要優先使用的朗讀聲音，依序尋找，找到哪個就用哪個。
    // 名稱只要「包含」就算符合（不分大小寫），裝置上沒有的會自動略過。
    // iPad／iPhone／Mac 可到「設定 → 輔助使用 → 朗讀內容 → 聲音 → 英文」
    // 下載 Ava、Samantha 等較自然的聲音，下載後這裡就會自動用上。
    preferredVoices: [
        'Ava (Premium)',            // Apple 最自然的美式女聲（需另外下載）
        'Ava (Enhanced)',
        'Zoe (Premium)',
        'Allison (Enhanced)',
        'Samantha',                 // Apple 內建美式女聲
        'Google US English',        // Chrome 內建美式女聲
        'Microsoft Aria',           // Edge 自然語音
        'Microsoft Jenny',
        'Karen',
        'Moira',
    ],

    // 「複製練習連結」使用的網址。
    // 留空 '' 代表自動使用目前網站的網址，搬家也不用改。
    // 若想固定成某個網址，例如 'https://你的帳號.github.io/english-speaking/'，填在這裡。
    publicPracticeURL: '',

    // 最近輸入紀錄存在瀏覽器裡的名稱。改掉會讓舊紀錄看不到，平常請不要動。
    historyKey: 'english-speaking-history-v1',

    // 每一題隨機顯示的小圖示，可自由增減。
    questionEmojis: ['🐱', '🐶', '🍎', '🌈', '⭐', '📚', '🦁', '🐰', '🍌', '🌸'],

    // 答對時的獎勵：每一輪 10 組都會出現一次，再重新洗牌。
    //   image：圖片檔案，放在 images 資料夾（SVG、PNG、JPG 都可以）
    //   alt  ：圖片說明，也是螢幕閱讀器會唸的文字
    //   notes：旋律的音符頻率（Hz），依序播放；例如 523.25 是高音 Do
    //   type ：音色，可用 'sine'（柔和）、'triangle'（明亮）、'square'、'sawtooth'
    // 新增一組：複製一行，改好圖片檔名與內容，並把圖片放進 images 資料夾。
    rewards: [
        //  1. 獎盃
        { image: 'images/reward-01.svg', alt: '微笑獎盃與彩色星星，答對了！', notes: [523.25, 659.25, 783.99, 1046.5], type: 'sine' },
        //  2. 小貓
        { image: 'images/reward-02.svg', alt: '小貓送你一顆星星，答對了！', notes: [659.25, 783.99, 987.77, 1318.51], type: 'triangle' },
        //  3. 火箭
        { image: 'images/reward-03.svg', alt: '小火箭飛向星空，答對了！', notes: [392, 523.25, 783.99, 1046.5], type: 'sine' },
        //  4. 彩虹
        { image: 'images/reward-04.svg', alt: '彩虹與微笑太陽，答對了！', notes: [523.25, 783.99, 659.25, 1046.5], type: 'triangle' },
        //  5. 小狗
        { image: 'images/reward-05.svg', alt: '小狗開心搖尾巴，答對了！', notes: [392, 493.88, 587.33, 783.99], type: 'triangle' },
        //  6. 熊貓
        { image: 'images/reward-06.svg', alt: '小熊貓為你加油，答對了！', notes: [523.25, 587.33, 783.99, 987.77], type: 'sine' },
        //  7. 兔子
        { image: 'images/reward-07.svg', alt: '小兔子開心微笑，答對了！', notes: [783.99, 659.25, 783.99, 1174.66], type: 'triangle' },
        //  8. 恐龍
        { image: 'images/reward-08.svg', alt: '小恐龍為你歡呼，答對了！', notes: [329.63, 392, 523.25, 659.25], type: 'triangle' },
        //  9. 鯨魚
        { image: 'images/reward-09.svg', alt: '小鯨魚噴出水花，答對了！', notes: [587.33, 739.99, 880, 1174.66], type: 'sine' },
        // 10. 星球
        { image: 'images/reward-10.svg', alt: '微笑星球送來祝福，答對了！', notes: [493.88, 659.25, 987.77, 1318.51], type: 'sine' },
    ]
};
