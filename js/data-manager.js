// Latince Ekinoks - Data Manager & Search Engine

const DataManager = (function () {
  const data = window.LATIN_CORE_DATA || [];

  // Helper to remove Latin macrons and Turkish accents for fuzzy search
  function normalizeText(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[āáàâä]/g, 'a')
      .replace(/[ēéèêë]/g, 'e')
      .replace(/[īíìîï]/g, 'i')
      .replace(/[ōóòôö]/g, 'o')
      .replace(/[ūúùûü]/g, 'u')
      .replace(/[ȳýỳŷÿ]/g, 'y')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .trim();
  }

  // Precompute normalized search strings for blazing fast live search
  data.forEach(item => {
    item._searchIndex = normalizeText(
      item.headword + ' ' +
      item.lemma + ' ' +
      item.def_tr + ' ' +
      item.def_en + ' ' +
      item.pos_tr + ' ' +
      item.pos_en + ' ' +
      item.cat_tr + ' ' +
      item.cat_en
    );
  });

  function matchesPos(item, targetPos) {
    if (!targetPos || targetPos === 'all') return true;

    // Direct exact match
    if (item.pos_tr === targetPos || item.pos_group === targetPos) return true;

    // Normalized comparison
    const normTarget = normalizeText(targetPos);
    const normGroup = normalizeText(item.pos_group || '');
    const normTr = normalizeText(item.pos_tr || '');
    const normEn = normalizeText(item.pos_en || '');

    if (normGroup === normTarget || normTr === normTarget) return true;
    if (normTr.startsWith(normTarget + ':') || normTr.startsWith(normTarget + ' ')) return true;

    // English category fallback
    if (normTarget === 'fiil' && normEn.startsWith('verb')) return true;
    if (normTarget === 'isim' && normEn.startsWith('noun')) return true;
    if (normTarget === 'sifat' && normEn.startsWith('adjective')) return true;
    if (normTarget === 'zarf' && normEn.startsWith('adverb')) return true;
    if (normTarget === 'edat' && normEn.startsWith('preposition')) return true;
    if (normTarget === 'baglac' && normEn.startsWith('conjunction')) return true;
    if (normTarget === 'zamir' && normEn.startsWith('pronoun')) return true;

    return false;
  }

  return {
    getAllWords() {
      return data;
    },

    getTotalCount() {
      return data.length;
    },

    getWordById(id) {
      return data.find(w => w.id === id);
    },

    getWordByRank(rank) {
      return data.find(w => w.rank === rank);
    },

    // 20 words per set (50 sets total)
    getWordsBySet(setNo) {
      return data.filter(w => w.set_no === setNo);
    },

    // First 400 words (Dr. Ekin Öyken's semester goal)
    getTermTargetWords() {
      return data.filter(w => w.is_term_target);
    },

    getStarredWords() {
      return data.filter(w => StorageManager.isStarred(w.id));
    },

    getRepeatWords() {
      return data.filter(w => StorageManager.isRepeat(w.id));
    },

    getLearnedWords() {
      return data.filter(w => StorageManager.isLearned(w.id));
    },

    // Unique parts of speech for dropdown
    getPartsOfSpeech() {
      const set = new Set();
      data.forEach(w => {
        if (w.pos_tr) set.add(w.pos_tr);
      });
      return Array.from(set).sort();
    },

    // Unique semantic groups for dropdown
    getSemanticGroups() {
      const set = new Set();
      data.forEach(w => {
        if (w.cat_tr) set.add(w.cat_tr);
      });
      return Array.from(set).sort();
    },

    // Comprehensive multi-criteria filter & sort
    filterWords(options = {}) {
      const {
        query = '',
        pos = 'all',
        category = 'all',
        setNo = 'all',
        targetOnly = false,
        starredOnly = false,
        repeatOnly = false,
        sortBy = 'rank-asc' // 'rank-asc', 'rank-desc', 'alpha-asc', 'alpha-desc'
      } = options;

      const normQuery = normalizeText(query);

      let results = data.filter(item => {
        // Query match
        if (normQuery && !item._searchIndex.includes(normQuery)) {
          return false;
        }

        // Part of Speech
        if (pos !== 'all' && !matchesPos(item, pos)) {
          return false;
        }

        // Semantic Category
        if (category !== 'all' && item.cat_tr !== category) {
          return false;
        }

        // Set number
        if (setNo !== 'all' && item.set_no !== parseInt(setNo, 10)) {
          return false;
        }

        // Semester target (first 400)
        if (targetOnly && !item.is_term_target) {
          return false;
        }

        // Starred
        if (starredOnly && !StorageManager.isStarred(item.id)) {
          return false;
        }

        // Repeat / Needs review
        if (repeatOnly && !StorageManager.isRepeat(item.id)) {
          return false;
        }

        return true;
      });

      // Sorting
      results.sort((a, b) => {
        if (sortBy === 'rank-asc') return a.rank - b.rank;
        if (sortBy === 'rank-desc') return b.rank - a.rank;
        if (sortBy === 'alpha-asc') return a.headword.localeCompare(b.headword);
        if (sortBy === 'alpha-desc') return b.headword.localeCompare(a.headword);
        return a.rank - b.rank;
      });

      return results;
    },

    // Calculate Semester Target Statistics
    getTargetStats() {
      const targetWords = this.getTermTargetWords();
      const targetCount = targetWords.length; // 400
      let learnedCount = 0;
      let repeatCount = 0;

      targetWords.forEach(w => {
        if (StorageManager.isLearned(w.id)) learnedCount++;
        if (StorageManager.isRepeat(w.id)) repeatCount++;
      });

      const percent = Math.round((learnedCount / targetCount) * 100);

      return {
        total: targetCount,
        learned: learnedCount,
        repeat: repeatCount,
        remaining: targetCount - learnedCount,
        percent: percent
      };
    },

    // Set statistics (for set badges: e.g. "8/20")
    getSetStats(setNo) {
      const setWords = this.getWordsBySet(setNo);
      let learned = 0;
      setWords.forEach(w => {
        if (StorageManager.isLearned(w.id)) learned++;
      });
      return {
        total: setWords.length,
        learned: learned,
        isCompleted: setWords.length > 0 && learned === setWords.length
      };
    }
  };
})();
