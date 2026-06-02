// ============================================================
// 考研刷题 - 核心逻辑 v3
// 整合 Storage / Search / Auth / Exam 模块
// ============================================================

// ---- 全局状态 ----
let currentFilter = { groups: [], subjects: [], years: [], topics: [], types: [] };

const QUESTION_TYPE_FILTERS = {
  single: { name: '单选', icon: '○' },
  multi: { name: '多选', icon: '☐' },
  fill: { name: '填空', icon: '✎' },
  code: { name: '编程', icon: '💻' },
};
let currentQuestions = [], currentIndex = -1, selectedOption = null, selectedMulti = {};

// 动态题库：静态数据 + localStorage 导入的题目
function getQuestionBank() {
  const imported = [];
  try {
    const raw = localStorage.getItem('ky-imported-questions');
    if (raw) imported.push(...JSON.parse(raw));
  } catch(e) {}
  return [
    ...(typeof QUESTIONS_408 !== 'undefined' ? QUESTIONS_408 : []),
    ...(typeof QUESTIONS_408_EXTRA !== 'undefined' ? QUESTIONS_408_EXTRA : []),
    ...(typeof QUESTIONS_MATH !== 'undefined' ? QUESTIONS_MATH : []),
    ...(typeof QUESTIONS_POLITICS !== 'undefined' ? QUESTIONS_POLITICS : []),
    ...(typeof QUESTIONS_POLITICS_2017 !== 'undefined' ? QUESTIONS_POLITICS_2017 : []),
    ...(typeof QUESTIONS_POLITICS_2018 !== 'undefined' ? QUESTIONS_POLITICS_2018 : []),
    ...(typeof QUESTIONS_ENGLISH !== 'undefined' ? QUESTIONS_ENGLISH : []),
    ...imported
  ];
}

// 全局使用函数获取最新题库
function getBank() { return getQuestionBank(); }
const QUESTION_BANK = getQuestionBank();

// ---- Init ----
function init() {
  Storage.init();

  // 从 Storage 同步到全局变量（兼容旧代码）
  window.userAnswers = Storage.get('userAnswers');
  window.markedQuestions = Storage.get('markedQuestions');
  window.submittedQuestions = Storage.get('submittedQuestions');
  window.wrongBook = Storage.get('wrongBook');

  renderGroupFilters();
  renderSubjectFilters();
  renderYearFilters();
  renderTopicFilters();
  renderTypeFilters();
  selectAllSubjects();
  updateAllStats();

  // 初始化搜索
  Search.init('search-input');

  // 初始化我的面板
  Auth.init();

  // 检查今日打卡
  autoCheckin();

  // 初始化每日一题
  Daily.init();

  // 初始化学习计划
  Plan.init();

  // 答题卡滑动
  initSheetSwipe();

  // 题目左右滑动
  initQuestionSwipe();

  // 深色模式
  initDarkMode();
}

// ---- 打卡（每日自动） ----
function autoCheckin() {
  const today = new Date().toISOString().slice(0, 10);
  const records = Storage.getCheckinRecords();
  if (!records[today]) {
    Storage.checkinToday();
  }
}

// ---- 兼容旧代码的 saveToStorage ----
function saveToStorage() {
  Storage.set('userAnswers', window.userAnswers);
  Storage.set('markedQuestions', window.markedQuestions);
  Storage.set('submittedQuestions', window.submittedQuestions);
  Storage.set('wrongBook', window.wrongBook);
}

// ---- Group Filters ----
function renderGroupFilters() {
  const c = document.getElementById('group-filters');
  c.innerHTML = '';
  for (const [k, g] of Object.entries(SUBJECT_GROUPS)) {
    const chip = document.createElement('span');
    chip.className = 'filter-chip';
    chip.textContent = g.icon + ' ' + g.name;
    chip.onclick = () => toggleGroup(k);
    if (currentFilter.groups.includes(k)) chip.classList.add('active');
    c.appendChild(chip);
  }
}

function toggleGroup(key) {
  const idx = currentFilter.groups.indexOf(key);
  if (idx >= 0) currentFilter.groups.splice(idx, 1);
  else currentFilter.groups.push(key);
  currentFilter.subjects = Object.keys(SUBJECTS).filter(k =>
    currentFilter.groups.length === 0 || currentFilter.groups.includes(SUBJECTS[k].group)
  );
  renderGroupFilters();
  renderSubjectFilters();
  renderTopicFilters();
  applyFilter();
}

