// ============================================================
// 考研刷题 - 登录/注册模块 v3
// ============================================================

const Auth = {
  _baseURL: 'http://localhost:3456',
  _token: null,
  _user: null,
  _codeTimer: null,
  _codeCountdown: 0,

  // ---- 初始化 ----
  init(baseURL) {
    if (baseURL) this._baseURL = baseURL;
    this._user = Storage.getUser();
    this._token = this._user?.token || null;
    this._updateHeaderUI();
    // 如果有 token，尝试拉取用户信息
    if (this._token) {
      this._fetchProfile().then(user => {
        if (user) {
          Storage.setUser(user);
          this._user = user;
          this._updateHeaderUI();
          // 尝试同步
          this.syncFromCloud().then(() => {
            // 之后启动自动同步（每 10 分钟）
            this._startAutoSync();
          });
        } else {
          this.logout(true);
        }
      });
    }
  },

  // ---- 自动同步 ----
  _autoSyncInterval: null,
  _startAutoSync() {
    if (this._autoSyncInterval) clearInterval(this._autoSyncInterval);
    this._autoSyncInterval = setInterval(() => {
      if (this.isLoggedIn()) {
        this.syncToCloud().catch(() => {});
      }
    }, 10 * 60 * 1000); // 每 10 分钟
  },
  _stopAutoSync() {
    if (this._autoSyncInterval) {
      clearInterval(this._autoSyncInterval);
      this._autoSyncInterval = null;
    }
  },

  // ---- 状态 ----
  isLoggedIn() {
    return !!(this._token && this._user);
  },

  getUser() {
    return this._user;
  },

  getToken() {
    return this._token;
  },

  // ---- 登录弹窗 ----
  showLoginModal() {
    // 如果已经登录，显示用户面板
    if (this.isLoggedIn()) {
      this._showUserPanel();
      return;
    }
    this._renderLoginModal();
    document.getElementById('login-overlay').style.display = 'flex';
  },

  closeLoginModal() {
    document.getElementById('login-overlay').style.display = 'none';
    if (this._codeTimer) clearInterval(this._codeTimer);
  },

  _renderLoginModal() {
    // 如果已存在则跳过
    if (document.getElementById('login-overlay')) return;

    const html = `
    <div id="login-overlay" class="login-overlay" onclick="if(event.target===this)Auth.closeLoginModal()">
      <div class="login-card">
        <div class="login-header">
          <h3>📱 登录考研刷题</h3>
          <span class="login-close" onclick="Auth.closeLoginModal()">✕</span>
        </div>
        <p class="login-sub">登录后数据可云端同步，换设备继续刷</p>
        <div class="login-form">
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
          <button class="btn btn-primary btn-full-login" id="btn-login" onclick="Auth.login()">登 录</button>
          <p class="login-hint">💡 首次登录自动注册 · 演示验证码 <code>000000</code></p>
        </div>
        <div class="login-error" id="login-error" style="display:none;"></div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  _showUserPanel() {
    this._renderLoginModal(); // 确保 overlay 容器存在
    // 替换登录卡片内容为用户面板
    const card = document.querySelector('.login-card');
    if (!card) return;
    const user = this._user;
    card.innerHTML = `
      <div class="login-header">
        <h3>👤 个人中心</h3>
        <span class="login-close" onclick="Auth.closeLoginModal()">✕</span>
      </div>
      <div class="user-info">
        <div class="user-avatar">${user.avatar || '📚'}</div>
        <div class="user-name">${user.nickname || '研友'}</div>
        <div class="user-phone">${user.phone}</div>
        <div class="user-stats">
          <div class="ustat"><strong>${user.stats?.streak || 0}</strong><span>连续天数</span></div>
          <div class="ustat"><strong>${user.stats?.totalQuestions || 0}</strong><span>累计刷题</span></div>
          <div class="ustat"><strong>${user.stats?.examCount || 0}</strong><span>模拟考试</span></div>
        </div>
      </div>
      <div class="user-actions">
        <button class="btn btn-primary btn-full-login" onclick="Auth.syncToCloud();Auth.closeLoginModal()">☁️ 同步数据到云端</button>
        <button class="btn btn-secondary btn-full-login" onclick="Auth.syncFromCloud();Auth.closeLoginModal()">⬇️ 从云端恢复数据</button>
        <button class="btn btn-danger-text" onclick="Auth.logout()">退出登录</button>
      </div>`;
    document.getElementById('login-overlay').style.display = 'flex';
  },

  // ---- 发送验证码 ----
  async sendCode() {
    const phone = document.getElementById('login-phone').value.trim();
    if (!/^1\d{10}$/.test(phone)) {
      this._showError('请输入正确的手机号');
      return;
    }
    const btn = document.getElementById('btn-send-code');
    btn.disabled = true;

    try {
      const res = await this._fetch('/api/auth/send-code', { phone });
      if (res.ok) {
        this._startCodeCountdown(btn);
      } else {
        this._showError(res.msg || '发送失败');
        btn.disabled = false;
      }
    } catch(e) {
      this._showError('网络错误，请确认后端已启动');
      btn.disabled = false;
    }
  },

  _startCodeCountdown(btn) {
    this._codeCountdown = 60;
    btn.textContent = `${this._codeCountdown}s`;
    this._codeTimer = setInterval(() => {
      this._codeCountdown--;
      btn.textContent = `${this._codeCountdown}s`;
      if (this._codeCountdown <= 0) {
        clearInterval(this._codeTimer);
        btn.textContent = '重新获取';
        btn.disabled = false;
      }
    }, 1000);
  },

  // ---- 登录 ----
  async login() {
    const phone = document.getElementById('login-phone').value.trim();
    const code = document.getElementById('login-code').value.trim();
    if (!phone || !code) {
      this._showError('请填写手机号和验证码');
      return;
    }
    try {
      const res = await this._fetch('/api/auth/login', { phone, code });
      if (res.ok) {
        this._token = res.token;
        this._user = {
          id: res.user.id,
          phone: res.user.phone,
          nickname: res.user.nickname,
          avatar: res.user.avatar,
          stats: res.user.stats,
          token: res.token
        };
        Storage.setUser(this._user);
        this._updateHeaderUI();
        // 登录成功后如果已打开弹窗，切换到用户面板
        const card = document.querySelector('.login-card');
        if (card) {
          document.getElementById('login-overlay').style.display = 'none';
        }
        // 自动同步
        this.syncToCloud();
      } else {
        this._showError(res.msg || '登录失败');
      }
    } catch(e) {
      this._showError('网络错误，请确认后端已启动');
    }
  },

  // ---- 退出 ----
  logout(silent) {
    this._token = null;
    this._user = null;
    Storage.clearUser();
    this._stopAutoSync();
    if (!silent) {
      this.closeLoginModal();
      this._showError('');
    }
    this._updateHeaderUI();
  },

  // ---- 云端同步 ----
  async syncToCloud() {
    if (!this.isLoggedIn()) return;
    try {
      const data = Storage.exportData();
      const stats = this._collectStats();
      await this._fetch('/api/user/sync', { data, stats });
      console.log('✅ 数据已同步到云端');
    } catch(e) {
      console.warn('⚠️ 云端同步失败:', e.message);
    }
  },

  async syncFromCloud() {
    if (!this.isLoggedIn()) return;
    try {
      const res = await this._fetch('/api/user/sync', null, 'GET');
      if (res.ok && res.data) {
        Storage.importData(res.data);
        console.log('✅ 数据已从云端恢复');
      }
    } catch(e) {
      console.warn('⚠️ 云端恢复失败:', e.message);
    }
  },

  // ---- 获取用户信息 ----
  async _fetchProfile() {
    try {
      const res = await this._fetch('/api/user/profile', null, 'GET');
      if (res.ok) {
        return { ...res.user, token: this._token };
      }
      return null;
    } catch(e) { return null; }
  },

  // ---- 辅助 ----
  _collectStats() {
    const submitted = Storage.getSubmittedIds();
    let correct = 0;
    (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : window.QUESTION_BANK || []).forEach(q => {
      if (!Storage.isSubmitted(q.id)) return;
      const ans = Storage.getAnswer(q.id);
      let isCorrect = false;
      if (q.type === 'multi') {
        const c = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
        const u = (Array.isArray(ans) ? ans : [ans]).sort().join('');
        isCorrect = c === u;
      } else if (q.type === 'fill') {
        isCorrect = String(ans || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
      } else {
        isCorrect = ans === q.answer;
      }
      if (isCorrect) correct++;
    });
    return {
      totalQuestions: submitted.length,
      correctRate: submitted.length > 0 ? Math.round(correct / submitted.length * 100) : 0,
      streak: Storage.getStreak(),
      examCount: Storage.getExams().length
    };
  },

  async _fetch(path, body, method) {
    const opts = {
      method: method || (body ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json' },
    };
    if (this._token) opts.headers['Authorization'] = 'Bearer ' + this._token;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this._baseURL + path, opts);
    return res.json();
  },

  _showError(msg) {
    const el = document.getElementById('login-error');
    if (!el) return;
    if (msg) { el.textContent = msg; el.style.display = 'block'; }
    else { el.style.display = 'none'; }
  },

  _updateHeaderUI() {
    const loginBtn = document.getElementById('btn-login-ui');
    if (!loginBtn) return;
    if (this.isLoggedIn()) {
      loginBtn.textContent = '👤 ' + (this._user.nickname || '我的');
      loginBtn.className = 'btn btn-outline btn-logged-in';
      loginBtn.onclick = () => this.showLoginModal();
    } else {
      loginBtn.textContent = '登录';
      loginBtn.className = 'btn btn-outline';
      loginBtn.onclick = () => this.showLoginModal();
    }
  }
};
