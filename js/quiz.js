// Latince Ekinoks - Quiz / Sınav Modu Motoru

const QuizEngine = (function () {
  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let isAnswered = false;
  let currentSetNo = 1;

  function init() {
    setupEventListeners();
  }

  function startQuizForSet(setNo) {
    currentSetNo = setNo;
    const words = DataManager.getWordsBySet(setNo);
    startQuizWithWords(words, `Set ${setNo} Testi`);
  }

  function startQuizForCustom(words, title = 'Özel Test') {
    startQuizWithWords(words, title);
  }

  function startQuizWithWords(words, title) {
    if (!words || words.length === 0) {
      alert('Test oluşturulacak kelime bulunamadı.');
      return;
    }

    // Shuffle questions
    const shuffledWords = [...words].sort(() => 0.5 - Math.random());
    questions = shuffledWords.map(targetWord => generateQuestion(targetWord, words));

    currentIndex = 0;
    score = 0;
    isAnswered = false;

    const titleEl = document.getElementById('quizTitle');
    if (titleEl) titleEl.textContent = title;

    renderQuestion();
  }

  function generateQuestion(targetWord, pool) {
    // Generate 3 distractors from the pool or overall data
    const allWords = DataManager.getAllWords();
    const distractors = [];

    // First try to find distractors from same grammatical group
    const samePos = allWords.filter(w => w.id !== targetWord.id && w.pos_group === targetWord.pos_group);
    const candidatePool = samePos.length >= 3 ? samePos : allWords.filter(w => w.id !== targetWord.id);

    const shuffledCandidates = [...candidatePool].sort(() => 0.5 - Math.random());
    for (const c of shuffledCandidates) {
      if (distractors.length >= 3) break;
      if (!distractors.some(d => d.def_tr === c.def_tr)) {
        distractors.push(c);
      }
    }

    // Options array (1 correct + 3 wrong)
    const options = [
      { text: targetWord.def_tr, isCorrect: true, word: targetWord },
      ...distractors.map(d => ({ text: d.def_tr, isCorrect: false, word: d }))
    ].sort(() => 0.5 - Math.random());

    return {
      targetWord,
      options
    };
  }

  function renderQuestion() {
    isAnswered = false;
    const q = questions[currentIndex];
    const total = questions.length;

    // Badges & Counters
    document.getElementById('quizProgressBadge').textContent = `Soru ${currentIndex + 1} / ${total}`;
    document.getElementById('quizScoreBadge').textContent = `Skor: ${score} Doğru`;

    // Question content
    document.getElementById('quizHeadword').textContent = q.targetWord.headword;
    document.getElementById('quizGrammar').textContent = `${q.targetWord.pos_tr} • ${q.targetWord.cat_tr} • Sıklık: #${q.targetWord.rank}`;

    // Options list
    const listEl = document.getElementById('quizOptionsList');
    listEl.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.innerHTML = `
        <span class="option-prefix">${letters[idx]}</span>
        <span class="option-text">${opt.text}</span>
      `;

      btn.addEventListener('click', () => selectOption(btn, opt, q));
      listEl.appendChild(btn);
    });

    // Feedback box hide
    const feedbackBox = document.getElementById('quizFeedbackBox');
    if (feedbackBox) feedbackBox.style.display = 'none';
  }

  function selectOption(selectedBtn, option, question) {
    if (isAnswered) return;
    isAnswered = true;

    const allButtons = document.querySelectorAll('.quiz-option-btn');
    allButtons.forEach(btn => btn.disabled = true);

    const feedbackBox = document.getElementById('quizFeedbackBox');
    const feedbackText = document.getElementById('quizFeedbackText');

    if (option.isCorrect) {
      score++;
      selectedBtn.classList.add('correct');
      if (feedbackText) {
        feedbackText.innerHTML = `
          <strong style="color: var(--success);">✓ Harika, Doğru Cevap!</strong><br>
          <span style="font-size: 0.85rem; color: var(--text-muted);">İngilizce: "${question.targetWord.def_en}"</span>
        `;
      }
      StorageManager.setLearned(question.targetWord.id, true);
    } else {
      selectedBtn.classList.add('wrong');
      // Highlight correct one
      allButtons.forEach((btn, idx) => {
        if (question.options[idx].isCorrect) {
          btn.classList.add('correct');
        }
      });

      if (feedbackText) {
        feedbackText.innerHTML = `
          <strong style="color: var(--danger);">✗ Yanlış Seçenek</strong><br>
          <span style="font-size: 0.85rem; color: var(--text-muted);">Doğru Anlam: "${question.targetWord.def_tr}" (İng: "${question.targetWord.def_en}")</span>
        `;
      }
      StorageManager.setRepeat(question.targetWord.id, true);
    }

    document.getElementById('quizScoreBadge').textContent = `Skor: ${score} Doğru`;

    // Logeion helper button in feedback
    const logeionBtn = document.getElementById('quizLogeionBtn');
    if (logeionBtn) {
      logeionBtn.href = question.targetWord.logeion_url;
    }

    if (feedbackBox) feedbackBox.style.display = 'flex';
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      renderResults();
    }
  }

  function renderResults() {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);

    const container = document.getElementById('quizMainContent');
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">${pct >= 70 ? '🎉' : '📖'}</div>
        <h2 style="font-family: var(--font-serif); color: var(--primary); margin-bottom: 0.5rem;">Test Tamamlandı!</h2>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Sonucunuz ve başarı oranınız:</p>
        
        <div style="display: inline-block; background-color: var(--bg-surface-soft); border: 2px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem 2.5rem; margin-bottom: 1.5rem;">
          <div style="font-size: 2.8rem; font-weight: 800; color: ${pct >= 70 ? 'var(--success)' : 'var(--warning)'}; font-family: var(--font-serif);">${score} / ${total}</div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted);">%${pct} Başarı</div>
        </div>

        <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
          <button id="quizRetryBtn" class="btn-decision btn-know">↻ Testi Tekrar Çöz</button>
          <button id="quizGoFlashcardBtn" class="btn-decision btn-repeat">🗂️ Bu Setin Kartlarına Dön</button>
        </div>
      </div>
    `;

    document.getElementById('quizRetryBtn')?.addEventListener('click', () => {
      startQuizForSet(currentSetNo);
    });

    document.getElementById('quizGoFlashcardBtn')?.addEventListener('click', () => {
      App.switchView('flashcard');
      FlashcardApp.loadSet(currentSetNo);
    });
  }

  function setupEventListeners() {
    document.getElementById('quizNextBtn')?.addEventListener('click', nextQuestion);
  }

  return {
    init,
    startQuizForSet,
    startQuizForCustom
  };
})();
