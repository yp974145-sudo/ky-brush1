// ============================================================
// 考研刷题 - 全科目定义
// ============================================================

const SUBJECTS = {
  // 408
  ds: { name: '数据结构', icon: '🌲', color: '#4CAF50', group: '408' },
  co: { name: '计组', icon: '💻', color: '#2196F3', group: '408' },
  os: { name: '操作系统', icon: '⚙️', color: '#FF9800', group: '408' },
  cn: { name: '计网', icon: '🌐', color: '#9C27B0', group: '408' },
  // 数学
  ma1: { name: '数学一', icon: '📐', color: '#E91E63', group: 'math' },
  ma2: { name: '数学二', icon: '📏', color: '#F06292', group: 'math' },
  ma3: { name: '数学三', icon: '📊', color: '#EC407A', group: 'math' },
  // 政治
  po: { name: '政治', icon: '🏛️', color: '#F44336', group: 'politics' },
  // 英语
  en1: { name: '英语一', icon: '📖', color: '#00BCD4', group: 'english' },
  en2: { name: '英语二', icon: '📕', color: '#4DD0E1', group: 'english' }
};

const SUBJECT_GROUPS = {
  '408': { name: '408 计算机', icon: '💾' },
  'math': { name: '数学', icon: '📐' },
  'politics': { name: '政治', icon: '🏛️' },
  'english': { name: '英语', icon: '📖' }
};

// 难度定义
const DIFFICULTY = {
  easy: { label: '简单', color: '#4CAF50', bg: '#e8f5e9' },
  medium: { label: '中等', color: '#FF9800', bg: '#fff3e0' },
  hard: { label: '较难', color: '#F44336', bg: '#ffebee' }
};

const TOPICS = {
  // === 408 数据结构 ===
  'ds-1': { name: '绪论', subject: 'ds', desc: '时间复杂度、数据结构概念' },
  'ds-2': { name: '线性表', subject: 'ds', desc: '顺序表、链表' },
  'ds-3': { name: '栈和队列', subject: 'ds', desc: '栈、队列、数组' },
  'ds-4': { name: '串', subject: 'ds', desc: '串匹配、KMP' },
  'ds-5': { name: '树与二叉树', subject: 'ds', desc: '二叉树、哈夫曼、并查集' },
  'ds-6': { name: '图', subject: 'ds', desc: '存储、遍历、MST、最短路径' },
  'ds-7': { name: '查找', subject: 'ds', desc: '折半、B树、散列表' },
  'ds-8': { name: '排序', subject: 'ds', desc: '内部排序、外部排序' },
  // === 408 计组 ===
  'co-1': { name: '计算机系统概述', subject: 'co', desc: '冯诺依曼、性能指标' },
  'co-2': { name: '数据的表示和运算', subject: 'co', desc: '数制、IEEE754、ALU' },
  'co-3': { name: '存储器层次结构', subject: 'co', desc: 'Cache、主存、虚存' },
  'co-4': { name: '指令系统', subject: 'co', desc: '指令格式、寻址方式' },
  'co-5': { name: '中央处理器', subject: 'co', desc: '数据通路、流水线' },
  'co-6': { name: '总线', subject: 'co', desc: '总线结构、仲裁' },
  'co-7': { name: '输入输出系统', subject: 'co', desc: 'I/O、中断、DMA' },
  // === 408 OS ===
  'os-1': { name: 'OS概述', subject: 'os', desc: '概念、分类、系统调用' },
  'os-2': { name: '进程与线程', subject: 'os', desc: '进程、调度、同步、死锁' },
  'os-3': { name: '内存管理', subject: 'os', desc: '分页、分段、虚拟内存' },
  'os-4': { name: '文件管理', subject: 'os', desc: '文件系统、磁盘' },
  'os-5': { name: 'I/O管理', subject: 'os', desc: '控制、缓冲、SPOOLing' },
  // === 408 计网 ===
  'cn-1': { name: '网络体系结构', subject: 'cn', desc: 'OSI/TCP/IP' },
  'cn-2': { name: '物理层', subject: 'cn', desc: '奈奎斯特、香农' },
  'cn-3': { name: '数据链路层', subject: 'cn', desc: '帧、MAC、交换机' },
  'cn-4': { name: '网络层', subject: 'cn', desc: 'IP、路由、子网' },
  'cn-5': { name: '传输层', subject: 'cn', desc: 'TCP/UDP、流量拥塞' },
  'cn-6': { name: '应用层', subject: 'cn', desc: 'DNS、HTTP、FTP' },

  // === 数学一/二/三共用 ===
  'ma-1': { name: '极限与连续', subject: 'ma1', desc: '极限计算、连续性' },
  'ma-2': { name: '一元微分学', subject: 'ma1', desc: '导数、中值定理' },
  'ma-3': { name: '一元积分学', subject: 'ma1', desc: '不定/定积分、反常积分' },
  'ma-4': { name: '多元微分学', subject: 'ma1', desc: '偏导、全微分、极值' },
  'ma-5': { name: '多元积分学', subject: 'ma1', desc: '重积分、曲面积分(数一)' },
  'ma-6': { name: '微分方程', subject: 'ma1', desc: '一阶、高阶微分方程' },
  'ma-7': { name: '无穷级数', subject: 'ma1', desc: '幂级数、傅里叶(数一/三)' },
  'ma-8': { name: '线性代数', subject: 'ma1', desc: '行列式、矩阵、特征值' },
  'ma-9': { name: '概率统计', subject: 'ma1', desc: '概率、分布、估计(数一/三)' },

  // === 政治 ===
  'po-1': { name: '马原', subject: 'po', desc: '马克思主义基本原理' },
  'po-2': { name: '毛中特', subject: 'po', desc: '毛泽东思想与中特理论' },
  'po-3': { name: '史纲', subject: 'po', desc: '中国近现代史纲要' },
  'po-4': { name: '思修法基', subject: 'po', desc: '思想道德与法治' },
  'po-5': { name: '时政', subject: 'po', desc: '形势与政策' },

  // === 英语一/二 ===
  'en-1': { name: '完形填空', subject: 'en1', desc: 'Use of English' },
  'en-2': { name: '阅读理解', subject: 'en1', desc: 'Reading Comprehension' },
  'en-3': { name: '新题型', subject: 'en1', desc: '排序/七选五/匹配' },
  'en-4': { name: '翻译', subject: 'en1', desc: '英译汉' },
  'en-5': { name: '写作', subject: 'en1', desc: '应用文/图画/图表' }
};

const YEARS = [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025];

const QUESTION_TYPES = {
  single: { name: '单选', icon: '○' },
  multi: { name: '多选', icon: '☐' },
  fill: { name: '填空', icon: '✎' },
  essay: { name: '解答', icon: '📝' }
};
