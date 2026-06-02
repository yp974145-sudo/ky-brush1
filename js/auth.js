// ============================================================
// 考研刷题 - 登录/注册 + 我的面板 v3
// ============================================================

const Auth = {
  _baseURL: 'http://localhost:3456',
  _token: null,
  _user: null,
  _codeTimer: null,
  _codeCountdown: 0,

  init(baseURL) {
    if (baseURL) this._baseURL = baseURL;
    this._user = Storage.getUser();
    this._token = this._user?.token || null;
    this._updateUI();
    if (this._token) {
      this._fetchProfile().then(user => {
        if (user) { Storage.setUser(user); this._user = user; this._updateUI(); this.syncFromCloud().then(() => this._startAutoSync()); }
        else this.logout(true);
      }).catch(() => {});
    }
  },

  isLoggedIn() { return !!(this._token && this._user); },
  getUser() { return this._user; },
  getToken() { return this._token; },

  // ---- "我的" 面板入口 ----
  showMyPanel() {
    this._ensureOverlay();
    if (this.isLoggedIn()) this._renderProfile();
    else this._renderLogin();
    document.getElementById('me-overlay').style.display = 'flex';
  },

  // ---- 登录面板 ----
  showLoginModal() { this.showMyPanel(); },

  closePanel() {
    document.getElementById('me-overlay').style.display = 'none';
    if (this._codeTimer) clearInterval(this._codeTimer);
  },

  _renderLogin() {
    const el = document.getElementById('me-panel');
    el.innerHTML = `
      <div class="me-header">
        <h3>👤 登录 / 注册</h3>
        <span class="me-close" onclick="Auth.closePanel()">✕</span>
      </div>
      <div class="me-form">
        <div class="input-group">
          <label>手机号</label>
          <input type="tel" id="login-phone" placeholder="输入手机号" maxlength="11" autocomplete="tel">
        </div>
        <div class="input-group">
          <label>验证码</label>
          <div class="code-row">
            <input type="text" id="login-code" placeholder="输入验证码" maxlength="6" autocomplete="off" inputmode="numeric">
            <button class="btn btn-code" id="btn-send-code" onclick="Auth.sendCode()">获取验证码</button>
          </div>
        </div>
        <button class="btn btn-primary btn-full-login" onclick="Auth.login()">登 录</button>
        <div class="me-error" id="me-error" style="display:none;"></div>
        <p class="me-hint">首次自动注册 · 演示码 <code>000000</code></p>
      </div>`;
  },

  _renderProfile() {
    const u = this._user;
    const el = document.getElementById('me-panel');
    el.innerHTML = `
      <div class="me-header">
        <h3>👤 我的</h3>
        <span class="me-close" onclick="Auth.closePanel()">✕</span>
      </div>
      <div class="me-profile">
        <div class="user-avatar">${u.avatar || '📚'}</div>
        <div class="user-name">${u.nickname || '研友'}</div>
        <div class="user-phone">${u.phone}</div>
        <div class="user-stats">
          <div class="ustat"><strong>${u.stats?.streak || Storage.getStreak()}</strong><span>连续天数</span></div>
          <div class="ustat"><strong>${u.stats?.totalQuestions || Storage.getSubmittedIds().length}</strong><span>累计刷题</span></div>
          <div class="ustat"><strong>${u.stats?.examCount || Storage.getExams().length}</strong><span>模拟考试</span></div>
        </div>
      </div>
      <div class="me-actions">
        <button class="btn btn-outline btn-me-action" onclick="Auth.syncToCloud();Auth.closePanel()">☁️ 同步到云端</button>
        <button class="btn btn-outline btn-me-action" onclick="Auth.syncFromCloud();Auth.closePanel()">⬇️ 从云端恢复</button>
        <button class="btn btn-outline btn-me-action" onclick="Stats.show();Auth.closePanel()">📊 学习统计</button>
        <button class="btn btn-outline btn-me-action" onclick="PlanUI.show();Auth.closePanel()">📋 学习计划</button>
        <button class="btn btn-outline btn-me-action" onclick="startExam();Auth.closePanel()">⏱ 模拟考试</button>
        <button class="btn btn-danger-text btn-me-action" onclick="Auth.logout()">退出登录</button>
      </div>`;
  },

  // ---- 发送验证码 ----
  async sendCode() {
    const phone = document.getElementById('login-phone').value.trim();
    if (!/^1\d{10}$/.test(phone)) { this._err('请输入正确手机号'); return; }
    const btn = document.getElementById('btn-send-code');
    btn.disabled = true;
    try {
      const res = await this._fetch('/api/auth/send-code', { phone });
      if (res.ok) this._startCD(btn);
      else { this._err(res.msg); btn.disabled = false; }
    } catch(e) { this._err('网络错误，后端未启动'); btn.disabled = false; }
  },

  _startCD(btn) {
    this._codeCountdown = 60;
    btn.textContent = `${this._codeCountdown}s`;
    this._codeTimer = setInterval(() => {
      this._codeCountdown--;
      btn.textContent = `${this._codeCountdown}s`;
      if (this._codeCountdown <= 0) { clearInterval(this._codeTimer); btn.textContent = '重新获取'; btn.disabled = false; }
    }, 1000);
  },

  // ---- 登录 ----
  async login() {
    const phone = document.getElementById('login-phone').value.trim();
    const code = document.getElementById('login-code').value.trim();
    if (!phone || !code) { this._err('请填写完整'); return; }
    try {
      const res = await this._fetch('/api/auth/login', { phone, code });
      if (res.ok) {
        this._token = res.token;
        this._user = { id: res.user.id, phone: res.user.phone, nickname: res.user.nickname, avatar: res.user.avatar, stats: res.user.stats, token: res.token };
        Storage.setUser(this._user);
        this._updateUI();
        this._renderProfile();
        this.syncToCloud();
      } else { this._err(res.msg); }
    } catch(e) { this._err('网络错误，后端未启动'); }
  },

  // ---- 退出 ----
  logout(silent) {
    this._token = null; this._user = null;
    Storage.clearUser(); this._stopAutoSync();
    if (!silent) { this._renderLogin(); }
    this._updateUI();
    this.closePanel();
  },

  // ---- 同步 ----
  async syncToCloud() {
    if (!this.isLoggedIn()) return;
    try { await this._fetch('/api/user/sync', { data: Storage.exportData(), stats: this._stats() }); } catch(e) {}
  },
  async syncFromCloud() {
    if (!this.isLoggedIn()) return;
    try { const res = await this._fetch('/api/user/sync', null, 'GET'); if (res.ok && res.data) Storage.importData(res.data); } catch(e) {}
  },
  _autoSyncInterval: null,
  _startAutoSync() {
    if (this._autoSyncInterval) clearInterval(this._autoSyncInterval);
    this._autoSyncInterval = setInterval(() => { if (this.isLoggedIn()) this.syncToCloud().catch(() => {}); }, 10 * 60 * 1000);
  },
  _stopAutoSync() { if (this._autoSyncInterval) { clearInterval(this._autoSyncInterval); this._autoSyncInterval = null; } },

  // ---- 辅助 ----
  async _fetchProfile() {
    try { const res = await this._fetch('/api/user/profile', null, 'GET'); return res.ok ? { ...res.user, token: this._token } : null; } catch(e) { return null; }
  },
  _stats() {
    const s = Storage.getSubmittedIds();
    let c = 0;
    (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []).forEach(q => {
      if (!Storage.isSubmitted(q.id)) return;
      const a = Storage.getAnswer(q.id); let ok = false;
      if (q.type === 'multi') { const cc = (Array.isArray(q.answer)?q.answer:[q.answer]).sort().join(''); const u = (Array.isArray(a)?a:[a]).sort().join(''); ok = cc === u; }
      else if (q.type === 'fill') ok = String(a||'').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
      else ok = a === q.answer;
      if (ok) c++;
    });
    return { totalQuestions: s.length, correctRate: s.length > 0 ? Math.round(c/s.length*100) : 0, streak: Storage.getStreak(), examCount: Storage.getExams().length };
  },
  async _fetch(path, body, method) {
    const opts = { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json' } };
    if (this._token) opts.headers['Authorization'] = 'Bearer ' + this._token;
    if (body) opts.body = JSON.stringify(body);
    return (await fetch(this._baseURL + path, opts)).json();
  },
  _err(msg) {
    const el = document.getElementById('me-error'); if (!el) return;
    el.textContent = msg; el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  },
  _updateUI() {
    const btn = document.getElementById('btn-login-ui');
    if (!btn) return;
    if (this.isLoggedIn()) { btn.textContent = '👤 ' + (this._user.nickname || '我的'); btn.className = 'btn btn-outline btn-logged-in'; btn.onclick = () => this.showMyPanel(); }
    else { btn.textContent = '登录'; btn.className = 'btn btn-outline'; btn.onclick = () => this.showMyPanel(); }
  },
  _ensureOverlay() {
    if (document.getElementById('me-overlay')) return;
    const html = `<div id="me-overlay" class="login-overlay" onclick="if(event.target===this)Auth.closePanel()"><div class="login-card" id="me-panel"></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};