// ---- Subject Filters ----
function renderSubjectFilters() {
  const c = document.getElementById('subject-filters');
  c.innerHTML = '';
  const visibleSubjects = currentFilter.groups.length === 0
    ? Object.keys(SUBJECTS)
    : Object.keys(SUBJECTS).filter(k => currentFilter.groups.includes(SUBJECTS[k].group));
  for (const k of visibleSubjects) {
    const subj = SUBJECTS[k];
    const chip = document.createElement('span');
    chip.className = 'filter-chip';
    chip.textContent = subj.icon + ' ' + subj.name;
    chip.onclick = () => toggleSubject(k);
    if (currentFilter.subjects.includes(k)) chip.classList.add('active');
    c.appendChild(chip);
  }
}

function toggleSubject(key) {
  const idx = currentFilter.subjects.indexOf(key);
  if (idx >= 0) currentFilter.subjects.splice(idx, 1);
  else currentFilter.subjects.push(key);
  renderSubjectFilters();
  renderTopicFilters();
  applyFilter();
}

function selectAllSubjects() {
  currentFilter.groups = [];
  currentFilter.subjects = Object.keys(SUBJECTS);
  currentFilter.years = [];
  currentFilter.topics = [];
  currentFilter.types = [];
  renderGroupFilters();
  renderSubjectFilters();
  renderYearFilters();
  renderTopicFilters();
  renderTypeFilters();
  applyFilter();
}

// ---- Year Filters ----
function renderYearFilters() {
  const c = document.getElementById('year-filters');
  c.innerHTML = '';
  const all = document.createElement('span');
  all.className = 'year-chip' + (currentFilter.years.length === 0 ? ' active' : '');
  all.textContent = '全部';
  all.onclick = () => { currentFilter.years = []; renderYearFilters(); applyFilter(); };
  c.appendChild(all);
  YEARS.forEach(y => {
    const chip = document.createElement('span');
    chip.className = 'year-chip' + (currentFilter.years.includes(y) ? ' active' : '');
    chip.textContent = y;
    chip.onclick = () => {
      const i = currentFilter.years.indexOf(y);
      if (i >= 0) currentFilter.years.splice(i, 1);
      else currentFilter.years.push(y);
      renderYearFilters(); applyFilter();
    };
    c.appendChild(chip);
  });
}

// ---- Type Filters ----
function renderTypeFilters() {
  const c = document.getElementById('type-filters');
  if (!c) return;
  c.innerHTML = '';
  Object.entries(QUESTION_TYPE_FILTERS).forEach(([k, v]) => {
    const chip = document.createElement('span');
    chip.className = 'filter-chip';
    chip.textContent = v.icon + ' ' + v.name;
    chip.onclick = () => toggleType(k);
    if (currentFilter.types.includes(k)) chip.classList.add('active');
    c.appendChild(chip);
  });
}

function toggleType(key) {
  const idx = currentFilter.types.indexOf(key);
  if (idx >= 0) currentFilter.types.splice(idx, 1);
  else currentFilter.types.push(key);
  renderTypeFilters();
  applyFilter();
}

// ---- Topic Filters ----
function renderTopicFilters() {
  const c = document.getElementById('topic-filters');
  let subj = currentFilter.subjects.length === 1 ? currentFilter.subjects[0] : null;
  c.innerHTML = '';
  if (!subj) {
    c.innerHTML = '<span style="font-size:12px;color:#999;">选择单个学科后显示知识点</span>';
    return;
  }
  const lookupSubj = (subj === 'ma2' || subj === 'ma3') ? 'ma1' : (subj === 'en2' ? 'en1' : subj);
  const topics = Object.entries(TOPICS).filter(([k, v]) => v.subject === lookupSubj);
  topics.forEach(([key, tp]) => {
    const chip = document.createElement('span');
    chip.className = 'topic-chip';
    chip.textContent = tp.name;
    chip.title = tp.desc;
    chip.onclick = () => {
      const i = currentFilter.topics.indexOf(key);
      if (i >= 0) currentFilter.topics.splice(i, 1);
      else currentFilter.topics.push(key);
      renderTopicFilters(); applyFilter();
    };
    if (currentFilter.topics.includes(key)) chip.classList.add('active');
    c.appendChild(chip);
  });
}

// ---- Filter ----
function applyFilter() {
  // 如果正在考试中，不干扰
  if (Exam.state === 'running') return;

  mode = 'filter';
  const topicSubjects = currentFilter.topics.map(t => {
    const tp = TOPICS[t];
    if (!tp) return t;
    if (tp.subject === 'ma1') return ['ma1', 'ma2', 'ma3'];
    if (tp.subject === 'en1') return ['en1', 'en2'];
    return [tp.subject];
  }).flat();

  let filtered = getBank().filter(q => {
    const s = currentFilter.subjects.length === 0 || currentFilter.subjects.includes(q.subject);
    const y = currentFilter.years.length === 0 || currentFilter.years.includes(q.year);
    const t = currentFilter.topics.length === 0 || topicSubjects.includes(q.subject);
    const tp = currentFilter.types.length === 0 || currentFilter.types.includes(q.type);
    return s && y && t && tp;
  });

  // 搜索二次过滤
  filtered = Search.execute(filtered);
  Search.updateUI();

  currentQuestions = filtered;
  currentIndex = -1; selectedOption = null; selectedMulti = {};
  renderSheet(); updateFilterStats();
  currentQuestions.length > 0 ? showQuestion(0) : showWelcome();
}

