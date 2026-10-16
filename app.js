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
        <div class="speech-content" id="speech-text-${topic.id}">${topic.fullSpeech}</div>
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
                <span class="outline-en">${topic.outline.hook}</span>
                <span class="outline-vi">${topic.outline.hookVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">2. State the Purpose (Nêu mục tiêu bài nói):</span>
                <span class="outline-en">${topic.outline.purpose}</span>
                <span class="outline-vi">${topic.outline.purposeVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">3. Build Credibility (Tạo uy tín cá nhân):</span>
                <span class="outline-en">${topic.outline.credibility}</span>
                <span class="outline-vi">${topic.outline.credibilityVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">4. Preview Main Points (Khái quát các điểm chính):</span>
                <span class="outline-en">${topic.outline.preview}</span>
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
                <span class="outline-en"><strong>Phân tích:</strong> ${topic.outline.bodyPoint1.detail}</span>
                <span class="outline-en"><strong>Dẫn chứng/Ví dụ:</strong> ${topic.outline.bodyPoint1.example}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">${topic.outline.bodyPoint2.heading}</span>
                <span class="outline-en"><strong>Phân tích:</strong> ${topic.outline.bodyPoint2.detail}</span>
                <span class="outline-en"><strong>Dẫn chứng/Ví dụ:</strong> ${topic.outline.bodyPoint2.example}</span>
              </li>
              ${topic.outline.bodyPoint3 ? `
              <li class="outline-item">
                <span class="outline-label">${topic.outline.bodyPoint3.heading}</span>
                <span class="outline-en"><strong>Phân tích:</strong> ${topic.outline.bodyPoint3.detail}</span>
                <span class="outline-en"><strong>Dẫn chứng/Ví dụ:</strong> ${topic.outline.bodyPoint3.example}</span>
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
                <span class="outline-en">${topic.outline.conclusionSummary}</span>
                <span class="outline-vi">${topic.outline.conclusionSummaryVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">2. Reinforce the Purpose (Khẳng định lại ý nghĩa bài nói):</span>
                <span class="outline-en">${topic.outline.conclusionReinforce}</span>
                <span class="outline-vi">${topic.outline.conclusionReinforceVi}</span>
              </li>
              <li class="outline-item">
                <span class="outline-label">3. Provide Closure (Kết thúc ấn tượng & Lời kêu gọi):</span>
                <span class="outline-en">${topic.outline.conclusionClosure}</span>
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
      let vocabCardsHtml = topic.vocabulary.map(v => `
        <div class="vocab-card">
          <div class="vocab-word">${v.word}</div>
          <div class="vocab-phonetics">${v.phonetics}</div>
          <div class="vocab-meaning">${v.meaning}</div>
        </div>
      `).join('');
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

      // Assemble details card
      body.appendChild(audioToolbar);
      body.appendChild(tabsNav);
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
  // Web Speech API: Text-to-Speech
  // =========================================================================
  function stopSpeech() {
    if (!synth) return;
    synth.cancel();

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

  function playSpeech(id) {
    if (!synth) {
      showToast('Trình duyệt của bạn không hỗ trợ tính năng Web Speech API.');
      return;
    }

    if (state.currentlyPlayingId === id && synth.speaking) {
      // Toggle pause/resume
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

    const utterance = new SpeechSynthesisUtterance(topic.fullSpeech);
    utterance.rate = state.speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    state.currentlyPlayingId = id;
    updateSpeechStatus(id, true, 'Đang đọc...');

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

  // Initial Render
  renderTopics(TOPICS_DATA);
  updateTimerDisplay();
  handleHashNavigation();

  window.addEventListener('hashchange', handleHashNavigation);
});
