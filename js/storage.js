// Latince Ekinoks - LocalStorage State & Progress Manager

const StorageManager = (function () {
  const PREFIX = 'latince_ekinoks_';

  const KEYS = {
    LEARNED: PREFIX + 'learned_ids',
    REPEAT: PREFIX + 'repeat_ids',
    STARRED: PREFIX + 'starred_ids',
    LANG_MODE: PREFIX + 'lang_mode',
    THEME: PREFIX + 'theme',
    CARD_DIRECTION: PREFIX + 'card_direction',
    ACTIVE_SET: PREFIX + 'active_set',
    QUIZ_HISTORY: PREFIX + 'quiz_history'
  };

  function getSetFromStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.warn('LocalStorage parse error for key:', key, e);
      return new Set();
    }
  }

  function saveSetToStorage(key, setObj) {
    try {
      const arr = Array.from(setObj);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      console.warn('LocalStorage save error for key:', key, e);
    }
  }

  // In-memory cached sets
  let learnedSet = getSetFromStorage(KEYS.LEARNED);
  let repeatSet = getSetFromStorage(KEYS.REPEAT);
  let starredSet = getSetFromStorage(KEYS.STARRED);

  return {
    // Learned Words
    isLearned(id) {
      return learnedSet.has(id);
    },
    setLearned(id, isLearned) {
      if (isLearned) {
        learnedSet.add(id);
        repeatSet.delete(id); // If learned, remove from repeat
      } else {
        learnedSet.delete(id);
      }
      saveSetToStorage(KEYS.LEARNED, learnedSet);
      saveSetToStorage(KEYS.REPEAT, repeatSet);
    },
    toggleLearned(id) {
      const state = !this.isLearned(id);
      this.setLearned(id, state);
      return state;
    },
    getLearnedCount() {
      return learnedSet.size;
    },

    // Repeat / Review Words
    isRepeat(id) {
      return repeatSet.has(id);
    },
    setRepeat(id, isRepeat) {
      if (isRepeat) {
        repeatSet.add(id);
        learnedSet.delete(id);
      } else {
        repeatSet.delete(id);
      }
      saveSetToStorage(KEYS.REPEAT, repeatSet);
      saveSetToStorage(KEYS.LEARNED, learnedSet);
    },
    toggleRepeat(id) {
      const state = !this.isRepeat(id);
      this.setRepeat(id, state);
      return state;
    },
    getRepeatCount() {
      return repeatSet.size;
    },

    // Starred / Favorite Words
    isStarred(id) {
      return starredSet.has(id);
    },
    toggleStarred(id) {
      if (starredSet.has(id)) {
        starredSet.delete(id);
      } else {
        starredSet.add(id);
      }
      saveSetToStorage(KEYS.STARRED, starredSet);
      return starredSet.has(id);
    },
    getStarredCount() {
      return starredSet.size;
    },
    getStarredIds() {
      return Array.from(starredSet);
    },

    // Language Visibility Mode: 'tr' | 'en' | 'both'
    getLangMode() {
      return localStorage.getItem(KEYS.LANG_MODE) || 'both';
    },
    setLangMode(mode) {
      localStorage.setItem(KEYS.LANG_MODE, mode);
    },

    // Theme: 'parchment' | 'dark' | 'light'
    getTheme() {
      return localStorage.getItem(KEYS.THEME) || 'parchment';
    },
    setTheme(theme) {
      localStorage.setItem(KEYS.THEME, theme);
    },

    // Card Direction: 'lat_to_mean' | 'mean_to_lat'
    getCardDirection() {
      return localStorage.getItem(KEYS.CARD_DIRECTION) || 'lat_to_mean';
    },
    setCardDirection(dir) {
      localStorage.setItem(KEYS.CARD_DIRECTION, dir);
    },

    // Active Set (1..50)
    getActiveSet() {
      const val = parseInt(localStorage.getItem(KEYS.ACTIVE_SET), 10);
      return (val && val >= 1 && val <= 50) ? val : 1;
    },
    setActiveSet(setNo) {
      localStorage.setItem(KEYS.ACTIVE_SET, setNo);
    },

    // Reset progress
    resetAllProgress() {
      learnedSet.clear();
      repeatSet.clear();
      starredSet.clear();
      localStorage.removeItem(KEYS.LEARNED);
      localStorage.removeItem(KEYS.REPEAT);
      localStorage.removeItem(KEYS.STARRED);
    }
  };
})();
