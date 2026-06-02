// ============================================================
// 考研刷题 - 个性化考研规划器 v1
// 选年份 → 选科目 → 生成分阶段学习计划 + 目标程度
// ============================================================

const Planner = {
  // 当前配置
  config: {
    year: '2027',       // 考研年份（入学年份）
    subjects: ['408', 'math', 'politics', 'english'],
  },

  // 根据年份计算关键日期
  _calcDates(year) {
    const examYear = parseInt(year) - 1; // 2027考研 → 2026年12月初试
    return {
      now: new Date(),
      examYear: examYear,
      foundation_end: `${examYear}-06-30`,
      summer_start: `${examYear}-07-01`,
      summer_end: `${examYear}-08-31`,
      sprint_start: `${examYear}-09-01`,
      sprint_end: `${examYear}-10-31`,
      final_start: `${examYear}-11-01`,
      exam: `${examYear}-12-20`,
      apply_start: `${examYear}-09-24`,
      apply_end: `${examYear}-10-25`,
      result: `${year}-02-20`,
    };
  },

  // 各科课程体系 — 知识点 → 四个阶段的目标程度
  // 程度: 0=未开始 1=了解 2=理解 3=掌握 4=熟练
  curriculums: {
    '408': {
      name: '408计算机', icon: '💻',
      topics: [
        { id:'ds1', name:'数据结构绪论',       g1:3,g2:4,g3:4,g4:4 },
        { id:'ds2', name:'线性表/链表',         g1:3,g2:4,g3:4,g4:4 },
        { id:'ds3', name:'栈和队列',            g1:3,g2:4,g3:4,g4:4 },
        { id:'ds4', name:'树与二叉树',          g1:2,g2:3,g3:4,g4:4 },
        { id:'ds5', name:'图',                  g1:1,g2:2,g3:3,g4:4 },
        { id:'ds6', name:'查找',                g1:1,g2:3,g3:4,g4:4 },
        { id:'ds7', name:'排序',                g1:2,g2:3,g3:4,g4:4 },
        { id:'co1', name:'计算机系统概述',      g1:2,g2:3,g3:4,g4:4 },
        { id:'co2', name:'数据的表示与运算',    g1:3,g2:4,g3:4,g4:4 },
        { id:'co3', name:'存储器层次结构',      g1:2,g2:3,g3:4,g4:4 },
        { id:'co4', name:'指令系统',            g1:1,g2:2,g3:3,g4:4 },
        { id:'co5', name:'中央处理器CPU',       g1:1,g2:2,g3:3,g4:4 },
        { id:'co6', name:'总线与I/O系统',       g1:1,g2:2,g3:3,g4:4 },
        { id:'os1', name:'操作系统概述',        g1:2,g2:3,g3:4,g4:4 },
        { id:'os2', name:'进程管理',            g1:2,g2:3,g3:4,g4:4 },
        { id:'os3', name:'内存管理',            g1:1,g2:2,g3:3,g4:4 },
        { id:'os4', name:'文件管理',            g1:1,g2:2,g3:3,g4:4 },
        { id:'os5', name:'I/O管理',             g1:1,g2:2,g3:3,g4:4 },
        { id:'cn1', name:'计算机网络体系结构',  g1:2,g2:3,g3:4,g4:4 },
        { id:'cn2', name:'物理层',              g1:2,g2:3,g3:4,g4:4 },
        { id:'cn3', name:'数据链路层',          g1:1,g2:2,g3:3,g4:4 },
        { id:'cn4', name:'网络层',              g1:1,g2:2,g3:3,g4:4 },
        { id:'cn5', name:'传输层',              g1:1,g2:2,g3:3,g4:4 },
        { id:'cn6', name:'应用层',              g1:1,g2:2,g3:3,g4:4 },
      ]
    },
    'math': {
      name: '数学一/二/三', icon: '📐',
      topics: [
        { id:'m1', name:'函数极限连续',   g1:3,g2:4,g3:4,g4:4 },
        { id:'m2', name:'一元微分学',     g1:3,g2:4,g3:4,g4:4 },
        { id:'m3', name:'一元积分学',     g1:3,g2:4,g3:4,g4:4 },
        { id:'m4', name:'微分方程',       g1:2,g2:3,g3:4,g4:4 },
        { id:'m5', name:'多元微分学',     g1:2,g2:3,g3:4,g4:4 },
        { id:'m6', name:'二重积分',       g1:1,g2:3,g3:4,g4:4 },
        { id:'m7', name:'无穷级数',       g1:1,g2:2,g3:4,g4:4 },
        { id:'m8', name:'向量与空间几何', g1:1,g2:2,g3:3,g4:4 },
        { id:'m9', name:'线性代数基础',   g1:3,g2:4,g3:4,g4:4 },
        { id:'m10',name:'矩阵与向量',     g1:2,g2:3,g3:4,g4:4 },
        { id:'m11',name:'线性方程组',     g1:2,g2:3,g3:4,g4:4 },
        { id:'m12',name:'特征值与二次型', g1:1,g2:2,g3:4,g4:4 },
        { id:'m13',name:'概率论基础',     g1:2,g2:3,g3:4,g4:4 },
        { id:'m14',name:'随机变量与分布', g1:2,g2:3,g3:4,g4:4 },
        { id:'m15',name:'数理统计',       g1:1,g2:2,g3:3,g4:4 },
      ]
    },
    'politics': {
      name: '政治', icon: '📖',
      topics: [
        { id:'p1', name:'马原：哲学',         g1:2,g2:3,g3:4,g4:4 },
        { id:'p2', name:'马原：政经+科社',    g1:1,g2:2,g3:4,g4:4 },
        { id:'p3', name:'毛中特',             g1:0,g2:2,g3:4,g4:4 },
        { id:'p4', name:'史纲',               g1:0,g2:2,g3:4,g4:4 },
        { id:'p5', name:'思修法基',           g1:0,g2:1,g3:3,g4:4 },
        { id:'p6', name:'时政',               g1:0,g2:0,g3:2,g4:4 },
      ]
    },
    'english': {
      name: '英语一/二', icon: '📝',
      topics: [
        { id:'e1', name:'考研词汇5500',       g1:3,g2:4,g3:4,g4:4 },
        { id:'e2', name:'长难句分析',         g1:3,g2:4,g3:4,g4:4 },
        { id:'e3', name:'阅读理解A',          g1:1,g2:3,g3:4,g4:4 },
        { id:'e4', name:'阅读理解B（新题型）',g1:0,g2:2,g3:3,g4:4 },
        { id:'e5', name:'翻译',               g1:0,g2:2,g3:3,g4:4 },
        { id:'e6', name:'完形填空',           g1:0,g2:1,g3:3,g4:4 },
        { id:'e7', name:'小作文',             g1:0,g2:1,g3:3,g4:4 },
        { id:'e8', name:'大作文',             g1:0,g2:2,g3:4,g4:4 },
      ]
    },
  },

  // 四个阶段定义
  phases: [
    { id:'g1', title:'基础阶段', label:'打基础', color:'#2196F3',
      desc:'全面学习各科基础知识，建立知识框架。数学和英语是重点。', hours: '6-8h/天' },
    { id:'g2', title:'强化阶段', label:'刷题强化', color:'#FF9800',
      desc:'暑假高强度刷题，攻克重难点。专业课开始系统复习。', hours: '8-10h/天' },
    { id:'g3', title:'冲刺阶段', label:'真题冲刺', color:'#E91E63',
      desc:'真题模拟 + 查漏补缺。政治主观题开始背诵。', hours: '10-12h/天' },
    { id:'g4', title:'模考阶段', label:'全真模拟', color:'#9C27B0',
      desc:'全科计时模拟考试，调整作息和心态。政治背诵冲刺。', hours: '10-12h/天' },
  ],

  // 程度标签
  levels: ['未开始','了解','理解','掌握','熟练'],
  levelColors: ['#ccc','#90CAF9','#42A5F5','#1E88E5','#0D47A1'],

  // ---- 初始化 ----
  init() {
    this._loadConfig();
  },

  // ---- 显示 ----
  show() {
    this._ensureDOM();
    document.getElementById('planner-panel').style.display = 'flex';
    // 隐藏其他面板
    ['content','welcome','exam-panel','kaoyan-panel','stats-panel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    this._renderConfig();
  },

  close() {
    document.getElementById('planner-panel').style.display = 'none';
    document.getElementById('content').style.display = '';
    if (typeof applyFilter === 'function') applyFilter();
  },

  // ---- 配置页 ----
  _renderConfig() {
    const el = document.getElementById('planner-panel');
    const d = this._calcDates(this.config.year);
    const yearNum = parseInt(this.config.year);

    const yearOpts = [yearNum, yearNum+1, yearNum+2].map(y =>
      `<option value="${y}" ${this.config.year == y ? 'selected' : ''}>${y}年考研（${y-1}年12月初试）</option>`
    ).join('');

    const subjKeys = ['408','math','politics','english'];
    const subjNames = { '408':'408计算机', 'math':'数学', 'politics':'政治', 'english':'英语' };

    el.innerHTML = `
      <div class="pl-header">
        <h2>📋 考研规划器</h2>
        <button class="btn btn-icon" onclick="Planner.close()" style="color:var(--text);font-size:22px;">✕</button>
      </div>

      <div class="pl-config-card">
        <div class="pl-config-row">
          <label>🎯 目标考研年份</label>
          <select id="pl-year" class="pl-select" onchange="Planner._onYearChange()">${yearOpts}</select>
        </div>
        <div class="pl-config-row">
          <label>📚 考试科目</label>
          <div class="pl-subj-chips">
            ${subjKeys.map(k => `
              <span class="pl-subj-chip ${this.config.subjects.includes(k)?'active':''}"
                    onclick="Planner._toggleSubject('${k}')">${subjNames[k]}</span>
            `).join('')}
          </div>
        </div>
        <button class="btn btn-primary btn-full-login" onclick="Planner._renderPlan()" style="margin-top:8px;">
          📋 生成学习计划
        </button>
      </div>

      <div id="pl-plan-area"></div>
    `;
  },

  _onYearChange() {
    this.config.year = document.getElementById('pl-year').value;
    this._saveConfig();
  },

  _toggleSubject(key) {
    const idx = this.config.subjects.indexOf(key);
    if (idx >= 0) this.config.subjects.splice(idx, 1);
    else this.config.subjects.push(key);
    this._saveConfig();
    this._renderConfig();
  },

  // ---- 计划页 ----
  _renderPlan() {
    const d = this._calcDates(this.config.year);
    const area = document.getElementById('pl-plan-area');
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();

    // 计算总进度
    let totalTopics = 0, doneWeight = 0;
    this.config.subjects.forEach(sk => {
      const cur = this.curriculums[sk];
      if (!cur) return;
      cur.topics.forEach(t => {
        totalTopics++;
        // 根据当前日期判断处于哪个阶段，用该阶段的目标程度作为权重
        const phase = this._getCurrentPhase(d);
        const goal = t[phase];
        const actual = this._getProgress(sk, t.id);
        doneWeight += Math.min(actual, goal) / 4;
      });
    });
    const overallPct = totalTopics > 0 ? Math.round((doneWeight / totalTopics) * 100) : 0;

    // 阶段时间线
    const phaseDates = {
      g1: { start: d.now.toISOString().slice(0,10), end: d.foundation_end },
      g2: { start: d.summer_start, end: d.summer_end },
      g3: { start: d.sprint_start, end: d.sprint_end },
      g4: { start: d.final_start, end: d.exam },
    };

    const currentPhase = this._getCurrentPhase(d);

    const phasesHTML = this.phases.map((p, i) => {
      const isCurrent = p.id === currentPhase;
      const isPassed = today > (phaseDates[p.id]?.end || '');
      let cls = 'pl-phase-card';
      if (isCurrent) cls += ' pl-phase-current';
      if (isPassed) cls += ' pl-phase-passed';

      return `
        <div class="${cls}" style="border-top:4px solid ${p.color}">
          <div class="pl-phase-head">
            <span class="pl-phase-num" style="background:${p.color}">${i+1}</span>
            <span class="pl-phase-title">${p.title}</span>
            <span class="pl-phase-label">${p.label}</span>
            ${isCurrent ? '<span class="kg-badge-now">当前</span>' : ''}
          </div>
          <div class="pl-phase-date">
            ${phaseDates[p.id]?.start || ''} → ${phaseDates[p.id]?.end || ''}
          </div>
          <div class="pl-phase-desc">${p.desc}</div>
          <div class="pl-phase-hours">⏱ 建议 ${p.hours}</div>
        </div>
      `;
    }).join('');

    // 各科详细计划
    let subjectsHTML = '';
    this.config.subjects.forEach(sk => {
      const cur = this.curriculums[sk];
      if (!cur) return;

      const topicsHTML = cur.topics.map(t => {
        const phase = currentPhase;
        const goal = t[phase]; // 当前阶段目标程度
        const actual = this._getProgress(sk, t.id);
        const goalLabel = this.levels[goal];
        const goalColor = this.levelColors[goal];

        // 生成四个阶段的进度点
        const dotsHTML = ['g1','g2','g3','g4'].map(ph => {
          const g = t[ph];
          const a = this._getProgress(sk, t.id);
          const filled = a >= g;
          return `<span class="pl-dot ${filled?'pl-dot-filled':''}" style="${filled?`background:${this.levelColors[g]}`:''}" title="${this.phases.find(p=>p.id===ph).label}: 目标${this.levels[g]}"></span>`;
        }).join('');

        return `
          <tr>
            <td class="pl-topic-name">${t.name}</td>
            <td>${dotsHTML}</td>
            <td>
              <span class="pl-goal-tag" style="background:${goalColor}20;color:${goalColor};border:1px solid ${goalColor}40">
                🎯 ${goalLabel}
              </span>
            </td>
            <td>
              <div class="pl-level-bar">
                ${this.levels.map((l, li) => `
                  <span class="pl-lv ${li <= actual-1 ? 'pl-lv-on' : ''}"
                        style="${li <= actual-1 ? `background:${this.levelColors[li+1]}` : ''}"
                        onclick="Planner._setProgress('${sk}','${t.id}',${li+1})"
                        title="设为「${l}」"></span>
                `).join('')}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      subjectsHTML += `
        <div class="pl-subj-block">
          <div class="pl-subj-title">${cur.icon} ${cur.name}</div>
          <div class="pl-table-wrap">
            <table class="pl-table">
              <thead><tr><th>知识点</th><th>阶段目标</th><th>当前目标</th><th>我的程度（点击调整）</th></tr></thead>
              <tbody>${topicsHTML}</tbody>
            </table>
          </div>
        </div>
      `;
    });

    area.innerHTML = `
      <div class="pl-overview">
        <div class="pl-overview-ring">
          <span class="pl-overview-num">${overallPct}%</span>
          <span class="pl-overview-label">总进度</span>
        </div>
        <div class="pl-overview-info">
          <div>🎯 ${this.config.year}年考研 · ${this.config.subjects.length}科</div>
          <div>📅 初试: ${d.exam}</div>
          <div>⏳ 倒计时: <strong>${Math.ceil((new Date(d.exam) - now) / 86400000)} 天</strong></div>
        </div>
      </div>

      <div class="pl-section-title">📅 四个阶段</div>
      <div class="pl-phases-grid">${phasesHTML}</div>

      <div class="pl-section-title">📚 分科学习计划（点击程度条调整进度）</div>
      <div class="pl-subjects">${subjectsHTML}</div>

      <div class="pl-legend">
        <span>程度：</span>
        ${this.levels.map((l, i) => `<span class="pl-legend-item"><span class="pl-legend-dot" style="background:${this.levelColors[i]}"></span>${l}</span>`).join('')}
        <span style="margin-left:12px;">🎯 = 当前阶段应达到的目标</span>
      </div>

      <button class="btn btn-secondary btn-full-login" onclick="Planner._renderConfig()" style="margin-top:20px;">← 重新设置</button>
    `;
  },

  // 获取当前阶段
  _getCurrentPhase(d) {
    const now = new Date();
    if (now <= new Date(d.foundation_end)) return 'g1';
    if (now <= new Date(d.summer_end)) return 'g2';
    if (now <= new Date(d.sprint_end)) return 'g3';
    return 'g4';
  },

  // 获取/设置进度
  _getProgress(subjKey, topicId) {
    try {
      const data = JSON.parse(localStorage.getItem('pl-progress') || '{}');
      return (data[subjKey] && data[subjKey][topicId]) || 0;
    } catch(e) { return 0; }
  },

  _setProgress(subjKey, topicId, level) {
    try {
      const data = JSON.parse(localStorage.getItem('pl-progress') || '{}');
      if (!data[subjKey]) data[subjKey] = {};
      data[subjKey][topicId] = data[subjKey][topicId] === level ? 0 : level; // 点击同等级取消
      localStorage.setItem('pl-progress', JSON.stringify(data));
      this._renderPlan();
    } catch(e) {}
  },

  // ---- Storage ----
  _loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem('pl-config'));
      if (saved) this.config = saved;
    } catch(e) {}
  },

  _saveConfig() {
    localStorage.setItem('pl-config', JSON.stringify(this.config));
  },

  // ---- DOM ----
  _ensureDOM() {
    if (document.getElementById('planner-panel')) return;
    const html = `<div id="planner-panel" style="display:none;"></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};

Planner.init();
