// ============================================================
// 考研刷题 - 在线代码编辑器 v3
// 支持：Piston API 远程编译运行(C) + 本地 JS 执行
// ============================================================

const CodeEditor = {
  _pistonURL: 'https://emkc.org/api/v2/piston/execute',
  _language: 'c',
  _version: '10.2.0',
  _currentQId: null,

  // ---- 初始化编辑器 ----
  render(containerEl, q) {
    this._currentQId = q.id;
    const savedCode = Storage.getAnswer(q.id) || q.template || '';
    const submitted = Storage.isSubmitted(q.id);
    const language = q.language || 'c';

    let langLabel = language === 'c' ? 'C 语言' : language === 'js' ? 'JavaScript' : language.toUpperCase();

    containerEl.innerHTML = `
      <div class="code-editor-wrap">
        <div class="ce-header">
          <span class="ce-lang-tag">🔧 ${langLabel}</span>
          <span class="ce-hint">${submitted ? '已提交（只读）' : '写完代码后点提交编译运行'}</span>
        </div>
        <div class="ce-main">
          <div class="ce-line-numbers" id="ce-linenums">${this._genLineNums(savedCode)}</div>
          <textarea
            id="ce-textarea"
            class="ce-textarea"
            placeholder="在这里写代码..."
            ${submitted ? 'readonly' : ''}
            spellcheck="false"
            oninput="CodeEditor._updateLineNums()"
            onkeydown="CodeEditor._handleTab(event)"
            onscroll="CodeEditor._syncScroll()"
          >${savedCode}</textarea>
        </div>
        <div class="ce-footer">
          <button class="btn btn-primary" id="ce-submit-btn" onclick="CodeEditor.submit()" ${submitted ? 'disabled' : ''}>
            ▶ 编译运行
          </button>
          <span class="ce-status" id="ce-status"></span>
        </div>
        <div id="ce-output" class="ce-output" style="display:none;"></div>
      </div>`;
  },

  // ---- 行号 ----
  _genLineNums(text) {
    const lines = (text || '').split('\n');
    let html = '';
    for (let i = 1; i <= Math.max(lines.length, 10); i++) {
      html += `<span>${i}</span>`;
    }
    return html;
  },

  _updateLineNums() {
    const ta = document.getElementById('ce-textarea');
    const ln = document.getElementById('ce-linenums');
    if (!ta || !ln) return;
    const lines = ta.value.split('\n');
    let html = '';
    for (let i = 1; i <= Math.max(lines.length, 10); i++) {
      html += `<span>${i}</span>`;
    }
    ln.innerHTML = html;
    // 自动保存
    if (this._currentQId) {
      Storage.setAnswer(this._currentQId, ta.value);
    }
  },

  _syncScroll() {
    const ta = document.getElementById('ce-textarea');
    const ln = document.getElementById('ce-linenums');
    if (!ta || !ln) return;
    ln.scrollTop = ta.scrollTop;
  },

  _handleTab(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      CodeEditor._updateLineNums();
    }
  },

  // ---- 提交执行 ----
  async submit() {
    const ta = document.getElementById('ce-textarea');
    const qId = this._currentQId;
    if (!ta || !qId) return;

    const code = ta.value.trim();
    if (!code) return;

    const bank = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);
    const q = bank.find(x => x.id === qId);
    if (!q) return;

    const lang = q.language || 'c';
    const statusEl = document.getElementById('ce-status');
    const outputEl = document.getElementById('ce-output');
    const submitBtn = document.getElementById('ce-submit-btn');

    submitBtn.disabled = true;
    statusEl.textContent = '⏳ 编译运行中...';
    statusEl.className = 'ce-status ce-running';
    outputEl.style.display = 'block';
    outputEl.innerHTML = '<div class="ce-loading">⏳ 正在远程编译运行，请稍候...</div>';

    try {
      let result;
      if (lang === 'js') {
        result = this._runLocalJS(code, q);
      } else {
        result = await this._runPiston(code, q);
      }

      // 判断对错
      const isCorrect = result.passed;
      Storage.setAnswer(qId, code);
      Storage.markSubmitted(qId);
      if (!isCorrect) Storage.addWrong(qId);
      Storage.checkinToday();

      // 学习计划追踪
      if (typeof Plan !== 'undefined' && Plan.onQuestionSubmitted) {
        Plan.onQuestionSubmitted(qId, isCorrect);
      }

      // 显示结果
      let resultHTML = '';
      if (result.error) {
        resultHTML = `<div class="ce-result ce-result-error">
          <div class="ce-result-title">❌ 编译/运行错误</div>
          <pre class="ce-error-text">${this._escapeHTML(result.error)}</pre>
        </div>`;
        statusEl.textContent = '❌ 错误';
        statusEl.className = 'ce-status ce-fail';
      } else if (isCorrect) {
        resultHTML = `<div class="ce-result ce-result-pass">
          <div class="ce-result-title">✅ 通过！</div>
          <div class="ce-result-detail">${result.detail || ''}</div>
          <pre class="ce-output-text">${this._escapeHTML(result.stdout || result.output || '')}</pre>
        </div>`;
        statusEl.textContent = '✅ 通过';
        statusEl.className = 'ce-status ce-pass';
      } else {
        resultHTML = `<div class="ce-result ce-result-fail">
          <div class="ce-result-title">❌ 答案不正确</div>
          <div class="ce-result-detail">${result.detail || ''}</div>
          <pre class="ce-output-text">你的输出：${this._escapeHTML(result.stdout || result.output || '(无)')}
预期输出：${this._escapeHTML(result.expected || q.expectedOutput || '')}</pre>
        </div>`;
        statusEl.textContent = '❌ 不通过';
        statusEl.className = 'ce-status ce-fail';
      }

      // 显示参考答案
      if (q.answer && !isCorrect) {
        resultHTML += `<div class="ce-reference">
          <div class="ce-ref-title">📖 参考答案</div>
          <pre class="ce-ref-code">${this._escapeHTML(q.answer)}</pre>
          ${q.analysis ? `<div class="ce-ref-analysis">${q.analysis}</div>` : ''}
        </div>`;
      }

      outputEl.innerHTML = resultHTML;
      ta.readOnly = true;
      Storage.setAnswer(qId, code);

      if (typeof saveToStorage === 'function') saveToStorage();
      if (typeof updateAllStats === 'function') updateAllStats();

    } catch(e) {
      statusEl.textContent = '⚠️ 网络错误';
      statusEl.className = 'ce-status ce-fail';
      outputEl.innerHTML = `<div class="ce-result ce-result-error">
        <div class="ce-result-title">⚠️ 执行失败</div>
        <div class="ce-result-detail">${this._escapeHTML(e.message)}。请检查网络连接，或尝试本地 JavaScript 题目。</div>
      </div>`;
    }

    submitBtn.disabled = false;
  },

  // ---- 本地 JS 执行 ----
  _runLocalJS(code, q) {
    try {
      // 收集所有 console.log 输出
      const logs = [];
      const fakeConsole = { log: (...args) => logs.push(args.join(' ')) };

      // 在沙箱中执行用户代码
      const fn = new Function('console', code);
      fn(fakeConsole);

      const output = logs.join('\n');
      const expected = (q.expectedOutput || '').trim();
      const passed = output.trim() === expected;

      return { passed, output, expected, detail: passed ? '输出与预期一致' : '输出与预期不符' };
    } catch(e) {
      return { error: e.message, passed: false };
    }
  },

  // ---- Piston API 远程执行 ----
  async _runPiston(userCode, q) {
    // 拼接完整程序
    let fullCode;
    if (q.boilerplate) {
      fullCode = q.boilerplate.replace('[USER_CODE]', userCode);
    } else {
      fullCode = userCode;
    }

    const resp = await fetch(this._pistonURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: this._language,
        version: this._version,
        files: [{ name: 'main.c', content: fullCode }],
        stdin: q.stdin || '',
        compile_timeout: 10000,
        run_timeout: 5000
      })
    });

    if (!resp.ok) throw new Error('API 请求失败: ' + resp.status);
    const data = await resp.json();

    // 检查编译错误
    if (data.compile && data.compile.code !== 0) {
      return { error: data.compile.stderr || data.compile.output || '编译错误', passed: false };
    }

    // 检查运行结果
    if (data.run) {
      const stdout = (data.run.stdout || '').trim();
      const stderr = (data.run.stderr || '').trim();

      if (data.run.code !== 0 && stderr) {
        return { error: stderr, passed: false };
      }

      const expected = (q.expectedOutput || '').trim();
      const passed = stdout === expected;

      return {
        passed,
        stdout,
        expected,
        stderr,
        detail: passed ? '输出与预期一致' : `输出不匹配：得到 "${stdout}"，期望 "${expected}"`
      };
    }

    return { error: '未知执行错误', passed: false };
  },

  _escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};
