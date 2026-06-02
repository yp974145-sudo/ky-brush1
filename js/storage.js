// ============================================================
// 考研刷题 - 统一存储层（多账户支持）v3
// ============================================================

const STORAGE_KEY = 'ky-brush';
const STORAGE_USER_KEY = 'ky-user';

const Storage = {
  _data: null,
  _currentUser: null,
  _listeners: {},

  init() {
    const raw = this._loadFromLS(STORAGE_KEY);
    // 兼容旧版数据
    if (raw && raw.userAnswers && !raw._accounts) {
      // 旧版单用户数据迁移
      this._data = { _currentUser: null, _accounts: { '__default__': raw } };
      this._currentUser = null;
      this._flush();
    } else {
      this._data = raw || { _currentUser: null, _accounts: {} };
    }
    // 恢复上次登录的用户
    const saved = this._loadFromLS(STORAGE_USER_KEY);
    if (saved && saved.nickname && this._data._accounts[saved.nickname]) {
      this.switchTo(saved.nickname);
    }
    return this._data;
  },

  // ---- 账户管理 ----
  switchTo(nickname) {
    if (!this._data._accounts[nickname]) {
      this._data._accounts[nickname] = this._newAccount();
    }
    this._currentUser = nickname;
    this._data._currentUser = nickname;
    this._flush();
  },

  createAccount(nickname) {
    if (this._data._accounts[nickname]) return false;
    this._data._accounts[nickname] = this._newAccount();
    this.switchTo(nickname);
    return true;
  },

  deleteAccount(nickname) {
    delete this._data._accounts[nickname];
    if (this._currentUser === nickname) {
      this._currentUser = null;
      this._data._currentUser = null;
    }
    this._flush();
  },

  listAccounts() {
    return Object.keys(this._data._accounts).map(name => ({
      name,
      submitted: Object.keys(this._data._accounts[name].submittedQuestions || {}).length,
      streak: this._data._accounts[name].checkin?.streak || 0
    }));
  },

  getCurrentUser() {
    return this._currentUser;
  },

  // ---- 通用读写 ----
  _acc() {
    if (!this._currentUser || !this._data._accounts[this._currentUser]) return null;
    return this._data._accounts[this._currentUser];
  },

  get(key) {
    const acc = this._acc();
    return acc ? acc[key] : this._data[key];
  },

  set(key, val) {
    const acc = this._acc();
    if (acc) acc[key] = val;
    else this._data[key] = val;
    this._flush();
    this._emit(key, val);
  },

  getAll() {
    const acc = this._acc();
    return acc ? { ...acc } : { ...this._data };
  },

  // ---- 题目快捷方法 ----
  getAnswer(qId)     { return this.get('userAnswers')[qId]; },
  setAnswer(qId, a)   { this.get('userAnswers')[qId] = a; this._flush(); },
  isSubmitted(qId)    { return !!this.get('submittedQuestions')[qId]; },
  markSubmitted(qId)  { this.get('submittedQuestions')[qId] = true; this._flush(); },
  isMarked(qId)       { return !!this.get('markedQuestions')[qId]; },
  toggleMarked(qId)   {
    const m = this.get('markedQuestions');
    m[qId] ? delete m[qId] : (m[qId] = true);
    this._flush();
    return m[qId];
  },
  isWrong(qId)        { return !!this.get('wrongBook')[qId]; },
  addWrong(qId)       { this.get('wrongBook')[qId] = true; this._flush(); },
  isFavorite(qId)     { return !!this.get('favorites')[qId]; },
  toggleFavorite(qId) {
    const f = this.get('favorites');
    f[qId] ? delete f[qId] : (f[qId] = true);
    this._flush();
    return f[qId];
  },
  setNote(qId, text)  { this.get('notes')[qId] = text; this._flush(); },
  getNote(qId)        { return this.get('notes')[qId] || ''; },

  getWrongIds()       { return Object.keys(this.get('wrongBook')); },
  getFavoriteIds()    { return Object.keys(this.get('favorites')); },
  getSubmittedIds()   { return Object.keys(this.get('submittedQuestions')); },

  // ---- 打卡 ----
  checkinToday() {
    const c = this.get('checkin');
    const today = new Date().toISOString().slice(0, 10);
    if (!c.records[today]) c.records[today] = { count: 0 };
    c.records[today].count++;
    this._calcStreak();
    this._flush();
    return c.records[today].count;
  },
  getCheckinRecords() { return this.get('checkin').records; },
  getStreak()         { return this.get('checkin').streak; },
  _calcStreak() {
    const c = this.get('checkin');
    let streak = 0; const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (c.records[key]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    c.streak = streak;
  },

  // ---- 考试记录（全局共享）----
  saveExam(record) {
    const exams = JSON.parse(localStorage.getItem('ky-exams') || '[]');
    record.id = Date.now(); record.date = new Date().toISOString();
    record.user = this._currentUser;
    exams.unshift(record);
    if (exams.length > 50) exams.length = 50;
    localStorage.setItem('ky-exams', JSON.stringify(exams));
  },
  getExams() {
    return JSON.parse(localStorage.getItem('ky-exams') || '[]');
  },

  // ---- 用户信息 ----
  getUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_USER_KEY)); } catch(e) { return null; }
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
      if (data._accounts) {
        for (const name of Object.keys(data._accounts)) {
          if (!this._data._accounts[name]) this._data._accounts[name] = data._accounts[name];
        }
      }
      this._flush();
      return true;
    } catch(e) { return false; }
  },

  // ---- 重置 ----
  reset() {
    if (this._currentUser) {
      this._data._accounts[this._currentUser] = this._newAccount();
    }
    this._flush();
  },

  // ---- 内部 ----
  _newAccount() {
    return {
      userAnswers: {}, markedQuestions: {}, submittedQuestions: {},
      wrongBook: {}, favorites: {}, notes: {},
      checkin: { records: {}, streak: 0 }
    };
  },
  _loadFromLS(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch(e) { return null; }
  },
  _flush() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  },
  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
  },
  _emit(key, val) {
    if (this._listeners[key]) this._listeners[key].forEach(fn => fn(val));
  }
};
