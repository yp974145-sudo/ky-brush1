// ============================================================
// 考研刷题 - 核心逻辑 v2
// ============================================================

// ---- 全局 ----
let currentFilter = { groups: [], subjects: [], years: [], topics: [] };
let currentQuestions = [], currentIndex = -1, selectedOption = null, selectedMulti = {};
let userAnswers = {}, markedQuestions = {}, submittedQuestions = {}, wrongBook = {};
let mode = 'filter';

const QUESTION_BANK = [
  ...(typeof QUESTIONS_408 !== 'undefined' ? QUESTIONS_408 : []),
  ...(typeof QUESTIONS_MATH !== 'undefined' ? QUESTIONS_MATH : []),
  ...(typeof QUESTIONS_POLITICS !== 'undefined' ? QUESTIONS_POLITICS : []),
  ...(typeof QUESTIONS_ENGLISH !== 'undefined' ? QUESTIONS_ENGLISH : [])
];

// ---- Init ----
function init() {
  loadFromStorage();
  renderGroupFilters();
  renderSubjectFilters();
  renderYearFilters();
  renderTopicFilters();
  selectAllSubjects();
  updateAllStats();
}

// ---- Storage ----
function loadFromStorage() {
  try {
    const s = JSON.parse(localStorage.getItem('ky-brush') || '{}');
    userAnswers = s.userAnswers || {};
    markedQuestions = s.markedQuestions || {};
    submittedQuestions = s.submittedQuestions || {};
    wrongBook = s.wrongBook || {};
  } catch(e) {}
}
function saveToStorage() {
  localStorage.setItem('ky-brush', JSON.stringify({userAnswers, markedQuestions, submittedQuestions, wrongBook}));
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
  // 同步更新subjects
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
  renderGroupFilters();
  renderSubjectFilters();
  renderYearFilters();
  renderTopicFilters();
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

// ---- Topic Filters ----
function renderTopicFilters() {
  const c = document.getElementById('topic-filters');
  let subj = currentFilter.subjects.length === 1 ? currentFilter.subjects[0] : null;
  c.innerHTML = '';
  if (!subj) {
    c.innerHTML = '<span style="font-size:12px;color:#999;">选择单个学科后显示知识点</span>';
    return;
  }
  // 数学二/三映射到数一的知识点体系
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
  mode = 'filter';
  // 数学二/三的题目topic属于ma-*，与ma1共用知识点体系
  const topicSubjects = currentFilter.topics.map(t => {
    const tp = TOPICS[t];
    if (!tp) return t;
    if (tp.subject === 'ma1') return ['ma1','ma2','ma3'];
    if (tp.subject === 'en1') return ['en1','en2'];
    return [tp.subject];
  }).flat();
  currentQuestions = QUESTION_BANK.filter(q => {
    const s = currentFilter.subjects.length === 0 || currentFilter.subjects.includes(q.subject);
    const y = currentFilter.years.length === 0 || currentFilter.years.includes(q.year);
    const t = currentFilter.topics.length === 0 || topicSubjects.includes(q.subject);
    return s && y && t;
  });
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
  currentQuestions = [...QUESTION_BANK];
  shuffle(currentQuestions);
  currentIndex = -1; selectedOption = null; selectedMulti = {};
  renderSheet(); updateFilterStats(); showQuestion(0);
}

function reviewWrong() {
  mode = 'wrong';
  currentQuestions = QUESTION_BANK.filter(q => wrongBook[q.id]);
  currentIndex = -1; selectedOption = null; selectedMulti = {};
  renderSheet(); updateFilterStats();
  if (currentQuestions.length > 0) showQuestion(0);
  else { alert('🎉 错题本为空！'); selectAllSubjects(); }
}

function toggleWrongBook() { reviewWrong(); }

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
  const typeInfo = QUESTION_TYPES[q.type] || QUESTION_TYPES.single;
  const diff = DIFFICULTY[q.difficulty] || DIFFICULTY.medium;
  document.getElementById('q-tag').innerHTML =
    `<span class="tag" style="background:${SUBJECTS[q.subject].color}20;color:${SUBJECTS[q.subject].color};border:1px solid ${SUBJECTS[q.subject].color}40;">${SUBJECTS[q.subject].icon} ${SUBJECTS[q.subject].name}</span>
     <span class="tag" style="background:#f0f0f0;">${q.year}年</span>
     ${topicInfo ? `<span class="tag topic-clickable" style="background:#fff3e0;color:#e65100;border:1px solid #ffe0b2;cursor:pointer;" onclick="jumpToTopic('${q.topic}')" title="点击查看「${topicInfo.name}」全部题目">📌 ${topicInfo.name}</span>` : ''}
     <span class="tag" style="background:${diff.bg};color:${diff.color};border:1px solid ${diff.color}40;">⬤ ${diff.label}</span>
     <span class="tag" style="background:#e8eaf6;color:#283593;border:1px solid #c5cae9;">${typeInfo.icon} ${typeInfo.name}</span>`;

  // Passage (for English reading)
  const passageEl = document.getElementById('q-passage');
  if (q.passage) { passageEl.style.display = 'block'; passageEl.innerHTML = `<div class="passage-box">${q.passage}</div>`; }
  else passageEl.style.display = 'none';

  // Question text
  document.getElementById('q-text').textContent = q.question;

  // Code
  const codeEl = document.getElementById('q-code');
  codeEl.style.display = q.code ? 'block' : 'none';
  if (q.code) codeEl.textContent = q.code;

  // Options (for single/multi)
  const optEl = document.getElementById('q-options');
  const fillEl = document.getElementById('q-fill');
  const submitted = submittedQuestions[q.id];

  if (q.type === 'fill') {
    optEl.style.display = 'none'; fillEl.style.display = 'block';
    const inp = document.getElementById('fill-answer');
    inp.value = submitted ? (userAnswers[q.id] || '') : (userAnswers[q.id] || '');
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
      div.innerHTML = `<span class="option-letter">${letter}</span><span>${opt.substring(2).trim()}</span>`;

      if (submitted) {
        div.classList.add('disabled');
        const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
        if (correctAnswers.includes(letter)) div.classList.add('correct-answer');
        const userAns = Array.isArray(userAnswers[q.id]) ? userAnswers[q.id] : [userAnswers[q.id]];
        if (userAns.includes(letter) && !correctAnswers.includes(letter)) div.classList.add('wrong-answer');
      } else {
        if (isMulti) {
          if (selectedMulti[letter]) div.classList.add('selected');
          else if (userAnswers[q.id] && Array.isArray(userAnswers[q.id]) && userAnswers[q.id].includes(letter)) div.classList.add('selected');
        } else {
          if (letter === selectedOption || (userAnswers[q.id] === letter && !Array.isArray(userAnswers[q.id]))) div.classList.add('selected');
        }
      }

      div.onclick = () => {
        if (submitted) return;
        if (isMulti) {
          if (selectedMulti[letter]) delete selectedMulti[letter];
          else selectedMulti[letter] = true;
          userAnswers[q.id] = Object.keys(selectedMulti).sort();
          saveToStorage();
          showQuestion(currentIndex);
        } else {
          selectedOption = letter;
          userAnswers[q.id] = letter;
          saveToStorage();
          showQuestion(currentIndex);
        }
      };
      optEl.appendChild(div);
    });
  }

  // Buttons
  document.getElementById('btn-submit').style.display = submitted ? 'none' : 'inline-flex';
  document.getElementById('btn-mark').style.display = submitted ? 'none' : 'inline-flex';
  document.getElementById('btn-next').style.display = submitted ? 'inline-flex' : 'none';
  document.getElementById('btn-mark').textContent = markedQuestions[q.id] ? '🏷 取消标记' : '🏷 标记';

  // Result
  const resultArea = document.getElementById('result-area');
  if (submitted) {
    resultArea.style.display = 'block';
    const userAns = userAnswers[q.id];
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
    if (q.type === 'multi' && userAnswers[q.id] && Array.isArray(userAnswers[q.id])) {
      userAnswers[q.id].forEach(l => selectedMulti[l] = true);
    }
    if (q.type !== 'multi' && userAnswers[q.id] && !Array.isArray(userAnswers[q.id]) && !submitted) {
      selectedOption = userAnswers[q.id];
    }
  }

  renderSheet(); updateFilterStats();
  document.getElementById('content').scrollTop = 0;
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
    userAnswers[q.id] = val.trim();
  } else if (q.type === 'multi') {
    const keys = Object.keys(selectedMulti);
    if (keys.length === 0 && (!userAnswers[q.id] || !Array.isArray(userAnswers[q.id]))) return;
    if (keys.length > 0) userAnswers[q.id] = keys.sort();
  } else {
    if (!selectedOption && !userAnswers[q.id]) return;
    if (selectedOption) userAnswers[q.id] = selectedOption;
  }
  submittedQuestions[q.id] = true;

  // Check
  let isCorrect = false;
  if (q.type === 'multi') {
    const correct = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
    const user = (Array.isArray(userAnswers[q.id]) ? userAnswers[q.id] : [userAnswers[q.id]]).sort().join('');
    isCorrect = correct === user;
  } else if (q.type === 'fill') {
    isCorrect = String(userAnswers[q.id] || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
  } else {
    isCorrect = userAnswers[q.id] === q.answer;
  }

  if (!isCorrect) wrongBook[q.id] = true;
  saveToStorage(); renderSheet(); updateAllStats(); updateFilterStats();
  showQuestion(currentIndex);
}

