// ============================================================
// 考研刷题 - 我的面板（多账户）v3
// ============================================================

const Auth = {
  _user: null,

  init() {
    this._user = Storage.getUser();
    if (!this._user && Storage.getCurrentUser()) {
      this._user = { nickname: Storage.getCurrentUser() };
    }
    this._updateUI();
  },

  isLoggedIn() {
    return !!(this._user && this._user.nickname && Storage.getCurrentUser());
  },

  showMyPanel() {
    this._ensureOverlay();
    this.isLoggedIn() ? this._renderProfile() : this._renderLogin();
    document.getElementById('me-overlay').style.display = 'flex';
  },

  closePanel() {
    document.getElementById('me-overlay').style.display = 'none';
  },

  // ---- 选择/创建账户 ----
  _renderLogin() {
    const accounts = Storage.listAccounts();
    const el = document.getElementById('me-panel');
    let html = `
      <div class="me-header"><h3>👤 选择账户</h3><span class="me-close" onclick="Auth.closePanel()">✕</span></div>`;

    if (accounts.length > 0) {
      html += '<div class="me-account-list">';
      accounts.forEach(a => {
        html += `<div class="me-account-item" onclick="Auth._loginAs('${a.name}')">
          <span>📚</span>
          <div class="me-acc-info"><div class="me-acc-name">${a.name}</div><div class="me-acc-meta">${a.submitted} 题 · 🔥${a.streak}天</div></div>
        </div>`;
      });
      html += '</div>';
    } else {
      html += '<p class="me-desc" style="text-align:center;padding:12px;">还没有账户，创建一个吧</p>';
    }

    html += `
      <div class="me-form" style="margin-top:12px;">
        <div class="input-group">
          <label>新账户昵称</label>
          <div class="code-row">
            <input type="text" id="me-nickname" placeholder="输入昵称" maxlength="12">
            <button class="btn btn-code" onclick="Auth._createAccount()">创建</button>
          </div>
        </div>
      </div>`;
    el.innerHTML = html;
  },

  _loginAs(name) {
    Storage.switchTo(name);
    this._user = { nickname: name };
    Storage.setUser(this._user);
    this._updateUI();
    this._renderProfile();
    // 刷新全局数据
    this._reloadGlobals();
    if (typeof updateAllStats === 'function') updateAllStats();
    if (typeof applyFilter === 'function') applyFilter();
  },

  _createAccount() {
    const name = document.getElementById('me-nickname').value.trim();
    if (!name) return;
    if (Storage.listAccounts().find(a => a.name === name)) {
      alert('该昵称已存在，请换一个');
      return;
    }
    Storage.createAccount(name);
    this._user = { nickname: name };
    Storage.setUser(this._user);
    this._updateUI();
    this._renderProfile();
    this._reloadGlobals();
    if (typeof updateAllStats === 'function') updateAllStats();
    if (typeof applyFilter === 'function') applyFilter();
  },

  _reloadGlobals() {
    if (typeof window !== 'undefined') {
      window.userAnswers = Storage.get('userAnswers');
      window.markedQuestions = Storage.get('markedQuestions');
      window.submittedQuestions = Storage.get('submittedQuestions');
      window.wrongBook = Storage.get('wrongBook');
    }
  },

  // ---- 个人主页 ----
  _renderProfile() {
    const u = this._user;
    const el = document.getElementById('me-panel');
    const streak = Storage.getStreak();
    const submitted = Storage.getSubmittedIds().length;
    const wrong = Storage.getWrongIds().length;
    const exams = Storage.getExams().length;
    const accounts = Storage.listAccounts();

    let accountList = '';
    if (accounts.length > 1) {
      accountList = '<div class="me-account-list" style="margin-bottom:8px;">';
      accounts.forEach(a => {
        const active = a.name === u.nickname ? ' me-acc-active' : '';
        accountList += `<div class="me-account-item${active}" onclick="${a.name !== u.nickname ? `Auth._loginAs('${a.name}')` : ''}">
          <span>${a.name === u.nickname ? '✅' : '📚'}</span>
          <div class="me-acc-info"><div class="me-acc-name">${a.name}</div><div class="me-acc-meta">${a.submitted}题 🔥${a.streak}天</div></div>
        </div>`;
      });
      accountList += '</div>';
    }

    el.innerHTML = `
      <div class="me-header"><h3>👤 ${u.nickname}</h3><span class="me-close" onclick="Auth.closePanel()">✕</span></div>
      <div class="me-profile">
        <div class="user-avatar">📚</div>
        <div class="user-stats">
          <div class="ustat"><strong>${streak}</strong><span>连续天数</span></div>
          <div class="ustat"><strong>${submitted}</strong><span>累计刷题</span></div>
          <div class="ustat"><strong>${wrong}</strong><span>错题</span></div>
          <div class="ustat"><strong>${exams}</strong><span>模考</span></div>
        </div>
      </div>
      ${accountList}
      <div class="me-actions">
        <button class="btn btn-outline btn-me-action" onclick="Stats.show();Auth.closePanel()">📊 学习统计</button>
        <button class="btn btn-outline btn-me-action" onclick="PlanUI.show();Auth.closePanel()">📋 学习计划</button>
        <button class="btn btn-outline btn-me-action" onclick="startExam();Auth.closePanel()">⏱ 模拟考试</button>
        <button class="btn btn-outline btn-me-action" onclick="Stats.exportMyData()">💾 导出数据备份</button>
        <button class="btn btn-outline btn-me-action" onclick="document.getElementById('import-file').click()">📥 导入数据</button>
        <input type="file" id="import-file" accept=".json" style="display:none;" onchange="Stats.importData(this)">
        <button class="btn btn-outline btn-me-action" onclick="Auth._renderLogin()">🔄 切换账户</button>
        <button class="btn btn-outline btn-me-action" onclick="Auth._renderEditNickname()">✏️ 改昵称</button>
        <button class="btn btn-danger-text btn-me-action" onclick="Auth._confirmDelete()">🗑 删除此账户</button>
      </div>`;
  },

  _renderEditNickname() {
    const el = document.getElementById('me-panel');
    el.innerHTML = `
      <div class="me-header"><h3>✏️ 修改昵称</h3><span class="me-close" onclick="Auth.closePanel()">✕</span></div>
      <div class="me-form">
        <p class="me-desc">修改昵称会创建新账户，原账户数据保留，可切换回去。</p>
        <div class="input-group">
          <label>新昵称</label>
          <input type="text" id="me-nickname" maxlength="12">
        </div>
        <button class="btn btn-primary btn-full-login" onclick="Auth._createAccount()">创建并切换</button>
        <button class="btn btn-secondary btn-full-login" onclick="Auth._renderProfile()">返回</button>
      </div>`;
  },

  _confirmDelete() {
    const name = this._user.nickname;
    if (!confirm(`确定删除账户「${name}」的所有数据？此操作不可恢复。`)) return;
    Storage.deleteAccount(name);
    this._user = null;
    Storage.clearUser();
    this._reloadGlobals();
    if (typeof updateAllStats === 'function') updateAllStats();
    if (typeof applyFilter === 'function') applyFilter();
    this._renderLogin();
  },

  // ---- 辅助 ----
  _updateUI() {
    const btn = document.getElementById('btn-login-ui');
    if (!btn) return;
    if (this.isLoggedIn()) {
      btn.textContent = '👤 ' + this._user.nickname;
      btn.className = 'btn btn-outline btn-logged-in';
    } else {
      btn.textContent = '登录';
      btn.className = 'btn btn-outline';
    }
    btn.onclick = () => this.showMyPanel();
  },

  _ensureOverlay() {
    if (document.getElementById('me-overlay')) return;
    const html = `<div id="me-overlay" class="login-overlay" onclick="if(event.target===this)Auth.closePanel()"><div class="login-card" id="me-panel"></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};
