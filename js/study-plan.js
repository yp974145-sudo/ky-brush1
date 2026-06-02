// ============================================================
// 考研刷题 - 学习计划 + 技能树 v3
// ============================================================

// 预设学习计划模板
const STUDY_PLANS = {
  'ds-30': {
    id: 'ds-30',
    name: '数据结构 30 天通关',
    icon: '🌲',
    desc: '按照 408 考纲顺序，每天一个知识点，30 天刷完数据结构真题',
    stages: [
      { day: 1, topic: 'ds-1', label: '绪论与时间复杂度', goal: 5 },
      { day: 2, topic: 'ds-2', label: '线性表：顺序表', goal: 2 },
      { day: 3, topic: 'ds-3', label: '栈和队列', goal: 4 },
      { day: 4, topic: 'ds-4', label: '串与 KMP', goal: 0 },
      { day: 5, topic: 'ds-5', label: '二叉树遍历', goal: 3 },
      { day: 6, topic: 'ds-5', label: '树与森林', goal: 3 },
      { day: 7, topic: 'ds-5', label: '哈夫曼树与并查集', goal: 3 },
      { day: 8, topic: 'ds-6', label: '图的存储与遍历', goal: 2 },
      { day: 9, topic: 'ds-6', label: '图：最小生成树与最短路径', goal: 2 },
      { day: 10, topic: 'ds-7', label: '查找：折半与二叉搜索树', goal: 2 },
      { day: 11, topic: 'ds-7', label: '查找：B树与散列表', goal: 3 },
      { day: 12, topic: 'ds-8', label: '排序：插入/冒泡/快排', goal: 2 },
      { day: 13, topic: 'ds-8', label: '排序：堆排/归并/基数', goal: 3 },
      { day: 14, topic: 'ds-1', label: '数据结构综合复习', goal: 10 },
    ]
  },
  'co-21': {
    id: 'co-21',
    name: '计组三周特训',
    icon: '💻',
    desc: '21 天攻克计算机组成原理，覆盖数据运算、存储、CPU、I/O',
    stages: [
      { day: 1, topic: 'co-1', label: '计算机系统概述', goal: 3 },
      { day: 2, topic: 'co-2', label: '数制与编码', goal: 2 },
      { day: 3, topic: 'co-2', label: 'IEEE754 与 ALU', goal: 2 },
      { day: 4, topic: 'co-3', label: '主存储器', goal: 2 },
      { day: 5, topic: 'co-3', label: 'Cache 映射与替换', goal: 3 },
      { day: 6, topic: 'co-3', label: '虚拟存储器', goal: 2 },
      { day: 7, topic: 'co-4', label: '指令系统与寻址', goal: 2 },
      { day: 8, topic: 'co-5', label: '数据通路', goal: 2 },
      { day: 9, topic: 'co-5', label: '指令流水线', goal: 3 },
      { day: 10, topic: 'co-5', label: '控制器设计', goal: 3 },
      { day: 11, topic: 'co-7', label: '中断与 DMA', goal: 2 },
      { day: 12, topic: 'co-1', label: '计组综合复习', goal: 8 },
    ]
  },
  'os-20': {
    id: 'os-20',
    name: '操作系统 20 天突破',
    icon: '⚙️',
    desc: '从进程到文件系统，20 天刷完操作系统核心考点',
    stages: [
      { day: 1, topic: 'os-1', label: 'OS 概述与系统调用', goal: 2 },
      { day: 2, topic: 'os-2', label: '进程与线程概念', goal: 3 },
      { day: 3, topic: 'os-2', label: '进程调度算法', goal: 3 },
      { day: 4, topic: 'os-2', label: '同步与互斥', goal: 3 },
      { day: 5, topic: 'os-2', label: '死锁', goal: 2 },
      { day: 6, topic: 'os-3', label: '连续分配与分页', goal: 2 },
      { day: 7, topic: 'os-3', label: '页面置换与虚拟内存', goal: 3 },
      { day: 8, topic: 'os-4', label: '文件系统结构', goal: 2 },
      { day: 9, topic: 'os-4', label: '磁盘调度', goal: 2 },
      { day: 10, topic: 'os-5', label: 'I/O 控制与缓冲', goal: 2 },
      { day: 11, topic: 'os-1', label: '操作系统综合复习', goal: 10 },
    ]
  },
  'cn-18': {
    id: 'cn-18',
    name: '计网 18 天速成',
    icon: '🌐',
    desc: '系统梳理计算机网络，覆盖 TCP/IP 五层协议栈全部考点',
    stages: [
      { day: 1, topic: 'cn-1', label: 'OSI/TCP/IP 体系结构', goal: 1 },
      { day: 2, topic: 'cn-2', label: '物理层：编码与香农定理', goal: 2 },
      { day: 3, topic: 'cn-3', label: '数据链路层：帧与 MAC', goal: 2 },
      { day: 4, topic: 'cn-3', label: '交换机与 VLAN', goal: 2 },
      { day: 5, topic: 'cn-4', label: '网络层：IP 与子网', goal: 2 },
      { day: 6, topic: 'cn-4', label: '路由算法与协议', goal: 3 },
      { day: 7, topic: 'cn-4', label: 'IPv6 与移动 IP', goal: 2 },
      { day: 8, topic: 'cn-5', label: '传输层：TCP 可靠传输', goal: 3 },
      { day: 9, topic: 'cn-5', label: 'TCP 拥塞控制', goal: 3 },
      { day: 10, topic: 'cn-5', label: 'UDP', goal: 3 },
      { day: 11, topic: 'cn-6', label: '应用层：DNS/HTTP/FTP/SMTP', goal: 3 },
      { day: 12, topic: 'cn-1', label: '计网综合复习', goal: 10 },
    ]
  },
  'math-21': {
    id: 'math-21',
    name: '数学一 21 天强化',
    icon: '📐',
    desc: '高数、线代、概率三大模块分阶段刷题',
    stages: [
      { day: 1, topic: 'ma-1', label: '极限与连续', goal: 2 },
      { day: 2, topic: 'ma-2', label: '导数与微分', goal: 2 },
      { day: 3, topic: 'ma-2', label: '中值定理与泰勒', goal: 2 },
      { day: 4, topic: 'ma-2', label: '微分应用', goal: 2 },
      { day: 5, topic: 'ma-3', label: '不定积分', goal: 2 },
      { day: 6, topic: 'ma-3', label: '定积分与反常积分', goal: 3 },
      { day: 7, topic: 'ma-3', label: '定积分应用', goal: 2 },
      { day: 8, topic: 'ma-4', label: '多元微分', goal: 2 },
      { day: 9, topic: 'ma-4', label: '多元极值与拉格朗日', goal: 2 },
      { day: 10, topic: 'ma-5', label: '重积分', goal: 1 },
      { day: 11, topic: 'ma-6', label: '微分方程', goal: 2 },
      { day: 12, topic: 'ma-7', label: '无穷级数', goal: 3 },
      { day: 13, topic: 'ma-8', label: '行列式与矩阵', goal: 2 },
      { day: 14, topic: 'ma-8', label: '向量与线性方程组', goal: 2 },
      { day: 15, topic: 'ma-8', label: '特征值与二次型', goal: 1 },
      { day: 16, topic: 'ma-9', label: '概率基本概念', goal: 2 },
      { day: 17, topic: 'ma-9', label: '随机变量与分布', goal: 2 },
      { day: 18, topic: 'ma-9', label: '参数估计', goal: 1 },
      { day: 19, topic: 'ma-1', label: '数学综合复习', goal: 10 },
    ]
  }
};