// ---- Modes ----
function startRandom() {
  mode = 'random';
  currentFilter.subjects = Object.keys(SUBJECTS);
  currentFilter.years = []; currentFilter.topics = []; currentFilter.groups = [];
  renderGroupFilters(); renderSubjectFilters(); renderYearFilters(); renderTopicFilters();
  currentQuestions = [...getBank()];
  shuffle(currentQuestions);
  currentIndex = -1; selectedOption = null; selectedMulti = {};
  Search.keyword = '';
  if (Search.inputEl) Search.inputEl.value = '';
  renderSheet(); updateFilterStats(); showQuestion(0);
}

function reviewWrong() {
  mode = 'wrong';
  currentQuestions = getBank().filter(q => Storage.isWrong(q.id));
  currentIndex = -1; selectedOption = null; selectedMulti = {};
  renderSheet(); updateFilterStats();
  if (currentQuestions.length > 0) showQuestion(0);
  else { alert('🎉 错题本为空！'); selectAllSubjects(); }
}

function showFavorites() {
  mode = 'favorites';
  currentQuestions = getBank().filter(q => Storage.isFavorite(q.id));
  currentIndex = -1; selectedOption = null; selectedMulti = {};
  renderSheet(); updateFilterStats();
  if (currentQuestions.length > 0) showQuestion(0);
  else { alert('⭐ 收藏夹为空！'); selectAllSubjects(); }
}

function toggleWrongBook() { reviewWrong(); }

// ---- 错题重做 ----
function startWrongRedo() {
  const wrongIds = Storage.getWrongIds();
  if (wrongIds.length === 0) { alert('🎉 没有错题！'); return; }

  const count = Math.min(wrongIds.length, parseInt(prompt(`共 ${wrongIds.length} 道错题，抽几题重做？`, Math.min(10, wrongIds.length))) || 10);
  if (isNaN(count) || count <= 0) return;

  const pool = getBank().filter(q => wrongIds.includes(q.id));
  shuffle(pool);
  currentQuestions = pool.slice(0, count);
  currentIndex = -1; selectedOption = null; selectedMulti = {};
  mode = 'wrong-redo';
  window._wrongRedoStats = { total: currentQuestions.length, correct: 0, wrong: 0, fixed: [] };
  renderSheet(); updateFilterStats(); showQuestion(0);
}

// 重做模式提交后处理
function _handleWrongRedoSubmit(qId, isCorrect) {
  if (mode !== 'wrong-redo') return;
  if (isCorrect) {
    window._wrongRedoStats.correct++;
    // 从错题本移除
    Storage.get('wrongBook')[qId] = false;
    delete Storage.get('wrongBook')[qId];
    Storage._flush();
    window._wrongRedoStats.fixed.push(qId);
  } else {
    window._wrongRedoStats.wrong++;
  }

  // 检查是否全部做完
  const answered = window._wrongRedoStats.correct + window._wrongRedoStats.wrong;
  if (answered >= window._wrongRedoStats.total) {
    setTimeout(() => {
      const s = window._wrongRedoStats;
      alert(`📊 错题重做完成！\n\n✅ 正确: ${s.correct}/${s.total}\n🎉 移出错题本: ${s.fixed.length} 题\n❌ 仍错误: ${s.wrong} 题`);
      mode = 'filter';
      updateAllStats();
      selectAllSubjects();
    }, 500);
  }
}

