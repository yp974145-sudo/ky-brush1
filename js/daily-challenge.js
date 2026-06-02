// ============================================================
// 考研刷题 - 每日一题 v3
// ============================================================

const Daily = {
  _storageKey: 'ky-daily',
  _data: null,  // { date, qId, answered }

  init() {
    this._data = JSON.parse(localStorage.getItem(this._storageKey) || '{}');
    const today = this._today();
    if (this._data.date !== today) {
      // 新的一天，选新题
      this._data = { date: today, qId: this._pick(), answered: false };
      this._save();
    }
    this._render();
  },

  _today() {
    return new Date().toISOString().slice(0, 10);
  },

  // 基于日期的确定性随机选题
  _pick() {
    const bank = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);
    if (bank.length === 0) return null;
    const today = this._today();
    // 用日期字符串 hash 作为种子
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = ((hash << 5) - hash) + today.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % bank.length;
    return bank[idx].id;
  },

  getQuestion() {
    if (!this._data || !this._data.qId) return null;
    const bank = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);
    return bank.find(q => q.id === this._data.qId) || null;
  },

  isAnswered() {
    return this._data.answered;
  },

  markAnswered() {
    this._data.answered = true;
    this._save();
    this._render();
    // 打卡联动
    Storage.checkinToday();
    if (typeof updateAllStats === 'function') updateAllStats();
  },

  open() {
    const q = this.getQuestion();
    if (!q) return;
    // 筛选到这道题
    if (typeof currentFilter !== 'undefined') {
      currentFilter.subjects = [q.subject];
      currentFilter.topics = [];
      currentFilter.years = [];
      currentFilter.groups = [];
      if (typeof renderGroupFilters === 'function') renderGroupFilters();
      if (typeof renderSubjectFilters === 'function') renderSubjectFilters();
      if (typeof renderTopicFilters === 'function') renderTopicFilters();
      if (typeof renderYearFilters === 'function') renderYearFilters();
      if (typeof applyFilter === 'function') applyFilter();
    }
  },

  _render() {
    const el = document.getElementById('daily-card');
    if (!el) return;
    const q = this.getQuestion();
    if (!q) {
      el.innerHTML = '<div class="daily-empty">暂无题目</div>';
      return;
    }

    const subj = SUBJECTS[q.subject] || {};
    const topic = TOPICS[q.topic] || {};
    const diff = DIFFICULTY[q.difficulty] || DIFFICULTY.medium;
    const answered = this.isAnswered();

    el.innerHTML = `
      <div class="daily-header">
        <span class="daily-badge">📅 每日一题</span>
        <span class="daily-date">${this._today()}</span>
        ${answered ? '<span class="daily-done">✅ 已完成</span>' : ''}
      </div>
      <div class="daily-tags">
        <span class="tag" style="background:${subj.color}20;color:${subj.color}">${subj.icon} ${subj.name}</span>
        <span class="tag" style="background:${diff.bg};color:${diff.color}">⬤ ${diff.label}</span>
        ${topic.name ? `<span class="tag" style="background:#fff3e0;color:#e65100">📌 ${topic.name}</span>` : ''}
      </div>
      <div class="daily-question">${q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question}</div>
      ${!answered
        ? `<button class="btn btn-primary daily-btn" onclick="Daily.open()">📝 开始答题</button>`
        : `<button class="btn btn-outline daily-btn-done" onclick="Daily.open()">🔍 回顾题目</button>`
      }
    `;
  },

  _save() {
    localStorage.setItem(this._storageKey, JSON.stringify(this._data));
  }
};
