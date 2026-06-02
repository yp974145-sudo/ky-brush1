// ============================================================
// 考研刷题 - 分享卡片 v3
// ============================================================

const ShareCard = {

  show() {
    this._ensureDOM();
    this._render();
    document.getElementById('share-overlay').style.display = 'flex';
  },

  close() {
    document.getElementById('share-overlay').style.display = 'none';
  },

  _render() {
    const card = document.getElementById('share-card-inner');
    const total = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []).length;
    const submitted = Storage.getSubmittedIds().length;
    const streak = Storage.getStreak();
    const wrongCount = Storage.getWrongIds().length;
    const favCount = Storage.getFavoriteIds().length;
    const exams = Storage.getExams();
    const examCount = exams.length;
    const lastExam = exams.length > 0 ? exams[0] : null;

    // 总体正确率
    let correct = 0;
    (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []).forEach(q => {
      if (!Storage.isSubmitted(q.id)) return;
      const ans = Storage.getAnswer(q.id);
      let ok = false;
      if (q.type === 'multi') {
        const c = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
        const u = (Array.isArray(ans) ? ans : [ans]).sort().join('');
        ok = c === u;
      } else if (q.type === 'fill') {
        ok = String(ans || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
      } else { ok = ans === q.answer; }
      if (ok) correct++;
    });
    const rate = submitted > 0 ? Math.round(correct / submitted * 100) : 0;

    // 生成卡片 HTML
    card.innerHTML = `
      <div class="share-card-bg">
        <div class="share-card-top">
          <div class="share-logo">📚 考研刷题</div>
          <div class="share-date">${new Date().toLocaleDateString('zh-CN')}</div>
        </div>
        <div class="share-stats">
          <div class="share-stat">
            <div class="share-stat-val" style="color:#3370ff;">${submitted}</div>
            <div class="share-stat-label">累计刷题</div>
          </div>
          <div class="share-stat">
            <div class="share-stat-val" style="color:${rate >= 60 ? '#00b96b' : '#f5a623'};">${rate}%</div>
            <div class="share-stat-label">正确率</div>
          </div>
          <div class="share-stat">
            <div class="share-stat-val" style="color:#f5a623;">${streak}</div>
            <div class="share-stat-label">连续天数</div>
          </div>
          <div class="share-stat">
            <div class="share-stat-val" style="color:#9C27B0;">${examCount}</div>
            <div class="share-stat-label">模拟考试</div>
          </div>
        </div>
        ${lastExam ? `
        <div class="share-exam">
          <div class="share-exam-label">最近考试</div>
          <div class="share-exam-info">
            ${lastExam.subject ? SUBJECTS[lastExam.subject]?.icon + ' ' + SUBJECTS[lastExam.subject]?.name : '全科'}
            · ${lastExam.correct}/${lastExam.total} 对
            · 正确率 ${lastExam.rate}%
          </div>
        </div>` : ''}
        <div class="share-footer">
          <span>📝 ${wrongCount} 错题</span>
          <span>⭐ ${favCount} 收藏</span>
          <span>📊 ${total} 题库</span>
        </div>
      </div>`;

    document.getElementById('share-card-inner').style.display = 'block';
  },

  // 复制为图片（使用 Canvas）
  async copyAsImage() {
    try {
      // 简单方案：复制文本
      const total = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []).length;
      const submitted = Storage.getSubmittedIds().length;
      let correct = 0;
      (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []).forEach(q => {
        if (!Storage.isSubmitted(q.id)) return;
        const ans = Storage.getAnswer(q.id);
        let ok = false;
        if (q.type === 'multi') {
          const c = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
          const u = (Array.isArray(ans) ? ans : [ans]).sort().join('');
          ok = c === u;
        } else { ok = ans === q.answer; }
        if (ok) correct++;
      });
      const rate = submitted > 0 ? Math.round(correct / submitted * 100) : 0;
      const text = `📚 考研刷题成绩单
━━━━━━━━━━━━━
📝 累计刷题：${submitted} 题
🎯 正确率：${rate}%
🔥 连续打卡：${Storage.getStreak()} 天
📋 错题数：${Storage.getWrongIds().length}
🏆 模拟考试：${Storage.getExams().length} 次
━━━━━━━━━━━━━
来一起刷考研真题吧！`;

      await navigator.clipboard.writeText(text);
      alert('✅ 成绩卡片已复制到剪贴板！');
    } catch(e) {
      alert('复制失败，请手动截图分享');
    }
  },

  _ensureDOM() {
    if (document.getElementById('share-overlay')) return;
    const html = `
    <div id="share-overlay" class="login-overlay" onclick="if(event.target===this)ShareCard.close()">
      <div class="share-card-wrap">
        <div class="share-card-header">
          <h3>📤 我的成绩卡</h3>
          <span class="login-close" onclick="ShareCard.close()">✕</span>
        </div>
        <div id="share-card-inner"></div>
        <div class="share-actions">
          <button class="btn btn-primary" onclick="ShareCard.copyAsImage()">📋 复制文本</button>
          <button class="btn btn-secondary" onclick="ShareCard.close()">关闭</button>
        </div>
        <p class="share-hint">💡 也可以直接截图分享给研友</p>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};
