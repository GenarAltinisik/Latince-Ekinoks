// Latince Ekinoks - Flashcard System (3D Flip, Multi-Direction, Audio, Gestures)

const FlashcardApp = (function () {
  let deck = [];
  let currentIndex = 0;
  let isFlipped = false;
  let activeSetNo = 1;
  let direction = 'lat_to_mean'; // 'lat_to_mean' or 'mean_to_lat'

  // DOM Elements cache
  let containerEl, frontEl, backEl, stepBadgeEl, setProgressEl, setFillEl;

  function init() {
    direction = StorageManager.getCardDirection();
    activeSetNo = StorageManager.getActiveSet();

    containerEl = document.getElementById('flashcardContainer');
    frontEl = document.getElementById('cardFaceFront');
    backEl = document.getElementById('cardFaceBack');
    stepBadgeEl = document.getElementById('cardStepBadge');
    setProgressEl = document.getElementById('cardSetProgress');
    setFillEl = document.getElementById('cardSetFill');

    setupEventListeners();
    loadSet(activeSetNo);
  }

  function loadSet(setNo) {
    activeSetNo = setNo;
    StorageManager.setActiveSet(setNo);
    deck = DataManager.getWordsBySet(setNo);
    currentIndex = 0;
    isFlipped = false;
    renderCard();
    updateSetPillsUI();
  }

  function loadCustomDeck(words, title = 'Özel Deste') {
    if (!words || words.length === 0) {
      alert('Bu grupta henüz kelime bulunmuyor!');
      return;
    }
    deck = words;
    currentIndex = 0;
    isFlipped = false;
    renderCard();
    
    // Update header title if present
    const titleEl = document.getElementById('currentSetTitle');
    if (titleEl) titleEl.textContent = title;
  }

  function flipCard() {
    if (!containerEl) return;
    isFlipped = !isFlipped;
    if (isFlipped) {
      containerEl.classList.add('is-flipped');
    } else {
      containerEl.classList.remove('is-flipped');
    }
  }

  function renderCard() {
    if (!containerEl || deck.length === 0) return;

    // Reset flip state smoothly
    isFlipped = false;
    containerEl.classList.remove('is-flipped');

    const word = deck[currentIndex];
    const isLearned = StorageManager.isLearned(word.id);
    const isRepeat = StorageManager.isRepeat(word.id);
    const isStarred = StorageManager.isStarred(word.id);

    // Progress badge (e.g. 1 / 20)
    if (stepBadgeEl) {
      stepBadgeEl.textContent = `${currentIndex + 1} / ${deck.length} • Sıra #${word.rank}`;
    }

    // Set progress bar
    if (setFillEl) {
      const pct = Math.round(((currentIndex + 1) / deck.length) * 100);
      setFillEl.style.width = `${pct}%`;
    }

    // Star icon state
    const starBtn = document.getElementById('cardStarBtn');
    if (starBtn) {
      starBtn.classList.toggle('starred', isStarred);
      starBtn.innerHTML = isStarred ? '★' : '☆';
    }

    // Active status tag
    const statusTag = document.getElementById('cardStatusTag');
    if (statusTag) {
      if (isLearned) {
        statusTag.textContent = '✓ Öğrenildi';
        statusTag.className = 'tag-badge' + ' btn-know';
      } else if (isRepeat) {
        statusTag.textContent = '↻ Tekrar Edilmeli';
        statusTag.className = 'tag-badge' + ' btn-repeat';
      } else {
        statusTag.textContent = 'Yeni';
        statusTag.className = 'tag-badge';
      }
    }

    // Fill Front and Back according to Direction
    if (direction === 'lat_to_mean') {
      // Front: Latin Headword & Grammar Hint
      document.getElementById('frontHeadword').textContent = word.headword;
      document.getElementById('frontGrammar').textContent = `${word.pos_tr} • ${word.cat_tr}`;
      document.getElementById('frontPrompt').textContent = 'Anlamı görmek için dokun veya boşluğa bas ↻';

      // Back: Turkish & English Meanings + Logeion Link
      document.getElementById('backHeadword').textContent = word.headword;
      document.getElementById('backDefTr').textContent = word.def_tr || '-';
      document.getElementById('backDefEn').textContent = word.def_en || '-';
      document.getElementById('backGrammarFull').textContent = `${word.pos_tr} (${word.pos_en}) • Sıklık Sırası: #${word.rank}`;
      
      const logeionBtn = document.getElementById('cardLogeionBtn');
      if (logeionBtn) {
        logeionBtn.href = word.logeion_url;
      }
    } else {
      // Reverse: Front has Meaning, Back has Latin Headword
      const langMode = StorageManager.getLangMode();
      let primaryFront = word.def_tr;
      if (langMode === 'en') primaryFront = word.def_en;
      else if (langMode === 'both') primaryFront = `${word.def_tr} / ${word.def_en}`;

      document.getElementById('frontHeadword').textContent = primaryFront;
      document.getElementById('frontGrammar').textContent = `[İpucu: ${word.pos_tr}] • ${word.cat_tr}`;
      document.getElementById('frontPrompt').textContent = 'Latince karşılığını görmek için dokun ↻';

      // Back: Latin headword
      document.getElementById('backHeadword').textContent = word.headword;
      document.getElementById('backDefTr').textContent = word.def_tr;
      document.getElementById('backDefEn').textContent = word.def_en;
      document.getElementById('backGrammarFull').textContent = `${word.pos_tr} • Sıklık: #${word.rank}`;

      const logeionBtn = document.getElementById('cardLogeionBtn');
      if (logeionBtn) {
        logeionBtn.href = word.logeion_url;
      }
    }
  }

  function nextCard() {
    if (currentIndex < deck.length - 1) {
      currentIndex++;
      renderCard();
    } else {
      // Loop or finish
      currentIndex = 0;
      renderCard();
    }
  }

  function prevCard() {
    if (currentIndex > 0) {
      currentIndex--;
      renderCard();
    } else {
      currentIndex = deck.length - 1;
      renderCard();
    }
  }

  function markKnown() {
    if (deck.length === 0) return;
    const word = deck[currentIndex];
    StorageManager.setLearned(word.id, true);
    renderCard();
    updateSetPillsUI();
    if (window.App && App.syncWordLearnState) {
      App.syncWordLearnState(word.id, true);
    }
    // Advance to next card smoothly
    setTimeout(() => nextCard(), 200);
  }

  function markRepeat() {
    if (deck.length === 0) return;
    const word = deck[currentIndex];
    StorageManager.setRepeat(word.id, true);
    renderCard();
    updateSetPillsUI();
    if (window.App && App.syncWordLearnState) {
      App.syncWordLearnState(word.id, false);
    }
    // Advance to next card smoothly
    setTimeout(() => nextCard(), 200);
  }

  function toggleStarCurrent() {
    if (deck.length === 0) return;
    const word = deck[currentIndex];
    const newState = StorageManager.toggleStarred(word.id);
    renderCard();
    if (window.App && App.syncWordStarState) {
      App.syncWordStarState(word.id, newState);
    }
  }

  function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    currentIndex = 0;
    renderCard();
  }

  function setDirection(newDir) {
    direction = newDir;
    StorageManager.setCardDirection(newDir);
    renderCard();
  }

  // Web Speech API for Latin pronunciation
  function speakCurrentWord() {
    if (deck.length === 0) return;
    const word = deck[currentIndex];
    if (!('speechSynthesis' in window)) {
      alert('Tarayıcınız ses sentezini desteklemiyor.');
      return;
    }

    window.speechSynthesis.cancel();
    // Use the primary headword or lemma for pronunciation
    const textToSpeak = word.headword.split(' ')[0].replace(/[-]/g, '');
    const utter = new SpeechSynthesisUtterance(textToSpeak);
    
    // Prefer Latin or Italian voice for accurate classical phonology
    const voices = window.speechSynthesis.getVoices();
    const latVoice = voices.find(v => v.lang.startsWith('la')) ||
                     voices.find(v => v.lang.startsWith('it')) ||
                     voices.find(v => v.lang.startsWith('es'));
    if (latVoice) {
      utter.voice = latVoice;
    }
    utter.rate = 0.85; // Slightly slower for clear philological comprehension
    window.speechSynthesis.speak(utter);
  }

  function updateSetPillsUI() {
    const pills = document.querySelectorAll('.set-pill-btn');
    pills.forEach(pill => {
      const setNo = parseInt(pill.dataset.setNo, 10);
      pill.classList.toggle('active', setNo === activeSetNo);

      // Show set progress ratio
      const stats = DataManager.getSetStats(setNo);
      const progSpan = pill.querySelector('.set-pill-progress');
      if (progSpan) {
        progSpan.textContent = `${stats.learned}/${stats.total}`;
      }
      if (stats.isCompleted) {
        pill.classList.add('set-completed');
      }
    });

    const titleEl = document.getElementById('currentSetTitle');
    if (titleEl) {
      const startRank = (activeSetNo - 1) * 20 + 1;
      const endRank = Math.min(activeSetNo * 20, 997);
      titleEl.textContent = `Set ${activeSetNo} (Sıklık Sırası: #${startRank} - #${endRank})${activeSetNo <= 20 ? ' • 🎯 1. Dönem Hedefi' : ''}`;
    }
  }

  function setupEventListeners() {
    // Card Click Flip
    if (containerEl) {
      containerEl.addEventListener('click', (e) => {
        // Prevent flip if clicked on an anchor link or button inside card
        if (e.target.closest('a') || e.target.closest('button')) return;
        flipCard();
      });
    }

    // Buttons
    document.getElementById('cardPrevBtn')?.addEventListener('click', prevCard);
    document.getElementById('cardNextBtn')?.addEventListener('click', nextCard);
    document.getElementById('cardKnowBtn')?.addEventListener('click', markKnown);
    document.getElementById('cardRepeatBtn')?.addEventListener('click', markRepeat);
    document.getElementById('cardStarBtn')?.addEventListener('click', toggleStarCurrent);
    document.getElementById('cardAudioBtn')?.addEventListener('click', speakCurrentWord);
    document.getElementById('cardShuffleBtn')?.addEventListener('click', shuffleDeck);

    // Direction Toggle
    document.getElementById('dirLatToMean')?.addEventListener('click', () => {
      document.getElementById('dirLatToMean').classList.add('active');
      document.getElementById('dirMeanToLat').classList.remove('active');
      setDirection('lat_to_mean');
    });

    document.getElementById('dirMeanToLat')?.addEventListener('click', () => {
      document.getElementById('dirMeanToLat').classList.add('active');
      document.getElementById('dirLatToMean').classList.remove('active');
      setDirection('mean_to_lat');
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      // Only handle if flashcard view is active
      const flashcardView = document.getElementById('viewFlashcard');
      if (!flashcardView || !flashcardView.classList.contains('active')) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        flipCard();
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        nextCard();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        prevCard();
      } else if (e.code === 'Digit1' || e.code === 'KeyK') {
        e.preventDefault();
        markKnown();
      } else if (e.code === 'Digit2' || e.code === 'KeyR') {
        e.preventDefault();
        markRepeat();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        speakCurrentWord();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleStarCurrent();
      }
    });

    // Touch Swipe Gestures for Mobile
    let touchStartX = 0;
    let touchStartY = 0;

    if (containerEl) {
      containerEl.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      containerEl.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Horizontal swipe if horizontal distance > 50px and greater than vertical
        if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            // Swiped left: Next card
            nextCard();
          } else {
            // Swiped right: Prev card
            prevCard();
          }
        }
      }, { passive: true });
    }
  }

  return {
    init,
    loadSet,
    loadCustomDeck,
    flipCard,
    nextCard,
    prevCard,
    markKnown,
    markRepeat,
    shuffleDeck,
    getActiveSetNo: () => activeSetNo,
    getCurrentWordId: () => (deck[currentIndex] ? deck[currentIndex].id : null),
    updateSetPillsUI
  };
})();
