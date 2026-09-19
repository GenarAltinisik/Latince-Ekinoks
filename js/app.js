// Latince Ekinoks - Main Application Controller

const App = (function () {
  let currentView = 'dictionary'; // 'dictionary', 'flashcard', 'goal', 'quiz', 'favorites', 'about'
  let activeLangMode = 'both'; // 'tr', 'en', 'both'
  let currentTheme = 'parchment'; // 'parchment', 'dark', 'light'

  // Pagination for dictionary view to ensure 60fps scrolling
  let renderedWordCount = 60;
  const WORDS_PER_PAGE = 60;
  let currentFilteredList = [];

  function init() {
    // Initialize storage settings
    activeLangMode = StorageManager.getLangMode();
    currentTheme = StorageManager.getTheme();

    applyTheme(currentTheme);
    applyLangMode(activeLangMode);

    // Initialize sub-modules
    FlashcardApp.init();
    QuizEngine.init();

    // Setup UI components
    buildSetButtons();
    populateFilterDropdowns();
    setupNavigation();
    setupFiltersAndSearch();
    setupModals();

    // Initial render
    renderDictionaryList();
    renderGoalDashboard();
  }

  // Dual Translation Visibility Mode
  function applyLangMode(mode) {
    activeLangMode = mode;
    StorageManager.setLangMode(mode);

    document.body.classList.remove('mode-tr', 'mode-en', 'mode-both');
    document.body.classList.add(`mode-${mode}`);

    // Update buttons in header
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Re-render flashcard if in reverse direction
    if (FlashcardApp) {
      // Re-trigger render
    }
  }

  // Theme Management
  function applyTheme(theme) {
    currentTheme = theme;
    StorageManager.setTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      if (theme === 'parchment') themeBtn.innerHTML = '📜';
      else if (theme === 'dark') themeBtn.innerHTML = '🌙';
      else themeBtn.innerHTML = '☀️';
    }
  }

  function cycleTheme() {
    if (currentTheme === 'parchment') applyTheme('dark');
    else if (currentTheme === 'dark') applyTheme('light');
    else applyTheme('parchment');
  }

  // View Switching
  function switchView(viewName) {
    currentView = viewName;

    // Update tab classes (Desktop & Mobile)
    document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
    });

    // Update view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`view${capitalize(viewName)}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Custom view hooks
    if (viewName === 'dictionary') {
      syncDictionaryCardsState();
    } else if (viewName === 'goal') {
      renderGoalDashboard();
    } else if (viewName === 'favorites') {
      renderFavoritesView();
    } else if (viewName === 'flashcard') {
      FlashcardApp.updateSetPillsUI();
    } else if (viewName === 'quiz') {
      if (!QuizEngine.hasActiveQuiz()) {
        const activeSet = FlashcardApp.getActiveSetNo() || StorageManager.getActiveSet() || 1;
        QuizEngine.startQuizForSet(activeSet);
      }
    }
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Build the 50 Set Buttons for Flashcard and Filter navigation
  function buildSetButtons() {
    const strip = document.getElementById('setsScrollStrip');
    if (!strip) return;

    strip.innerHTML = '';
    const activeSet = StorageManager.getActiveSet();

    for (let setNo = 1; setNo <= 50; setNo++) {
      const btn = document.createElement('button');
      btn.className = `set-pill-btn ${setNo === activeSet ? 'active' : ''} ${setNo <= 20 ? 'target-set' : ''}`;
      btn.dataset.setNo = setNo;
      
      const startRank = (setNo - 1) * 20 + 1;
      const endRank = Math.min(setNo * 20, 997);
      const stats = DataManager.getSetStats(setNo);

      btn.innerHTML = `
        <span>Set ${setNo}</span>
        <span class="set-pill-progress">${stats.learned}/${stats.total}</span>
      `;

      btn.addEventListener('click', () => {
        FlashcardApp.loadSet(setNo);
      });

      strip.appendChild(btn);
    }
  }

  // Populate POS and Category select dropdowns
  function populateFilterDropdowns() {
    const posSelect = document.getElementById('posFilterSelect');
    const catSelect = document.getElementById('catFilterSelect');

    if (posSelect) {
      posSelect.innerHTML = `
        <option value="all">- Tümü (Sözcük Türleri) -</option>
        <optgroup label="Temel Gruplar">
          <option value="Fiil">Fiiller (Tüm Çekimler)</option>
          <option value="İsim">İsimler (Tüm Çekimler)</option>
          <option value="Sıfat">Sıfatlar (Tüm Çekimler)</option>
          <option value="Zarf">Zarflar (Tümü)</option>
          <option value="Edat">Edatlar (Tümü)</option>
          <option value="Bağlaç">Bağlaçlar (Tümü)</option>
          <option value="Zamir">Zamirler (Tümü)</option>
        </optgroup>
      `;

      const detailedGroup = document.createElement('optgroup');
      detailedGroup.label = 'Ayrıntılı Çekim Grupları';

      const posList = DataManager.getPartsOfSpeech();
      posList.forEach(pos => {
        if (!['Edat', 'Bağlaç', 'Zarf', 'Zamir'].includes(pos)) {
          const opt = document.createElement('option');
          opt.value = pos;
          opt.textContent = pos;
          detailedGroup.appendChild(opt);
        }
      });
      posSelect.appendChild(detailedGroup);
    }

    if (catSelect) {
      const catList = DataManager.getSemanticGroups();
      catList.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
    }

    // Set select dropdown in dictionary filter
    const setSelect = document.getElementById('setFilterSelect');
    if (setSelect) {
      for (let s = 1; s <= 50; s++) {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = `Set ${s} (#${(s-1)*20+1} - #${Math.min(s*20, 997)})${s <= 20 ? ' 🎯' : ''}`;
        setSelect.appendChild(opt);
      }
    }
  }

  // Render Dictionary List with Pagination / Virtualization
  function renderDictionaryList(resetPagination = true) {
    if (resetPagination) {
      renderedWordCount = WORDS_PER_PAGE;
    }

    const query = document.getElementById('dictionarySearchInput')?.value || '';
    const pos = document.getElementById('posFilterSelect')?.value || 'all';
    const cat = document.getElementById('catFilterSelect')?.value || 'all';
    const setNo = document.getElementById('setFilterSelect')?.value || 'all';
    const sortBy = document.getElementById('sortBySelect')?.value || 'rank-asc';
    const targetOnly = document.getElementById('filterPillTarget')?.classList.contains('active') || false;

    currentFilteredList = DataManager.filterWords({
      query,
      pos,
      category: cat,
      setNo,
      targetOnly,
      sortBy
    });

    const grid = document.getElementById('wordsGrid');
    const countEl = document.getElementById('resultsCountBadge');
    if (countEl) {
      countEl.innerHTML = `Toplam <strong>${currentFilteredList.length}</strong> kelime gösteriliyor`;
    }

    if (!grid) return;

    if (currentFilteredList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3>Aramanızla eşleşen Latince kelime bulunamadı.</h3>
          <p style="font-size: 0.88rem; margin-top: 0.25rem;">Filtreleri sıfırlayarak tekrar deneyebilirsiniz.</p>
        </div>
      `;
      return;
    }

    const slice = currentFilteredList.slice(0, renderedWordCount);
    grid.innerHTML = slice.map(word => createWordCardHtml(word)).join('');

    // Attach card event listeners (Star, Logeion, Quick Quiz, etc.)
    attachWordCardEvents(grid);

    // Show "Load More" button if remaining
    let loadMoreBtn = document.getElementById('loadMoreWordsBtn');
    if (!loadMoreBtn) {
      loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'loadMoreWordsBtn';
      loadMoreBtn.className = 'btn-secondary-sm';
      loadMoreBtn.style.cssText = 'display: block; margin: 1.5rem auto; padding: 0.75rem 2rem; font-size: 0.9rem;';
      loadMoreBtn.textContent = 'Daha Fazla Kelime Yükle...';
      loadMoreBtn.addEventListener('click', () => {
        renderedWordCount += WORDS_PER_PAGE;
        renderDictionaryList(false);
      });
      grid.parentNode.appendChild(loadMoreBtn);
    }

    loadMoreBtn.style.display = renderedWordCount < currentFilteredList.length ? 'block' : 'none';
  }

  function createWordCardHtml(word) {
    const isLearned = StorageManager.isLearned(word.id);
    const isStarred = StorageManager.isStarred(word.id);

    return `
      <div class="word-card" data-id="${word.id}">
        <div class="word-card-top">
          <span class="word-rank-badge ${word.is_term_target ? 'target-badge' : ''}">
            #${word.rank} ${word.is_term_target ? '🎯 Hedef' : ''}
          </span>
          <div class="word-card-actions">
            <button class="btn-icon-sm btn-speak" title="Telaffuzu Dinle" data-text="${word.lemma}">🔊</button>
            <button class="btn-icon-sm btn-star ${isStarred ? 'starred' : ''}" title="Yıldızla / Zorlandıklarıma Ekle" data-id="${word.id}">
              ${isStarred ? '★' : '☆'}
            </button>
            <button class="btn-icon-sm btn-learn ${isLearned ? 'learned' : ''}" title="${isLearned ? 'Öğrenildi olarak işaretli' : 'Öğrenildi olarak işaretle'}" data-id="${word.id}">
              ${isLearned ? '✓' : '○'}
            </button>
          </div>
        </div>

        <div>
          <h3 class="word-headword">${word.headword}</h3>
          <div class="word-meta">
            <span class="tag-badge pos-tag">${word.pos_tr}</span>
            <span class="tag-badge">${word.cat_tr}</span>
            <span class="tag-badge">Set ${word.set_no}</span>
          </div>
        </div>

        <div class="word-translations">
          <div class="translation-box translation-tr">
            <span class="translation-header">🇹🇷 Türkçe</span>
            <div class="tr-text">${word.def_tr}</div>
          </div>
          <div class="translation-box translation-en">
            <span class="translation-header">🇬🇧 İngilizce</span>
            <div class="en-text">${word.def_en}</div>
          </div>
        </div>

        <div class="word-card-bottom">
          <a href="${word.logeion_url}" target="_blank" rel="noopener noreferrer" class="logeion-link-btn" title="Logeion Lewis & Short Sözlüğünde Aç">
            📖 Logeion Sözlük ↗
          </a>
          <span class="set-link-badge" data-set="${word.set_no}">
            Set ${word.set_no} Kartları ➔
          </span>
        </div>
      </div>
    `;
  }

  function syncWordStarState(wordId, isStarred) {
    document.querySelectorAll(`.btn-star[data-id="${wordId}"]`).forEach(btn => {
      btn.classList.toggle('starred', isStarred);
      btn.textContent = isStarred ? '★' : '☆';
    });

    const cardStarBtn = document.getElementById('cardStarBtn');
    if (cardStarBtn && FlashcardApp.getCurrentWordId && FlashcardApp.getCurrentWordId() === wordId) {
      cardStarBtn.classList.toggle('starred', isStarred);
      cardStarBtn.innerHTML = isStarred ? '★' : '☆';
    }

    updateFavoritesCountBadge();
  }

  function syncWordLearnState(wordId, isLearned) {
    document.querySelectorAll(`.btn-learn[data-id="${wordId}"]`).forEach(btn => {
      btn.classList.toggle('learned', isLearned);
      btn.textContent = isLearned ? '✓' : '○';
    });

    FlashcardApp.updateSetPillsUI();
    updateFavoritesCountBadge();
  }

  function syncDictionaryCardsState() {
    const cards = document.querySelectorAll('#wordsGrid .word-card');
    cards.forEach(card => {
      const id = parseInt(card.dataset.id, 10);
      const starBtn = card.querySelector('.btn-star');
      const learnBtn = card.querySelector('.btn-learn');

      if (starBtn) {
        const isStarred = StorageManager.isStarred(id);
        starBtn.classList.toggle('starred', isStarred);
        starBtn.textContent = isStarred ? '★' : '☆';
      }

      if (learnBtn) {
        const isLearned = StorageManager.isLearned(id);
        learnBtn.classList.toggle('learned', isLearned);
        learnBtn.textContent = isLearned ? '✓' : '○';
      }
    });
  }

  function updateFavoritesCountBadge() {
    const badge = document.getElementById('favoritesCountBadge');
    if (badge) {
      const starredCount = StorageManager.getStarredCount();
      const repeatCount = StorageManager.getRepeatCount();
      badge.textContent = `${starredCount} Yıldızlı • ${repeatCount} Tekrar Listesinde`;
    }
  }

  function attachWordCardEvents(container) {
    // Star toggle
    container.querySelectorAll('.btn-star').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const state = StorageManager.toggleStarred(id);
        syncWordStarState(id, state);
      });
    });

    // Learn toggle
    container.querySelectorAll('.btn-learn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id, 10);
        const state = StorageManager.toggleLearned(id);
        syncWordLearnState(id, state);
      });
    });

    // Audio speak
    container.querySelectorAll('.btn-speak').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.dataset.text;
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(text);
          utter.rate = 0.85;
          window.speechSynthesis.speak(utter);
        }
      });
    });

    // Jump to set flashcard
    container.querySelectorAll('.set-link-badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const setNo = parseInt(badge.dataset.set, 10);
        switchView('flashcard');
        FlashcardApp.loadSet(setNo);
      });
    });
  }

  // Semester Goal (İlk 400 Kelime) Dashboard
  function renderGoalDashboard() {
    const stats = DataManager.getTargetStats();

    const percentEl = document.getElementById('goalPercentNum');
    const fractionEl = document.getElementById('goalFractionText');
    const fillEl = document.getElementById('goalOverallFill');

    if (percentEl) percentEl.textContent = `%${stats.percent}`;
    if (fractionEl) fractionEl.textContent = `${stats.learned} / ${stats.total} Kelime`;
    if (fillEl) fillEl.style.width = `${stats.percent}%`;

    // Stats Grid Values
    document.getElementById('statTargetLearned')?.replaceChildren(document.createTextNode(stats.learned));
    document.getElementById('statTargetRemaining')?.replaceChildren(document.createTextNode(stats.remaining));
    document.getElementById('statTargetRepeat')?.replaceChildren(document.createTextNode(stats.repeat));

    // Daily pace recommendation
    const daysLeft = 90; // Typical semester remaining duration
    const pace = (stats.remaining / daysLeft).toFixed(1);
    const paceEl = document.getElementById('statDailyPace');
    if (paceEl) paceEl.textContent = `${pace} kelime/gün`;

    // Render Target Sets (Set 1 to 20)
    const targetSetsGrid = document.getElementById('goalSetsGrid');
    if (targetSetsGrid) {
      targetSetsGrid.innerHTML = '';
      for (let s = 1; s <= 20; s++) {
        const setStats = DataManager.getSetStats(s);
        const card = document.createElement('div');
        card.className = 'goal-stat-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <strong style="font-size: 0.88rem; color: var(--primary);">Set ${s} (#${(s-1)*20+1} - #${s*20})</strong>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${setStats.isCompleted ? 'var(--success)' : 'var(--text-muted)'};">
              ${setStats.learned} / ${setStats.total}
            </span>
          </div>
          <div class="set-progress-track">
            <div class="set-progress-fill" style="width: ${Math.round((setStats.learned/setStats.total)*100)}%;"></div>
          </div>
        `;
        card.addEventListener('click', () => {
          switchView('flashcard');
          FlashcardApp.loadSet(s);
        });
        targetSetsGrid.appendChild(card);
      }
    }
  }

  // Favorites / Difficult Words View
  function renderFavoritesView() {
    const starredWords = DataManager.getStarredWords();
    const repeatWords = DataManager.getRepeatWords();

    const grid = document.getElementById('favoritesGrid');
    const badge = document.getElementById('favoritesCountBadge');
    if (badge) {
      badge.textContent = `${starredWords.length} Yıldızlı • ${repeatWords.length} Tekrar Listesinde`;
    }

    if (!grid) return;

    const allDifficult = [...new Map([...starredWords, ...repeatWords].map(item => [item.id, item])).values()];

    if (allDifficult.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⭐</div>
          <h3>Henüz yıldızlanan veya tekrara atılan kelime yok.</h3>
          <p style="font-size: 0.88rem; margin-top: 0.25rem;">Çalışırken zorlandığınız kelimelerin yıldızına (★) dokunarak buraya toplayabilirsiniz.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = allDifficult.map(word => createWordCardHtml(word)).join('');
    attachWordCardEvents(grid);

    // Button to practice these directly in flashcard
    const practiceBtn = document.getElementById('practiceFavoritesBtn');
    if (practiceBtn) {
      practiceBtn.onclick = () => {
        switchView('flashcard');
        FlashcardApp.loadCustomDeck(allDifficult, '⭐ Zorlandıklarım & Favorilerim');
      };
    }
  }

  // Navigation Event Listeners
  function setupNavigation() {
    // Desktop Nav Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        switchView(tab.dataset.view);
      });
    });

    // Mobile Bottom Nav Items
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        switchView(item.dataset.view);
      });
    });

    // Brand click returns to dictionary
    document.getElementById('brandLogoLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('dictionary');
    });

    // Language mode buttons in header
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyLangMode(btn.dataset.mode);
      });
    });

    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', cycleTheme);

    // Course Banner Action Buttons
    document.getElementById('bannerGoGoalBtn')?.addEventListener('click', () => {
      switchView('goal');
    });

    document.getElementById('bannerAboutBtn')?.addEventListener('click', () => {
      openModal('aboutModal');
    });

    // Quiz Set Selector trigger
    document.getElementById('startQuizFromSetBtn')?.addEventListener('click', () => {
      const activeSet = FlashcardApp.getActiveSetNo();
      QuizEngine.startQuizForSet(activeSet);
      switchView('quiz');
    });
  }

  // Search & Filter event handlers
  function setupFiltersAndSearch() {
    const searchInput = document.getElementById('dictionarySearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (clearBtn) clearBtn.style.display = searchInput.value ? 'block' : 'none';
        renderDictionaryList(true);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        clearBtn.style.display = 'none';
        renderDictionaryList(true);
      });
    }

    const posSelect = document.getElementById('posFilterSelect');
    const catSelect = document.getElementById('catFilterSelect');
    const setSelect = document.getElementById('setFilterSelect');
    const sortSelect = document.getElementById('sortBySelect');

    posSelect?.addEventListener('change', () => {
      const val = posSelect.value;
      // Sync quick pills
      document.querySelectorAll('.pos-quick-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.pos === val);
      });
      renderDictionaryList(true);
    });

    catSelect?.addEventListener('change', () => renderDictionaryList(true));
    setSelect?.addEventListener('change', () => renderDictionaryList(true));
    sortSelect?.addEventListener('change', () => renderDictionaryList(true));

    // Target Filter Pill
    const targetPill = document.getElementById('filterPillTarget');
    if (targetPill) {
      targetPill.addEventListener('click', () => {
        targetPill.classList.toggle('active');
        renderDictionaryList(true);
      });
    }

    // Quick POS Filter Pills (Toggleable with .active state)
    document.querySelectorAll('.pos-quick-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const targetPos = pill.dataset.pos;
        const isAlreadyActive = pill.classList.contains('active');

        // Reset active on all pos pills
        document.querySelectorAll('.pos-quick-pill').forEach(p => p.classList.remove('active'));

        if (isAlreadyActive) {
          // Clicking again toggles off
          if (posSelect) posSelect.value = 'all';
        } else {
          // Activate this pill
          pill.classList.add('active');
          if (posSelect) posSelect.value = targetPos;
        }

        renderDictionaryList(true);
      });
    });

    // Reset Filters Button
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      if (posSelect) posSelect.value = 'all';
      if (catSelect) catSelect.value = 'all';
      if (setSelect) setSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'rank-asc';
      if (targetPill) targetPill.classList.remove('active');
      document.querySelectorAll('.pos-quick-pill').forEach(p => p.classList.remove('active'));
      renderDictionaryList(true);
    });
  }

  // Modal setup
  function setupModals() {
    document.querySelectorAll('.modal-close-btn, .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          closeAllModals();
        }
      });
    });
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  return {
    init,
    switchView,
    openModal,
    closeAllModals,
    renderDictionaryList,
    renderGoalDashboard,
    syncWordStarState,
    syncWordLearnState
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
