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
      // 直接用 Storage._data，避免 JSON 序列化/反序列化的数据丢失
      const payload = {
        user_id: this._userId,
        data: Storage._data._accounts || {},
        updated_at: new Date().toISOString()
      };
      const { error } = await this._client
        .from('user_data')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) {
        if (error.code === '42P01') {
          console.warn('⚠️ 云端表 user_data 不存在，请在 Supabase SQL Editor 执行建表语句');
        } else {
          console.warn('云同步上传失败:', error.message, error.code);
        }
      } else {
        console.log('✅ 数据已同步到云端');
      }
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
        .maybeSingle();
      if (error) {
        if (error.code === '42P01') {
          console.warn('⚠️ 云端表 user_data 不存在');
        } else {
          console.warn('云同步下载失败:', error.message);
        }
        return null;
      }
      if (!data?.data) return null;
      return data.data;
    } catch (e) {
      console.warn('云同步下载异常:', e.message);
      return null;
    }
  },

  // ---- 登录后处理 ----
  async _onLogin() {
    console.log('🔐 已登录 Supabase，开始同步...');
    // 先尝试从云端下载
    const cloudData = await this.download();
    if (cloudData) {
      console.log('📥 从云端下载数据...');
      // 合并到本地
      if (Storage._data && Storage._data._accounts) {
        for (const [name, acc] of Object.entries(cloudData)) {
          if (!Storage._data._accounts[name]) {
            Storage._data._accounts[name] = acc;
          } else {
            // 合并：云端数据覆盖本地（以云端为准）
            Object.assign(Storage._data._accounts[name], acc);
          }
        }
        Storage._flush();
        console.log('✅ 云端数据已合并到本地');
      }
      // 刷新全局变量
      if (typeof Auth !== 'undefined' && Auth._reloadGlobals) Auth._reloadGlobals();
      if (typeof updateAllStats === 'function') updateAllStats();
      if (typeof applyFilter === 'function') applyFilter();
    } else {
      console.log('📤 云端无数据，上传本地数据...');
    }
    // 上传本地数据到云端
    await this.upload();
  },

  // ---- 手动同步 ----
  async manualSync() {
    if (!this.isLoggedIn()) return '请先登录';
    try {
      await this.upload();
      return '✅ 同步成功';
    } catch(e) {
      return '❌ 同步失败: ' + e.message;
    }
  },

  // ---- 自动同步 ----
  _uploadTimer: null,
  scheduleUpload() {
    if (!this._userId) return;
    clearTimeout(this._uploadTimer);
    this._uploadTimer = setTimeout(() => this.upload(), 3000);
  }
};

// 答题后自动触发云端同步
const _origFlush = Storage._flush;
Storage._flush = function() {
  _origFlush.call(this);
  if (typeof Cloud !== 'undefined' && Cloud.isLoggedIn && Cloud.isLoggedIn()) {
    Cloud.scheduleUpload();
  }
};

// 启动
Cloud.init();