// ---- Show Question ----
function showQuestion(index) {
  if (index < 0 || index >= currentQuestions.length) return;
  currentIndex = index; selectedOption = null; selectedMulti = {};
  const q = currentQuestions[index];

  document.getElementById('welcome').style.display = 'none';
  const area = document.getElementById('question-area');
  area.style.display = 'block';

  // Navigation
  document.getElementById('q-index').textContent = `第 ${index + 1}/${currentQuestions.length} 题`;
  const topicInfo = TOPICS[q.topic];
  const typeInfo = QUESTION_TYPES[q.type] || { name: q.type === 'code' ? '编程' : '未知', icon: q.type === 'code' ? '💻' : '?' };
  const diff = DIFFICULTY[q.difficulty] || DIFFICULTY.medium;

  // 题目标签（含搜索高亮）
  const subjTag = `<span class="tag" style="background:${SUBJECTS[q.subject].color}20;color:${SUBJECTS[q.subject].color};border:1px solid ${SUBJECTS[q.subject].color}40;">${SUBJECTS[q.subject].icon} ${SUBJECTS[q.subject].name}</span>`;
  document.getElementById('q-tag').innerHTML =
    `${subjTag}
     <span class="tag" style="background:#f0f0f0;">${q.year}年</span>
     ${topicInfo ? `<span class="tag topic-clickable" style="background:#fff3e0;color:#e65100;border:1px solid #ffe0b2;cursor:pointer;" onclick="jumpToTopic('${q.topic}')" title="点击查看「${topicInfo.name}」全部题目">📌 ${Search.highlight(topicInfo.name)}</span>` : ''}
     <span class="tag" style="background:${diff.bg};color:${diff.color};border:1px solid ${diff.color}40;" title="${diff.label}">${diff.stars}</span>
     <span class="tag" style="background:#e8eaf6;color:#283593;border:1px solid #c5cae9;">${typeInfo.icon} ${typeInfo.name}</span>`;

  // Passage
  const passageEl = document.getElementById('q-passage');
  if (q.passage) { passageEl.style.display = 'block'; passageEl.innerHTML = `<div class="passage-box">${q.passage}</div>`; }
  else passageEl.style.display = 'none';

  // Question text with search highlight
  document.getElementById('q-text').innerHTML = Search.highlight(q.question);

  // 编程题：特殊处理
  if (q.type === 'code') {
    const optsEl = document.getElementById('q-options');
    optsEl.style.display = 'block';
    document.getElementById('q-fill').style.display = 'none';
    document.getElementById('q-code').style.display = 'none';
    document.getElementById('q-passage').style.display = 'none';
    CodeEditor.render(optsEl, q);
    document.getElementById('btn-submit').style.display = 'none';
    document.getElementById('btn-mark').style.display = 'none';
    document.getElementById('btn-fav').style.display = 'none';
    document.getElementById('btn-next').style.display = 'none';
    // 隐藏笔记区域
    const noteArea = document.getElementById('note-area');
    if (noteArea) noteArea.style.display = 'none';
    renderSheet(); updateFilterStats();
    return;
  }

  // Code
  const codeEl = document.getElementById('q-code');
  codeEl.style.display = q.code ? 'block' : 'none';
  if (q.code) codeEl.textContent = q.code;

  // Options
  const optEl = document.getElementById('q-options');
  const fillEl = document.getElementById('q-fill');
  const submitted = Storage.isSubmitted(q.id);

  if (q.type === 'fill') {
    optEl.style.display = 'none'; fillEl.style.display = 'block';
    const inp = document.getElementById('fill-answer');
    inp.value = submitted ? (Storage.getAnswer(q.id) || '') : (Storage.getAnswer(q.id) || '');
    inp.disabled = submitted;
  } else {
    optEl.style.display = 'flex'; fillEl.style.display = 'none';
    optEl.innerHTML = '';
    q.options.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'option-item';
      const isMulti = q.type === 'multi';
      const letter = String.fromCharCode(65 + i);
      const prefix = isMulti ? '☐' : '○';
      div.innerHTML = `<span class="option-letter">${letter}</span><span>${Search.highlight(opt.substring(2).trim())}</span>`;

      if (submitted) {
        div.classList.add('disabled');
        const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
        if (correctAnswers.includes(letter)) div.classList.add('correct-answer');
        const userAns = Array.isArray(Storage.getAnswer(q.id)) ? Storage.getAnswer(q.id) : [Storage.getAnswer(q.id)];
        if (userAns.includes(letter) && !correctAnswers.includes(letter)) div.classList.add('wrong-answer');
      } else {
        if (isMulti) {
          if (selectedMulti[letter]) div.classList.add('selected');
          else if (Storage.getAnswer(q.id) && Array.isArray(Storage.getAnswer(q.id)) && Storage.getAnswer(q.id).includes(letter)) div.classList.add('selected');
        } else {
          if (letter === selectedOption || (Storage.getAnswer(q.id) === letter && !Array.isArray(Storage.getAnswer(q.id)))) div.classList.add('selected');
        }
      }

      div.onclick = () => {
        if (submitted) return;
        if (isMulti) {
          if (selectedMulti[letter]) delete selectedMulti[letter];
          else selectedMulti[letter] = true;
          Storage.setAnswer(q.id, Object.keys(selectedMulti).sort());
          saveToStorage();
          showQuestion(currentIndex);
        } else {
          selectedOption = letter;
          Storage.setAnswer(q.id, letter);
          saveToStorage();
          showQuestion(currentIndex);
        }
      };
      optEl.appendChild(div);
    });
  }

  // Buttons
  document.getElementById('btn-submit').style.display = submitted ? 'none' : 'inline-flex';
  const markBtn = document.getElementById('btn-mark');
  markBtn.style.display = submitted ? 'none' : 'inline-flex';
  markBtn.textContent = Storage.isMarked(q.id) ? '🏷 取消标记' : '🏷 标记';

  // Favorite button
  let favBtn = document.getElementById('btn-fav');
  if (!favBtn) {
    favBtn = document.createElement('button');
    favBtn.id = 'btn-fav';
    favBtn.className = 'btn btn-mark-btn';
    document.getElementById('question-actions').appendChild(favBtn);
  }
  favBtn.textContent = Storage.isFavorite(q.id) ? '⭐ 已收藏' : '☆ 收藏';
  favBtn.onclick = () => {
    const isFav = Storage.toggleFavorite(q.id);
    favBtn.textContent = isFav ? '⭐ 已收藏' : '☆ 收藏';
  };

  document.getElementById('btn-next').style.display = submitted ? 'inline-flex' : 'none';
  const btnPrev = document.getElementById('btn-prev');
  if (btnPrev) btnPrev.style.display = submitted ? 'inline-flex' : 'none';

  // Result
  const resultArea = document.getElementById('result-area');
  if (submitted) {
    resultArea.style.display = 'block';
    const userAns = Storage.getAnswer(q.id);
    let isCorrect = false;
    if (q.type === 'multi') {
      const correct = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
      const user = (Array.isArray(userAns) ? userAns : [userAns]).sort().join('');
      isCorrect = correct === user;
    } else if (q.type === 'fill') {
      isCorrect = String(userAns || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
    } else {
      isCorrect = userAns === q.answer;
    }
    resultArea.className = isCorrect ? 'result-correct' : 'result-wrong';
    const correctDisplay = Array.isArray(q.answer) ? q.answer.join('') : q.answer;
    resultArea.innerHTML = `
      <div><span class="result-icon">${isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}</span></div>
      <div style="margin-top:6px;"><strong>正确答案：${correctDisplay}</strong></div>
      ${q.analysis ? `<div style="margin-top:10px;color:#555;"><strong>📖 解析：</strong>${q.analysis}</div>` : ''}
    `;
  } else {
    resultArea.style.display = 'none';
    if (q.type === 'multi' && Storage.getAnswer(q.id) && Array.isArray(Storage.getAnswer(q.id))) {
      Storage.getAnswer(q.id).forEach(l => selectedMulti[l] = true);
    }
    if (q.type !== 'multi' && Storage.getAnswer(q.id) && !Array.isArray(Storage.getAnswer(q.id)) && !submitted) {
      selectedOption = Storage.getAnswer(q.id);
    }
  }

  // 笔记区域
  let noteArea = document.getElementById('note-area');
  if (!noteArea) {
    noteArea = document.createElement('div');
    noteArea.id = 'note-area';
    noteArea.innerHTML = `
      <div class="note-header">📝 个人笔记</div>
      <textarea id="note-textarea" class="note-textarea" placeholder="记下你的思路、易错点..." oninput="saveNoteDebounced()"></textarea>`;
    document.getElementById('question-body').appendChild(noteArea);
  }
  noteArea.style.display = 'block';
  const nta = document.getElementById('note-textarea');
  nta.value = Storage.getNote(q.id) || '';
  nta.dataset.qId = q.id;

  renderSheet(); updateFilterStats();
  document.getElementById('content').scrollTop = 0;
}