function toggleMark() {
  const q = currentQuestions[currentIndex];
  if (submittedQuestions[q.id]) return;
  if (markedQuestions[q.id]) delete markedQuestions[q.id];
  else markedQuestions[q.id] = true;
  saveToStorage(); renderSheet();
  showQuestion(currentIndex);
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
    if (submittedQuestions[q.id]) {
      let isCorrect = false;
      if (q.type === 'multi') {
        const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
        const u = (Array.isArray(userAnswers[q.id])?userAnswers[q.id]:[userAnswers[q.id]]).sort().join('');
        isCorrect = c === u;
      } else if (q.type === 'fill') {
        isCorrect = String(userAnswers[q.id]||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
      } else {
        isCorrect = userAnswers[q.id] === q.answer;
      }
      cell.classList.add(isCorrect ? 'correct-cell' : 'wrong-cell');
    }
    if (markedQuestions[q.id]) cell.classList.add('marked-cell');
    grid.appendChild(cell);
  });
}

// ---- Stats ----
function updateAllStats() {
  const done = Object.keys(submittedQuestions).length;
  let corr = 0;
  QUESTION_BANK.forEach(q => {
    if (!submittedQuestions[q.id]) return;
    let isCorrect = false;
    if (q.type === 'multi') {
      const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
      const u = (Array.isArray(userAnswers[q.id])?userAnswers[q.id]:[userAnswers[q.id]]).sort().join('');
      isCorrect = c === u;
    } else if (q.type === 'fill') {
      isCorrect = String(userAnswers[q.id]||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
    } else {
      isCorrect = userAnswers[q.id] === q.answer;
    }
    if (isCorrect) corr++;
  });
  document.getElementById('stat-total').textContent = QUESTION_BANK.length;
  document.getElementById('stat-correct').textContent = corr;
  document.getElementById('stat-wrong').textContent = done - corr;
  document.getElementById('stat-rate').textContent = done > 0 ? Math.round(corr/done*100)+'%' : '--';
  document.getElementById('wrong-count').textContent = Object.keys(wrongBook).length;
}

function updateFilterStats() {
  document.getElementById('filter-count').textContent = currentQuestions.length;
  const done = currentQuestions.filter(q => submittedQuestions[q.id]).length;
  let corr = 0;
  currentQuestions.forEach(q => {
    if (!submittedQuestions[q.id]) return;
    let isCorrect = false;
    if (q.type === 'multi') {
      const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
      const u = (Array.isArray(userAnswers[q.id])?userAnswers[q.id]:[userAnswers[q.id]]).sort().join('');
      isCorrect = c === u;
    } else if (q.type === 'fill') {
      isCorrect = String(userAnswers[q.id]||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
    } else {
      isCorrect = userAnswers[q.id] === q.answer;
    }
    if (isCorrect) corr++;
  });
  document.getElementById('filter-done').textContent = done;
  document.getElementById('filter-rate').textContent = done > 0 ? Math.round(corr/done*100)+'%' : '--';
}

// ---- Reset ----
function resetProgress() {
  if (!confirm('确定要重置所有答题记录吗？此操作不可恢复。')) return;
  userAnswers = {}; markedQuestions = {}; submittedQuestions = {}; wrongBook = {};
  selectedOption = null; selectedMulti = {};
  saveToStorage(); updateAllStats(); applyFilter();
}

// ---- Utils ----
function shuffle(a) { for (let i = a.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

// ---- Keyboard ----
document.addEventListener('keydown', (e) => {
  if (currentIndex < 0 || currentQuestions.length === 0) return;
  const q = currentQuestions[currentIndex];
  if (submittedQuestions[q.id]) {
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
      userAnswers[q.id] = Object.keys(selectedMulti).sort();
      saveToStorage();
      showQuestion(currentIndex);
    } else {
      selectOptionUniversal(key);
    }
  }
  if (e.key === 'Enter') { e.preventDefault(); submitAnswer(); }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); if (currentIndex < currentQuestions.length-1) showQuestion(currentIndex+1); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); if (currentIndex > 0) showQuestion(currentIndex-1); }
});

function selectOptionUniversal(letter) {
  selectedOption = letter;
  userAnswers[currentQuestions[currentIndex].id] = letter;
  saveToStorage();
  showQuestion(currentIndex);
}

// ---- Start ----
// 移动端切换
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}
function toggleSheet() {
  document.getElementById('answer-sheet').classList.toggle('open');
  document.getElementById('sheet-overlay').classList.toggle('show');
}
// 点击知识点标签跳转
function jumpToTopic(topicKey) {
  const topic = TOPICS[topicKey];
  if (!topic) return;
  // 找到topic对应的base subject，再映射回可能的subject key
  const baseSubj = topic.subject;
  // 选中包含该知识点的学科
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

init();
