// Latince Ekinoks - Quiz / Sınav Modu Motoru

const QuizEngine = (function () {
  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let isAnswered = false;
  let currentSetKey = 1; // number 1-50, 'target400', or 'starred'
  let currentDirection = 'lat_to_tr'; // 'lat_to_tr', 'lat_to_en', 'mean_to_lat'
  let currentTitle = 'Set 1 Testi';
  let currentWords = [];

  function init() {
    populateSetDropdown();
    setupEventListeners();
  }

  function populateSetDropdown() {
    const select = document.getElementById('quizSetSelect');
    if (!select) return;

    select.innerHTML = `
      <optgroup label="🎯 Dönem Hedefi Setleri (1 - 20)">
        ${Array.from({ length: 20 }, (_, i) => {
          const s = i + 1;
          const start = (s - 1) * 20 + 1;
          const end = s * 20;
          return `<option value="${s}">Set ${s} (#${start} - #${end})</option>`;
        }).join('')}
      </optgroup>
      <optgroup label="İleri Düzey Setler (21 - 50)">
        ${Array.from({ length: 30 }, (_, i) => {
          const s = i + 21;
          const start = (s - 1) * 20 + 1;
          const end = Math.min(s * 20, 997);
          return `<option value="${s}">Set ${s} (#${start} - #${end})</option>`;
        }).join('')}
      </optgroup>
      <optgroup label="Özel Çalışma Modları">
        <option value="target400">🎯 İlk 400 Kelime (Rastgele 20 Kelime)</option>
        <option value="starred">⭐ Zorlandıklarım & Tekrar Kelimeleri</option>
      </optgroup>
    `;
  }

  function hasActiveQuiz() {
    return questions && questions.length > 0 && currentIndex < questions.length;
  }

  function startQuizForSet(setNo, direction) {
    const num = Number(setNo) || 1;
    currentSetKey = num;

    const setSelect = document.getElementById('quizSetSelect');
    if (setSelect) setSelect.value = String(num);

    if (direction) {
      currentDirection = direction;
      const dirSelect = document.getElementById('quizDirectionSelect');
      if (dirSelect) dirSelect.value = direction;
    }

    const words = DataManager.getWordsBySet(num);
    startQuizWithWords(words, `Set ${num} Testi`);
  }

  function startQuizForTarget400() {
    currentSetKey = 'target400';

    const setSelect = document.getElementById('quizSetSelect');
    if (setSelect) setSelect.value = 'target400';

    const allTarget = DataManager.getTermTargetWords();
    const sampled = [...allTarget].sort(() => 0.5 - Math.random()).slice(0, 20);
    startQuizWithWords(sampled, '🎯 İlk 400 Kelime Testi (20 Kelime)');
  }

  function startQuizForStarred() {
    currentSetKey = 'starred';

    const setSelect = document.getElementById('quizSetSelect');
    if (setSelect) setSelect.value = 'starred';

    const starred = DataManager.getStarredWords();
    const repeat = DataManager.getRepeatWords();
    const pool = [...new Map([...starred, ...repeat].map(w => [w.id, w])).values()];

    if (pool.length === 0) {
      const qArea = document.getElementById('quizQuestionArea');
      const rArea = document.getElementById('quizResultsArea');
      const eArea = document.getElementById('quizEmptyArea');
      if (qArea) qArea.style.display = 'none';
      if (rArea) rArea.style.display = 'none';
      if (eArea) eArea.style.display = 'block';
      questions = [];
      return;
    }

    const sampled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 20);
    startQuizWithWords(sampled, `⭐ Zorlandıklarım Testi (${sampled.length} Kelime)`);
  }

  function startQuizForCustom(words, title = 'Özel Test') {
    currentSetKey = 'custom';
    startQuizWithWords(words, title);
  }

  function restartCurrentQuiz() {
    if (currentSetKey === 'target400') {
      startQuizForTarget400();
    } else if (currentSetKey === 'starred') {
      startQuizForStarred();
    } else if (typeof currentSetKey === 'number' || !isNaN(Number(currentSetKey))) {
      startQuizForSet(Number(currentSetKey));
    } else {
      startQuizWithWords(currentWords, currentTitle);
    }
  }

  function startQuizWithWords(words, title) {
    if (!words || words.length === 0) {
      return;
    }

    currentWords = words;
    currentTitle = title;

    // Shuffle questions
    const shuffledWords = [...words].sort(() => 0.5 - Math.random());
    questions = shuffledWords.map(targetWord => generateQuestion(targetWord));

    currentIndex = 0;
    score = 0;
    isAnswered = false;

    // Reset visibility of areas
    const qArea = document.getElementById('quizQuestionArea');
    const rArea = document.getElementById('quizResultsArea');
    const eArea = document.getElementById('quizEmptyArea');
    if (qArea) qArea.style.display = 'block';
    if (rArea) rArea.style.display = 'none';
    if (eArea) eArea.style.display = 'none';

    const titleEl = document.getElementById('quizTitle');
    if (titleEl) titleEl.textContent = title;

    renderQuestion();
  }

  function generateQuestion(targetWord) {
    const allWords = DataManager.getAllWords();
    const dir = currentDirection || 'lat_to_tr';

    // Prioritize candidates with same pos_group for realistic distractors
    const samePos = allWords.filter(w => w.id !== targetWord.id && w.pos_group === targetWord.pos_group);
    const candidatePool = samePos.length >= 6 ? samePos : allWords.filter(w => w.id !== targetWord.id);
    const shuffledCandidates = [...candidatePool].sort(() => 0.5 - Math.random());

    let correctText = '';
    let promptHeadword = '';
    let promptGrammar = '';
    let typeLabel = '';
    let distractorProp = '';

    if (dir === 'lat_to_en') {
      typeLabel = 'Latince Sözcüğün İngilizce Karşılığını Seçin';
      promptHeadword = targetWord.headword;
      promptGrammar = `${targetWord.pos_en} • Rank: #${targetWord.rank}`;
      correctText = targetWord.def_en;
      distractorProp = 'def_en';
    } else if (dir === 'mean_to_lat') {
      typeLabel = 'Türkçe Anlamın Latince Karşılığını Seçin';
      promptHeadword = targetWord.def_tr;
      promptGrammar = `${targetWord.pos_tr} • Sıklık: #${targetWord.rank}`;
      correctText = targetWord.headword;
      distractorProp = 'headword';
    } else {
      // Default: lat_to_tr
      typeLabel = 'Latince Sözcüğün Türkçe Karşılığını Seçin';
      promptHeadword = targetWord.headword;
      promptGrammar = `${targetWord.pos_tr} • Sıklık: #${targetWord.rank}`;
      correctText = targetWord.def_tr;
      distractorProp = 'def_tr';
    }

    const distractors = [];
    for (const c of shuffledCandidates) {
      if (distractors.length >= 3) break;
      const textVal = c[distractorProp];
      if (!textVal) continue;
      if (textVal.trim() === correctText.trim()) continue;
      if (!distractors.some(d => d[distractorProp].trim() === textVal.trim())) {
        distractors.push(c);
      }
    }

    // Fallback if not enough distractors found from shuffled candidates
    if (distractors.length < 3) {
      for (const c of allWords) {
        if (distractors.length >= 3) break;
        if (c.id === targetWord.id) continue;
        const textVal = c[distractorProp];
        if (!textVal || textVal.trim() === correctText.trim()) continue;
        if (!distractors.some(d => d[distractorProp].trim() === textVal.trim())) {
          distractors.push(c);
        }
      }
    }

    // Options array (1 correct + 3 wrong)
    const options = [
      { text: correctText, isCorrect: true, word: targetWord },
      ...distractors.map(d => ({ text: d[distractorProp], isCorrect: false, word: d }))
    ].sort(() => 0.5 - Math.random());

    return {
      targetWord,
      typeLabel,
      promptHeadword,
      promptGrammar,
      correctText,
      options
    };
  }

  function renderQuestion() {
    isAnswered = false;
    const q = questions[currentIndex];
    const total = questions.length;

    // Badges & Counters
    const progressBadge = document.getElementById('quizProgressBadge');
    if (progressBadge) progressBadge.textContent = `Soru ${currentIndex + 1} / ${total}`;

    const scoreBadge = document.getElementById('quizScoreBadge');
    if (scoreBadge) scoreBadge.textContent = `Skor: ${score} Doğru`;

    // Question labels
    const typeEl = document.getElementById('quizQuestionType');
    if (typeEl) typeEl.textContent = q.typeLabel;

    const headwordEl = document.getElementById('quizHeadword');
    if (headwordEl) headwordEl.textContent = q.promptHeadword;

    const grammarEl = document.getElementById('quizGrammar');
    if (grammarEl) grammarEl.textContent = q.promptGrammar;

    // Options list
    const listEl = document.getElementById('quizOptionsList');
    if (listEl) {
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
    }

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
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            <strong>${question.targetWord.headword}</strong>: ${question.targetWord.def_tr}
            <em style="display:block; margin-top:2px;">(İng: "${question.targetWord.def_en}")</em>
          </span>
        `;
      }
      StorageManager.setLearned(question.targetWord.id, true);
    } else {
      selectedBtn.classList.add('wrong');
      // Highlight the correct one
      allButtons.forEach((btn, idx) => {
        if (question.options[idx].isCorrect) {
          btn.classList.add('correct');
        }
      });

      if (feedbackText) {
        feedbackText.innerHTML = `
          <strong style="color: var(--danger);">✗ Yanlış Seçenek</strong><br>
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            Doğru Cevap: <strong>${question.correctText}</strong><br>
            <strong>${question.targetWord.headword}</strong>: ${question.targetWord.def_tr} (İng: "${question.targetWord.def_en}")
          </span>
        `;
      }
      StorageManager.setRepeat(question.targetWord.id, true);
    }

    const scoreBadge = document.getElementById('quizScoreBadge');
    if (scoreBadge) scoreBadge.textContent = `Skor: ${score} Doğru`;

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
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;

    const qArea = document.getElementById('quizQuestionArea');
    const rArea = document.getElementById('quizResultsArea');
    const eArea = document.getElementById('quizEmptyArea');

    if (qArea) qArea.style.display = 'none';
    if (eArea) eArea.style.display = 'none';
    if (!rArea) return;

    rArea.style.display = 'block';

    let latinMotto = '';
    let mottoSub = '';
    if (pct >= 80) {
      latinMotto = 'Optime! Harika bir sonuç!';
      mottoSub = 'Bu kelimeleri çok iyi kavramış görünüyorsunuz.';
    } else if (pct >= 60) {
      latinMotto = 'Bene! Gayet başarılı bir çalışma!';
      mottoSub = 'Birkaç tekrar ile tam puan alabilirsiniz.';
    } else {
      latinMotto = 'Repetitio est mater studiorum!';
      mottoSub = 'Tekrar çalışmanın anasıdır. Kelime kartlarını gözden geçirip testi tekrar deneyin.';
    }

    const isNumericSet = typeof currentSetKey === 'number' || (!isNaN(Number(currentSetKey)) && Number(currentSetKey) >= 1 && Number(currentSetKey) <= 50);
    const nextSetNo = isNumericSet ? Number(currentSetKey) + 1 : null;

    rArea.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <div style="font-size: 3.2rem; margin-bottom: 0.5rem;">${pct >= 70 ? '🎉' : '📖'}</div>
        <h2 style="font-family: var(--font-serif); color: var(--primary); margin-bottom: 0.35rem;">${latinMotto}</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">${mottoSub}</p>
        
        <div style="display: inline-block; background-color: var(--bg-surface-soft); border: 2px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.25rem 2.5rem; margin-bottom: 1.5rem;">
          <div style="font-size: 2.8rem; font-weight: 800; color: ${pct >= 70 ? 'var(--success)' : 'var(--warning)'}; font-family: var(--font-serif);">${score} / ${total}</div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted);">%${pct} Başarı Oranı</div>
        </div>

        <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
          <button id="quizRetryBtn" class="btn-decision btn-know">↻ Bu Testi Tekrar Çöz</button>
          ${nextSetNo && nextSetNo <= 50 ? `<button id="quizNextSetBtn" class="btn-decision btn-repeat">Set ${nextSetNo} Testine Geç ➔</button>` : ''}
          ${isNumericSet ? `<button id="quizGoFlashcardBtn" class="btn-secondary-sm" style="padding: 0.65rem 1.15rem;">🗂️ Bu Setin Kartlarına Git</button>` : ''}
          <button id="quizGoGoalBtn" class="btn-secondary-sm" style="padding: 0.65rem 1.15rem;">🎯 Dönem Hedefine Dön</button>
        </div>
      </div>
    `;

    document.getElementById('quizRetryBtn')?.addEventListener('click', () => {
      restartCurrentQuiz();
    });

    document.getElementById('quizNextSetBtn')?.addEventListener('click', () => {
      if (nextSetNo && nextSetNo <= 50) {
        startQuizForSet(nextSetNo);
      }
    });

    document.getElementById('quizGoFlashcardBtn')?.addEventListener('click', () => {
      if (isNumericSet) {
        App.switchView('flashcard');
        FlashcardApp.loadSet(Number(currentSetKey));
      }
    });

    document.getElementById('quizGoGoalBtn')?.addEventListener('click', () => {
      App.switchView('goal');
    });
  }

  function setupEventListeners() {
    // Set Dropdown
    const setSelect = document.getElementById('quizSetSelect');
    if (setSelect) {
      setSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'target400') {
          startQuizForTarget400();
        } else if (val === 'starred') {
          startQuizForStarred();
        } else {
          startQuizForSet(Number(val));
        }
      });
    }

    // Direction Dropdown
    const dirSelect = document.getElementById('quizDirectionSelect');
    if (dirSelect) {
      dirSelect.addEventListener('change', (e) => {
        currentDirection = e.target.value;
        restartCurrentQuiz();
      });
    }

    // Restart Button
    document.getElementById('quizRestartBtn')?.addEventListener('click', () => {
      restartCurrentQuiz();
    });

    // Next Question Button
    document.getElementById('quizNextBtn')?.addEventListener('click', nextQuestion);

    // Empty state back button
    document.getElementById('quizEmptyBackBtn')?.addEventListener('click', () => {
      startQuizForSet(1);
    });

    // Keyboard Shortcuts for Quiz
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const quizView = document.getElementById('viewQuiz');
      if (!quizView || !quizView.classList.contains('active')) return;

      const rArea = document.getElementById('quizResultsArea');
      const isResultsVisible = rArea && rArea.style.display === 'block';

      if (isResultsVisible) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          restartCurrentQuiz();
        }
        return;
      }

      // If in active question
      if (!isAnswered) {
        const buttons = document.querySelectorAll('.quiz-option-btn');
        let selectedIdx = -1;
        if (e.code === 'KeyA' || e.code === 'Digit1') selectedIdx = 0;
        else if (e.code === 'KeyB' || e.code === 'Digit2') selectedIdx = 1;
        else if (e.code === 'KeyC' || e.code === 'Digit3') selectedIdx = 2;
        else if (e.code === 'KeyD' || e.code === 'Digit4') selectedIdx = 3;

        if (selectedIdx >= 0 && buttons[selectedIdx]) {
          e.preventDefault();
          buttons[selectedIdx].click();
        }
      } else {
        // Answered: Space or Enter moves to next question
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          nextQuestion();
        }
      }
    });
  }

  return {
    init,
    hasActiveQuiz,
    startQuizForSet,
    startQuizForTarget400,
    startQuizForStarred,
    startQuizForCustom,
    restartCurrentQuiz
  };
})();