// 笔记自动保存（500ms 防抖，锁定题目 ID 防竞态）
let noteTimer = null;
function saveNoteDebounced() {
  clearTimeout(noteTimer);
  const qId = document.getElementById('note-textarea')?.dataset?.qId;
  noteTimer = setTimeout(() => {
    const text = document.getElementById('note-textarea').value;
    Storage.setNote(qId, text);
  }, 500);
}

function showWelcome() {
  document.getElementById('question-area').style.display = 'none';
  document.getElementById('welcome').style.display = 'block';
  renderSheet();
}

// ---- Submit ----
function submitAnswer() {
  const q = currentQuestions[currentIndex];
  if (q.type === 'fill') {
    const val = document.getElementById('fill-answer').value;
    if (!val.trim()) return;
    Storage.setAnswer(q.id, val.trim());
  } else if (q.type === 'multi') {
    const keys = Object.keys(selectedMulti);
    if (keys.length === 0 && (!Storage.getAnswer(q.id) || !Array.isArray(Storage.getAnswer(q.id)))) return;
    if (keys.length > 0) Storage.setAnswer(q.id, keys.sort());
  } else {
    if (!selectedOption && !Storage.getAnswer(q.id)) return;
    if (selectedOption) Storage.setAnswer(q.id, selectedOption);
  }
  Storage.markSubmitted(q.id);

  // Check
  const userAns = Storage.getAnswer(q.id);
  let isCorrect = false;
  if (q.type === 'multi') {
    const correct = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
    const user = (Array.isArray(userAns) ? userAns : [userAns]).sort().join('');
    isCorrect = correct === user;
  } else if (q.type === 'fill') {
    isCorrect = String(userAns || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
  } else {
    isCorrect = userAns === q.answer;
  }

  if (!isCorrect) Storage.addWrong(q.id);

  // 错题重做追踪
  _handleWrongRedoSubmit(q.id, isCorrect);

  // 学习计划进度追踪
  Plan.onQuestionSubmitted(q.id, isCorrect);

  // 每日一题完成检测
  if (Daily.getQuestion() && Daily.getQuestion().id === q.id && isCorrect) {
    Daily.markAnswered();
  }

  // 打卡
  Storage.checkinToday();

  saveToStorage(); renderSheet(); updateAllStats(); updateFilterStats();
  showQuestion(currentIndex);
}

function toggleMark() {
  const q = currentQuestions[currentIndex];
  if (Storage.isSubmitted(q.id)) return;
  Storage.toggleMarked(q.id);
  saveToStorage(); renderSheet();
  showQuestion(currentIndex);
}

function prevQuestion() {
  if (currentIndex > 0) showQuestion(currentIndex - 1);
}
function nextQuestion() {
  if (currentIndex < currentQuestions.length - 1) showQuestion(currentIndex + 1);
}

// ---- Answer Sheet ----
function renderSheet() {
  const grid = document.getElementById('sheet-grid');
  grid.innerHTML = '';
  if (currentQuestions.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;font-size:12px;color:#999;text-align:center;">暂无题目</div>';
    return;
  }
  currentQuestions.forEach((q, i) => {
    const cell = document.createElement('div');
    cell.className = 'sheet-cell';
    cell.textContent = i + 1;
    cell.title = `${SUBJECTS[q.subject].name} ${q.year}年 Q${i+1}`;
    cell.onclick = () => showQuestion(i);
    if (i === currentIndex) cell.classList.add('current');
    if (Storage.isSubmitted(q.id)) {
      const userAns = Storage.getAnswer(q.id);
      let isCorrect = false;
      if (q.type === 'multi') {
        const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
        const u = (Array.isArray(userAns)?userAns:[userAns]).sort().join('');
        isCorrect = c === u;
      } else if (q.type === 'fill') {
        isCorrect = String(userAns||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
      } else {
        isCorrect = userAns === q.answer;
      }
      cell.classList.add(isCorrect ? 'correct-cell' : 'wrong-cell');
    }
    if (Storage.isMarked(q.id)) cell.classList.add('marked-cell');
    grid.appendChild(cell);
  });
}

// ---- Stats ----
function updateAllStats() {
  const done = Storage.getSubmittedIds().length;
  let corr = 0;
  const bank = getBank();
  bank.forEach(q => {
    if (!Storage.isSubmitted(q.id)) return;
    const userAns = Storage.getAnswer(q.id);
    let isCorrect = false;
    if (q.type === 'multi') {
      const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
      const u = (Array.isArray(userAns)?userAns:[userAns]).sort().join('');
      isCorrect = c === u;
    } else if (q.type === 'fill') {
      isCorrect = String(userAns||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
    } else {
      isCorrect = userAns === q.answer;
    }
    if (isCorrect) corr++;
  });
  document.getElementById('stat-total').textContent = bank.length;
  document.getElementById('stat-correct').textContent = corr;
  document.getElementById('stat-wrong').textContent = done - corr;
  document.getElementById('stat-rate').textContent = done > 0 ? Math.round(corr/done*100)+'%' : '--';
  document.getElementById('wrong-count').textContent = Storage.getWrongIds().length;
  document.getElementById('fav-count').textContent = Storage.getFavoriteIds().length;
  const fc2 = document.getElementById('fav-count2');
  if (fc2) fc2.textContent = Storage.getFavoriteIds().length;
}

function updateFilterStats() {
  document.getElementById('filter-count').textContent = currentQuestions.length;
  const done = currentQuestions.filter(q => Storage.isSubmitted(q.id)).length;
  let corr = 0;
  currentQuestions.forEach(q => {
    if (!Storage.isSubmitted(q.id)) return;
    const userAns = Storage.getAnswer(q.id);
    let isCorrect = false;
    if (q.type === 'multi') {
      const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
      const u = (Array.isArray(userAns)?userAns:[userAns]).sort().join('');
      isCorrect = c === u;
    } else if (q.type === 'fill') {
      isCorrect = String(userAns||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
    } else {
      isCorrect = userAns === q.answer;
    }
    if (isCorrect) corr++;
  });
  document.getElementById('filter-done').textContent = done;
  document.getElementById('filter-rate').textContent = done > 0 ? Math.round(corr/done*100)+'%' : '--';
}

// ---- Reset ----
function resetProgress() {
  if (!confirm('确定要重置所有答题记录吗？此操作不可恢复。')) return;
  Storage.reset();
  window.userAnswers = Storage.get('userAnswers');
  window.markedQuestions = Storage.get('markedQuestions');
  window.submittedQuestions = Storage.get('submittedQuestions');
  window.wrongBook = Storage.get('wrongBook');
  selectedOption = null; selectedMulti = {};
  updateAllStats(); applyFilter();
}

// ---- Utils ----
function shuffle(a) { for (let i = a.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

// ---- Keyboard ----
document.addEventListener('keydown', (e) => {
  // 如果焦点在搜索框或输入框，不处理快捷键
  if (document.activeElement && (document.activeElement.id === 'search-input' || document.activeElement.id === 'fill-answer' || document.activeElement.id === 'ce-textarea')) return;
  if (Exam.state === 'running') return; // 考试中不处理

  if (currentIndex < 0 || currentQuestions.length === 0) return;
  const q = currentQuestions[currentIndex];
  if (Storage.isSubmitted(q.id)) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); if (currentIndex < currentQuestions.length-1) showQuestion(currentIndex+1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); if (currentIndex > 0) showQuestion(currentIndex-1); }
    return;
  }
  if (q.type === 'fill') {
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
    return;
  }
  const key = e.key.toUpperCase();
  if (['A','B','C','D','E'].includes(key)) {
    if (q.type === 'multi') {
      if (selectedMulti[key]) delete selectedMulti[key]; else selectedMulti[key] = true;
      Storage.setAnswer(q.id, Object.keys(selectedMulti).sort());
      saveToStorage();
      showQuestion(currentIndex);
    } else {
      selectOptionUniversal(key);
    }
  }
  if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); if (currentIndex < currentQuestions.length-1) showQuestion(currentIndex+1); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); if (currentIndex > 0) showQuestion(currentIndex-1); }
  // Ctrl+S 收藏当前题
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); Storage.toggleFavorite(q.id); document.getElementById('btn-fav').textContent = Storage.isFavorite(q.id) ? '⭐ 已收藏' : '☆ 收藏'; }
});

