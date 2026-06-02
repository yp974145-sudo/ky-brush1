// ============================================================
// 考研刷题 - Supabase 云端同步 v1
// 使用前：去 https://supabase.com 创建免费项目
// 把下面的 SUPABASE_URL 和 SUPABASE_KEY 换成你自己的
// ============================================================

const SUPABASE_CONFIG = {
  url: 'https://mxtkkglvfkfwcqfuwnws.supabase.co',
  key: 'sb_publishable_wewoxkAjlA9RW9_9O34x3g_hHEKFfSU',
};

const Cloud = {
  _client: null,
  _userId: null,
  _syncing: false,

  // ---- 初始化 ----
  init() {
    if (!window.supabase) {
      console.warn('Supabase SDK 未加载，云端同步不可用');
      return;
    }
    if (SUPABASE_CONFIG.url.includes('YOUR-PROJECT')) {
      console.info('未配置 Supabase，跳過雲端同步。去 supabase.com 创建项目后填入 js/supabase.js');
      return;
    }
    this._client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    // 自动恢复 session
    this._client.auth.getSession().then(({ data }) => {
      if (data.session) {
        this._userId = data.session.user.id;
        this._onLogin();
      }
    });
  },

  isReady() { return !!this._client; },

  // ---- 邮箱登录 ----
  async signUp(email, password) {
    if (!this._client) throw new Error('云同步未连接');
    const { data, error } = await this._client.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) { this._userId = data.user.id; this._onLogin(); }
    return data;
  },

  async signIn(email, password) {
    if (!this._client) throw new Error('云同步未连接');
    const { data, error } = await this._client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) { this._userId = data.user.id; this._onLogin(); }
    return data;
  },

  // ---- 手机验证码登录 ----
  async sendPhoneOTP(phone) {
    if (!this._client) throw new Error('云同步未连接');
    const { data, error } = await this._client.auth.signInWithOtp({ phone });
    if (error) throw error;
    return data;
  },

  async verifyPhoneOTP(phone, token) {
    if (!this._client) throw new Error('云同步未连接');
    const { data, error } = await this._client.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
    if (data.user) { this._userId = data.user.id; this._onLogin(); }
    return data;
  },

  async signOut() {
    if (!this._client) return;
    await this._client.auth.signOut();
    this._userId = null;
  },

  getUserId() { return this._userId; },
  isLoggedIn() { return !!this._userId; },

  // ---- 数据表初始化 ----
  _ensureTables() {
    // Supabase 需要先在后台创建表（SQL Editor 执行）：
    //
    // CREATE TABLE user_data (
    //   id SERIAL PRIMARY KEY,
    //   user_id UUID REFERENCES auth.users NOT NULL,
    //   data JSONB NOT NULL,
    //   updated_at TIMESTAMPTZ DEFAULT NOW()
    // );
    // CREATE UNIQUE INDEX user_data_user_id_idx ON user_data(user_id);
    //
    // 如果没有建表，上传会失败，但不影响本地使用
  },

  // ---- 同步：上传 ----
  async upload() {
    if (!this._client || !this._userId) return;
    if (this._syncing) return;
    this._syncing = true;
    try {
      const dump = Storage.exportData();
      const { error } = await this._client
        .from('user_data')
        .upsert({ user_id: this._userId, data: JSON.parse(dump), updated_at: new Date().toISOString() });
      if (error) console.warn('云同步上传失败:', error.message);
    } catch (e) {
      console.warn('云同步上传异常:', e.message);
    } finally {
      this._syncing = false;
    }
  },

  // ---- 同步：下载 ----
  async download() {
    if (!this._client || !this._userId) return null;
    try {
      const { data, error } = await this._client
        .from('user_data')
        .select('data')
        .eq('user_id', this._userId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null; // 没有记录，正常
        console.warn('云同步下载失败:', error.message);
        return null;
      }
      return data?.data || null;
    } catch (e) {
      console.warn('云同步下载异常:', e.message);
      return null;
    }
  },

  // ---- 登录后处理 ----
  async _onLogin() {
    // 尝试从云端下载数据
    const cloud = await this.download();
    if (cloud) {
      const merged = Storage.importData(JSON.stringify(cloud));
      if (merged && typeof updateAllStats === 'function') updateAllStats();
      if (typeof applyFilter === 'function') applyFilter();
    }
    // 上传本地数据到云端
    await this.upload();
  },

  // ---- 自动同步 ----
  // 答题后调用，带防抖
  _uploadTimer: null,
  scheduleUpload() {
    if (!this._userId) return;
    clearTimeout(this._uploadTimer);
    this._uploadTimer = setTimeout(() => this.upload(), 2000);
  }
};

// 答题后自动触发云端同步（挂到 Storage 上）
const _origFlush = Storage._flush;
Storage._flush = function() {
  _origFlush.call(this);
  if (Cloud.isLoggedIn()) Cloud.scheduleUpload();
};

// 启动
Cloud.init();
