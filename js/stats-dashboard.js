// ============================================================
// 考研刷题 - 统计仪表盘 + 打卡日历 + 错题导出 v3
// ============================================================

const Stats = {

  // ---- 仪表盘入口 ----
  show() {
    this._ensureDOM();
    const panel = document.getElementById('stats-panel');
    this._render();
    panel.style.display = 'flex';
    // 隐藏其他面板
    document.getElementById('content').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
    if (document.getElementById('exam-panel')) document.getElementById('exam-panel').style.display = 'none';
  },

  close() {
    const panel = document.getElementById('stats-panel');
    if (panel) panel.style.display = 'none';
    document.getElementById('content').style.display = '';
    if (typeof applyFilter === 'function') applyFilter();
  },

  // ---- 渲染 ----
  _render() {
    const panel = document.getElementById('stats-panel');
    const bank = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);

    // 汇总数据
    const total = bank.length;
    const submitted = Storage.getSubmittedIds().length;
    let correct = 0;
    bank.forEach(q => {
      if (!Storage.isSubmitted(q.id)) return;
      const ans = Storage.getAnswer(q.id);
      let ok = false;
      if (q.type === 'multi') {
        const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
        const u = (Array.isArray(ans)?ans:[ans]).sort().join('');
        ok = c === u;
      } else if (q.type === 'fill') {
        ok = String(ans||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
      } else { ok = ans === q.answer; }
      if (ok) correct++;
    });

    // 各科正确率
    const subjectStats = {};
    for (const [key, subj] of Object.entries(SUBJECTS)) {
      const qs = bank.filter(q => q.subject === key);
      const done = qs.filter(q => Storage.isSubmitted(q.id)).length;
      let corr = 0;
      qs.forEach(q => {
        if (!Storage.isSubmitted(q.id)) return;
        const ans = Storage.getAnswer(q.id);
        let ok = false;
        if (q.type === 'multi') {
          const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
          const u = (Array.isArray(ans)?ans:[ans]).sort().join('');
          ok = c === u;
        } else if (q.type === 'fill') {
          ok = String(ans||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
        } else { ok = ans === q.answer; }
        if (ok) corr++;
      });
      subjectStats[key] = { name: subj.name, icon: subj.icon, color: subj.color, total: qs.length, done, corr, rate: done > 0 ? Math.round(corr/done*100) : 0 };
    }

    // 薄弱知识点 Top 5
    const topicStats = {};
    for (const [key, tp] of Object.entries(TOPICS)) {
      const qs = bank.filter(q => q.topic === key);
      const done = qs.filter(q => Storage.isSubmitted(q.id)).length;
      let corr = 0;
      qs.forEach(q => {
        if (!Storage.isSubmitted(q.id)) return;
        const ans = Storage.getAnswer(q.id);
        let ok = false;
        if (q.type === 'multi') {
          const c = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join('');
          const u = (Array.isArray(ans)?ans:[ans]).sort().join('');
          ok = c === u;
        } else if (q.type === 'fill') {
          ok = String(ans||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
        } else { ok = ans === q.answer; }
        if (ok) corr++;
      });
      if (done > 0 && qs.length >= 3) {
        topicStats[key] = { name: tp.name, subj: tp.subject, done, corr, rate: Math.round(corr/done*100), total: qs.length };
      }
    }
    const weakTopics = Object.entries(topicStats)
      .sort((a, b) => a[1].rate - b[1].rate)
      .slice(0, 8);

    // 最近 7 天趋势
    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const rec = Storage.getCheckinRecords()[key];
      trendDays.push({ date: key, label: this._fmtDayLabel(d), count: rec ? rec.count : 0 });
    }
    const maxCount = Math.max(...trendDays.map(d => d.count), 1);

    // 打卡日历（最近 12 周）
    const weeks = this._buildCalendar();

    // 渲染
    panel.innerHTML = `
      <div id="stats-header">
        <div class="stats-h-left"><span class="exam-icon">📊</span><span class="exam-title">学习统计</span></div>
        <button class="btn btn-outline" style="color:#333;border-color:#ccc;" onclick="Stats.close()">✕ 关闭</button>
      </div>
      <div id="stats-body">

        <!-- 概览卡片 -->
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-card-icon">📝</div>
            <div class="stat-card-val">${total}</div>
            <div class="stat-card-label">题库总量</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">✅</div>
            <div class="stat-card-val">${submitted}</div>
            <div class="stat-card-label">已刷题数</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">🎯</div>
            <div class="stat-card-val">${submitted > 0 ? Math.round(correct/submitted*100) + '%' : '--'}</div>
            <div class="stat-card-label">总体正确率</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">🔥</div>
            <div class="stat-card-val">${Storage.getStreak()}</div>
            <div class="stat-card-label">连续天数</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">📋</div>
            <div class="stat-card-val">${Storage.getWrongIds().length}</div>
            <div class="stat-card-label">错题本</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon">⭐</div>
            <div class="stat-card-val">${Storage.getFavoriteIds().length}</div>
            <div class="stat-card-label">收藏题</div>
          </div>
        </div>

        <!-- 打卡日历 -->
        <div class="stats-section">
          <h3>📅 打卡日历</h3>
          <div class="calendar-wrap">
            <div class="calendar-months">${this._renderMonthLabels(weeks)}</div>
            <div class="calendar-grid">${this._renderCalendarCells(weeks)}</div>
          </div>
          <div class="calendar-legend">
            <span>少</span>
            <span class="cal-legend-cell cal-l0"></span>
            <span class="cal-legend-cell cal-l1"></span>
            <span class="cal-legend-cell cal-l2"></span>
            <span class="cal-legend-cell cal-l3"></span>
            <span class="cal-legend-cell cal-l4"></span>
            <span>多</span>
          </div>
        </div>

        <div class="stats-row">
          <!-- 最近 7 天趋势 -->
          <div class="stats-section stats-half">
            <h3>📈 近 7 天刷题量</h3>
            <div class="trend-chart">
              ${trendDays.map(d => `
                <div class="trend-bar-wrap">
                  <div class="trend-val">${d.count}</div>
                  <div class="trend-bar" style="height:${d.count > 0 ? Math.max(d.count/maxCount*120, 12) : 0}px;"></div>
                  <div class="trend-label">${d.label}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 薄弱知识点 -->
          <div class="stats-section stats-half">
            <h3>⚠️ 薄弱知识点</h3>
            <div class="weak-list">
              ${weakTopics.length === 0 ? '<div class="weak-empty">多刷几道题就能看到薄弱点了 ✨</div>' :
                weakTopics.map(([key, tp]) => `
                  <div class="weak-item" onclick="Stats._jumpToTopic('${key}')">
                    <span class="weak-name">${SUBJECTS[tp.subj]?.icon || ''} ${tp.name}</span>
                    <span class="weak-bar-bg"><span class="weak-bar-fill" style="width:${tp.rate}%;background:${tp.rate >= 60 ? 'var(--correct)' : tp.rate >= 40 ? '#f5a623' : 'var(--wrong)'}"></span></span>
                    <span class="weak-rate">${tp.rate}%</span>
                    <span class="weak-count">${tp.done}/${tp.total}</span>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>

        <!-- 各科正确率 -->
        <div class="stats-section">
          <h3>📚 各科正确率</h3>
          <div class="subject-bars">
            ${Object.entries(subjectStats).map(([key, s]) => `
              <div class="subject-bar-item" onclick="Stats._jumpToSubject('${key}')">
                <div class="sb-top">
                  <span class="sb-name">${s.icon} ${s.name}</span>
                  <span class="sb-num">${s.done}/${s.total}</span>
                </div>
                <div class="sb-bar-bg">
                  <div class="sb-bar-fill" style="width:${s.rate}%; background:${s.color}"></div>
                </div>
                <span class="sb-rate">${s.done > 0 ? s.rate + '%' : '未刷'}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 考试历史 -->
        <div class="stats-section">
          <h3>🏆 考试记录</h3>
          ${this._renderExamHistory()}
        </div>

        <!-- 操作按钮 -->
        <div class="stats-actions">
          <button class="btn btn-primary" onclick="Stats.exportWrongs()">🖨 导出错题（可打印）</button>
          <button class="btn btn-secondary" onclick="Stats.exportMyData()">💾 导出全部数据</button>
          <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">📥 导入数据</button>
          <input type="file" id="import-file" accept=".json" style="display:none;" onchange="Stats.importData(this)">
          <button class="btn btn-danger-text" onclick="Stats._confirmReset()">🔄 重置所有记录</button>
        </div>
      </div>`;

    document.getElementById('content').scrollTop = 0;
  },

  // ---- 日历构建 ----
  _buildCalendar() {
    const records = Storage.getCheckinRecords();
    const weeks = [];
    const today = new Date();
    // 从今天往前推 84 天（12周）
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83);
    // 对齐到周日
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const d = new Date(startDate);
    let week = [];
    while (d <= today) {
      const key = d.toISOString().slice(0, 10);
      const count = records[key] ? records[key].count : 0;
      week.push({ date: key, day: d.getDate(), month: d.getMonth(), count });
      if (d.getDay() === 6 || d.getTime() === today.getTime()) {
        while (week.length < 7) week.push(null); // 补齐
        weeks.push(week);
        week = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  },

  _renderMonthLabels(weeks) {
    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    let labels = '';
    let lastMonth = -1;
    weeks.forEach(w => {
      const validDay = w.find(d => d !== null);
      if (validDay && validDay.month !== lastMonth) {
        lastMonth = validDay.month;
        labels += `<span class="cal-month-label">${monthNames[validDay.month]}</span>`;
      } else {
        labels += '<span class="cal-month-label"></span>';
      }
    });
    return labels;
  },

  _renderCalendarCells(weeks) {
    const today = new Date().toISOString().slice(0, 10);
    let html = '';
    // 7 行（周日~周六）x N 列（周数）
    for (let row = 0; row < 7; row++) {
      weeks.forEach(w => {
        const d = w[row];
        if (d === null) {
          html += '<div class="cal-cell cal-empty"></div>';
        } else {
          const level = d.count === 0 ? 0 : d.count <= 5 ? 1 : d.count <= 15 ? 2 : d.count <= 30 ? 3 : 4;
          const isToday = d.date === today;
          html += `<div class="cal-cell cal-l${level}${isToday ? ' cal-today' : ''}" title="${d.date}: ${d.count} 题">${isToday ? '' : ''}</div>`;
        }
      });
    }
    return html;
  },

  _renderExamHistory() {
    const exams = Storage.getExams();
    if (exams.length === 0) {
      return '<div class="weak-empty">还没有考试记录，来一次模拟考试吧 ⏱</div>';
    }
    return `<div class="exam-history">
      ${exams.slice(0, 10).map(ex => `
        <div class="exam-hist-item">
          <span class="exam-hist-date">${ex.date ? new Date(ex.date).toLocaleDateString('zh-CN') : ''}</span>
          <span class="exam-hist-subj">${ex.subject ? (SUBJECTS[ex.subject]?.icon + ' ' + SUBJECTS[ex.subject]?.name) : '全部科目'}</span>
          <span class="exam-hist-score" style="color:${ex.rate >= 60 ? 'var(--correct)' : 'var(--wrong)'}">${ex.rate}%</span>
          <span class="exam-hist-detail">${ex.correct}/${ex.total} 对</span>
          <span class="exam-hist-time">${this._fmtDuration(ex.elapsed)}</span>
        </div>
      `).join('')}
    </div>`;
  },

  // ---- 错题导出 ----
  exportWrongs() {
    const wrongIds = Storage.getWrongIds();
    if (wrongIds.length === 0) {
      alert('🎉 没有错题！继续加油～');
      return;
    }
    const bank = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);
    const wrongQs = bank.filter(q => wrongIds.includes(q.id));

    // 按科目分组
    const grouped = {};
    wrongQs.forEach(q => {
      const subj = SUBJECTS[q.subject]?.name || q.subject;
      if (!grouped[subj]) grouped[subj] = [];
      grouped[subj].push(q);
    });

    // 生成可打印 HTML
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>错题集 - 考研刷题</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;padding:20px;color:#333;max-width:800px;margin:0 auto}
  h1{text-align:center;margin-bottom:6px;font-size:22px}
  .subtitle{text-align:center;color:#999;font-size:12px;margin-bottom:20px}
  h2{margin:20px 0 12px;font-size:16px;border-bottom:2px solid #3370ff;padding-bottom:4px}
  .q-item{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:14px;margin-bottom:12px;page-break-inside:avoid}
  .q-title{font-weight:600;font-size:14px;margin-bottom:6px}
  .q-text{font-size:14px;line-height:1.7;margin-bottom:6px}
  .q-opt{font-size:13px;line-height:1.6;margin-bottom:4px;padding-left:8px}
  .q-answer{margin-top:8px;font-size:13px}
  .q-answer .correct{color:#00b96b;font-weight:600}
  .q-answer .wrong{color:#f54a45}
  .q-analysis{margin-top:6px;font-size:12px;color:#666;border-left:3px solid #3370ff;padding-left:8px}
  pre{background:#1e1e2e;color:#cdd6f4;padding:10px;border-radius:6px;font-size:12px;overflow-x:auto}
  @media print{body{padding:0}.q-item{border:none;border-bottom:1px dashed #ccc;border-radius:0}}
</style></head><body>
<h1>📋 错题集</h1>
<div class="subtitle">导出时间：${new Date().toLocaleString('zh-CN')} · 共 ${wrongQs.length} 道错题</div>`;

    for (const [subj, qs] of Object.entries(grouped)) {
      html += `<h2>${subj}（${qs.length}题）</h2>`;
      qs.forEach((q, i) => {
        const userAns = Storage.getAnswer(q.id);
        const correctAns = Array.isArray(q.answer) ? q.answer.join('') : q.answer;
        const userDisplay = Array.isArray(userAns) ? (userAns.length ? userAns.join('') : '未作答') : (userAns || '未作答');
        html += `<div class="q-item">
          <div class="q-title">${i + 1}. ${q.year}年 · ${TOPICS[q.topic]?.name || ''}</div>
          <div class="q-text">${q.question}</div>
          ${q.code ? `<pre>${q.code}</pre>` : ''}
          ${q.options ? q.options.map(o => `<div class="q-opt">${o}</div>`).join('') : ''}
          <div class="q-answer">
            <span class="wrong">你的答案：${userDisplay}</span> ｜
            <span class="correct">正确答案：${correctAns}</span>
          </div>
          ${q.analysis ? `<div class="q-analysis">📖 ${q.analysis}</div>` : ''}
        </div>`;
      });
    }

    html += '</body></html>';

    // 在新窗口打开
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  },

  // ---- 数据导出 ----
  exportMyData() {
    const data = Storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `考研刷题_备份_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (confirm('导入将合并数据（不覆盖已有记录），确定吗？')) {
        const ok = Storage.importData(e.target.result);
        if (ok) {
          alert('✅ 导入成功！');
          // 刷新全局变量
          window.userAnswers = Storage.get('userAnswers');
          window.markedQuestions = Storage.get('markedQuestions');
          window.submittedQuestions = Storage.get('submittedQuestions');
          window.wrongBook = Storage.get('wrongBook');
          this._render();
          if (typeof updateAllStats === 'function') updateAllStats();
          if (typeof applyFilter === 'function') applyFilter();
        } else {
          alert('❌ 数据格式错误');
        }
      }
    };
    reader.readAsText(file);
    input.value = '';
  },

  _confirmReset() {
    if (!confirm('确定要重置所有答题记录吗？此操作不可恢复。')) return;
    if (!confirm('再次确认：所有做题记录、错题、收藏、笔记将被清空。')) return;
    Storage.reset();
    window.userAnswers = Storage.get('userAnswers');
    window.markedQuestions = Storage.get('markedQuestions');
    window.submittedQuestions = Storage.get('submittedQuestions');
    window.wrongBook = Storage.get('wrongBook');
    this._render();
    if (typeof updateAllStats === 'function') updateAllStats();
    if (typeof applyFilter === 'function') applyFilter();
  },

  _jumpToTopic(topicKey) {
    this.close();
    if (typeof jumpToTopic === 'function') jumpToTopic(topicKey);
  },

  _jumpToSubject(subj) {
    this.close();
    if (typeof currentFilter !== 'undefined') {
      currentFilter.subjects = [subj];
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

  _fmtDayLabel(d) {
    const days = ['日','一','二','三','四','五','六'];
    return `${d.getMonth()+1}/${d.getDate()} 周${days[d.getDay()]}`;
  },

  _fmtDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m >= 60) return `${Math.floor(m/60)}h${m%60}m`;
    return `${m}m${s}s`;
  },

  _ensureDOM() {
    if (document.getElementById('stats-panel')) return;
    const html = `<div id="stats-panel" style="display:none;"></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};
