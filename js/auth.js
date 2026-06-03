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

  logout() {
    this._user = null;
    Storage.clearUser();
    this._updateUI();
    this.closePanel();
    // 断开云端
    if (typeof Cloud !== 'undefined') Cloud.signOut().catch(() => {});
    if (typeof applyFilter === 'function') applyFilter();
  },

  // ---- 登录页（统一：邮箱+密码）----
  _renderLogin() {
    const accounts = Storage.listAccounts();
    const el = document.getElementById('me-panel');
    const cloudReady = typeof Cloud !== 'undefined' && Cloud.isReady();

    let html = `<div class="me-header"><h3>👤 登录</h3><span class="me-close" onclick="Auth.closePanel()">✕</span></div>`;

    html += `
      <div class="me-hint" style="margin-bottom:12px;">一个邮箱对应一个账号，数据云端同步</div>
      <div id="me-cloud-error" class="me-error" style="display:none;"></div>
      <div class="me-form">
        <div class="input-group">
          <label>邮箱</label>
          <input type="email" id="me-email" placeholder="your@email.com" autocomplete="email">
        </div>
        <div class="input-group">
          <label>密码（至少6位）</label>
          <input type="password" id="me-password" placeholder="输入密码" autocomplete="current-password">
        </div>
        <button class="btn btn-primary btn-full-login" onclick="Auth._cloudLogin()">🔐 登录 / 注册</button>
        <p class="me-hint">首次输入自动注册</p>
      </div>`;

    // 已有本地账户快速切换
    if (accounts.length > 0) {
      html += '<div class="me-divider"><span>或切换已有账户</span></div><div class="me-account-list">';
      accounts.forEach(a => {
        html += `<div class="me-account-item" onclick="Auth._loginAs('${a.name}')">
          <span>${a.name.includes('@') ? '📧' : '📚'}</span>
          <div class="me-acc-info"><div class="me-acc-name">${a.name}</div><div class="me-acc-meta">${a.submitted}题 · 🔥${a.streak}天</div></div>
        </div>`;
      });
      html += '</div>';
    }
    el.innerHTML = html;
  },

  // Supabase 登录/注册
  async _cloudLogin() {
    const email = document.getElementById('me-email').value.trim();
    const password = document.getElementById('me-password').value.trim();
    const errEl = document.getElementById('me-cloud-error');
    if (!email || !password) { this._showCloudErr('请填写邮箱和密码'); return; }
    if (password.length < 6) { this._showCloudErr('密码至少6位'); return; }

    errEl.style.display = 'none';
    try {
      // 先尝试登录
      let result;
      try {
        result = await Cloud.signIn(email, password);
      } catch(e) {
        // 登录失败，尝试注册
        const msg = e.message || '';
        if (msg.includes('Invalid login') || msg.includes('401') || msg.includes('400')) {
          try {
            result = await Cloud.signUp(email, password);
            // 检查是否需要邮箱确认
            if (!Cloud.isLoggedIn()) {
              this._showCloudErr('注册成功！请检查邮箱确认链接，或去 Supabase 后台关闭邮箱确认。');
              return;
            }
          } catch(e2) {
            throw new Error('注册失败: ' + (e2.message || ''));
          }
        } else {
          throw e;
        }
      }
      // 成功 → 创建/切换到本地账户
      const nickname = email.split('@')[0];
      if (!Storage.listAccounts().find(a => a.name === nickname)) {
        Storage.createAccount(nickname);
      }
      Storage.switchTo(nickname);
      this._user = { nickname, email };
      Storage.setUser(this._user);
      this._updateUI();
      this._renderProfile();
      this._reloadGlobals();
      // 强制同步：先从云端下载合并，再上传本地
      if (typeof Cloud !== 'undefined') {
        Cloud.download().then(cloud => {
          if (cloud) { Storage.importData(JSON.stringify(cloud)); this._reloadGlobals(); }
          Cloud.upload();
        }).catch(() => {});
      }
      if (typeof updateAllStats === 'function') updateAllStats();
      if (typeof applyFilter === 'function') applyFilter();
    } catch(e) {
      this._showCloudErr('登录失败: ' + (e.message || '网络错误'));
    }
  },

  _showCloudErr(msg) {
    const el = document.getElementById('me-cloud-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  },

  async _manualSync() {
    if (typeof Cloud === 'undefined' || !Cloud.isReady()) {
      alert('云同步未配置。请先在 Supabase 创建项目并配置 js/supabase.js');
      return;
    }
    if (!Cloud.isLoggedIn()) {
      alert('请先用邮箱登录');
      return;
    }
    const result = await Cloud.manualSync();
    alert(result);
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
      <div class="me-stats-row">
        <div class="me-stat"><strong>🔥${streak}天</strong><span>连续</span></div>
        <div class="me-stat"><strong>📝${submitted}</strong><span>刷题</span></div>
        <div class="me-stat"><strong>❌${wrong}</strong><span>错题</span></div>
        <div class="me-stat"><strong>⏱${exams}</strong><span>模考</span></div>
      </div>
      ${accountList}
      <div class="me-actions-grid">
        <button class="btn btn-outline btn-me-action" onclick="Stats.show();Auth.closePanel()">📊 统计</button>
        <button class="btn btn-outline btn-me-action" onclick="PlanUI.show();Auth.closePanel()">📋 计划</button>
        <button class="btn btn-outline btn-me-action" onclick="startExam();Auth.closePanel()">⏱ 模考</button>
        <button class="btn btn-outline btn-me-action" onclick="Auth._manualSync()">☁️ 同步</button>
        <button class="btn btn-outline btn-me-action" onclick="Auth._renderEditNickname()">✏️ 改名</button>
        <button class="btn btn-outline btn-me-action" onclick="Auth._renderLogin()">🔄 切换</button>
      </div>
      <div class="me-actions">
        <button class="btn btn-outline btn-me-action" onclick="Stats.exportMyData()">💾 导出备份</button>
        <button class="btn btn-outline btn-me-action" onclick="document.getElementById('import-file').click()">📥 导入数据</button>
        <input type="file" id="import-file" accept=".json" style="display:none;" onchange="Stats.importData(this)">
        <button class="btn btn-danger-text btn-me-action" onclick="Auth._confirmDelete()">🗑 删除此账户</button>
        <button class="btn btn-danger-text btn-me-action" onclick="Auth.logout()">🚪 退出登录</button>
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
