/**
 * Foundation of Public Speaking - 30 English Topics
 * Application Logic: Accordion, TTS, Timer, Search & Filter
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentCategory: 'all',
    searchQuery: '',
    currentlyPlayingId: null,
    speechRate: 1.0,
    theme: localStorage.getItem('tvu_theme') || 'light',
    timerInterval: null,
    timerTotalSeconds: 180,
    timerRemainingSeconds: 180,
    isTimerRunning: false,
    ai: {
      kokoroUrl: 'http://localhost:8880',
      ollamaUrl: 'http://localhost:11434',
      kokoroAvailable: false,
      ollamaAvailable: false,
      ollamaModel: 'gemma3:4b',
      selectedVoice: localStorage.getItem('tvu_kokoro_voice') || 'af_heart',
      audioCache: new Map(),
      currentAudio: null,
      currentAudioId: null,
      coachTopicId: 1,
      coachMode: 'exam_qa',
      autoSpeak: true,
      isRecording: false,
      recognition: null,
      chatMessages: [],
      isGenerating: false,
    },
    highlightedWords: new Set(JSON.parse(localStorage.getItem('tvu_highlighted_words') || '["plant-based", "environment", "sustainable"]')),
    penMode: false,
    currentSelectedWord: '',
  };

  // DOM Elements
  const topicsContainer = document.getElementById('topicsContainer');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const categoryFilter = document.getElementById('categoryFilter');
  const expandAllBtn = document.getElementById('expandAllBtn');
  const collapseAllBtn = document.getElementById('collapseAllBtn');
  const emptyState = document.getElementById('emptyState');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const openTimerBtn = document.getElementById('openTimerBtn');
  const closeTimerBtn = document.getElementById('closeTimerBtn');
  const timerModal = document.getElementById('timerModal');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerToggleBtn = document.getElementById('timerToggleBtn');
  const timerBtnText = document.getElementById('timerBtnText');
  const timerResetBtn = document.getElementById('timerResetBtn');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  // AI & Kokoro DOM Elements
  const openAiCoachBtn = document.getElementById('openAiCoachBtn');
  const hubOpenCoachBtn = document.getElementById('hubOpenCoachBtn');
  const closeAiCoachBtn = document.getElementById('closeAiCoachBtn');
  const aiCoachOverlay = document.getElementById('aiCoachOverlay');
  const statusKokoro = document.getElementById('statusKokoro');
  const stateKokoro = document.getElementById('stateKokoro');
  const statusOllama = document.getElementById('statusOllama');
  const stateOllama = document.getElementById('stateOllama');
  const headerAiBadge = document.getElementById('headerAiBadge');
  const kokoroVoiceSelect = document.getElementById('kokoroVoiceSelect');
  const testKokoroVoiceBtn = document.getElementById('testKokoroVoiceBtn');
  const coachTopicSelect = document.getElementById('coachTopicSelect');
  const coachModeSelect = document.getElementById('coachModeSelect');
  const autoSpeakCheckbox = document.getElementById('autoSpeakCheckbox');
  const coachChatStream = document.getElementById('coachChatStream');
  const coachInputText = document.getElementById('coachInputText');
  const coachSendBtn = document.getElementById('coachSendBtn');
  const coachMicBtn = document.getElementById('coachMicBtn');
  const coachMicTip = document.getElementById('coachMicTip');
  const coachAudioIndicator = document.getElementById('coachAudioIndicator');
  const coachAudioStatusText = document.getElementById('coachAudioStatusText');
  const stopCoachAudioBtn = document.getElementById('stopCoachAudioBtn');
  const coachModelBadge = document.getElementById('coachModelBadge');

  // Word Highlighting & Phonetic Popover DOM Elements
  const toggleHighlightPenBtn = document.getElementById('toggleHighlightPenBtn');
  const penModeIndicator = document.getElementById('penModeIndicator');
  const closePenModeBtn = document.getElementById('closePenModeBtn');
  const openWordBankBtn = document.getElementById('openWordBankBtn');
  const headerWordCount = document.getElementById('headerWordCount');
  const phoneticPopover = document.getElementById('phoneticPopover');
  const popoverWord = document.getElementById('popoverWord');
  const popoverIpa = document.getElementById('popoverIpa');
  const popoverMeaning = document.getElementById('popoverMeaning');
  const popoverMeaningRow = document.getElementById('popoverMeaningRow');
  const popoverSpeakBtn = document.getElementById('popoverSpeakBtn');
  const popoverSpeakLabel = document.getElementById('popoverSpeakLabel');
  const popoverUnmarkBtn = document.getElementById('popoverUnmarkBtn');
  const selectionActionPopover = document.getElementById('selectionActionPopover');
  const btnMarkSelectedWord = document.getElementById('btnMarkSelectedWord');
  const btnSpeakSelectedWord = document.getElementById('btnSpeakSelectedWord');
  const wordBankOverlay = document.getElementById('wordBankOverlay');
  const closeWordBankBtn = document.getElementById('closeWordBankBtn');
  const wordBankSearch = document.getElementById('wordBankSearch');
  const wordBankList = document.getElementById('wordBankList');
  const clearAllWordsBtn = document.getElementById('clearAllWordsBtn');
  const wordBankSub = document.getElementById('wordBankSub');

  // iPad & Mobile Touch Word Inspector Sheet Elements
  const touchWordSheet = document.getElementById('touchWordSheet');
  const touchSheetBackdrop = document.getElementById('touchSheetBackdrop');
  const touchSheetWord = document.getElementById('touchSheetWord');
  const touchSheetIpa = document.getElementById('touchSheetIpa');
  const touchSheetMeaning = document.getElementById('touchSheetMeaning');
  const touchSheetMeaningBox = document.getElementById('touchSheetMeaningBox');
  const touchSheetSpeakBtn = document.getElementById('touchSheetSpeakBtn');
  const touchSheetMarkBtn = document.getElementById('touchSheetMarkBtn');
  const touchMarkIcon = document.getElementById('touchMarkIcon');
  const touchMarkText = document.getElementById('touchMarkText');
  const closeTouchSheetBtn = document.getElementById('closeTouchSheetBtn');

  // Initialize Speech Synthesis
  const synth = window.speechSynthesis;
  let englishVoice = null;

  function loadVoices() {
    if (!synth) return;
    const voices = synth.getVoices();
    // Prefer Google US English, Samantha, Daniel, or any standard en-US/en-GB voice
    englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))) ||
                   voices.find(v => v.lang.startsWith('en')) || null;
  }

  if (synth) {
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }

  // =========================================================================
  // Theme Handling
  // =========================================================================
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tvu_theme', theme);
    if (theme === 'dark') {
      themeIconSun.style.display = 'none';
      themeIconMoon.style.display = 'block';
    } else {
      themeIconSun.style.display = 'block';
      themeIconMoon.style.display = 'none';
    }
  }

  applyTheme(state.theme);

  themeToggleBtn.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // =========================================================================
  // Render Topics
  // =========================================================================
  function getCategoryClass(cat) {
    if (cat.includes('Health')) return 'tag-health';
    if (cat.includes('Technology')) return 'tag-tech';
    if (cat.includes('Education')) return 'tag-edu';
    if (cat.includes('Communication')) return 'tag-comm';
    return 'tag-society';
  }

  function renderTopics(topicsToRender) {
    topicsContainer.innerHTML = '';

    if (topicsToRender.length === 0) {
      emptyState.classList.add('visible');
      return;
    }
    emptyState.classList.remove('visible');

    const fragment = document.createDocumentFragment();

    topicsToRender.forEach(topic => {
      const details = document.createElement('details');
      details.className = 'topic-item';
      details.id = `topic-${topic.id}`;
      details.setAttribute('data-category', topic.category);

      // Category CSS badge class
      const tagClass = getCategoryClass(topic.category);

      // Summary Header (The Click Trigger)
      const summary = document.createElement('summary');
      summary.className = 'topic-summary';
      summary.setAttribute('aria-label', `Mở bài thuyết trình Topic ${topic.id}: ${topic.title}`);

      summary.innerHTML = `
        <div class="summary-left">
          <div class="topic-badge" aria-hidden="true">${String(topic.id).padStart(2, '0')}</div>
          <div class="topic-titles">
            <div class="topic-meta-row">
              <span class="category-tag ${tagClass}">${topic.category}</span>
              <span class="meta-info-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${topic.duration}
              </span>
              <span class="meta-info-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                ${topic.wordCount} words
              </span>
            </div>
            <h2 class="topic-title-en">${topic.title}</h2>
            <div class="topic-title-vi">${topic.titleVi}</div>
          </div>
        </div>

        <div class="summary-right">
          <div class="chevron-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      `;

      // Expanded Content Panel
      const body = document.createElement('div');
      body.className = 'topic-body';

      // Audio & Utility Toolbar
      const audioToolbar = document.createElement('div');
      audioToolbar.className = 'audio-action-bar';
      audioToolbar.innerHTML = `
        <div class="audio-controls">
          <button class="btn-pill btn-primary btn-play-speech" data-id="${topic.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span class="play-btn-text">Nghe Phát Âm (Audio AI)</span>
          </button>
          <button class="btn-pill btn-stop-speech" data-id="${topic.id}" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"></rect>
            </svg>
            <span>Dừng</span>
          </button>
          <div class="audio-status">
            <span class="status-dot"></span>
            <span class="status-text">Sẵn sàng đọc</span>
          </div>
          <select class="speech-rate-select" data-id="${topic.id}" title="Tốc độ đọc">
            <option value="0.85">0.85x Chậm</option>
            <option value="1.0" selected>1.0x Chuẩn</option>
            <option value="1.15">1.15x Nhanh</option>
          </select>
        </div>

        <div class="utility-buttons">
          <button class="btn-pill btn-copy-speech" data-id="${topic.id}" title="Sao chép toàn bộ bài nói tiếng Anh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Sao chép bài</span>
          </button>
          <button class="btn-pill btn-print-topic" data-id="${topic.id}" title="In bài thuyết trình này">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>In / PDF</span>
          </button>
        </div>
      `;

      // Tabs Navigation
      const tabsNav = document.createElement('div');
      tabsNav.className = 'tabs-navigation';
      tabsNav.innerHTML = `
        <button class="tab-btn active" data-tab="speech" data-id="${topic.id}">
          🎙️ Bài Nói Hoàn Chỉnh
        </button>
        <button class="tab-btn" data-tab="outline" data-id="${topic.id}">
          📑 Dàn Ý Chuẩn TVU
        </button>
        <button class="tab-btn" data-tab="vietnamese" data-id="${topic.id}">
          🇻🇳 Bản Dịch Tiếng Việt
        </button>
        <button class="tab-btn" data-tab="vocab" data-id="${topic.id}">
          💡 Từ Vựng Ghi Điểm (${topic.vocabulary.length})
        </button>
        <button class="tab-btn" data-tab="tips" data-id="${topic.id}">
          🎯 Mẹo Luyện Thuyết Trình
        </button>
      `;

      // Tab Panels Container
      const panelsContainer = document.createElement('div');
      panelsContainer.className = 'tab-panels-wrapper';

      // 1. Full Speech Panel
      const speechPanel = document.createElement('div');
      speechPanel.className = 'tab-panel panel-speech active';
      speechPanel.innerHTML = `
        <div class="speech-content" id="speech-text-${topic.id}">${renderTextWithHighlights(topic.fullSpeech, true)}</div>
      `;

      // 2. Speaking Outline Panel
      const outlinePanel = document.createElement('div');
      outlinePanel.className = 'tab-panel panel-outline';
      outlinePanel.innerHTML = `
        <div class="outline-card">
          <!-- A. Introduction -->
          <div class="outline-section">
            <div class="outline-section-header">
              <span class="section-badge">Phần A</span>
              <span>A. Introduction (Mở bài - 4 bước chuẩn)</span>
            </div>
            <ul class="outline-list">
              <li class="outline-item">
                <span class="outline-label">1. Capture Audience's Attention (Hook - Thu hút người nghe):</span>
                <span class="outline-en">${renderTextWithHighlights(topic.outline.hook, false)}</span>
                <span class="outline-vi">${topic.outline.hookVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">2. State the Purpose (Nêu mục tiêu bài nói):</span>
                <span class="outline-en">${renderTextWithHighlights(topic.outline.purpose, false)}</span>
                <span class="outline-vi">${topic.outline.purposeVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">3. Build Credibility (Tạo uy tín cá nhân):</span>
                <span class="outline-en">${renderTextWithHighlights(topic.outline.credibility, false)}</span>
                <span class="outline-vi">${topic.outline.credibilityVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">4. Preview Main Points (Khái quát các điểm chính):</span>
                <span class="outline-en">${renderTextWithHighlights(topic.outline.preview, false)}</span>
                <span class="outline-vi">${topic.outline.previewVi}</span>
              </li>
            </ul>
          </div>

          <!-- B. Body -->
          <div class="outline-section">
            <div class="outline-section-header">
              <span class="section-badge" style="background: linear-gradient(135deg, #10b981, #059669);">Phần B</span>
              <span>B. Body (Thân bài - Các luận điểm & Dẫn chứng)</span>
            </div>
            <ul class="outline-list">
              <li class="outline-item">
                <span class="outline-label">${topic.outline.bodyPoint1.heading}</span>
                <span class="outline-en"><strong>Phân tích:</strong> ${renderTextWithHighlights(topic.outline.bodyPoint1.detail, false)}</span>
                <span class="outline-en"><strong>Dẫn chứng/Ví dụ:</strong> ${renderTextWithHighlights(topic.outline.bodyPoint1.example, false)}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">${topic.outline.bodyPoint2.heading}</span>
                <span class="outline-en"><strong>Phân tích:</strong> ${renderTextWithHighlights(topic.outline.bodyPoint2.detail, false)}</span>
                <span class="outline-en"><strong>Dẫn chứng/Ví dụ:</strong> ${renderTextWithHighlights(topic.outline.bodyPoint2.example, false)}</span>
              </li>
              ${topic.outline.bodyPoint3 ? `
              <li class="outline-item">
                <span class="outline-label">${topic.outline.bodyPoint3.heading}</span>
                <span class="outline-en"><strong>Phân tích:</strong> ${renderTextWithHighlights(topic.outline.bodyPoint3.detail, false)}</span>
                <span class="outline-en"><strong>Dẫn chứng/Ví dụ:</strong> ${renderTextWithHighlights(topic.outline.bodyPoint3.example, false)}</span>
              </li>` : ''}
            </ul>
          </div>

          <!-- C. Conclusion -->
          <div class="outline-section">
            <div class="outline-section-header">
              <span class="section-badge" style="background: linear-gradient(135deg, #f59e0b, #d97706);">Phần C</span>
              <span>C. Conclusion (Kết bài - 3 bước trọn vẹn)</span>
            </div>
            <ul class="outline-list">
              <li class="outline-item">
                <span class="outline-label">1. Summarize Main Points (Tóm tắt điểm chính):</span>
                <span class="outline-en">${renderTextWithHighlights(topic.outline.conclusionSummary, false)}</span>
                <span class="outline-vi">${topic.outline.conclusionSummaryVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">2. Reinforce the Purpose (Khẳng định lại ý nghĩa bài nói):</span>
                <span class="outline-en">${renderTextWithHighlights(topic.outline.conclusionReinforce, false)}</span>
                <span class="outline-vi">${topic.outline.conclusionReinforceVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">3. Provide Closure (Kết thúc ấn tượng & Lời kêu gọi):</span>
                <span class="outline-en">${renderTextWithHighlights(topic.outline.conclusionClosure, false)}</span>
                <span class="outline-vi">${topic.outline.conclusionClosureVi}</span>
              </li>
            </ul>
          </div>
        </div>
      `;

      // 3. Vietnamese Translation Panel
      const viPanel = document.createElement('div');
      viPanel.className = 'tab-panel panel-vietnamese';
      viPanel.innerHTML = `
        <div class="vi-content">${topic.speechVi}</div>
      `;

      // 4. Vocabulary Panel
      const vocabPanel = document.createElement('div');
      vocabPanel.className = 'tab-panel panel-vocab';
      let vocabCardsHtml = topic.vocabulary.map(v => {
        const isMarked = state.highlightedWords && state.highlightedWords.has(v.word.toLowerCase());
        return `
        <div class="vocab-card" data-word="${v.word.toLowerCase()}">
          <button class="btn-vocab-star ${isMarked ? 'marked' : ''}" data-word="${v.word.toLowerCase()}" title="${isMarked ? 'Đã đánh dấu chưa nhớ (Bấm để bỏ)' : 'Đánh dấu từ này là chưa nhớ'}">
            ${isMarked ? '⭐' : '☆'}
          </button>
          <div class="vocab-word">${v.word}</div>
          <div class="vocab-phonetics">${v.phonetics}</div>
          <div class="vocab-meaning">${v.meaning}</div>
        </div>
      `;
      }).join('');
      vocabPanel.innerHTML = `<div class="vocab-grid">${vocabCardsHtml}</div>`;

      // 5. Delivery Tips Panel
      const tipsPanel = document.createElement('div');
      tipsPanel.className = 'tab-panel panel-tips';
      tipsPanel.innerHTML = `
        <div class="delivery-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div>
            <strong>Gợi ý biểu cảm & Tông giọng khi thi:</strong>
            <p style="margin-top:0.35rem;">${topic.deliveryTips}</p>
          </div>
        </div>
      `;

      // Assemble tab panels
      panelsContainer.appendChild(speechPanel);
      panelsContainer.appendChild(outlinePanel);
      panelsContainer.appendChild(viPanel);
      panelsContainer.appendChild(vocabPanel);
      panelsContainer.appendChild(tipsPanel);

      // Sticky Header Container (Audio Toolbar & Tabs Navigation)
      const stickyHeader = document.createElement('div');
      stickyHeader.className = 'topic-sticky-header';
      stickyHeader.appendChild(audioToolbar);
      stickyHeader.appendChild(tabsNav);

      // Assemble details card
      body.appendChild(stickyHeader);
      body.appendChild(panelsContainer);

      details.appendChild(summary);
      details.appendChild(body);

      fragment.appendChild(details);
    });

    topicsContainer.appendChild(fragment);

    // Reattach Event Listeners for tabs & buttons
    attachCardListeners();
  }

  // =========================================================================
  // Card Interactivity: Tabs, Audio & Copy
  // =========================================================================
  function attachCardListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = btn.getAttribute('data-tab');
        const parentCard = btn.closest('.topic-item');

        parentCard.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        parentCard.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });

        const activePanel = parentCard.querySelector(`.panel-${targetTab}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });

    // Star button in vocabulary cards
    document.querySelectorAll('.btn-vocab-star').forEach(starBtn => {
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = starBtn.getAttribute('data-word');
        if (word) {
          toggleWordHighlight(word);
        }
      });
    });

    // Copy Speech Button
    document.querySelectorAll('.btn-copy-speech').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const topic = TOPICS_DATA.find(t => t.id === id);
        if (topic) {
          navigator.clipboard.writeText(topic.fullSpeech).then(() => {
            showToast(`Đã sao chép bài nói Topic ${id} vào bộ nhớ tạm!`);
          }).catch(() => {
            // Fallback
            const el = document.getElementById(`speech-text-${id}`);
            if (el) {
              const range = document.createRange();
              range.selectNodeContents(el);
              window.getSelection().removeAllRanges();
              window.getSelection().addRange(range);
              document.execCommand('copy');
              showToast(`Đã sao chép bài nói Topic ${id}!`);
            }
          });
        }
      });
    });

    // Print Button
    document.querySelectorAll('.btn-print-topic').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = document.getElementById(`topic-${id}`);
        if (item) {
          item.open = true;
          window.print();
        }
      });
    });

    // Speech Rate Change
    document.querySelectorAll('.speech-rate-select').forEach(select => {
      select.addEventListener('change', (e) => {
        state.speechRate = parseFloat(e.target.value);
        if (synth && synth.speaking) {
          const id = parseInt(select.getAttribute('data-id'), 10);
          playSpeech(id);
        }
      });
    });

    // Text-to-Speech Play / Pause
    document.querySelectorAll('.btn-play-speech').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        playSpeech(id);
      });
    });

    // Text-to-Speech Stop
    document.querySelectorAll('.btn-stop-speech').forEach(btn => {
      btn.addEventListener('click', () => {
        stopSpeech();
      });
    });
  }

  // =========================================================================
  // Audio Engine: Kokoro AI TTS (with Web Speech API Fallback)
  // =========================================================================
  function stopSpeech() {
    // 1. Stop HTML5 Kokoro Audio if playing
    if (state.ai.currentAudio) {
      state.ai.currentAudio.pause();
      state.ai.currentAudio.currentTime = 0;
      state.ai.currentAudio = null;
    }

    // 2. Stop Web Speech API
    if (synth && synth.speaking) {
      synth.cancel();
    }

    // 3. Stop Coach Audio UI
    if (coachAudioIndicator) {
      coachAudioIndicator.style.display = 'none';
    }

    if (state.currentlyPlayingId) {
      const card = document.getElementById(`topic-${state.currentlyPlayingId}`);
      if (card) {
        const playBtn = card.querySelector('.btn-play-speech');
        const stopBtn = card.querySelector('.btn-stop-speech');
        const statusDot = card.querySelector('.status-dot');
        const statusText = card.querySelector('.status-text');

        if (playBtn) playBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <span>Nghe Phát Âm (Audio AI)</span>
        `;
        if (stopBtn) stopBtn.style.display = 'none';
        if (statusDot) statusDot.classList.remove('playing');
        if (statusText) statusText.textContent = 'Đã dừng';
      }
      state.currentlyPlayingId = null;
    }
  }

  async function synthesizeKokoroAudio(text, voice = state.ai.selectedVoice, speed = state.speechRate) {
    const cleanText = text.trim();
    const cacheKey = `${voice}_${speed}_${cleanText}`;
    if (state.ai.audioCache.has(cacheKey)) {
      return state.ai.audioCache.get(cacheKey);
    }

    const response = await fetch(`${state.ai.kokoroUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: cleanText,
        voice: voice,
        speed: speed,
        lang: 'en-us'
      })
    });

    if (!response.ok) {
      throw new Error(`Kokoro error: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    state.ai.audioCache.set(cacheKey, audioUrl);
    return audioUrl;
  }

  async function playSpeech(id) {
    // If clicking same card while Audio is playing/paused
    if (state.currentlyPlayingId === id && state.ai.currentAudio) {
      if (state.ai.currentAudio.paused) {
        state.ai.currentAudio.play();
        updateSpeechStatus(id, true, `Đang đọc (${state.ai.currentAudioSource || 'AI'})...`);
      } else {
        state.ai.currentAudio.pause();
        updateSpeechStatus(id, false, 'Đang tạm dừng');
      }
      return;
    }

    // If clicking same card while Web Speech API is speaking
    if (state.currentlyPlayingId === id && synth && synth.speaking) {
      if (synth.paused) {
        synth.resume();
        updateSpeechStatus(id, true, 'Đang đọc...');
      } else {
        synth.pause();
        updateSpeechStatus(id, false, 'Đang tạm dừng');
      }
      return;
    }

    // Stop existing speech
    stopSpeech();

    const topic = TOPICS_DATA.find(t => t.id === id);
    if (!topic) return;

    state.currentlyPlayingId = id;

    // 1. Priority 1: Check if pre-rendered Kokoro MP3 file exists (zero latency)
    const preRecordedUrl = `audio/topic-${id}.mp3`;
    try {
      updateSpeechStatus(id, true, 'Đang tải âm thanh AI...');
      const checkRes = await fetch(preRecordedUrl, { method: 'HEAD' });
      if (checkRes.ok) {
        if (state.currentlyPlayingId !== id) return;

        const audio = new Audio(preRecordedUrl);
        audio.playbackRate = state.speechRate;
        state.ai.currentAudio = audio;
        state.ai.currentAudioSource = 'AI Đọc Sẵn Studio';

        audio.onended = () => {
          stopSpeech();
          updateSpeechStatus(id, false, 'Hoàn thành bài đọc');
        };

        audio.onerror = () => {
          playWithDynamicKokoro(topic, id);
        };

        await audio.play();
        updateSpeechStatus(id, true, 'Đang phát âm (AI Studio 24kHz)...');
        return;
      }
    } catch (e) {
      // Fall through to dynamic Kokoro if pre-rendered file is not accessible
    }

    // 2. Priority 2: Dynamic Kokoro synthesis on localhost
    playWithDynamicKokoro(topic, id);
  }

  async function playWithDynamicKokoro(topic, id) {
    if (state.ai.kokoroAvailable) {
      updateSpeechStatus(id, true, 'Đang tạo giọng Kokoro AI...');
      try {
        const audioUrl = await synthesizeKokoroAudio(topic.fullSpeech, state.ai.selectedVoice, state.speechRate);
        if (state.currentlyPlayingId !== id) return;

        const audio = new Audio(audioUrl);
        audio.playbackRate = state.speechRate;
        state.ai.currentAudio = audio;
        state.ai.currentAudioSource = `Kokoro (${state.ai.selectedVoice})`;

        audio.onended = () => {
          stopSpeech();
          updateSpeechStatus(id, false, 'Hoàn thành bài đọc');
        };

        audio.onerror = () => {
          fallbackWebSpeech(topic, id);
        };

        await audio.play();
        updateSpeechStatus(id, true, `Đang đọc (${state.ai.selectedVoice})...`);
      } catch (err) {
        console.warn('Kokoro TTS failed, falling back to Web Speech API:', err);
        fallbackWebSpeech(topic, id);
      }
    } else {
      fallbackWebSpeech(topic, id);
    }
  }

  function fallbackWebSpeech(topic, id) {
    if (!synth) {
      showToast('Trình duyệt không hỗ trợ phát âm.');
      stopSpeech();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(topic.fullSpeech);
    utterance.rate = state.speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    if (englishVoice) utterance.voice = englishVoice;

    state.currentlyPlayingId = id;
    updateSpeechStatus(id, true, 'Đang đọc (Web Speech)...');

    utterance.onend = () => {
      stopSpeech();
      updateSpeechStatus(id, false, 'Hoàn thành bài đọc');
    };

    utterance.onerror = () => {
      stopSpeech();
    };

    synth.speak(utterance);
  }

  function updateSpeechStatus(id, isPlaying, text) {
    const card = document.getElementById(`topic-${id}`);
    if (!card) return;

    const playBtn = card.querySelector('.btn-play-speech');
    const stopBtn = card.querySelector('.btn-stop-speech');
    const statusDot = card.querySelector('.status-dot');
    const statusText = card.querySelector('.status-text');

    if (isPlaying) {
      if (playBtn) playBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
        <span>Tạm dừng</span>
      `;
      if (stopBtn) stopBtn.style.display = 'inline-flex';
      if (statusDot) statusDot.classList.add('playing');
    } else {
      if (playBtn) playBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Tiếp tục nghe</span>
      `;
      if (statusDot) statusDot.classList.remove('playing');
    }

    if (statusText) statusText.textContent = text;
  }

  // =========================================================================
  // Filtering & Search
  // =========================================================================
  function filterAndRender() {
    const query = state.searchQuery.toLowerCase().trim();
    const cat = state.currentCategory;

    const filtered = TOPICS_DATA.filter(t => {
      // Category match
      const matchesCategory = (cat === 'all') || (t.category === cat);
      if (!matchesCategory) return false;

      // Query match
      if (!query) return true;

      const titleMatch = t.title.toLowerCase().includes(query);
      const titleViMatch = t.titleVi.toLowerCase().includes(query);
      const idMatch = `topic ${t.id}`.includes(query) || `${t.id}` === query;
      const speechMatch = t.fullSpeech.toLowerCase().includes(query);
      const vocabMatch = t.vocabulary.some(v => v.word.toLowerCase().includes(query) || v.meaning.toLowerCase().includes(query));

      return titleMatch || titleViMatch || idMatch || speechMatch || vocabMatch;
    });

    renderTopics(filtered);
  }

  // Search input event
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery.length > 0) {
      searchClearBtn.style.display = 'block';
    } else {
      searchClearBtn.style.display = 'none';
    }
    filterAndRender();
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClearBtn.style.display = 'none';
    filterAndRender();
    searchInput.focus();
  });

  // Category Filter buttons
  categoryFilter.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      categoryFilter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentCategory = btn.getAttribute('data-category');
      filterAndRender();
    });
  });

  // Expand All / Collapse All
  expandAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.topic-item').forEach(d => d.open = true);
  });

  collapseAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.topic-item').forEach(d => d.open = false);
  });

  // =========================================================================
  // Practice Speech Timer
  // =========================================================================
  function updateTimerDisplay() {
    const mins = Math.floor(state.timerRemainingSeconds / 60);
    const secs = state.timerRemainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function toggleTimer() {
    if (state.isTimerRunning) {
      // Pause
      clearInterval(state.timerInterval);
      state.isTimerRunning = false;
      timerBtnText.textContent = 'Tiếp tục';
      timerToggleBtn.classList.remove('btn-pause');
      timerToggleBtn.classList.add('btn-start');
    } else {
      // Start
      state.isTimerRunning = true;
      timerBtnText.textContent = 'Tạm dừng';
      timerToggleBtn.classList.remove('btn-start');
      timerToggleBtn.classList.add('btn-pause');

      state.timerInterval = setInterval(() => {
        if (state.timerRemainingSeconds > 0) {
          state.timerRemainingSeconds--;
          updateTimerDisplay();

          if (state.timerRemainingSeconds === 0) {
            clearInterval(state.timerInterval);
            state.isTimerRunning = false;
            timerBtnText.textContent = 'Bắt đầu';
            timerToggleBtn.classList.remove('btn-pause');
            timerToggleBtn.classList.add('btn-start');
            showToast('⏰ Hết giờ thuyết trình! Hãy tổng kết và nhận xét phần thể hiện.');
            timerDisplay.style.color = '#ef4444';
          }
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(state.timerInterval);
    state.isTimerRunning = false;
    state.timerRemainingSeconds = state.timerTotalSeconds;
    timerBtnText.textContent = 'Bắt đầu';
    timerToggleBtn.classList.remove('btn-pause');
    timerToggleBtn.classList.add('btn-start');
    timerDisplay.style.color = 'var(--accent-primary)';
    updateTimerDisplay();
  }

  openTimerBtn.addEventListener('click', () => {
    timerModal.classList.add('active');
  });

  closeTimerBtn.addEventListener('click', () => {
    timerModal.classList.remove('active');
  });

  timerToggleBtn.addEventListener('click', toggleTimer);
  timerResetBtn.addEventListener('click', resetTimer);

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const time = parseInt(btn.getAttribute('data-time'), 10);
      state.timerTotalSeconds = time;
      resetTimer();
    });
  });

  // =========================================================================
  // Toast Helper
  // =========================================================================
  let toastTimeout;
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // =========================================================================
  // =========================================================================
  // AI Services & Speaking Coach Management (Local LLM + Kokoro TTS)
  // =========================================================================
  async function initAiServices() {
    // 1. Check Kokoro TTS Status
    try {
      const kRes = await fetch(`${state.ai.kokoroUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (kRes.ok) {
        const kData = await kRes.json();
        state.ai.kokoroAvailable = true;
        if (statusKokoro) {
          statusKokoro.classList.add('online');
          statusKokoro.classList.remove('offline');
        }
        if (stateKokoro) stateKokoro.textContent = `Online (${kData.kokoro_voices_count || 54} giọng)`;
        console.log('✓ Kokoro TTS Connected:', kData);
      } else {
        throw new Error('Not OK');
      }
    } catch (e) {
      state.ai.kokoroAvailable = false;
      if (statusKokoro) {
        statusKokoro.classList.add('offline');
        statusKokoro.classList.remove('online');
      }
      if (stateKokoro) stateKokoro.textContent = 'Offline (Dùng Web Speech)';
    }

    // 2. Check Ollama Local LLM Status
    try {
      const oRes = await fetch(`${state.ai.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (oRes.ok) {
        const oData = await oRes.json();
        const models = oData.models || [];
        const hasGemma = models.find(m => m.name.includes('gemma3') || m.name.includes('gemma'));
        if (hasGemma) {
          state.ai.ollamaModel = hasGemma.name;
        } else if (models.length > 0) {
          state.ai.ollamaModel = models[0].name;
        }
        state.ai.ollamaAvailable = true;
        if (statusOllama) {
          statusOllama.classList.add('online');
          statusOllama.classList.remove('offline');
        }
        if (stateOllama) stateOllama.textContent = `Online (${state.ai.ollamaModel})`;
        if (coachModelBadge) coachModelBadge.textContent = state.ai.ollamaModel;
        if (headerAiBadge) headerAiBadge.textContent = 'Gemma 3';
        console.log('✓ Ollama Local LLM Connected:', state.ai.ollamaModel);
      } else {
        throw new Error('Not OK');
      }
    } catch (e) {
      state.ai.ollamaAvailable = false;
      if (statusOllama) {
        statusOllama.classList.add('offline');
        statusOllama.classList.remove('online');
      }
      if (stateOllama) stateOllama.textContent = 'Offline';
    }

    // 3. Voice Selector Change Handler
    if (kokoroVoiceSelect) {
      kokoroVoiceSelect.value = state.ai.selectedVoice;
      kokoroVoiceSelect.addEventListener('change', (e) => {
        state.ai.selectedVoice = e.target.value;
        localStorage.setItem('tvu_kokoro_voice', state.ai.selectedVoice);
        showToast(`Đã đổi giọng đọc sang: ${state.ai.selectedVoice}`);
      });
    }

    // 4. Test Voice Button
    if (testKokoroVoiceBtn) {
      testKokoroVoiceBtn.addEventListener('click', async () => {
        stopSpeech();
        const sampleText = "Hello! This is Kokoro AI text to speech. I will help you master English public speaking with natural pronunciation!";
        testKokoroVoiceBtn.disabled = true;
        testKokoroVoiceBtn.innerHTML = `<span>⏳ Đang tạo...</span>`;

        try {
          if (state.ai.kokoroAvailable) {
            const url = await synthesizeKokoroAudio(sampleText, state.ai.selectedVoice, 1.0);
            const audio = new Audio(url);
            state.ai.currentAudio = audio;
            audio.onended = () => {
              testKokoroVoiceBtn.disabled = false;
              testKokoroVoiceBtn.innerHTML = `<span>🔊 Thử giọng</span>`;
            };
            audio.onerror = () => {
              testKokoroVoiceBtn.disabled = false;
              testKokoroVoiceBtn.innerHTML = `<span>🔊 Thử giọng</span>`;
            };
            await audio.play();
          } else {
            showToast('Kokoro TTS hiện chưa kết nối. Đang thử bằng Web Speech API.');
            const u = new SpeechSynthesisUtterance(sampleText);
            u.lang = 'en-US';
            u.onend = () => {
              testKokoroVoiceBtn.disabled = false;
              testKokoroVoiceBtn.innerHTML = `<span>🔊 Thử giọng</span>`;
            };
            synth.speak(u);
          }
        } catch (err) {
          showToast('Lỗi phát âm: ' + err.message);
          testKokoroVoiceBtn.disabled = false;
          testKokoroVoiceBtn.innerHTML = `<span>🔊 Thử giọng</span>`;
        }
      });
    }
  }

  function initAiCoach() {
    // Populate Topic Selector in Coach
    if (coachTopicSelect) {
      coachTopicSelect.innerHTML = TOPICS_DATA.map(t =>
        `<option value="${t.id}">Topic ${t.id}: ${t.title.slice(0, 48)}...</option>`
      ).join('');

      coachTopicSelect.addEventListener('change', (e) => {
        state.ai.coachTopicId = parseInt(e.target.value, 10);
        resetCoachConversation();
      });
    }

    if (coachModeSelect) {
      coachModeSelect.addEventListener('change', (e) => {
        state.ai.coachMode = e.target.value;
        resetCoachConversation();
      });
    }

    if (autoSpeakCheckbox) {
      autoSpeakCheckbox.checked = state.ai.autoSpeak;
      autoSpeakCheckbox.addEventListener('change', (e) => {
        state.ai.autoSpeak = e.target.checked;
      });
    }

    // Open & Close Coach Modal Handlers
    const openModal = (topicId) => {
      if (topicId) {
        state.ai.coachTopicId = topicId;
        if (coachTopicSelect) coachTopicSelect.value = topicId;
      }
      if (aiCoachOverlay) {
        aiCoachOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
      if (state.ai.chatMessages.length === 0) {
        resetCoachConversation();
      }
      if (coachInputText) coachInputText.focus();
    };

    const closeModal = () => {
      if (aiCoachOverlay) {
        aiCoachOverlay.style.display = 'none';
        document.body.style.overflow = '';
      }
      stopSpeech();
      if (state.ai.isRecording && state.ai.recognition) {
        state.ai.recognition.stop();
      }
    };

    if (openAiCoachBtn) openAiCoachBtn.addEventListener('click', () => openModal(state.ai.coachTopicId));
    if (hubOpenCoachBtn) hubOpenCoachBtn.addEventListener('click', () => openModal(state.ai.coachTopicId));
    if (closeAiCoachBtn) closeAiCoachBtn.addEventListener('click', closeModal);

    if (aiCoachOverlay) {
      aiCoachOverlay.addEventListener('click', (e) => {
        if (e.target === aiCoachOverlay) closeModal();
      });
    }

    // Stop Coach Audio Button
    if (stopCoachAudioBtn) {
      stopCoachAudioBtn.addEventListener('click', () => {
        stopSpeech();
      });
    }

    // Quick Prompts Chips
    document.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt && coachInputText) {
          coachInputText.value = prompt;
          sendCoachMessage();
        }
      });
    });

    // Send Button & Textarea Enter Handler
    if (coachSendBtn) {
      coachSendBtn.addEventListener('click', sendCoachMessage);
    }

    if (coachInputText) {
      coachInputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendCoachMessage();
        }
      });
    }

    // Speech-to-Text Microphone
    initCoachSpeechRecognition();
  }

  function initCoachSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      if (coachMicTip) coachMicTip.textContent = '💡 Trình duyệt hiện tại chưa hỗ trợ Web Speech API recognition (Hãy dùng Chrome hoặc Edge để nói qua micro).';
      if (coachMicBtn) coachMicBtn.style.opacity = '0.5';
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        state.ai.isRecording = true;
        if (coachMicBtn) coachMicBtn.classList.add('recording');
        if (coachMicTip) coachMicTip.textContent = '🔴 Đang lắng nghe bạn nói tiếng Anh...';
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (coachInputText) coachInputText.value = transcript;
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        state.ai.isRecording = false;
        if (coachMicBtn) coachMicBtn.classList.remove('recording');
        if (coachMicTip) coachMicTip.textContent = '⚠️ Không nhận diện được hoặc mic chưa được cấp quyền.';
      };

      recognition.onend = () => {
        state.ai.isRecording = false;
        if (coachMicBtn) coachMicBtn.classList.remove('recording');
        if (coachMicTip) coachMicTip.textContent = '💡 Đã ghi nhận xong! Bạn có thể chỉnh sửa văn bản hoặc bấm "Gửi".';
      };

      state.ai.recognition = recognition;

      if (coachMicBtn) {
        coachMicBtn.addEventListener('click', () => {
          if (state.ai.isRecording) {
            recognition.stop();
          } else {
            stopSpeech();
            try {
              recognition.start();
            } catch (err) {
              console.warn(err);
            }
          }
        });
      }
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }
  }

  function resetCoachConversation() {
    state.ai.chatMessages = [];
    if (coachChatStream) coachChatStream.innerHTML = '';

    const topic = TOPICS_DATA.find(t => t.id === state.ai.coachTopicId) || TOPICS_DATA[0];
    let greetingText = '';

    if (state.ai.coachMode === 'exam_qa') {
      greetingText = `Hello! I am your Public Speaking Examiner for **Topic ${topic.id}: ${topic.title}**.\n\nLet's test your speaking confidence! Here is your warm-up question: **Why is this topic important, and what is your personal experience or hook to engage the audience?**`;
    } else if (state.ai.coachMode === 'feedback') {
      greetingText = `Welcome! I'm your Speaking Coach for **Topic ${topic.id}: ${topic.title}**.\n\nPlease speak or type any part of your speech (your Hook, Body Points, or Conclusion). I will analyze your vocabulary, grammar, and delivery!`;
    } else {
      greetingText = `Hi there! Let's have a friendly spoken conversation about **${topic.title}**. Feel free to share your thoughts, and don't worry about making mistakes!`;
    }

    appendCoachMessage('assistant', greetingText, true);
  }

  function appendCoachMessage(role, text, shouldSpeak = false) {
    state.ai.chatMessages.push({ role, content: text });

    if (!coachChatStream) return;

    const wrap = document.createElement('div');
    wrap.className = `chat-bubble-wrap ${role === 'assistant' ? 'tutor' : 'user'}`;

    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar';
    avatar.textContent = role === 'assistant' ? '🎓' : '👤';

    const content = document.createElement('div');
    content.className = 'bubble-content';

    // Simple markdown-to-html (bold & line breaks)
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    content.innerHTML = formatted;

    if (role === 'assistant') {
      const actions = document.createElement('div');
      actions.className = 'bubble-actions';

      const audioBtn = document.createElement('button');
      audioBtn.className = 'btn-bubble-audio';
      audioBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Nghe giọng Kokoro AI</span>
      `;

      audioBtn.addEventListener('click', () => {
        speakCoachText(text);
      });

      actions.appendChild(audioBtn);
      content.appendChild(actions);
    }

    wrap.appendChild(avatar);
    wrap.appendChild(content);
    coachChatStream.appendChild(wrap);

    // Auto-scroll
    coachChatStream.scrollTop = coachChatStream.scrollHeight;

    if (role === 'assistant' && shouldSpeak && state.ai.autoSpeak) {
      speakCoachText(text);
    }
  }

  async function speakCoachText(rawText) {
    stopSpeech();

    // Clean text of markdown asterisks and URLs for speech
    const cleanText = rawText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#+/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    if (!cleanText) return;

    if (coachAudioIndicator) {
      coachAudioIndicator.style.display = 'flex';
      if (coachAudioStatusText) coachAudioStatusText.textContent = `Kokoro AI (${state.ai.selectedVoice}) đang phát âm...`;
    }

    if (state.ai.kokoroAvailable) {
      try {
        const audioUrl = await synthesizeKokoroAudio(cleanText, state.ai.selectedVoice, 1.0);
        const audio = new Audio(audioUrl);
        state.ai.currentAudio = audio;

        audio.onended = () => {
          if (coachAudioIndicator) coachAudioIndicator.style.display = 'none';
        };

        audio.onerror = () => {
          if (coachAudioIndicator) coachAudioIndicator.style.display = 'none';
        };

        await audio.play();
      } catch (err) {
        console.warn('Kokoro audio failed:', err);
        if (coachAudioIndicator) coachAudioIndicator.style.display = 'none';
        if (synth) {
          const u = new SpeechSynthesisUtterance(cleanText);
          u.lang = 'en-US';
          synth.speak(u);
        }
      }
    } else if (synth) {
      const u = new SpeechSynthesisUtterance(cleanText);
      u.lang = 'en-US';
      if (englishVoice) u.voice = englishVoice;
      u.onend = () => {
        if (coachAudioIndicator) coachAudioIndicator.style.display = 'none';
      };
      synth.speak(u);
    }
  }

  async function sendCoachMessage() {
    if (!coachInputText || state.ai.isGenerating) return;

    const userText = coachInputText.value.trim();
    if (!userText) return;

    coachInputText.value = '';
    appendCoachMessage('user', userText, false);

    const topic = TOPICS_DATA.find(t => t.id === state.ai.coachTopicId) || TOPICS_DATA[0];

    // Build system prompt for Gemma 3
    const systemPrompt = `You are a supportive, high-energy English Speaking Coach at Tra Vinh University (TVU) helping a student with the course "Foundation of Public Speaking".
The current presentation topic is: Topic ${topic.id}: "${topic.title}".
Topic overview: ${topic.titleVi}.
Outline Hook: "${topic.outline.hook}"
Mode: ${state.ai.coachMode === 'exam_qa' ? 'Examiner Q&A (ask sharp, engaging follow-up questions to test public speaking depth)' : state.ai.coachMode === 'feedback' ? 'Speech Feedback (give constructive tips on pronunciation, formal phrasing, and delivery)' : 'Free Discussion'}.

CRITICAL RULES:
1. Always respond in natural, clear spoken English.
2. Keep responses brief: 2 to 3 sentences max! Never produce huge walls of text because your response will be read aloud immediately via text-to-speech.
3. If the student makes a grammatical or word-choice slip, gently point it out in 1 phrase, then encourage them.
4. Always conclude with a conversational, thought-provoking question to prompt them to speak again.`;

    // Show loading state
    state.ai.isGenerating = true;
    if (coachSendBtn) coachSendBtn.disabled = true;

    const loadingWrap = document.createElement('div');
    loadingWrap.className = 'chat-bubble-wrap tutor';
    loadingWrap.id = 'coachLoadingBubble';
    loadingWrap.innerHTML = `
      <div class="bubble-avatar">🎓</div>
      <div class="bubble-content" style="font-style: italic; color: var(--text-muted);">
        <span>Gemma 3 đang suy nghĩ câu trả lời...</span>
      </div>
    `;
    coachChatStream.appendChild(loadingWrap);
    coachChatStream.scrollTop = coachChatStream.scrollHeight;

    try {
      if (state.ai.ollamaAvailable) {
        // Prepare conversation messages (last 6 turns for context)
        const recentMessages = state.ai.chatMessages.slice(-6).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

        const payload = {
          model: state.ai.ollamaModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...recentMessages
          ],
          stream: false
        };

        const response = await fetch(`${state.ai.ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
        const data = await response.json();
        const replyText = data.message?.content || "That's a very interesting thought! Can you explain a little bit more with an example?";

        const loader = document.getElementById('coachLoadingBubble');
        if (loader) loader.remove();

        appendCoachMessage('assistant', replyText, true);
      } else {
        // Fallback simulated intelligent response if Ollama is temporarily offline
        await new Promise(r => setTimeout(r, 600));
        const loader = document.getElementById('coachLoadingBubble');
        if (loader) loader.remove();

        const fallbackReply = `Great point about "${topic.title}"! When speaking publicly, remember to pause after your key points to let the audience absorb your ideas. How would you conclude this thought powerfully?`;
        appendCoachMessage('assistant', fallbackReply, true);
      }
    } catch (err) {
      console.warn('Ollama request failed:', err);
      const loader = document.getElementById('coachLoadingBubble');
      if (loader) loader.remove();

      appendCoachMessage('assistant', `That was great speaking! How would you use a real-life example to make this point even more convincing to your classmates?`, true);
    } finally {
      state.ai.isGenerating = false;
      if (coachSendBtn) coachSendBtn.disabled = false;
    }
  }

  // =========================================================================
  // Word Highlighting & Phonetic Popover Engine
  // =========================================================================
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function renderTextWithHighlights(text, wrapParagraphs = true) {
    if (!text) return '';
    const highlightedSet = state.highlightedWords;

    // Tokenize paragraph: wrap each individual word in an accessible .speech-word target
    function tokenizeParagraph(paraText) {
      let safe = paraText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return safe.replace(/\b([a-zA-Z][a-zA-Z0-9'-]*)\b/g, (match) => {
        const clean = match.toLowerCase().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        if (!clean || clean.length < 2) return match;
        const isMarked = highlightedSet && highlightedSet.has(clean);
        return `<span class="speech-word${isMarked ? ' word-highlighted' : ''}" data-word="${clean}">${match}</span>`;
      });
    }

    if (!wrapParagraphs) {
      return tokenizeParagraph(text);
    }

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    return paragraphs.map(p => {
      return `<p class="speech-p">${tokenizeParagraph(p).replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  function getWordInfo(rawWord) {
    if (!rawWord) return null;
    const clean = rawWord.trim().toLowerCase().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (!clean) return null;

    if (typeof PHONETICS_DATA !== 'undefined' && PHONETICS_DATA) {
      if (PHONETICS_DATA[clean]) {
        return {
          word: clean,
          ipa: PHONETICS_DATA[clean].ipa || '',
          meaning: PHONETICS_DATA[clean].meaning || ''
        };
      }
      // Try root word / singular heuristics
      if (clean.endsWith('ies') && PHONETICS_DATA[clean.slice(0, -3) + 'y']) {
        const base = clean.slice(0, -3) + 'y';
        return { word: clean, ipa: PHONETICS_DATA[base].ipa, meaning: PHONETICS_DATA[base].meaning || '' };
      }
      if (clean.endsWith('s') && PHONETICS_DATA[clean.slice(0, -1)]) {
        const base = clean.slice(0, -1);
        return { word: clean, ipa: PHONETICS_DATA[base].ipa, meaning: PHONETICS_DATA[base].meaning || '' };
      }
      if (clean.endsWith('ed') && PHONETICS_DATA[clean.slice(0, -2)]) {
        const base = clean.slice(0, -2);
        return { word: clean, ipa: PHONETICS_DATA[base].ipa, meaning: PHONETICS_DATA[base].meaning || '' };
      }
      if (clean.endsWith('ing') && PHONETICS_DATA[clean.slice(0, -3)]) {
        const base = clean.slice(0, -3);
        return { word: clean, ipa: PHONETICS_DATA[base].ipa, meaning: PHONETICS_DATA[base].meaning || '' };
      }
    }

    return { word: clean, ipa: `/${clean}/`, meaning: '' };
  }

  function saveHighlightedWords() {
    localStorage.setItem('tvu_highlighted_words', JSON.stringify(Array.from(state.highlightedWords)));
    updateWordBankCount();
    refreshHighlightsInDom();
  }

  function updateWordBankCount() {
    const count = state.highlightedWords.size;
    if (headerWordCount) {
      headerWordCount.textContent = count;
      if (count > 0) {
        headerWordCount.classList.add('has-items');
      } else {
        headerWordCount.classList.remove('has-items');
      }
    }
    if (wordBankSub) {
      wordBankSub.textContent = `Bạn đang có ${count} từ vựng cần ôn luyện`;
    }
  }

  function toggleWordHighlight(rawWord, forceState) {
    if (!rawWord) return;
    const clean = rawWord.trim().toLowerCase().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (!clean) return;

    if (state.highlightedWords.has(clean) && forceState !== true) {
      state.highlightedWords.delete(clean);
      showToast(`Đã bỏ đánh dấu: "${clean}"`);
    } else {
      state.highlightedWords.add(clean);
      showToast(`Đã đánh dấu từ: "${clean}"`);
    }
    saveHighlightedWords();
  }

  function refreshHighlightsInDom() {
    // Refresh open topics
    document.querySelectorAll('.topic-item[open]').forEach(item => {
      const id = parseInt(item.id.replace('topic-', ''), 10);
      const topic = TOPICS_DATA.find(t => t.id === id);
      if (!topic) return;

      const speechEl = item.querySelector('.speech-content');
      if (speechEl) speechEl.innerHTML = renderTextWithHighlights(topic.fullSpeech, true);

      // Refresh all speech-word spans inside outline/other panels
      item.querySelectorAll('.speech-word').forEach(span => {
        const word = span.getAttribute('data-word');
        const isMarked = state.highlightedWords.has(word);
        span.classList.toggle('word-highlighted', isMarked);
      });

      // Refresh vocab card stars
      item.querySelectorAll('.btn-vocab-star').forEach(star => {
        const word = star.getAttribute('data-word');
        const isMarked = state.highlightedWords.has(word);
        star.textContent = isMarked ? '⭐' : '☆';
        star.classList.toggle('marked', isMarked);
        star.title = isMarked ? 'Đã đánh dấu chưa nhớ (Bấm để bỏ)' : 'Đánh dấu từ này là chưa nhớ';
      });
    });

    if (wordBankOverlay && wordBankOverlay.style.display !== 'none') {
      renderWordBankList(wordBankSearch ? wordBankSearch.value : '');
    }

    if (currentInspectWord && touchWordSheet && touchWordSheet.style.display !== 'none') {
      updateTouchSheetState(currentInspectWord);
    }
  }

  // iPad & Mobile Touch Word Inspector Logic
  let currentInspectWord = null;

  function showTouchWordSheet(rawWord) {
    const info = getWordInfo(rawWord);
    if (!info) return;

    currentInspectWord = info.word;

    if (touchSheetWord) touchSheetWord.textContent = info.word;
    if (touchSheetIpa) touchSheetIpa.textContent = info.ipa || `/${info.word}/`;

    if (touchSheetMeaningBox && touchSheetMeaning) {
      if (info.meaning) {
        touchSheetMeaning.textContent = info.meaning;
        touchSheetMeaningBox.style.display = 'flex';
      } else {
        touchSheetMeaningBox.style.display = 'none';
      }
    }

    updateTouchSheetState(info.word);

    if (touchWordSheet) {
      touchWordSheet.style.display = 'flex';
      void touchWordSheet.offsetHeight; // trigger reflow for smooth transition
      touchWordSheet.classList.add('active');
    }
  }

  function updateTouchSheetState(word) {
    if (!touchSheetMarkBtn) return;
    const isMarked = state.highlightedWords.has(word);
    touchSheetMarkBtn.classList.toggle('marked', isMarked);
    if (touchMarkIcon) touchMarkIcon.textContent = isMarked ? '✓' : '🖍️';
    if (touchMarkText) touchMarkText.textContent = isMarked ? 'Đã thuộc (Bỏ lưu)' : 'Đánh dấu chưa nhớ';
  }

  function hideTouchWordSheet() {
    if (touchWordSheet) {
      touchWordSheet.classList.remove('active');
      setTimeout(() => {
        if (!touchWordSheet.classList.contains('active')) {
          touchWordSheet.style.display = 'none';
        }
      }, 280);
    }
  }

  async function speakSingleWord(word) {
    if (!word) return;
    const clean = word.trim().toLowerCase();

    if (state.ai.kokoroAvailable) {
      try {
        const audioUrl = await synthesizeKokoroAudio(clean, state.ai.selectedVoice, 0.95);
        const audio = new Audio(audioUrl);
        state.ai.currentAudio = audio;
        await audio.play();
        return;
      } catch (err) {
        console.warn('Kokoro single word speech failed, using fallback:', err);
      }
    }

    if (synth) {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-US';
      u.rate = 0.9;
      if (englishVoice) u.voice = englishVoice;
      synth.speak(u);
    }
  }

  let popoverTimer = null;
  let currentHoverWord = null;

  function showPhoneticPopover(targetElem, rawWord) {
    clearTimeout(popoverTimer);
    const info = getWordInfo(rawWord);
    if (!info) return;

    currentHoverWord = info.word;

    if (popoverWord) popoverWord.textContent = info.word;
    if (popoverIpa) popoverIpa.textContent = info.ipa || `/${info.word}/`;

    if (popoverMeaningRow && popoverMeaning) {
      if (info.meaning) {
        popoverMeaning.textContent = info.meaning;
        popoverMeaningRow.style.display = 'flex';
      } else {
        popoverMeaningRow.style.display = 'none';
      }
    }

    if (phoneticPopover) {
      phoneticPopover.style.display = 'block';

      const rect = targetElem.getBoundingClientRect();
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const popoverRect = phoneticPopover.getBoundingClientRect();

      let top = rect.top + scrollTop - popoverRect.height - 10;
      let left = rect.left + scrollLeft + (rect.width / 2) - (popoverRect.width / 2);

      // Flip below if near top boundary
      if (rect.top - popoverRect.height < 15) {
        top = rect.bottom + scrollTop + 10;
      }

      // Horizontal boundaries
      if (left < 10) left = 10;
      if (left + popoverRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popoverRect.width - 10;
      }

      phoneticPopover.style.top = `${top}px`;
      phoneticPopover.style.left = `${left}px`;
    }
  }

  function hidePhoneticPopover(delay = 180) {
    clearTimeout(popoverTimer);
    popoverTimer = setTimeout(() => {
      if (phoneticPopover) phoneticPopover.style.display = 'none';
    }, delay);
  }

  function renderWordBankList(filterQuery = '') {
    if (!wordBankList) return;
    const q = filterQuery.toLowerCase().trim();
    const words = Array.from(state.highlightedWords).filter(w => !q || w.includes(q));

    if (words.length === 0) {
      wordBankList.innerHTML = `
        <div class="word-bank-empty">
          <div class="word-bank-empty-icon">📖</div>
          <h3>${q ? 'Không tìm thấy từ phù hợp' : 'Chưa có từ nào được đánh dấu'}</h3>
          <p>${q ? 'Thử tìm với từ khóa khác.' : 'Bật "Bút Dạ Quang" hoặc bôi đen từ trong bài đọc để đánh dấu các từ bạn chưa nhớ!'}</p>
        </div>
      `;
      return;
    }

    wordBankList.innerHTML = words.map(w => {
      const info = getWordInfo(w) || { word: w, ipa: '', meaning: '' };
      return `
        <div class="word-bank-item">
          <div class="word-item-info">
            <div class="word-item-top">
              <span class="word-item-title">${info.word}</span>
              ${info.ipa ? `<span class="word-item-ipa">${info.ipa}</span>` : ''}
            </div>
            ${info.meaning ? `<div class="word-item-meaning">🇻🇳 ${info.meaning}</div>` : ''}
          </div>
          <div class="word-item-actions">
            <button class="btn-word-speak" data-word="${info.word}" title="Nghe phát âm">
              🔊 Đọc
            </button>
            <button class="btn-word-delete" data-word="${info.word}" title="Bỏ khỏi danh sách (Đã nhớ)">
              ✓ Đã thuộc
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    wordBankList.querySelectorAll('.btn-word-speak').forEach(btn => {
      btn.addEventListener('click', () => {
        speakSingleWord(btn.getAttribute('data-word'));
      });
    });

    wordBankList.querySelectorAll('.btn-word-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleWordHighlight(btn.getAttribute('data-word'), false);
      });
    });
  }

  function initHighlightSystem() {
    updateWordBankCount();

    // 1. Pen Mode Activation & Indicator Handling
    function setPenMode(active) {
      state.penMode = active;
      document.body.classList.toggle('pen-mode-active', state.penMode);
      if (toggleHighlightPenBtn) toggleHighlightPenBtn.classList.toggle('active', state.penMode);
      if (penModeIndicator) {
        penModeIndicator.style.display = state.penMode ? 'block' : 'none';
      }
      if (state.penMode) {
        hideTouchWordSheet();
        hidePhoneticPopover(0);
        showToast('🖍️ Chế độ Bút Dạ Quang: BẬT. Chạm vào bất kỳ từ nào để đánh dấu vàng!');
      } else {
        showToast('Đã tắt Chế độ Bút Dạ Quang.');
      }
    }

    if (toggleHighlightPenBtn) {
      toggleHighlightPenBtn.addEventListener('click', () => {
        setPenMode(!state.penMode);
      });
    }

    if (closePenModeBtn) {
      closePenModeBtn.addEventListener('click', () => {
        setPenMode(false);
      });
    }

    // 2. Desktop Mouse Hover over highlighted words
    document.addEventListener('mouseover', (e) => {
      // Don't show tooltip on touch devices
      if (window.matchMedia('(pointer: coarse)').matches) return;
      const mark = e.target.closest('.word-highlighted');
      if (mark) {
        const word = mark.getAttribute('data-word') || mark.textContent;
        showPhoneticPopover(mark, word);
        return;
      }
      if (e.target.closest('#phoneticPopover')) {
        clearTimeout(popoverTimer);
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('.word-highlighted') || e.target.closest('#phoneticPopover')) {
        hidePhoneticPopover(200);
      }
    });

    // 3. Desktop Popover Actions
    if (popoverSpeakBtn) {
      popoverSpeakBtn.addEventListener('click', () => {
        if (currentHoverWord) speakSingleWord(currentHoverWord);
      });
    }

    if (popoverUnmarkBtn) {
      popoverUnmarkBtn.addEventListener('click', () => {
        if (currentHoverWord) {
          toggleWordHighlight(currentHoverWord, false);
          hidePhoneticPopover(0);
        }
      });
    }

    // 4. iPad & Mobile Touch Word Sheet Actions
    if (touchSheetSpeakBtn) {
      touchSheetSpeakBtn.addEventListener('click', () => {
        if (currentInspectWord) speakSingleWord(currentInspectWord);
      });
    }

    if (touchSheetMarkBtn) {
      touchSheetMarkBtn.addEventListener('click', () => {
        if (currentInspectWord) {
          toggleWordHighlight(currentInspectWord);
          updateTouchSheetState(currentInspectWord);
        }
      });
    }

    if (closeTouchSheetBtn) {
      closeTouchSheetBtn.addEventListener('click', hideTouchWordSheet);
    }

    if (touchSheetBackdrop) {
      touchSheetBackdrop.addEventListener('click', hideTouchWordSheet);
    }

    // 5. Unified Word Tap & Click Engine (iPad / Touch + Desktop)
    document.addEventListener('click', (e) => {
      // Check if user tapped an English word
      const wordEl = e.target.closest('.speech-word');
      if (wordEl) {
        const word = wordEl.getAttribute('data-word');
        if (!word) return;

        // Visual feedback pulse
        wordEl.classList.remove('word-tap-pulse');
        void wordEl.offsetWidth; // trigger reflow
        wordEl.classList.add('word-tap-pulse');

        // If Pen mode is on -> 1-touch highlight!
        if (state.penMode) {
          toggleWordHighlight(word);
          return;
        }

        // Normal mode -> Show Word Inspector
        const isTouchOrTablet = window.matchMedia('(pointer: coarse)').matches ||
                                window.innerWidth <= 1024 ||
                                ('ontouchstart' in window);

        if (isTouchOrTablet) {
          showTouchWordSheet(word);
        } else {
          showPhoneticPopover(wordEl, word);
        }
        return;
      }

      // If clicked outside touch sheet, close it smoothly
      if (touchWordSheet && touchWordSheet.classList.contains('active')) {
        if (!e.target.closest('.touch-sheet-panel') && !e.target.closest('.speech-word')) {
          hideTouchWordSheet();
        }
      }
    });

    // 6. Text Selection Action Popover (for manual drag selection)
    document.addEventListener('mouseup', (e) => {
      // Don't trigger selection popover if tapping a word directly
      if (e.target.closest('.speech-word')) return;

      const sel = window.getSelection();
      const selText = sel ? sel.toString().trim() : '';
      if (!selText || selText.length < 2 || selText.length > 50) {
        if (!e.target.closest('#selectionActionPopover')) {
          if (selectionActionPopover) selectionActionPopover.style.display = 'none';
        }
        return;
      }

      const inSpeech = e.target.closest('.speech-content') || e.target.closest('.outline-en');
      if (!inSpeech) {
        if (selectionActionPopover) selectionActionPopover.style.display = 'none';
        return;
      }

      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        selectionActionPopover.style.display = 'flex';
        const popoverRect = selectionActionPopover.getBoundingClientRect();

        let top = rect.top + scrollTop - popoverRect.height - 8;
        let left = rect.left + scrollLeft + (rect.width / 2) - (popoverRect.width / 2);

        if (rect.top - popoverRect.height < 15) {
          top = rect.bottom + scrollTop + 8;
        }
        if (left < 10) left = 10;
        if (left + popoverRect.width > window.innerWidth - 10) {
          left = window.innerWidth - popoverRect.width - 10;
        }

        selectionActionPopover.style.top = `${top}px`;
        selectionActionPopover.style.left = `${left}px`;
        state.currentSelectedWord = selText;
      } catch (err) {}
    });

    if (btnMarkSelectedWord) {
      btnMarkSelectedWord.addEventListener('click', () => {
        if (state.currentSelectedWord) {
          toggleWordHighlight(state.currentSelectedWord, true);
          if (selectionActionPopover) selectionActionPopover.style.display = 'none';
          window.getSelection()?.removeAllRanges();
        }
      });
    }

    if (btnSpeakSelectedWord) {
      btnSpeakSelectedWord.addEventListener('click', () => {
        if (state.currentSelectedWord) {
          speakSingleWord(state.currentSelectedWord);
          if (selectionActionPopover) selectionActionPopover.style.display = 'none';
        }
      });
    }

    // 6. Word Bank Modal
    if (openWordBankBtn) {
      openWordBankBtn.addEventListener('click', () => {
        if (wordBankOverlay) {
          wordBankOverlay.style.display = 'flex';
          document.body.style.overflow = 'hidden';
          renderWordBankList(wordBankSearch ? wordBankSearch.value : '');
          if (wordBankSearch) wordBankSearch.focus();
        }
      });
    }

    if (closeWordBankBtn) {
      closeWordBankBtn.addEventListener('click', () => {
        if (wordBankOverlay) {
          wordBankOverlay.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }

    if (wordBankOverlay) {
      wordBankOverlay.addEventListener('click', (e) => {
        if (e.target === wordBankOverlay) {
          wordBankOverlay.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }

    if (wordBankSearch) {
      wordBankSearch.addEventListener('input', (e) => {
        renderWordBankList(e.target.value);
      });
    }

    if (clearAllWordsBtn) {
      clearAllWordsBtn.addEventListener('click', () => {
        if (state.highlightedWords.size === 0) return;
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách từ đã đánh dấu không?')) {
          state.highlightedWords.clear();
          saveHighlightedWords();
          showToast('Đã xóa toàn bộ danh sách từ chưa nhớ.');
        }
      });
    }
  }

  // Deep Link Handling (e.g. #topic-5)
  // =========================================================================
  function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#topic-')) {
      const target = document.querySelector(hash);
      if (target) {
        target.open = true;
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }

  // Initial Render & Setup
  renderTopics(TOPICS_DATA);
  updateTimerDisplay();
  handleHashNavigation();
  initAiServices();
  initAiCoach();
  initHighlightSystem();

  window.addEventListener('hashchange', handleHashNavigation);
});
