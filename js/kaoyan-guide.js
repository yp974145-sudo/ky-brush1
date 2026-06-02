// ============================================================
// 考研刷题 - 考研全流程指南 v1
// 时间线 + 待办清单 + 资源导航 + 每日提醒
// ============================================================

const KaoyanGuide = {
  // ---- 考研全流程阶段 ----
  stages: [
    { id: 's1',  title: '择校 & 启动',     date: '2026-03-01', end: '2026-04-30', color: '#4CAF50',
      tasks: ['确定目标院校和专业（1-3个）','查阅报录比、复试线','搜集专业课参考书目','制定全年复习规划','注册学信网账号'],
      tips: '信息搜集黄金期！多逛研招网和目标院校官网，加考研群找学长学姐' },
    { id: 's2',  title: '基础复习',         date: '2026-05-01', end: '2026-06-30', color: '#2196F3',
      tasks: ['数学：过完高数/线代/概率基础','英语：背完第一轮单词（5500词）','英语：学习长难句分析','专业课：通读教材第一遍','政治：暂不开始'],
      tips: '重心在数学和英语单词，不要贪多。每天保证6-8小时有效学习' },
    { id: 's3',  title: '黄金暑期强化',     date: '2026-07-01', end: '2026-08-31', color: '#FF9800',
      tasks: ['数学：刷660/880/1000题','英语：精读历年阅读真题（一天一篇）','专业课：系统学习+做课后题','政治：开始看徐涛网课（每天1小时）','整理各科错题本'],
      tips: '拉开差距的关键期！暑假在校复习效率最高，不要回家' },
    { id: 's4',  title: '大纲 & 招生简章',  date: '2026-09-01', end: '2026-09-30', color: '#E91E63',
      tasks: ['关注考研大纲发布（9月中旬）','对比大纲变化，调整复习重点','查阅目标院校招生简章','确认考试科目有无变化','准备预报名材料'],
      tips: '大纲变动是最重要的信号！政治大纲每年变化最大，及时跟进' },
    { id: 's5',  title: '预报名',           date: '2026-09-24', end: '2026-09-27', color: '#F44336',
      tasks: ['9月24-27日研招网预报名','填写考生信息、报考信息','上传照片（按要求规格）','抢就近报考点','缴费（一定记得交！）'],
      tips: '⚠️ 尽早报名抢考点！热门城市手慢无。预报名=正式报名，不用重复' },
    { id: 's6',  title: '正式报名',         date: '2026-10-05', end: '2026-10-25', color: '#F44336',
      tasks: ['10月5-25日研招网正式报名','仔细核对每一项信息','确认报考点、报考单位','截图保存报名号','未预报名的同学抓紧'],
      tips: '⚠️ 只能报一个学校一个专业！信息提交前反复检查，错了很麻烦' },
    { id: 's7',  title: '网上确认',         date: '2026-10-28', end: '2026-11-05', color: '#F44336',
      tasks: ['上传身份证照片','上传学历证明/学生证','按要求拍摄手持身份证照片','等待审核通过','未通过需补充材料'],
      tips: '各省确认时间不同（一般10月底-11月初），关注报考点公告！' },
    { id: 's8',  title: '冲刺复习',         date: '2026-11-01', end: '2026-12-20', color: '#9C27B0',
      tasks: ['政治：背肖四/肖八大题','数学：刷真题+模拟卷（李林6+4）','英语：作文模板背诵+默写','专业课：背诵+真题模拟','全科模拟考试（计时训练）'],
      tips: '政治提分黄金期！每天4小时以上背大题。数学保持手感，每天必做题' },
    { id: 's9',  title: '打印准考证',       date: '2026-12-14', end: '2026-12-25', color: '#F44336',
      tasks: ['考前10天左右研招网打印准考证','多打几份备用','确认考场地址','订酒店（考场附近）','准备考试用品（2B铅笔、身份证等）'],
      tips: '酒店要早订！考场周边考试那两天价格翻3倍' },
    { id: 's10', title: '初试',             date: '2026-12-26', end: '2026-12-27', color: '#D32F2F',
      tasks: ['第一天：上午政治/管综 下午外语','第二天：上午业务课一 下午业务课二','每科提前30分钟到','考完不对答案','坚持到底不弃考'],
      tips: '🎯 一年的努力就在这两天！心态最重要，考完一科忘一科' },
    { id: 's11', title: '等待出分',         date: '2026-12-28', end: '2027-02-20', color: '#607D8B',
      tasks: ['适当放松1-2周','准备复试内容（英语口语+专业课）','关注调剂信息（提前了解）','预估分数，准备Plan B','制作简历、整理作品集'],
      tips: '不要完全躺平！复试淘汰率也很高，提前准备英语自我介绍' },
    { id: 's12', title: '查成绩',           date: '2027-02-21', end: '2027-03-10', color: '#F44336',
      tasks: ['研招网查询初试成绩','对比往年国家线和院校线','判断是否能进复试','关注成绩复核通知','准备复试或调剂'],
      tips: '查分当天网站会崩，心态放平。成绩不理想第一时间看调剂' },
    { id: 's13', title: '国家线 & 复试',    date: '2027-03-11', end: '2027-04-30', color: '#E91E63',
      tasks: ['3月中旬公布国家线','34所自划线院校出复试线','准备复试：笔试+面试+英语','复试材料：成绩单/政审表等','关注调剂系统开放'],
      tips: '复试一般1:1.2-1:1.5差额，面试表现很重要。调剂系统4月6日左右开放' },
    { id: 's14', title: '调剂',             date: '2027-04-06', end: '2027-04-30', color: '#FF9800',
      tasks: ['研招网调剂系统填报（一次3个志愿）','联系调剂院校导师','准备调剂复试','收到复试通知后确认','拟录取后确认接受'],
      tips: '调剂信息「手慢无」！多渠道关注：小木虫、考研群、院校官网' },
    { id: 's15', title: '拟录取 & 上岸',    date: '2027-05-01', end: '2027-09-01', color: '#4CAF50',
      tasks: ['确认拟录取通知','政审/调档/体检','等待录取通知书（6-7月）','准备研究生入学','享受上岸的快乐 🎉'],
      tips: '恭喜上岸！利用开学前的时间可以提前联系导师、看论文' },
  ],

  // ---- 重要网站 ----
  links: [
    { name: '研招网（报名/查分/调剂）', url: 'https://yz.chsi.com.cn', icon: '🏛', tag: '官方' },
    { name: '学信网（学籍认证）', url: 'https://www.chsi.com.cn', icon: '🎓', tag: '官方' },
    { name: '中国教育在线考研频道', url: 'https://www.eol.cn/e_ky/', icon: '📰', tag: '资讯' },
    { name: '掌上考研', url: 'https://www.kaoyan.cn', icon: '📱', tag: '综合' },
    { name: '考研报录比查询', url: 'http://www.chinakaoyan.com/baolubi/', icon: '📊', tag: '数据' },
    { name: 'B站考研课程（免费）', url: 'https://search.bilibili.com/all?keyword=%E8%80%83%E7%A0%94', icon: '▶', tag: '课程' },
    { name: '中国大学MOOC', url: 'https://www.icourse163.org', icon: '🏫', tag: '课程' },
    { name: '小木虫（调剂&学术）', url: 'http://muchong.com', icon: '🐛', tag: '论坛' },
    { name: '考研帮', url: 'https://www.kaoyan.com', icon: '🤝', tag: '论坛' },
    { name: '知乎考研经验', url: 'https://www.zhihu.com/topic/19571406', icon: '💡', tag: '经验' },
    { name: '学科评估排名', url: 'http://www.cdgdc.edu.cn', icon: '📈', tag: '择校' },
    { name: '考研百科（研招网）', url: 'https://yz.chsi.com.cn/yzzt/kybk', icon: '📖', tag: '指南' },
  ],

  // ---- 推荐老师/资料 ----
  resources: [
    { subject: '政治', items: ['肖秀荣（精讲精练+1000题+肖四肖八）','徐涛（网课）','腿姐（技巧班）'] },
    { subject: '英语', items: ['唐迟（阅读的逻辑）','田静（长难句）','王江涛（作文）','单词：红宝书/墨墨背单词'] },
    { subject: '数学', items: ['张宇（高数18讲+1000题）','李永乐（线代辅导讲义）','汤家凤（基础班）','真题+李林6+4模拟卷'] },
    { subject: '408',   items: ['王道考研系列（4本）','天勤数据结构','院校历年真题','B站王道/天勤免费视频'] },
  ],

  // ---- 初始化 ----
  init() {
    this._loadChecklist();
  },

  // ---- 显示面板 ----
  show() {
    this._ensureDOM();
    document.getElementById('kaoyan-panel').style.display = 'flex';
    document.getElementById('content').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
    if (document.getElementById('exam-panel')) document.getElementById('exam-panel').style.display = 'none';
    this._render();
  },

  close() {
    document.getElementById('kaoyan-panel').style.display = 'none';
    document.getElementById('content').style.display = '';
    if (typeof applyFilter === 'function') applyFilter();
  },

  // ---- 渲染 ----
  _render() {
    const el = document.getElementById('kaoyan-panel');
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // 找到当前阶段
    let currentStageIdx = 0;
    for (let i = this.stages.length - 1; i >= 0; i--) {
      if (today >= this.stages[i].date) { currentStageIdx = i; break; }
    }

    // 计算总进度
    const totalStages = this.stages.length;
    const progress = Math.round((currentStageIdx / totalStages) * 100);

    // 找到下一个关键日期
    let nextMilestone = null;
    for (const s of this.stages) {
      if (s.date > today) { nextMilestone = s; break; }
    }

    const daysUntil = nextMilestone
      ? Math.ceil((new Date(nextMilestone.date) - now) / 86400000)
      : 0;

    // 时间段
    let timelineHTML = this.stages.map((s, i) => {
      const isPassed = today >= s.date;
      const isCurrent = i === currentStageIdx;
      const isFuture = today < s.date;
      const checked = this._checklist[s.id] || {};
      const doneCount = s.tasks.filter(t => checked[t]).length;
      const pct = Math.round((doneCount / s.tasks.length) * 100);

      let cls = 'kg-stage';
      if (isPassed && !isCurrent) cls += ' kg-passed';
      if (isCurrent) cls += ' kg-current';
      if (isFuture) cls += ' kg-future';

      return `
        <div class="${cls}" style="border-left-color:${s.color}">
          <div class="kg-stage-head">
            <span class="kg-stage-dot" style="background:${s.color}"></span>
            <span class="kg-stage-title">${s.title}</span>
            <span class="kg-stage-date">${s.date.slice(5)} – ${s.end.slice(5)}</span>
            ${isCurrent ? '<span class="kg-badge-now">当前</span>' : ''}
            ${isPassed && !isCurrent ? '<span class="kg-badge-done">✓</span>' : ''}
          </div>
          <div class="kg-progress-bar"><div class="kg-progress-fill" style="width:${pct}%;background:${s.color}"></div></div>
          <ul class="kg-task-list">
            ${s.tasks.map(t => `
              <li class="kg-task ${checked[t] ? 'kg-task-done' : ''}" onclick="KaoyanGuide._toggleTask('${s.id}', '${t.replace(/'/g, "\\'")}')">
                <span class="kg-task-check">${checked[t] ? '✅' : '⬜'}</span> ${t}
              </li>
            `).join('')}
          </ul>
          ${s.tips ? `<div class="kg-tip">💡 ${s.tips}</div>` : ''}
        </div>
      `;
    }).join('');

    // 链接区
    const linksHTML = this.links.map(l => `
      <a class="kg-link" href="${l.url}" target="_blank" rel="noopener">
        <span class="kg-link-icon">${l.icon}</span>
        <span class="kg-link-name">${l.name}</span>
        <span class="kg-link-tag">${l.tag}</span>
      </a>
    `).join('');

    // 资源区
    const resHTML = this.resources.map(r => `
      <div class="kg-res-card">
        <div class="kg-res-subj">${r.subject}</div>
        <div class="kg-res-items">${r.items.map(i => `<span class="kg-res-tag">${i}</span>`).join('')}</div>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="kg-header">
        <h2>📅 考研全流程指南</h2>
        <button class="btn btn-icon" onclick="KaoyanGuide.close()" style="color:var(--text);font-size:22px;">✕</button>
      </div>

      <div class="kg-topbar">
        <div class="kg-progress-ring">
          <span class="kg-progress-num">${progress}%</span>
          <span class="kg-progress-label">总进度</span>
        </div>
        <div class="kg-next-box">
          <span class="kg-next-label">📌 下一个关键节点</span>
          <span class="kg-next-title">${nextMilestone ? nextMilestone.title : '🎉 全部完成！'}</span>
          <span class="kg-next-countdown">${nextMilestone ? `还有 <strong>${daysUntil}</strong> 天 · ${nextMilestone.date}` : '恭喜上岸！'}</span>
        </div>
      </div>

      <div class="kg-section-title">⏱ 全流程时间线</div>
      <div class="kg-timeline">${timelineHTML}</div>

      <div class="kg-section-title">🔗 必备网站 & 资源</div>
      <div class="kg-links-grid">${linksHTML}</div>

      <div class="kg-section-title">👨‍🏫 各科推荐老师 & 资料</div>
      <div class="kg-res-grid">${resHTML}</div>
    `;
  },

  // ---- 任务勾选 ----
  _toggleTask(stageId, taskName) {
    if (!this._checklist[stageId]) this._checklist[stageId] = {};
    this._checklist[stageId][taskName] = !this._checklist[stageId][taskName];
    this._saveChecklist();
    this._render();
  },

  _loadChecklist() {
    try {
      this._checklist = JSON.parse(localStorage.getItem('ky-checklist') || '{}');
    } catch(e) { this._checklist = {}; }
  },

  _saveChecklist() {
    localStorage.setItem('ky-checklist', JSON.stringify(this._checklist));
  },

  // ---- DOM ----
  _ensureDOM() {
    if (document.getElementById('kaoyan-panel')) return;
    const html = `<div id="kaoyan-panel" style="display:none;"></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};

// 启动
KaoyanGuide.init();
