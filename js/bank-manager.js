// ============================================================
// 考研刷题 - 题库管理 v1
// 粘贴文本 → 自动解析 → 入库 → 导出JS
// ============================================================

const BankManager = {
  // localStorage 中的导入题目
  _storageKey: 'ky-imported-questions',

  // ---- 格式模板 ----
  getTemplate() {
    return `Q: 下面程序段的时间复杂度是（  ）。
A. O(log₂n)
B. O(n)
C. O(nlog₂n)
D. O(n²)
答案: A
解析: x从2开始每次乘2，循环次数约log₂(n/2)，即O(log₂n)。
知识点: ds-1
年份: 2025
难度: 中等
类型: 单选
代码: x = 2;
while (x < n/2)
    x = 2 * x;
---
Q: 下一题题干...
A. 选项A
B. 选项B
C. 选项C
D. 选项D
答案: B
解析: 解析内容
知识点: ds-5
年份: 2024
---
（用 --- 分隔多道题，可一次粘贴几十道）`;
  },

  // ---- 显示管理面板 ----
  show() {
    this._ensureDOM();
    document.getElementById('bank-panel').style.display = 'flex';
    ['content','welcome','exam-panel','kaoyan-panel','planner-panel','stats-panel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    this._renderImport();
  },

  close() {
    document.getElementById('bank-panel').style.display = 'none';
    document.getElementById('content').style.display = '';
    if (typeof applyFilter === 'function') applyFilter();
  },

  // ---- 导入页 ----
  _renderImport() {
    const el = document.getElementById('bank-panel');
    const imported = this._getImported();
    const subjects = typeof SUBJECTS !== 'undefined' ? SUBJECTS : {};
    const topics = typeof TOPICS !== 'undefined' ? TOPICS : {};

    // 知识点快速参考
    const topicRef = Object.entries(topics).map(([k, v]) =>
      `<span class="bm-topic-ref" onclick="document.getElementById('bm-text').value+='\\n知识点: ${k}'">${k}: ${v.name}</span>`
    ).join('');

    el.innerHTML = `
      <div class="bm-header">
        <h2>📦 题库管理</h2>
        <div class="bm-tabs">
          <button class="bm-tab active" onclick="BankManager._renderImport()">📥 批量导入</button>
          <button class="bm-tab" onclick="BankManager._renderManual()">✏️ 手动添加</button>
          <button class="bm-tab" onclick="BankManager._renderList()">📋 已导入 (${imported.length}题)</button>
          <button class="bm-tab" onclick="BankManager._renderExport()">💾 导出</button>
        </div>
        <button class="btn btn-icon" onclick="BankManager.close()" style="color:var(--text);font-size:22px;">✕</button>
      </div>

      <div class="bm-body">
        <div class="bm-section">
          <h4>📋 粘贴题目文本（从PDF复制）</h4>
          <p class="bm-hint">每道题用 <code>---</code> 分隔。支持字段：Q(题干) A/B/C/D(选项) 答案 解析 知识点 年份 难度 类型 代码</p>
        </div>

        <textarea id="bm-text" class="bm-textarea" placeholder="在此粘贴题目文本...&#10;&#10;格式示例：&#10;Q: 题目内容&#10;A. 选项A&#10;B. 选项B&#10;C. 选项C&#10;D. 选项D&#10;答案: A&#10;解析: 解析内容&#10;知识点: ds-1&#10;年份: 2025&#10;---"></textarea>

        <div class="bm-actions">
          <button class="btn btn-primary" onclick="BankManager._preview()">🔍 预览解析</button>
          <button class="btn btn-secondary" onclick="document.getElementById('bm-text').value=BankManager.getTemplate()">📝 填入模板</button>
          <button class="btn btn-secondary" onclick="document.getElementById('bm-text').value=''">🗑 清空</button>
        </div>

        <div class="bm-section" style="margin-top:12px;">
          <h4>🏷 知识点ID速查（点击插入）</h4>
          <div class="bm-topic-refs">${topicRef}</div>
        </div>

        <div id="bm-preview"></div>
        <div id="bm-imported-msg" class="bm-msg" style="display:none;"></div>
      </div>
    `;
  },

  // ---- 手动添加 ----
  _renderManual() {
    const el = document.getElementById('bank-panel');
    const subjects = typeof SUBJECTS !== 'undefined' ? SUBJECTS : {};
    const topics = typeof TOPICS !== 'undefined' ? TOPICS : {};

    const subjectOpts = ['408','math','politics','english'].map(g => {
      const subs = Object.entries(subjects).filter(([k,v]) => v.group === g);
      return `<optgroup label="${g}">${subs.map(([k,v]) => `<option value="${k}">${v.icon} ${v.name}</option>`).join('')}</optgroup>`;
    }).join('');

    const topicOpts = Object.entries(topics).map(([k,v]) =>
      `<option value="${k}">${v.name} (${k})</option>`
    ).join('');

    el.innerHTML = `
      <div class="bm-header">
        <h2>📦 题库管理</h2>
        <div class="bm-tabs">
          <button class="bm-tab" onclick="BankManager._renderImport()">📥 批量导入</button>
          <button class="bm-tab active" onclick="BankManager._renderManual()">✏️ 手动添加</button>
          <button class="bm-tab" onclick="BankManager._renderList()">📋 已导入</button>
          <button class="bm-tab" onclick="BankManager._renderExport()">💾 导出</button>
        </div>
        <button class="btn btn-icon" onclick="BankManager.close()" style="color:var(--text);font-size:22px;">✕</button>
      </div>

      <div class="bm-body">
        <div class="bm-form">
          <div class="bm-field"><label>题干 *</label><textarea id="bm-q" class="bm-input" rows="3"></textarea></div>
          <div class="bm-field"><label>选项A</label><input id="bm-optA" class="bm-input" placeholder="A. ..."></div>
          <div class="bm-field"><label>选项B</label><input id="bm-optB" class="bm-input" placeholder="B. ..."></div>
          <div class="bm-field"><label>选项C</label><input id="bm-optC" class="bm-input" placeholder="C. ..."></div>
          <div class="bm-field"><label>选项D</label><input id="bm-optD" class="bm-input" placeholder="D. ..."></div>
          <div class="bm-row">
            <div class="bm-field"><label>答案 *</label><select id="bm-ans" class="bm-select"><option>A</option><option>B</option><option>C</option><option>D</option></select></div>
            <div class="bm-field"><label>科目</label><select id="bm-subj" class="bm-select">${subjectOpts}</select></div>
            <div class="bm-field"><label>知识点</label><select id="bm-topic" class="bm-select"><option value="">无</option>${topicOpts}</select></div>
          </div>
          <div class="bm-row">
            <div class="bm-field"><label>年份</label><input id="bm-year" class="bm-input" placeholder="2025"></div>
            <div class="bm-field"><label>难度</label><select id="bm-diff" class="bm-select"><option value="easy">简单</option><option value="medium" selected>中等</option><option value="hard">较难</option></select></div>
            <div class="bm-field"><label>类型</label><select id="bm-type" class="bm-select"><option value="single" selected>单选</option><option value="multi">多选</option><option value="fill">填空</option></select></div>
          </div>
          <div class="bm-field"><label>代码块</label><textarea id="bm-code" class="bm-input" rows="3" placeholder="可选"></textarea></div>
          <div class="bm-field"><label>解析</label><textarea id="bm-analysis" class="bm-input" rows="2" placeholder="可选"></textarea></div>
          <button class="btn btn-primary btn-full-login" onclick="BankManager._addManual()">✅ 添加到题库</button>
          <div id="bm-imported-msg" class="bm-msg" style="display:none;"></div>
        </div>
      </div>
    `;
  },

  // ---- 已导入列表 ----
  _renderList() {
    const el = document.getElementById('bank-panel');
    const imported = this._getImported();
    const subjects = typeof SUBJECTS !== 'undefined' ? SUBJECTS : {};
    const topics = typeof TOPICS !== 'undefined' ? TOPICS : {};

    el.innerHTML = `
      <div class="bm-header">
        <h2>📦 题库管理</h2>
        <div class="bm-tabs">
          <button class="bm-tab" onclick="BankManager._renderImport()">📥 批量导入</button>
          <button class="bm-tab" onclick="BankManager._renderManual()">✏️ 手动添加</button>
          <button class="bm-tab active" onclick="BankManager._renderList()">📋 已导入 (${imported.length}题)</button>
          <button class="bm-tab" onclick="BankManager._renderExport()">💾 导出</button>
        </div>
        <button class="btn btn-icon" onclick="BankManager.close()" style="color:var(--text);font-size:22px;">✕</button>
      </div>

      <div class="bm-body">
        ${imported.length === 0 ? '<p style="text-align:center;color:#999;padding:40px;">还没有导入题目</p>' : ''}
        ${imported.map((q, i) => `
          <div class="bm-q-card">
            <div class="bm-q-head">
              <span class="bm-q-id">#${i+1}</span>
              <span class="bm-q-title">${q.question.slice(0,80)}...</span>
              <span class="bm-q-tag">${topics[q.topic]?.name || q.topic}</span>
              <span class="bm-q-tag">${q.year}</span>
              <span class="bm-q-tag">${q.answer}</span>
              <button class="btn btn-sm" onclick="BankManager._deleteQ(${i});BankManager._renderList()" style="margin-left:auto;color:#f54a45;">删除</button>
            </div>
          </div>
        `).join('')}
        ${imported.length > 0 ? `<button class="btn btn-danger-text btn-full-login" onclick="if(confirm('确定删除全部${imported.length}道导入题？')){BankManager._clearAll();BankManager._renderList()}">🗑 清空全部导入题</button>` : ''}
      </div>
    `;
  },

  // ---- 导出 ----
  _renderExport() {
    const el = document.getElementById('bank-panel');
    const imported = this._getImported();
    const jsCode = this._generateJS(imported);

    el.innerHTML = `
      <div class="bm-header">
        <h2>📦 题库管理</h2>
        <div class="bm-tabs">
          <button class="bm-tab" onclick="BankManager._renderImport()">📥 批量导入</button>
          <button class="bm-tab" onclick="BankManager._renderManual()">✏️ 手动添加</button>
          <button class="bm-tab" onclick="BankManager._renderList()">📋 已导入</button>
          <button class="bm-tab active" onclick="BankManager._renderExport()">💾 导出</button>
        </div>
        <button class="btn btn-icon" onclick="BankManager.close()" style="color:var(--text);font-size:22px;">✕</button>
      </div>

      <div class="bm-body">
        <p>共 <strong>${imported.length}</strong> 道待导出题目</p>
        <p class="bm-hint">生成 data-imported.js 文件，放到 js/ 目录，index.html 中引入即可永久入库。</p>
        <textarea id="bm-export-code" class="bm-textarea" rows="20" readonly>${jsCode}</textarea>
        <div class="bm-actions">
          <button class="btn btn-primary" onclick="BankManager._downloadJS()">💾 下载 JS 文件</button>
          <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('bm-export-code').value);alert('已复制到剪贴板')">📋 复制代码</button>
        </div>
      </div>
    `;
  },

  // ---- 预览解析 ----
  _preview() {
    const text = document.getElementById('bm-text').value.trim();
    if (!text) return;
    const parsed = this._parseText(text);
    const preview = document.getElementById('bm-preview');
    const subjects = typeof SUBJECTS !== 'undefined' ? SUBJECTS : {};
    const topics = typeof TOPICS !== 'undefined' ? TOPICS : {};

    if (parsed.errors.length > 0) {
      preview.innerHTML = `<div class="bm-error">⚠️ ${parsed.errors.join('<br>')}</div>`;
      return;
    }

    preview.innerHTML = `
      <div class="bm-section"><h4>✅ 解析成功 — ${parsed.questions.length} 道题</h4></div>
      ${parsed.questions.map((q, i) => `
        <div class="bm-q-preview">
          <div class="bm-q-phead">#${i+1} · ${subjects[q.subject]?.name || q.subject} · ${q.year} · ${topics[q.topic]?.name || q.topic} · 答案: ${Array.isArray(q.answer)?q.answer.join(''):q.answer}</div>
          <div class="bm-q-pbody">${q.question}</div>
          ${q.options ? q.options.map(o => `<div class="bm-q-popt">${o}</div>`).join('') : ''}
          ${q.code ? `<pre class="bm-q-pcode">${q.code}</pre>` : ''}
          ${q.analysis ? `<div class="bm-q-panalysis">📖 ${q.analysis}</div>` : ''}
        </div>
      `).join('')}
      <button class="btn btn-primary btn-full-login" onclick="BankManager._importParsed()">✅ 确认导入 ${parsed.questions.length} 题</button>
    `;
    // 暂存解析结果
    window._bmParsed = parsed.questions;
  },

  _importParsed() {
    if (!window._bmParsed || window._bmParsed.length === 0) return;
    const imported = this._getImported();
    window._bmParsed.forEach(q => imported.push(q));
    this._saveImported(imported);
    refreshQuestionBank();
    if (typeof updateAllStats === 'function') updateAllStats();
    if (typeof applyFilter === 'function') applyFilter();
    document.getElementById('bm-text').value = '';
    document.getElementById('bm-preview').innerHTML = '';
    this._showMsg(`✅ 成功导入 ${window._bmParsed.length} 题！总共 ${imported.length} 题`);
    window._bmParsed = null;
  },

  // ---- 手动添加 ----
  _addManual() {
    const q = document.getElementById('bm-q').value.trim();
    const subj = document.getElementById('bm-subj').value;
    if (!q) return alert('请填写题干');

    const opts = ['A','B','C','D'].map(l => {
      const v = document.getElementById('bm-opt'+l).value.trim();
      return v ? `${l}. ${v}` : null;
    }).filter(Boolean);

    const question = {
      id: 'imported-' + Date.now(),
      year: parseInt(document.getElementById('bm-year').value) || 2025,
      subject: subj,
      topic: document.getElementById('bm-topic').value || '',
      type: document.getElementById('bm-type').value || 'single',
      difficulty: document.getElementById('bm-diff').value || 'medium',
      question: q,
      options: opts.length > 0 ? opts : undefined,
      answer: document.getElementById('bm-ans').value,
      code: document.getElementById('bm-code').value.trim() || undefined,
      analysis: document.getElementById('bm-analysis').value.trim() || undefined,
    };

    const imported = this._getImported();
    imported.push(question);
    this._saveImported(imported);
    refreshQuestionBank();
    if (typeof updateAllStats === 'function') updateAllStats();
    this._showMsg(`✅ 已添加！总共 ${imported.length} 题`);
    this._renderManual();
  },

  // ---- 解析引擎 ----
  _parseText(text) {
    const blocks = text.split(/^---$/m);
    const questions = [];
    const errors = [];

    blocks.forEach((block, idx) => {
      block = block.trim();
      if (!block) return;

      const q = { id: 'imported-' + Date.now() + '-' + idx, type: 'single', difficulty: 'medium' };
      const lines = block.split('\n');

      let currentKey = null;
      let options = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // 匹配键值对
        const kvMatch = line.match(/^(Q|题干|题目)[:：]\s*(.*)/i);
        if (kvMatch) { q.question = kvMatch[2]; currentKey = 'Q'; continue; }

        const ansMatch = line.match(/^(答案|Answer)[:：]\s*(.*)/i);
        if (ansMatch) { q.answer = ansMatch[2].trim().toUpperCase(); currentKey = null; continue; }

        const analysisMatch = line.match(/^(解析|分析|Analysis)[:：]\s*(.*)/i);
        if (analysisMatch) { q.analysis = analysisMatch[2]; currentKey = null; continue; }

        const topicMatch = line.match(/^(知识点|Topic)[:：]\s*(.*)/i);
        if (topicMatch) { q.topic = topicMatch[2].trim(); currentKey = null; continue; }

        const yearMatch = line.match(/^(年份|Year)[:：]\s*(\d+)/i);
        if (yearMatch) { q.year = parseInt(yearMatch[2]); currentKey = null; continue; }

        const diffMatch = line.match(/^(难度|Difficulty)[:：]\s*(.*)/i);
        if (diffMatch) {
          const d = diffMatch[2].trim();
          if (d.includes('简单') || d.includes('easy')) q.difficulty = 'easy';
          else if (d.includes('较难') || d.includes('难') || d.includes('hard')) q.difficulty = 'hard';
          else q.difficulty = 'medium';
          currentKey = null; continue;
        }

        const typeMatch = line.match(/^(类型|Type)[:：]\s*(.*)/i);
        if (typeMatch) {
          const t = typeMatch[2].trim();
          if (t.includes('多选') || t.includes('multi')) q.type = 'multi';
          else if (t.includes('填空') || t.includes('fill')) q.type = 'fill';
          else q.type = 'single';
          currentKey = null; continue;
        }

        const codeMatch = line.match(/^(代码|Code)[:：]\s*(.*)/i);
        if (codeMatch) {
          q.code = codeMatch[2]; currentKey = 'code'; continue;
        }

        const subjMatch = line.match(/^(科目|Subject)[:：]\s*(.*)/i);
        if (subjMatch) { q.subject = subjMatch[2].trim(); currentKey = null; continue; }

        // 匹配选项 A. / B. / C. / D. / E.
        const optMatch = line.match(/^([A-E])[.、．]\s*(.*)/);
        if (optMatch) {
          options.push(`${optMatch[1]}. ${optMatch[2]}`);
          currentKey = null; continue;
        }

        // 继续追加到上一个键
        if (currentKey === 'Q') q.question += '\n' + line;
        else if (currentKey === 'code') q.code += '\n' + line;
      }

      if (options.length > 0) q.options = options;

      // 验证
      if (!q.question) { errors.push(`第${idx+1}题缺少题干`); return; }
      if (!q.answer) { errors.push(`第${idx+1}题缺少答案`); return; }

      // 自动推断科目
      if (!q.subject && q.topic && typeof TOPICS !== 'undefined' && TOPICS[q.topic]) {
        q.subject = TOPICS[q.topic].subject;
      }
      if (!q.subject) q.subject = 'ds'; // 默认

      if (!q.year) q.year = 2025;

      questions.push(q);
    });

    return { questions, errors };
  },

  // ---- Storage ----
  _getImported() {
    try {
      return JSON.parse(localStorage.getItem(this._storageKey) || '[]');
    } catch(e) { return []; }
  },

  _saveImported(data) {
    localStorage.setItem(this._storageKey, JSON.stringify(data));
  },

  _deleteQ(idx) {
    const data = this._getImported();
    data.splice(idx, 1);
    this._saveImported(data);
  },

  _clearAll() {
    this._saveImported([]);
  },

  // 生成 JS 文件内容
  _generateJS(questions) {
    const lines = ['// 考研刷题 - 导入题目', '// 自动生成于 ' + new Date().toISOString().slice(0,10), '', 'const QUESTIONS_IMPORTED = ['];
    questions.forEach((q, i) => {
      const parts = [];
      parts.push(`id:'${q.id}'`);
      parts.push(`year:${q.year}`);
      parts.push(`subject:'${q.subject}'`);
      parts.push(`topic:'${q.topic || ''}'`);
      parts.push(`type:'${q.type}'`);
      if (q.difficulty && q.difficulty !== 'medium') parts.push(`difficulty:'${q.difficulty}'`);
      parts.push(`question:'${q.question.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`);
      if (q.options) parts.push(`options:${JSON.stringify(q.options)}`);
      parts.push(`answer:${Array.isArray(q.answer) ? JSON.stringify(q.answer) : `'${q.answer}'`}`);
      if (q.code) parts.push(`code:'${q.code.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`);
      if (q.analysis) parts.push(`analysis:'${q.analysis.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`);
      const comma = i < questions.length - 1 ? ',' : '';
      lines.push(`  { ${parts.join(', ')} }${comma}`);
    });
    lines.push('];');
    return lines.join('\n');
  },

  // 下载 JS 文件
  _downloadJS() {
    const imported = this._getImported();
    const code = this._generateJS(imported);
    const blob = new Blob([code], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data-imported.js';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  // ---- UI ----
  _showMsg(msg) {
    const el = document.getElementById('bm-imported-msg');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  },

  _ensureDOM() {
    if (document.getElementById('bank-panel')) return;
    document.body.insertAdjacentHTML('beforeend', '<div id="bank-panel" style="display:none;"></div>');
  }
};

// 刷新全局题库（导入后调用）
function refreshQuestionBank() {
  if (typeof QUESTION_BANK === 'undefined') return;
  const imported = [];
  try {
    const raw = localStorage.getItem('ky-imported-questions');
    if (raw) imported.push(...JSON.parse(raw));
  } catch(e) {}
  // 清空并重建（保留静态数据 + 加导入数据）
  // 找出现有静态数据（通过 id 前缀不含 imported- 来判断）
  const staticQs = QUESTION_BANK.filter(q => typeof q.id === 'string' && !q.id.startsWith('imported-'));
  QUESTION_BANK.length = 0;
  QUESTION_BANK.push(...staticQs, ...imported);
}
