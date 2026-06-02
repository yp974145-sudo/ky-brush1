// ============================================================
// 考研刷题 - 题目搜索模块 v3
// ============================================================

const Search = {
  keyword: '',
  debounceTimer: null,
  debounceMs: 300,
  results: [],     // 匹配的 question id 数组
  inputEl: null,

  // ---- 初始化 ----
  init(inputId) {
    this.inputEl = document.getElementById(inputId);
    if (!this.inputEl) return;
    this.inputEl.addEventListener('input', () => this.onInput());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.clear(); }
    });
    // 清除按钮
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clear());
    }
  },

  // ---- 输入处理 ----
  onInput() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.keyword = this.inputEl.value.trim();
      this.updateUI();
      if (typeof applyFilter === 'function') applyFilter();
    }, this.debounceMs);
  },

  // ---- 搜索执行 ----
  execute(questions) {
    if (!this.keyword) {
      this.results = [];
      return questions; // 无关键词时返回全部
    }
    const kw = this.keyword.toLowerCase();
    this.results = [];
    return questions.filter(q => {
      if (this._match(q, kw)) {
        this.results.push(q.id);
        return true;
      }
      return false;
    });
  },

  // ---- 匹配逻辑 ----
  _match(q, kw) {
    // 题号
    if (q.id.toLowerCase().includes(kw)) return true;
    // 题干
    if (q.question.toLowerCase().includes(kw)) return true;
    // 选项
    if (q.options) {
      for (const opt of q.options) {
        if (opt.toLowerCase().includes(kw)) return true;
      }
    }
    // 解析
    if (q.analysis && q.analysis.toLowerCase().includes(kw)) return true;
    // 代码块
    if (q.code && q.code.toLowerCase().includes(kw)) return true;
    // 知识点
    if (typeof TOPICS !== 'undefined' && TOPICS[q.topic]) {
      if (TOPICS[q.topic].name.includes(kw)) return true;
      if (TOPICS[q.topic].desc.toLowerCase().includes(kw)) return true;
    }
    // 学科
    if (typeof SUBJECTS !== 'undefined' && SUBJECTS[q.subject]) {
      if (SUBJECTS[q.subject].name.includes(kw)) return true;
    }
    // 年份
    if (String(q.year).includes(kw)) return true;
    // 难度
    if (q.difficulty) {
      if (kw === '简单' && q.difficulty === 'easy') return true;
      if (kw === '中等' && q.difficulty === 'medium') return true;
      if (kw === '较难' || kw === '难' && q.difficulty === 'hard') return true;
    }
    return false;
  },

  // ---- 高亮 ----
  highlight(text) {
    if (!this.keyword || !text) return text;
    const escaped = this.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return String(text).replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  // ---- 当前搜索状态 ----
  getResultCount() {
    return this.results.length;
  },

  getKeyword() {
    return this.keyword;
  },

  isActive() {
    return this.keyword.length > 0;
  },

  // ---- 清除 ----
  clear() {
    this.keyword = '';
    if (this.inputEl) this.inputEl.value = '';
    this.results = [];
    this.updateUI();
    if (typeof applyFilter === 'function') applyFilter();
  },

  // ---- UI ----
  updateUI() {
    const countEl = document.getElementById('search-count');
    const clearBtn = document.getElementById('search-clear');
    if (countEl) {
      countEl.style.display = this.isActive() ? 'inline' : 'none';
      countEl.textContent = this.isActive() ? `找到 ${this.getResultCount()} 题` : '';
    }
    if (clearBtn) {
      clearBtn.style.display = this.isActive() ? 'flex' : 'none';
    }
  }
};

// 便捷函数：在 applyFilter 中调用
function applySearchFilter(questions) {
  return Search.execute(questions);
}
