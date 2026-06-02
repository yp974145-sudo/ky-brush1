// ============================================================
// 考研刷题 - 模拟考试模块 v3
// ============================================================

const Exam = {
  state: 'idle',     // idle | config | running | review
  config: {
    subject: null,       // 单科代码 或 null=全部
    count: 20,           // 题目数量
    minutes: 45          // 时长（分钟）
  },
  questions: [],       // 本次考试的题目列表
  answers: {},         // 考试期间的答案 { qId: answer }
  marks: {},           // 考试期间的标记
  startTime: null,     // 开始时间戳
  endTime: null,       // 结束时间戳
  timerInterval: null,
  scoreData: null,     // 成绩计算结果

  // ---- 状态机入口 ----
  start() {
    if (!this._ensureDOM()) return;
    this.state = 'config';
    this._renderConfig();
    this._showExamPanel();
  },

  configure(subject, count, minutes) {
    this.config.subject = subject || null;
    this.config.count = count || 20;
    this.config.minutes = minutes || 45;
  },

  begin() {
    const { subject, count } = this.config;

    // 抽题
    const pool = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);
    let candidates = subject
      ? pool.filter(q => q.subject === subject)
      : [...pool];

    if (candidates.length === 0) {
      alert('该科目暂无题目');
      return;
    }
    if (candidates.length < count) {
      // 不够就全用
      this.config.count = candidates.length;
    }

    // 随机打乱取前 N
    this._shuffle(candidates);
    this.questions = candidates.slice(0, count);
    this.answers = {};
    this.marks = {};
    this.startTime = Date.now();
    this.endTime = this.startTime + this.config.minutes * 60 * 1000;
    this.state = 'running';

    this._renderRunning();
    this._startTimer();
    this._renderQuestion();
    this._renderExamSheet();
  },

  submit(isTimeout) {
    // 停计时器
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.state = 'review';
    this._calculateScore();
    this._renderReview();
  },

  exit() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.state = 'idle';
    this.questions = [];
    this.answers = {};
    this.marks = {};
    this.scoreData = null;
    const panel = document.getElementById('exam-panel');
    if (panel) panel.style.display = 'none';
    document.getElementById('content').style.display = '';
    document.getElementById('welcome').style.display = 'none';
    if (typeof applyFilter === 'function') applyFilter();
  },

  // ---- 考试过程中 ----
  answerQuestion(qId, answer) {
    this.answers[qId] = answer;
    this._updateExamSheet();
  },

  toggleExamMark(qId) {
    if (this.marks[qId]) delete this.marks[qId];
    else this.marks[qId] = true;
    this._updateExamSheet();
  },

  navigateTo(qId) {
    const idx = this.questions.findIndex(q => q.id === qId);
    if (idx >= 0) this._renderQuestion(idx);
  },

  getTimeLeft() {
    if (!this.endTime) return 0;
    return Math.max(0, Math.floor((this.endTime - Date.now()) / 1000));
  },

  isActive() {
    return this.state === 'running';
  },

  // ===================== 渲染层 =====================

  _ensureDOM() {
    if (document.getElementById('exam-panel')) return true;
    const html = `
    <div id="exam-panel" style="display:none;">
      <div id="exam-header">
        <div class="exam-h-left">
          <span class="exam-icon">⏱</span>
          <span class="exam-title">模拟考试</span>
          <span id="exam-progress" class="exam-progress"></span>
        </div>
        <div class="exam-h-right">
          <span id="exam-timer" class="exam-timer">45:00</span>
          <button id="exam-submit-btn" class="btn btn-primary btn-sm" onclick="Exam.submit(false)">交卷</button>
        </div>
      </div>
      <div id="exam-body">
        <div id="exam-question-area"></div>
        <div id="exam-sheet-area">
          <h4>📋 答题卡</h4>
          <div id="exam-sheet-grid"></div>
          <div class="sheet-legend">
            <span><span class="dot undone"></span>未答</span>
            <span><span class="dot correct-dot"></span>已答</span>
            <span><span class="dot marked"></span>标记</span>
          </div>
        </div>
      </div>
      <div id="exam-result-area" style="display:none;"></div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    return true;
  },

  _showExamPanel() {
    document.getElementById('exam-panel').style.display = 'flex';
    document.getElementById('content').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
  },

  // ---- CONFIG ----
  _renderConfig() {
    const panel = document.getElementById('exam-panel');
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    const { subject, count, minutes } = this.config;

    let subjectOptions = '<option value="">全部科目（随机）</option>';
    if (typeof SUBJECTS !== 'undefined') {
      for (const [k, v] of Object.entries(SUBJECTS)) {
        subjectOptions += `<option value="${k}" ${subject===k?'selected':''}>${v.icon} ${v.name}</option>`;
      }
    }

    panel.innerHTML = `
      <div id="exam-config">
        <h2>⚙️ 模拟考试设置</h2>
        <div class="exam-config-form">
          <div class="config-row">
            <label>📚 科目</label>
            <select id="ec-subject" class="config-select">${subjectOptions}</select>
          </div>
          <div class="config-row">
            <label>📝 题数</label>
            <div class="config-slider-wrap">
              <input type="range" id="ec-count" min="5" max="100" step="5" value="${count}" oninput="document.getElementById('ec-count-val').textContent=this.value">
              <span id="ec-count-val">${count}</span> 题
            </div>
          </div>
          <div class="config-row">
            <label>⏱ 时长</label>
            <select id="ec-minutes" class="config-select">
              <option value="30" ${minutes===30?'selected':''}>30 分钟</option>
              <option value="45" ${minutes===45?'selected':''}>45 分钟</option>
              <option value="60" ${minutes===60?'selected':''}>60 分钟</option>
              <option value="90" ${minutes===90?'selected':''}>90 分钟</option>
              <option value="120" ${minutes===120?'selected':''}>120 分钟</option>
              <option value="180" ${minutes===180?'selected':''}>180 分钟（3小时 408全真）</option>
            </select>
          </div>
          <button class="btn btn-primary exam-start-btn" onclick="
            Exam.configure(
              document.getElementById('ec-subject').value || null,
              parseInt(document.getElementById('ec-count').value),
              parseInt(document.getElementById('ec-minutes').value)
            );
            Exam.begin();
          ">🚀 开始考试</button>
          <button class="btn btn-secondary exam-cancel-btn" onclick="Exam.exit()">取消</button>
        </div>
      </div>`;
    document.getElementById('exam-body')?.removeAttribute('style');
    document.getElementById('exam-result-area')?.removeAttribute('style');
  },

  // ---- RUNNING ----
  _renderRunning() {
    const panel = document.getElementById('exam-panel');
    panel.innerHTML = `
      <div id="exam-header">
        <div class="exam-h-left">
          <span class="exam-icon">⏱</span>
          <span class="exam-title">模拟考试</span>
          <span id="exam-progress" class="exam-progress"></span>
        </div>
        <div class="exam-h-right">
          <span id="exam-timer" class="exam-timer">${this._fmtTime(this.getTimeLeft())}</span>
          <button id="exam-submit-btn" class="btn btn-primary btn-sm" onclick="Exam.submit(false)">交卷</button>
        </div>
      </div>
      <div id="exam-body">
        <div id="exam-question-area"></div>
        <div id="exam-sheet-area">
          <h4>📋 答题卡</h4>
          <div id="exam-sheet-grid"></div>
          <div class="sheet-legend">
            <span><span class="dot undone"></span>未答</span>
            <span><span class="dot answered"></span>已答</span>
            <span><span class="dot marked"></span>标记</span>
          </div>
        </div>
      </div>
      <div id="exam-result-area" style="display:none;"></div>`;
  },

  _renderQuestion(idx) {
    if (typeof idx !== 'number') idx = 0;
    if (idx < 0 || idx >= this.questions.length) return;
    const q = this.questions[idx];

    let qHTML = `
      <div id="exam-q-nav">
        <span>第 ${idx + 1}/${this.questions.length} 题</span>
        <span class="tag" style="background:${SUBJECTS[q.subject]?.color}20">${SUBJECTS[q.subject]?.icon} ${SUBJECTS[q.subject]?.name}</span>
        ${TOPICS[q.topic] ? `<span class="tag">📌 ${TOPICS[q.topic].name}</span>` : ''}
      </div>
      <div id="exam-q-text">${Search.highlight(q.question)}</div>`;

    if (q.code) {
      qHTML += `<pre id="exam-q-code">${q.code}</pre>`;
    }
    if (q.passage) {
      qHTML += `<div class="passage-box">${q.passage}</div>`;
    }

    // 选项
    if (q.type === 'fill') {
      const val = this.answers[q.id] || '';
      qHTML += `
        <div id="exam-q-options">
          <input type="text" class="fill-input" id="exam-fill-input" value="${val}"
            placeholder="输入你的答案..."
            onkeydown="if(event.key==='Enter'){Exam.answerQuestion('${q.id}', this.value);Exam.nextOrSubmit();}"
            onchange="Exam.answerQuestion('${q.id}', this.value)">
        </div>`;
    } else {
      qHTML += '<div id="exam-q-options" class="options-grid">';
      const isMulti = q.type === 'multi';
      const curAns = isMulti ? (Array.isArray(this.answers[q.id]) ? this.answers[q.id] : []) : this.answers[q.id];

      q.options.forEach((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const text = opt.substring(2).trim();
        let selected = false;
        if (isMulti) selected = curAns.includes(letter);
        else selected = curAns === letter;
        qHTML += `
          <div class="option-item exam-option ${selected ? 'selected' : ''}"
            data-letter="${letter}"
            onclick="Exam._selectOption('${q.id}', '${letter}', ${isMulti}, this)">
            <span class="option-letter">${letter}</span>
            <span>${Search.highlight(text)}</span>
          </div>`;
      });
      qHTML += '</div>';
    }

    // 按钮
    qHTML += `
      <div id="exam-q-actions">
        <button class="btn btn-secondary" onclick="Exam.navigateTo('${q.id}')" ${idx===0?'disabled':''}>◀ 上一题</button>
        <button class="btn btn-mark-btn" onclick="Exam.toggleExamMark('${q.id}');Exam._renderQuestion(${idx})">
          ${this.marks[q.id] ? '🏷 取消标记' : '🏷 标记'}
        </button>
        <button class="btn btn-primary" onclick="Exam.nextOrSubmit()">
          ${idx < this.questions.length - 1 ? '下一题 ▶' : '交卷 ✓'}
        </button>
      </div>`;

    document.getElementById('exam-question-area').innerHTML = qHTML;
    document.getElementById('exam-progress').textContent = `${idx + 1}/${this.questions.length}`;
  },

  _selectOption(qId, letter, isMulti, el) {
    if (isMulti) {
      const cur = Array.isArray(this.answers[qId]) ? [...this.answers[qId]] : [];
      const idx = cur.indexOf(letter);
      if (idx >= 0) cur.splice(idx, 1);
      else cur.push(letter);
      cur.sort();
      this.answers[qId] = cur;
      // 重新渲染当前题
      const currentIdx = this.questions.findIndex(q => q.id === qId);
      this._renderQuestion(currentIdx);
    } else {
      this.answers[qId] = letter;
      document.querySelectorAll('.exam-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
    }
    this._updateExamSheet();
  },

  nextOrSubmit() {
    // 找到当前题索引
    const qId = document.getElementById('exam-q-nav')?.nextElementSibling?.id;
    let currentIdx = 0;
    if (this.questions.length > 0) {
      const activeEl = document.getElementById('exam-q-nav');
      if (activeEl) {
        const txt = activeEl.querySelector('span')?.textContent || '';
        const m = txt.match(/(\d+)\/(\d+)/);
        if (m) currentIdx = parseInt(m[1]) - 1;
      }
    }
    if (currentIdx < this.questions.length - 1) {
      this._renderQuestion(currentIdx + 1);
    } else {
      if (confirm('确定要交卷吗？还有时间可以继续检查。')) {
        this.submit(false);
      }
    }
  },

  // ---- REVIEW ----
  _renderReview() {
    const d = this.scoreData;
    const panel = document.getElementById('exam-panel');
    panel.innerHTML = `
      <div id="exam-header">
        <div class="exam-h-left"><span class="exam-icon">📊</span><span class="exam-title">考试成绩</span></div>
        <div class="exam-h-right">
          <button class="btn btn-outline" style="color:#333;border-color:#ccc;" onclick="Exam.exit()">✕ 关闭</button>
        </div>
      </div>
      <div id="exam-result-area" style="display:block;">
        <div class="score-card">
          <div class="score-circle" style="border-color:${d.rate >= 60 ? 'var(--correct)' : 'var(--wrong)'}">
            <span class="score-num">${d.rate}%</span>
            <span class="score-label">正确率</span>
          </div>
          <div class="score-detail">
            <div>✅ 正确：<strong>${d.correct}</strong> 题</div>
            <div>❌ 错误：<strong>${d.wrong}</strong> 题</div>
            <div>⏱ 用时：<strong>${this._fmtTime(d.elapsed)}</strong></div>
            <div>📝 总题数：<strong>${d.total}</strong> 题</div>
          </div>
        </div>
        <div class="review-list">
          <h3>📋 逐题回看</h3>
          ${this.questions.map((q, i) => {
            const userAns = this.answers[q.id];
            let isCorrect = false;
            if (q.type === 'multi') {
              const c = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
              const u = (Array.isArray(userAns) ? userAns : [userAns]).sort().join('');
              isCorrect = c === u;
            } else if (q.type === 'fill') {
              isCorrect = String(userAns || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
            } else {
              isCorrect = userAns === q.answer;
            }
            const correctDisplay = Array.isArray(q.answer) ? q.answer.join('') : q.answer;
            const userDisplay = Array.isArray(userAns) ? (userAns.length ? userAns.join('') : '未作答') : (userAns || '未作答');

            return `
            <div class="review-item ${isCorrect ? 'review-correct' : 'review-wrong'}">
              <div class="review-idx">${i + 1} ${isCorrect ? '✅' : '❌'}</div>
              <div class="review-body">
                <div class="review-question">${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}</div>
                <div class="review-answers">
                  <span>你的答案：<strong>${userDisplay}</strong></span>
                  <span>正确答案：<strong>${correctDisplay}</strong></span>
                </div>
                ${q.analysis ? `<div class="review-analysis">📖 ${q.analysis.substring(0, 100)}${q.analysis.length > 100 ? '...' : ''}</div>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
        <button class="btn btn-primary btn-full" onclick="Exam.exit()" style="margin-top:12px;">返回刷题</button>
      </div>`;
  },

  // ---- 计时器 ----
  _startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerEl = document.getElementById('exam-timer');
    this.timerInterval = setInterval(() => {
      const left = this.getTimeLeft();
      if (timerEl) {
        timerEl.textContent = this._fmtTime(left);
        if (left <= 300) timerEl.classList.add('timer-warning');
        if (left <= 60) timerEl.classList.add('timer-danger');
      }
      if (left <= 0) {
        this.submit(true);
      }
    }, 1000);
  },

  _fmtTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  // ---- 算分 ----
  _calculateScore() {
    let correct = 0, wrong = 0;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

    this.questions.forEach(q => {
      const userAns = this.answers[q.id];
      let isCorrect = false;
      if (q.type === 'multi') {
        const c = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
        const u = (Array.isArray(userAns) ? userAns : [userAns]).sort().join('');
        isCorrect = c === u;
      } else if (q.type === 'fill') {
        isCorrect = String(userAns || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
      } else {
        isCorrect = userAns === q.answer;
      }
      if (isCorrect) correct++; else wrong++;
    });

    this.scoreData = {
      total: this.questions.length,
      correct, wrong,
      rate: Math.round(correct / this.questions.length * 100),
      elapsed,
      subject: this.config.subject
    };

    // 保存考试记录
    Storage.saveExam({
      subject: this.config.subject,
      total: this.questions.length,
      correct, wrong,
      rate: this.scoreData.rate,
      elapsed,
      questions: this.questions.map(q => ({
        id: q.id, subject: q.subject, topic: q.topic,
        answer: this.answers[q.id] || null,
        correct: this._checkCorrect(q, this.answers[q.id])
      }))
    });
  },

  _checkCorrect(q, userAns) {
    if (q.type === 'multi') {
      const c = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
      const u = (Array.isArray(userAns) ? userAns : [userAns]).sort().join('');
      return c === u;
    } else if (q.type === 'fill') {
      return String(userAns || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
    }
    return userAns === q.answer;
  },

  // ---- 答题卡 ----
  _renderExamSheet() {
    const grid = document.getElementById('exam-sheet-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.questions.forEach((q, i) => {
      const cell = document.createElement('div');
      cell.className = 'sheet-cell';
      cell.textContent = i + 1;
      cell.onclick = () => { this._renderQuestion(i); };
      if (this.answers[q.id] !== undefined && this.answers[q.id] !== '' &&
          !(Array.isArray(this.answers[q.id]) && this.answers[q.id].length === 0)) {
        cell.classList.add('answered-cell');
      }
      if (this.marks[q.id]) cell.classList.add('marked-cell');
      grid.appendChild(cell);
    });
  },

  _updateExamSheet() {
    this._renderExamSheet();
  },

  // ---- 工具 ----
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
};
