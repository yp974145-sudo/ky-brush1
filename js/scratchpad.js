// ============================================================
// 考研刷题 - 代码草稿板 v1
// 随时拉出，写代码就跑，不需要判题
// ============================================================

const Scratchpad = {
  _pistonURL: 'https://emkc.org/api/v2/piston/execute',

  _onLangChange() {
    const lang = document.getElementById('scratch-lang').value;
    const editor = document.getElementById('scratch-code');
    if (lang === 'c' && !editor.value.trim()) {
      editor.value = '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}';
    }
    if (lang === 'js' && !editor.value.trim()) {
      editor.value = 'console.log("Hello World");';
    }
  },

  async run() {
    const lang = document.getElementById('scratch-lang').value;
    const code = document.getElementById('scratch-code').value;
    const output = document.getElementById('scratch-output');
    output.textContent = '⏳ 运行中...';

    if (!code.trim()) {
      output.textContent = '⚠️ 请先输入代码';
      return;
    }

    if (lang === 'js') {
      this._runJS(code, output);
    } else {
      await this._runC(code, output);
    }
  },

  _runJS(code, output) {
    const logs = [];
    const fakeConsole = { log: (...args) => logs.push(args.map(String).join(' ')) };
    try {
      const fn = new Function('console', code);
      fn(fakeConsole);
      output.textContent = logs.join('\n') || '(无输出)';
    } catch(e) {
      output.textContent = '❌ 错误: ' + e.message;
    }
  },

  async _runC(code, output) {
    try {
      const resp = await fetch(this._pistonURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'c',
          version: '10.2.0',
          files: [{ name: 'main.c', content: code }],
          stdin: '',
          run_timeout: 5000,
        })
      });
      const data = await resp.json();
      if (data.run) {
        output.textContent = data.run.output || '(无输出)';
        if (data.run.stderr) output.textContent += '\n' + data.run.stderr;
        if (data.run.signal) output.textContent += '\n⚠️ 进程被终止: ' + data.run.signal;
      } else {
        output.textContent = '❌ 运行失败: ' + (data.message || '未知错误');
      }
    } catch(e) {
      output.textContent = '❌ 网络错误: ' + e.message;
    }
  }
};

// 全局开关
function toggleScratchpad() {
  const pad = document.getElementById('scratchpad');
  const overlay = document.getElementById('scratchpad-overlay');
  const isOpen = pad.classList.contains('open');
  if (isOpen) {
    pad.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  } else {
    pad.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('scratch-code').focus();
  }
}