// 技能树定义：按知识依赖关系组织
const SKILL_TREE = {
  '408': {
    name: '408 计算机统考', icon: '💾',
    children: {
      ds: {
        name: '数据结构', icon: '🌲', color: '#4CAF50',
        children: {
          'ds-1': { name: '绪论', stat: null },
          'ds-2': { name: '线性表', stat: null },
          'ds-3': { name: '栈和队列', stat: null },
          'ds-4': { name: '串', stat: null },
          'ds-5': { name: '树与二叉树', stat: null },
          'ds-6': { name: '图', stat: null },
          'ds-7': { name: '查找', stat: null },
          'ds-8': { name: '排序', stat: null },
        }
      },
      co: {
        name: '计算机组成原理', icon: '💻', color: '#2196F3',
        children: {
          'co-1': { name: '概述', stat: null },
          'co-2': { name: '数据的表示和运算', stat: null },
          'co-3': { name: '存储器层次结构', stat: null },
          'co-4': { name: '指令系统', stat: null },
          'co-5': { name: '中央处理器', stat: null },
          'co-6': { name: '总线', stat: null },
          'co-7': { name: '输入输出系统', stat: null },
        }
      },
      os: {
        name: '操作系统', icon: '⚙️', color: '#FF9800',
        children: {
          'os-1': { name: 'OS 概述', stat: null },
          'os-2': { name: '进程管理', stat: null },
          'os-3': { name: '内存管理', stat: null },
          'os-4': { name: '文件管理', stat: null },
          'os-5': { name: 'I/O 管理', stat: null },
        }
      },
      cn: {
        name: '计算机网络', icon: '🌐', color: '#9C27B0',
        children: {
          'cn-1': { name: '体系结构', stat: null },
          'cn-2': { name: '物理层', stat: null },
          'cn-3': { name: '数据链路层', stat: null },
          'cn-4': { name: '网络层', stat: null },
          'cn-5': { name: '传输层', stat: null },
          'cn-6': { name: '应用层', stat: null },
        }
      }
    }
  }
};

