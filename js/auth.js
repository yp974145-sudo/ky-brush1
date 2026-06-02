// ============================================================
// 考研刷题 - 我的面板（离线优先）v3
// ============================================================

const Auth = {
  _user: null,

  init() {
    this._user = Storage.getUser();
    this._updateUI();
  },

  isLoggedIn() {
    return !!(this._user && this._user.nickname);
  },

  // ---- 入口 ----
  showMyPanel() {
    this._ensureOverlay();
    this.isLoggedIn() ? this._renderProfile() : this._renderSetup();
    document.getElementById('me-overlay').style.display = 'flex';
  },

  closePanel() {
    document.getElementById('me-overlay').style.display = 'none';
  },

  // ---- 设置昵称（免登录）----
  _renderSetup() {
    const el = document.getElementById('me-panel');
    el.innerHTML = `
      <div class="me-header">
        <h3>👤 设置昵称</h3>
        <span class="me-close" onclick="Auth.closePanel()">✕</span>
      </div>
      <div class="me-form">
        <p class="me-desc">设置昵称后数据可在本设备持久保存。如需跨设备同步，可导出数据后在新设备导入。</p>
        <div class="input-group">
          <label>昵称</label>
          <input type="text" id="me-nickname" placeholder="给自己起个名字" maxlength="12" autocomplete="off">
        </div>
        <button class="btn btn-primary btn-full-login" onclick="Auth.setNickname()">保 存</button>
        <div class="me-hint">💡 数据保存在浏览器本地，无需注册账号</div>
      </div>`;
  },

  setNickname() {
    const name = document.getElementById('me-nickname').value.trim();
    if (!name) return;
    this._user = {
      nickname: name,
      phone: '',
      avatar: '📚',
      createdAt: Date.now()
    };
    Storage.setUser(this._user);
    this._updateUI();
    this._renderProfile();
  },

  // ---- 个人主页 ----
  _renderProfile() {
    const u = this._user;
    const el = document.getElementById('me-panel');
    const streak = Storage.getStreak();
    const submitted = Storage.getSubmittedIds().length;
    const wrong = Storage.getWrongIds().length;
    const exams = Storage.getExams().length;

    el.innerHTML = `
      <div class="me-header">
        <h3>👤 我的</h3>
        <span class="me-close" onclick="Auth.closePanel()">✕</span>
      </div>
      <div class="me-profile">
        <div class="user-avatar">${u.avatar || '📚'}</div>
        <div class="user-name">${u.nickname || '研友'}</div>
        <div class="user-stats">
          <div class="ustat"><strong>${streak}</strong><span>连续天数</span></div>
          <div class="ustat"><strong>${submitted}</strong><span>累计刷题</span></div>
          <div class="ustat"><strong>${wrong}</strong><span>错题</span></div>
          <div class="ustat"><strong>${exams}</strong><span>模考</span></div>
        </div>
      </div>
      <div class="me-actions">
        <button class="btn btn-outline btn-me-action" onclick="Stats.show();Auth.closePanel()">📊 学习统计</button>
        <button class="btn btn-outline btn-me-action" onclick="PlanUI.show();Auth.closePanel()">📋 学习计划</button>
        <button class="btn btn-outline btn-me-action" onclick="startExam();Auth.closePanel()">⏱ 模拟考试</button>
        <button class="btn btn-outline btn-me-action" onclick="Stats.exportMyData()">💾 导出数据备份</button>
        <button class="btn btn-outline btn-me-action" onclick="document.getElementById('import-file').click()">📥 导入数据</button>
        <input type="file" id="import-file" accept=".json" style="display:none;" onchange="Stats.importData(this)">
        <button class="btn btn-outline btn-me-action" onclick="Auth._renderEditNickname()">✏️ 修改昵称</button>
        <button class="btn btn-danger-text btn-me-action" onclick="Auth.logout()">退出（清除昵称）</button>
      </div>`;
  },

  _renderEditNickname() {
    const u = this._user;
    const el = document.getElementById('me-panel');
    el.innerHTML = `
      <div class="me-header">
        <h3>✏️ 修改昵称</h3>
        <span class="me-close" onclick="Auth.closePanel()">✕</span>
      </div>
      <div class="me-form">
        <div class="input-group">
          <label>新昵称</label>
          <input type="text" id="me-nickname" value="${u.nickname || ''}" maxlength="12">
        </div>
        <button class="btn btn-primary btn-full-login" onclick="Auth.setNickname()">保 存</button>
        <button class="btn btn-secondary btn-full-login" onclick="Auth._renderProfile()">返回</button>
      </div>`;
  },

  // ---- 退出 ----
  logout() {
    this._user = null;
    Storage.clearUser();
    this._updateUI();
    this.closePanel();
  },

  // ---- 数据导出/导入（委托给 Stats）----
  // 已通过按钮直接调用 Stats.exportMyData() / Stats.importData()

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
