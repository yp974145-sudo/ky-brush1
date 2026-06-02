// ============================================================
// 考研刷题 - 统一存储层 v3
// ============================================================

const STORAGE_KEY = 'ky-brush';
const STORAGE_USER_KEY = 'ky-user';
const STORAGE_EXAM_KEY = 'ky-exams';

const Storage = {
  _data: null,
  _listeners: {},

  // ---- 初始化 ----
  init() {
    this._data = this._loadFromLS(STORAGE_KEY) || {};
    // 确保子对象存在
    if (!this._data.userAnswers) this._data.userAnswers = {};
    if (!this._data.markedQuestions) this._data.markedQuestions = {};
    if (!this._data.submittedQuestions) this._data.submittedQuestions = {};
    if (!this._data.wrongBook) this._data.wrongBook = {};
    if (!this._data.favorites) this._data.favorites = {};
    if (!this._data.notes) this._data.notes = {};
    if (!this._data.checkin) this._data.checkin = { records: {}, streak: 0 };
    return this._data;
  },

  // ---- 通用读写 ----
  get(key) {
    return this._data[key];
  },

  set(key, val) {
    this._data[key] = val;
    this._flush();
    this._emit(key, val);
  },

  getAll() {
    return { ...this._data };
  },

  // ---- 题目相关快捷方法 ----
  getAnswer(qId)           { return this._data.userAnswers[qId]; },
  setAnswer(qId, answer)   { this._data.userAnswers[qId] = answer; this._flush(); },
  isSubmitted(qId)         { return !!this._data.submittedQuestions[qId]; },
  markSubmitted(qId)       { this._data.submittedQuestions[qId] = true; this._flush(); },
  isMarked(qId)            { return !!this._data.markedQuestions[qId]; },
  toggleMarked(qId) {
    if (this._data.markedQuestions[qId]) delete this._data.markedQuestions[qId];
    else this._data.markedQuestions[qId] = true;
    this._flush();
    return this._data.markedQuestions[qId];
  },
  isWrong(qId)             { return !!this._data.wrongBook[qId]; },
  addWrong(qId)            { this._data.wrongBook[qId] = true; this._flush(); },
  isFavorite(qId)          { return !!this._data.favorites[qId]; },
  toggleFavorite(qId) {
    if (this._data.favorites[qId]) delete this._data.favorites[qId];
    else this._data.favorites[qId] = true;
    this._flush();
    return this._data.favorites[qId];
  },
  setNote(qId, text)       { this._data.notes[qId] = text; this._flush(); },
  getNote(qId)             { return this._data.notes[qId] || ''; },

  getWrongIds()            { return Object.keys(this._data.wrongBook); },
  getFavoriteIds()         { return Object.keys(this._data.favorites); },
  getSubmittedIds()        { return Object.keys(this._data.submittedQuestions); },

  // ---- 打卡 ----
  checkinToday() {
    const today = new Date().toISOString().slice(0, 10);
    if (!this._data.checkin.records[today]) {
      this._data.checkin.records[today] = { count: 0 };
    }
    this._data.checkin.records[today].count++;
    // 计算连续天数
    this._calcStreak();
    this._flush();
    return this._data.checkin.records[today].count;
  },
  getCheckinRecords()      { return this._data.checkin.records; },
  getStreak()              { return this._data.checkin.streak; },
  _calcStreak() {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (this._data.checkin.records[key]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    this._data.checkin.streak = streak;
  },

  // ---- 考试记录 ----
  saveExam(record) {
    const exams = JSON.parse(localStorage.getItem(STORAGE_EXAM_KEY) || '[]');
    record.id = Date.now();
    record.date = new Date().toISOString();
    exams.unshift(record);
    if (exams.length > 50) exams.length = 50; // 保留最近50次
    localStorage.setItem(STORAGE_EXAM_KEY, JSON.stringify(exams));
    return record;
  },
  getExams() {
    return JSON.parse(localStorage.getItem(STORAGE_EXAM_KEY) || '[]');
  },

  // ---- 用户信息 ----
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER_KEY));
    } catch(e) { return null; }
  },
  setUser(user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  },
  clearUser() {
    localStorage.removeItem(STORAGE_USER_KEY);
  },

  // ---- 导出导入 ----
  exportData() {
    return JSON.stringify(this._data, null, 2);
  },
  importData(json) {
    try {
      const data = JSON.parse(json);
      // 合并到现有数据（不覆盖，只补充）
      for (const key of Object.keys(data)) {
        if (typeof data[key] === 'object' && !Array.isArray(data[key]) && this._data[key]) {
          Object.assign(this._data[key], data[key]);
        } else if (!this._data[key]) {
          this._data[key] = data[key];
        }
      }
      this._flush();
      return true;
    } catch(e) { return false; }
  },

  // ---- 重置 ----
  reset() {
    this._data = {
      userAnswers: {}, markedQuestions: {}, submittedQuestions: {},
      wrongBook: {}, favorites: {}, notes: {},
      checkin: { records: {}, streak: 0 }
    };
    this._flush();
  },

  // ---- 内部 ----
  _loadFromLS(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; }
  },
  _flush() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  },

  // ---- 简单事件（用于UI联动） ----
  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
  },
  _emit(key, val) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(fn => fn(val));
    }
  }
};