const Plan = {
  _storageKey: 'ky-plan',
  currentPlanId: null,
  progress: {},   // { stageIndex: { done, correct } }

  init() {
    const saved = JSON.parse(localStorage.getItem(this._storageKey) || '{}');
    this.currentPlanId = saved.planId || null;
    this.progress = saved.progress || {};
    this._refreshStats();
  },

  selectPlan(planId) {
    this.currentPlanId = planId;
    this.progress = {};
    this._save();
    this._refreshStats();
  },

  abandonPlan() {
    if (!confirm('确定要放弃当前学习计划吗？进度将丢失。')) return;
    this.currentPlanId = null;
    this.progress = {};
    this._save();
    this._refreshStats();
  },

  getPlan() {
    return STUDY_PLANS[this.currentPlanId] || null;
  },

  getStageProgress(idx) {
    return this.progress[idx] || null;
  },

  getOverallProgress() {
    const plan = this.getPlan();
    if (!plan) return { done: 0, correct: 0, total: 0, rate: 0, completedStages: 0, totalStages: plan.stages.length };
    let done = 0, correct = 0, completedStages = 0;
    plan.stages.forEach((s, i) => {
      const p = this.progress[i];
      if (p) { done += p.done; correct += p.correct; }
      if (p && p.done >= s.goal && s.goal > 0) completedStages++;
    });
    const total = plan.stages.length;
    const totalGoals = plan.stages.reduce((sum, s) => sum + s.goal, 0);
    return { done, correct, total, rate: totalGoals > 0 ? Math.round(correct / Math.max(done, 1) * 100) : 0, completedStages, totalStages: total };
  },

  // 由外部调用：当用户做完一道题后自动更新计划进度
  onQuestionSubmitted(qId, isCorrect) {
    const plan = this.getPlan();
    if (!plan) return;
    const bank = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);
    const q = bank.find(x => x.id === qId);
    if (!q) return;

    // 找到匹配的 stage
    plan.stages.forEach((stage, i) => {
      if (q.topic === stage.topic) {
        if (!this.progress[i]) this.progress[i] = { done: 0, correct: 0 };
        this.progress[i].done++;
        if (isCorrect) this.progress[i].correct++;
      }
    });
    this._save();
  },

  // 技能树统计
  getSkillTreeProgress() {
    const bank = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);
    const stats = {};
    for (const topicKey of Object.keys(TOPICS)) {
      const qs = bank.filter(q => q.topic === topicKey);
      const done = qs.filter(q => Storage.isSubmitted(q.id)).length;
      let corr = 0;
      qs.forEach(q => {
        if (!Storage.isSubmitted(q.id)) return;
        const ans = Storage.getAnswer(q.id);
        let ok = false;
        if (q.type === 'multi') {
          const c = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
          const u = (Array.isArray(ans) ? ans : [ans]).sort().join('');
          ok = c === u;
        } else if (q.type === 'fill') {
          ok = String(ans || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
        } else { ok = ans === q.answer; }
        if (ok) corr++;
      });
      stats[topicKey] = { total: qs.length, done, corr, rate: done > 0 ? Math.round(corr / done * 100) : 0 };
    }
    return stats;
  },

  _refreshStats() {
    // 更新 plan 进度（通过比较 bank 中的 submitted 数据）
    this._recalcFromBank();
  },

  _recalcFromBank() {
    const plan = this.getPlan();
    if (!plan) return;
    const bank = (typeof QUESTION_BANK !== 'undefined' ? QUESTION_BANK : []);
    // 只有没有手动 progress 时才从 bank 计算
    if (Object.keys(this.progress).length > 0) return;

    plan.stages.forEach((stage, i) => {
      const qs = bank.filter(q => q.topic === stage.topic);
      const submitted = qs.filter(q => Storage.isSubmitted(q.id));
      let corr = 0;
      submitted.forEach(q => {
        const ans = Storage.getAnswer(q.id);
        let ok = false;
        if (q.type === 'multi') {
          const c = (Array.isArray(q.answer) ? q.answer : [q.answer]).sort().join('');
          const u = (Array.isArray(ans) ? ans : [ans]).sort().join('');
          ok = c === u;
        } else if (q.type === 'fill') {
          ok = String(ans || '').trim().toLowerCase() === String(q.answer).trim().toLowerCase();
        } else { ok = ans === q.answer; }
        if (ok) corr++;
      });
      if (submitted.length > 0) {
        this.progress[i] = { done: submitted.length, correct: corr };
      }
    });
    this._save();
  },

  _save() {
    localStorage.setItem(this._storageKey, JSON.stringify({
      planId: this.currentPlanId,
      progress: this.progress
    }));
  }
};

