// ============================================================
// 考研刷题 - 后端服务 (Node.js)
// 运行: node server.js
// 端口: 3456
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3456;
const DB_PATH = path.join(__dirname, 'db.json');
const CODE_EXPIRE = 5 * 60 * 1000; // 验证码5分钟有效
const TOKEN_EXPIRE = 30 * 24 * 60 * 60 * 1000; // token 30天有效

// ============ 简易数据库 ============
function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
  catch(e) { return { users: {}, codes: {}, tokens: {} }; }
}
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ============ 工具函数 ============
function uid() { return 'u_' + crypto.randomBytes(8).toString('hex'); }
function tokenGen() { return 'tk_' + crypto.randomBytes(16).toString('hex'); }
function now() { return Date.now(); }
function sendJSON(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(JSON.stringify(data));
}

// ============ 业务逻辑 ============
function handleSendCode(db, body) {
  const { phone } = body;
  if (!phone || !/^1\d{10}$/.test(phone)) {
    return { ok: false, msg: '手机号格式不正确' };
  }
  // 生成6位验证码（演示模式：固定为 000000）
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.codes[phone] = { code, expires: now() + CODE_EXPIRE };
  console.log(`[验证码] ${phone} -> ${code}`);
  return { ok: true, msg: '验证码已发送（演示模式：控制台可见）' };
}

function handleLogin(db, body) {
  const { phone, code } = body;
  if (!phone || !code) {
    return { ok: false, msg: '手机号和验证码不能为空' };
  }
  const record = db.codes[phone];
  if (!record) {
    return { ok: false, msg: '请先获取验证码' };
  }
  if (now() > record.expires) {
    delete db.codes[phone];
    return { ok: false, msg: '验证码已过期' };
  }
  // 演示模式：验证码 000000 万能通过
  if (code !== record.code && code !== '000000') {
    return { ok: false, msg: '验证码错误' };
  }
  delete db.codes[phone];

  // 查找或创建用户
  let user = Object.values(db.users).find(u => u.phone === phone);
  const isNew = !user;
  if (isNew) {
    const id = uid();
    user = {
      id, phone,
      nickname: '研友' + phone.slice(-4),
      avatar: '',
      createdAt: now(),
      stats: { totalQuestions: 0, correctRate: 0, streak: 0, examCount: 0 }
    };
    db.users[id] = user;
  }

  // 生成 token
  const token = tokenGen();
  db.tokens[token] = { userId: user.id, expires: now() + TOKEN_EXPIRE };

  return {
    ok: true,
    isNew,
    user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar, stats: user.stats },
    token
  };
}

function verifyToken(db, authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const record = db.tokens[token];
  if (!record || now() > record.expires) return null;
  return db.users[record.userId] || null;
}

function handleGetProfile(db, authHeader) {
  const user = verifyToken(db, authHeader);
  if (!user) return { ok: false, msg: '未登录或登录已过期' };
  return {
    ok: true,
    user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar, stats: user.stats }
  };
}

function handleSyncUpload(db, authHeader, body) {
  const user = verifyToken(db, authHeader);
  if (!user) return { ok: false, msg: '未登录' };
  if (body.data) {
    user.syncData = body.data;
    user.lastSyncAt = now();
    if (body.stats) {
      user.stats = { ...user.stats, ...body.stats };
    }
  }
  return { ok: true, lastSyncAt: user.lastSyncAt };
}

function handleSyncDownload(db, authHeader) {
  const user = verifyToken(db, authHeader);
  if (!user) return { ok: false, msg: '未登录' };
  return { ok: true, data: user.syncData || null, lastSyncAt: user.lastSyncAt || null };
}

// ============ 路由 ============
const routes = {
  'POST /api/auth/send-code': (db, body) => handleSendCode(db, body),
  'POST /api/auth/login':    (db, body) => handleLogin(db, body),
  'GET /api/user/profile':   (db, _, auth) => handleGetProfile(db, auth),
  'POST /api/user/sync':     (db, body, auth) => handleSyncUpload(db, auth, body),
  'GET /api/user/sync':      (db, _, auth) => handleSyncDownload(db, auth)
};

// ============ HTTP Server ============
const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');

  // 解析 body
  if (req.method === 'POST') {
    let bodyRaw = '';
    req.on('data', chunk => bodyRaw += chunk);
    req.on('end', () => {
      let body = {};
      try { body = JSON.parse(bodyRaw); } catch(e) {}
      handleRequest(req, res, url, body);
    });
  } else {
    handleRequest(req, res, url, {});
  }
});

function handleRequest(req, res, url, body) {
  const key = req.method + ' ' + url.pathname;
  const db = loadDB();
  const authHeader = req.headers['authorization'] || '';

  if (routes[key]) {
    const result = routes[key](db, body, authHeader);
    saveDB(db);
    if (result.ok === false) {
      sendJSON(res, 400, result);
    } else {
      sendJSON(res, 200, result);
    }
  } else {
    sendJSON(res, 404, { ok: false, msg: '接口不存在' });
  }
}

server.listen(PORT, () => {
  console.log(`📚 考研刷题后端已启动: http://localhost:${PORT}`);
  console.log(`   接口列表:`);
  console.log(`   POST /api/auth/send-code  - 发送验证码`);
  console.log(`   POST /api/auth/login      - 登录/注册`);
  console.log(`   GET  /api/user/profile    - 获取用户信息`);
  console.log(`   POST /api/user/sync       - 上传数据`);
  console.log(`   GET  /api/user/sync       - 下载数据`);
  console.log(`\n   演示验证码: 000000（万能码）`);
});