function selectOptionUniversal(letter) {
  selectedOption = letter;
  Storage.setAnswer(currentQuestions[currentIndex].id, letter);
  saveToStorage();
  showQuestion(currentIndex);
}

// ---- 深色模式 ----
function initDarkMode() {
  const saved = localStorage.getItem('ky-dark');
  if (saved === '1' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
  }
  // 监听系统变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('ky-dark')) {
      document.body.classList.toggle('dark', e.matches);
    }
  });
}
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('ky-dark', isDark ? '1' : '0');
}

// ---- Header Dropdown ----
function toggleHeaderMore() {
  const d = document.getElementById('header-more-drop');
  d.classList.toggle('show');
}
function closeHeaderMore() {
  const d = document.getElementById('header-more-drop');
  if (d) d.classList.remove('show');
}
// 点击别处关闭下拉
document.addEventListener('click', function(e) {
  if (!e.target.closest('.header-more-wrap')) closeHeaderMore();
});

// ---- Start ----
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}

// 答题卡开关
function toggleSheet() {
  const sheet = document.getElementById('answer-sheet');
  if (sheet.classList.contains('open')) closeSheet();
  else openSheet();
}
function openSheet() {
  const sheet = document.getElementById('answer-sheet');
  const overlay = document.getElementById('sheet-overlay');
  sheet.classList.add('open');
  if (overlay) overlay.classList.add('show');
  document.body.style.overflow = 'hidden'; // 锁定背景滚动
}
function closeSheet() {
  const sheet = document.getElementById('answer-sheet');
  const overlay = document.getElementById('sheet-overlay');
  sheet.classList.remove('open');
  sheet.style.transform = '';
  if (overlay) overlay.classList.remove('show');
  document.body.style.overflow = ''; // 恢复滚动
}