// ============================================================
// 计划 & 技能树 UI 渲染
// ============================================================
const PlanUI = {

  show() {
    this._ensureDOM();
    const panel = document.getElementById('plan-panel');
    this._render();
    panel.style.display = 'flex';
    document.getElementById('content').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
    if (document.getElementById('exam-panel')) document.getElementById('exam-panel').style.display = 'none';
    if (document.getElementById('stats-panel')) document.getElementById('stats-panel').style.display = 'none';
  },

  close() {
    const panel = document.getElementById('plan-panel');
    if (panel) panel.style.display = 'none';
    document.getElementById('content').style.display = '';
    if (typeof applyFilter === 'function') applyFilter();
  },

  _render() {
    const panel = document.getElementById('plan-panel');
    const plan = Plan.getPlan();
    const overall = Plan.getOverallProgress();
    const skillStats = Plan.getSkillTreeProgress();

    let content = '';

    if (!plan) {
      // 计划列表
      content = `<div class="plan-header">
        <span class="plan-title">📋 学习计划</span>
        <p class="plan-desc">选择一个计划，系统会每天自动跟踪你的刷题进度</p>
      </div>
      <div class="plan-grid">
        ${Object.values(STUDY_PLANS).map(p => {
          const stats = this._calcPlanStats(p);
          return `
          <div class="plan-card" onclick="PlanUI._selectPlan('${p.id}')">
            <div class="plan-card-icon">${p.icon}</div>
            <div class="plan-card-name">${p.name}</div>
            <div class="plan-card-desc">${p.desc}</div>
            <div class="plan-card-meta">${p.stages.length} 天 · ${p.stages.reduce((s, x) => s + x.goal, 0)} 道题</div>
            <button class="btn btn-primary plan-card-btn">开始计划</button>
          </div>`;
        }).join('')}
      </div>`;
    } else {
      // 计划进度
      const completedColor = overall.rate >= 80 ? 'var(--correct)' : overall.rate >= 50 ? '#f5a623' : 'var(--wrong)';
      content = `
        <div class="plan-header">
          <div class="plan-title-row">
            <span class="plan-title">${plan.icon} ${plan.name}</span>
            <span class="plan-day">第 ${overall.completedStages}/${overall.totalStages} 阶段</span>
          </div>
          <div class="plan-overall-bar"><div class="plan-overall-fill" style="width:${overall.totalStages > 0 ? Math.round(overall.completedStages/overall.totalStages*100) : 0}%;background:${completedColor}"></div></div>
          <div class="plan-overall-stats">
            <span>✅ ${overall.correct}</span>
            <span>📝 ${overall.done}</span>
            <span>📊 ${overall.rate}%</span>
          </div>
        </div>
        <div class="plan-stages">
          ${plan.stages.map((s, i) => {
            const p = Plan.getStageProgress(i);
            const done = p ? p.done : 0;
            const isComplete = done >= s.goal && s.goal > 0;
            return `
            <div class="plan-stage ${isComplete ? 'stage-done' : ''}" onclick="PlanUI._jumpToTopic('${s.topic}')">
              <div class="stage-day">第${s.day}天</div>
              <div class="stage-info">
                <div class="stage-label">${s.label}</div>
                <div class="stage-goal">目标 ${s.goal} 题 | 已完成 ${done} 题 ${isComplete ? '✅' : ''}</div>
              </div>
              <div class="stage-bar"><div class="stage-bar-fill" style="width:${s.goal > 0 ? Math.min(100, Math.round(done/s.goal*100)) : (done > 0 ? 100 : 0)}%"></div></div>
            </div>`;
          }).join('')}
        </div>
        <button class="btn btn-danger-text" onclick="Plan.abandonPlan()" style="margin-top:12px;">放弃此计划</button>`;
    }

    // 技能树
    content += `
      <div class="plan-header" style="margin-top:20px;">
        <span class="plan-title">🌳 408 技能树</span>
        <p class="plan-desc">知识点掌握度一览，点击可跳转刷题</p>
      </div>
      <div class="skill-tree">
        ${this._renderSkillTree(skillStats)}
      </div>`;

    panel.innerHTML = `
      <div id="plan-header-bar">
        <div class="stats-h-left"><span class="exam-icon">📋</span><span class="exam-title">学习计划</span></div>
        <button class="btn btn-outline" style="color:#333;border-color:#ccc;" onclick="PlanUI.close()">✕ 关闭</button>
      </div>
      <div id="plan-body">${content}</div>`;
  },

  _renderSkillTree(stats) {
    let html = '';
    const tree = SKILL_TREE['408'];
    if (!tree) return '<div class="weak-empty">技能树数据加载中...</div>';

    for (const [subjKey, subj] of Object.entries(tree.children)) {
      html += `<div class="st-root">
        <div class="st-subject" style="border-left:4px solid ${subj.color};">
          <span class="st-subj-icon">${subj.icon}</span>
          <span class="st-subj-name">${subj.name}</span>
        </div>
        <div class="st-topics">`;

      for (const [tpKey, tp] of Object.entries(subj.children)) {
        const s = stats[tpKey];
        const rate = s ? s.rate : 0;
        const done = s ? s.done : 0;
        const total = s ? s.total : 0;
        const level = done === 0 ? 0 : rate >= 80 ? 4 : rate >= 60 ? 3 : rate >= 40 ? 2 : 1;
        const levelColors = ['', '#ebedf0', '#ffc2c2', '#ffd599', '#b5e8a2', '#7bc96f'];

        html += `<div class="st-topic" onclick="PlanUI._jumpToTopic('${tpKey}')">
          <span class="st-tp-name">${tp.name}</span>
          <span class="st-tp-bar"><span class="st-tp-fill" style="width:${Math.min(100, Math.round(done/Math.max(total,1)*100) || 0)}%;background:${levelColors[level]}"></span></span>
          <span class="st-tp-num">${done}/${total}</span>
          <span class="st-tp-rate" style="color:${rate >= 80 ? 'var(--correct)' : rate >= 50 ? '#f5a623' : '#999'}">${rate > 0 ? rate + '%' : ''}</span>
        </div>`;
      }

      html += `</div></div>`;
    }
    return html;
  },

  _calcPlanStats(plan) {
    return {};
  },

  _selectPlan(planId) {
    if (!confirm('开始此计划后，系统会自动跟踪你的刷题进度。继续？')) return;
    Plan.selectPlan(planId);
    this._render();
  },

  _jumpToTopic(topicKey) {
    this.close();
    if (typeof jumpToTopic === 'function') jumpToTopic(topicKey);
  },

  _ensureDOM() {
    if (document.getElementById('plan-panel')) return;
    const html = `<div id="plan-panel" style="display:none;"></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};