// 答题卡触摸下滑关闭
function initSheetSwipe() {
  const sheet = document.getElementById('answer-sheet');
  let startY = 0, dragging = false;

  sheet.addEventListener('touchstart', function(e) {
    if (!sheet.classList.contains('open')) return;
    const touchY = e.touches[0].clientY;
    const sheetTop = sheet.getBoundingClientRect().top;
    const grid = document.getElementById('sheet-grid');
    const atTop = grid.scrollTop <= 0;
    const inHeader = (touchY - sheetTop) < 80;
    if (!inHeader && !atTop) return;
    startY = touchY;
    dragging = true;
    sheet.style.transition = 'none';
  }, { passive: false });

  sheet.addEventListener('touchmove', function(e) {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      e.preventDefault();
      sheet.style.transform = `translateY(${dy}px)`;
    }
  }, { passive: false });

  sheet.addEventListener('touchend', function(e) {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > 80) closeSheet();
    else sheet.style.transform = '';
  });
}

// ---- 移动端搜索面板 ----
function toggleMobileSearch() {
  const panel = document.getElementById('mobile-search-panel');
  const input = document.getElementById('mobile-search-input');
  const isOpen = panel.classList.contains('show');
  if (isOpen) {
    panel.classList.remove('show');
  } else {
    panel.classList.add('show');
    input.value = Search.getKeyword();
    input.focus();
    renderMobileSearchResults();
  }
}

function renderMobileSearchResults() {
  const container = document.getElementById('mobile-search-result');
  const input = document.getElementById('mobile-search-input');
  if (!container) return;
  const kw = input.value.trim().toLowerCase();
  if (!kw) {
    container.innerHTML = '<div style="text-align:center;color:#999;padding:24px;">输入关键词开始搜索</div>';
    return;
  }
  const results = getBank().filter(q => {
    if (q.id.toLowerCase().includes(kw)) return true;
    if (q.question.toLowerCase().includes(kw)) return true;
    if (q.options && q.options.some(o => o.toLowerCase().includes(kw))) return true;
    if (q.analysis && q.analysis.toLowerCase().includes(kw)) return true;
    return false;
  }).slice(0, 50);
  if (results.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#999;padding:24px;">没有找到匹配的题目</div>';
    return;
  }
  container.innerHTML = results.map((q, i) => `
    <div class="ms-result-item" onclick="jumpToMobileSearchResult('${q.id}', '${q.subject}')">
      <span class="ms-result-idx">${i + 1}</span>
      <span>${q.question.slice(0, 60)}...</span>
      <span class="ms-result-meta">${SUBJECTS[q.subject]?.name || ''} · ${q.year}</span>
    </div>
  `).join('');
}

function jumpToMobileSearchResult(qId, subject) {
  currentFilter.subjects = [subject];
  currentFilter.years = []; currentFilter.topics = []; currentFilter.groups = [];
  mode = 'filter';
  renderGroupFilters(); renderSubjectFilters(); renderTopicFilters(); renderYearFilters();
  currentQuestions = getBank().filter(q => q.subject === subject);
  const idx = currentQuestions.findIndex(q => q.id === qId);
  renderSheet(); updateFilterStats();
  showQuestion(idx >= 0 ? idx : 0);
  toggleMobileSearch();
}

// ---- 题目左右滑动 ----
function initQuestionSwipe() {
  let startX = 0, startY = 0, swiping = false;

  document.addEventListener('touchstart', function(e) {
    // 不在刷题模式或考试中，不处理
    if (currentIndex < 0 || currentQuestions.length === 0) return;
    if (typeof Exam !== 'undefined' && Exam.state === 'running') return;
    // 如果点击的是按钮/链接/输入框，不拦截
    if (e.target.closest('button, a, input, textarea, select, .sheet-cell, .option-item, .nav-btn, .btn')) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    swiping = true;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (!swiping) return;
    swiping = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    // 水平滑动超过 30px，放宽方向判断
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 0.7) {
      if (dx < 0 && currentIndex < currentQuestions.length - 1) {
        showQuestion(currentIndex + 1);   // 左划 → 下一题
      } else if (dx > 0 && currentIndex > 0) {
        showQuestion(currentIndex - 1);   // 右划 → 上一题
      }
    }
  });
}

function jumpToTopic(topicKey) {
  const topic = TOPICS[topicKey];
  if (!topic) return;
  const baseSubj = topic.subject;
  let subjectsToSelect = [baseSubj];
  if (baseSubj === 'ma1') subjectsToSelect = ['ma1','ma2','ma3'];
  if (baseSubj === 'en1') subjectsToSelect = ['en1','en2'];
  currentFilter.subjects = subjectsToSelect;
  currentFilter.topics = [topicKey];
  currentFilter.years = [];
  currentFilter.groups = [];
  mode = 'filter';
  renderGroupFilters();
  renderSubjectFilters();
  renderTopicFilters();
  renderYearFilters();
  applyFilter();
  document.getElementById('content').scrollTop = 0;
}

// ---- 模拟考试快捷入口 ----
function startExam() {
  Exam.start();
}

function showCodeQuestions() {
  mode = 'filter';
  currentFilter.subjects = ['ds', 'co', 'os', 'cn'];
  currentFilter.years = []; currentFilter.topics = []; currentFilter.groups = [];
  renderGroupFilters(); renderSubjectFilters(); renderTopicFilters(); renderYearFilters();
  currentQuestions = getBank().filter(q => q.type === 'code');
  currentIndex = -1; selectedOption = null; selectedMulti = {};
  renderSheet(); updateFilterStats();
  if (currentQuestions.length > 0) showQuestion(0);
  else alert('没有编程题');
}

// 页面离开提醒（考试进行中）
window.addEventListener('beforeunload', (e) => {
  if (Exam.state === 'running') {
    e.preventDefault();
    e.returnValue = '考试正在进行中，确定离开吗？';
    return e.returnValue;
  }
});

init();
