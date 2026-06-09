// ── Site Data ────────────────────────────────────────────────────
const SITES_DATA = [
  // 北區
  { id:1,  name:'花蓮聖若瑟',           capacity:90.015,  unit:'KW',  city:'花蓮', zone:'北區', owner:'聖若瑟失智老人養護中心' },
  { id:2,  name:'花蓮保祿牧靈',         capacity:93.39,   unit:'KW',  city:'花蓮', zone:'北區', owner:'保祿牧靈院'   },
  { id:3,  name:'桃園大量八德廠',       capacity:667.2,   unit:'KW',  city:'桃園', zone:'北區', owner:'大量電機'     },
  { id:4,  name:'桃園東培龍潭廠',       capacity:1270,    unit:'KW',  city:'桃園', zone:'北區', owner:'東培工業'     },
  { id:5,  name:'桃園億流',             capacity:64.5,    unit:'KW',  city:'桃園', zone:'北區', owner:'億流企業'     },
  { id:6,  name:'桃園萬隆',             capacity:1811.94, unit:'KW',  city:'桃園', zone:'北區', owner:'萬隆農場'     },
  { id:7,  name:'雲林西螺洪慶堂雞舍',   capacity:225,     unit:'KW',  city:'雲林', zone:'北區', owner:'洪慶堂農牧'   },
  { id:8,  name:'雲林西螺尚盈電腦',     capacity:5.17,    unit:'KW',  city:'雲林', zone:'北區', owner:'尚盈電腦'     },
  { id:9,  name:'雲林西螺亞展汽車',     capacity:5.17,    unit:'KW',  city:'雲林', zone:'北區', owner:'亞展汽車'     },
  { id:10, name:'嘉義大林薯光',         capacity:1143,    unit:'KW',  city:'嘉義', zone:'北區', owner:'薯光農業'     },
  // 南區
  { id:11, name:'台南柳營黃燕良牛舍',   capacity:300,     unit:'KW',  city:'台南', zone:'南區', owner:'黃燕良農場'   },
  { id:12, name:'台南楠西一期',         capacity:306.13,  unit:'KW',  city:'台南', zone:'南區', owner:'楠西農電'     },
  { id:13, name:'台南天賜良園追日固定', capacity:24,      unit:'KW',  city:'台南', zone:'南區', owner:'天賜良園'     },
  { id:14, name:'台南善化雞舍',         capacity:86.4,    unit:'KW',  city:'台南', zone:'南區', owner:'善化畜牧場'   },
  { id:15, name:'台南心德教養院',       capacity:48.96,   unit:'KW',  city:'台南', zone:'南區', owner:'心德教養院'   },
  { id:16, name:'高雄恩智浦',           capacity:701.96,  unit:'KW',  city:'高雄', zone:'南區', owner:'恩智浦半導體' },
  { id:17, name:'高雄小港盛餘鋼鐵(既設)',capacity:471,    unit:'KW',  city:'高雄', zone:'南區', owner:'盛餘鋼鐵'     },
  { id:18, name:'高雄小港盛餘鋼鐵(新設)',capacity:1499.37,unit:'KW',  city:'高雄', zone:'南區', owner:'盛餘鋼鐵'     },
  { id:19, name:'屏東汽車客運公司',     capacity:1570,    unit:'KW',  city:'屏東', zone:'南區', owner:'屏東客運'     },
  { id:20, name:'台東東職一期',         capacity:489.21,  unit:'KW',  city:'台東', zone:'南區', owner:'台東縣東職'   },
  { id:21, name:'台東東職二期',         capacity:576.495, unit:'KW',  city:'台東', zone:'南區', owner:'台東縣東職'   },
  { id:22, name:'台東廣源國小',         capacity:99.66,   unit:'KW',  city:'台東', zone:'南區', owner:'廣源國小'     },
  { id:23, name:'台東廣源國小幼兒園',   capacity:60.06,   unit:'KW',  city:'台東', zone:'南區', owner:'廣源國小附幼' },
];

// ── 2026 Schedule ────────────────────────────────────────────────
// month: 1-12 (Jan-Dec), year defaults to 2026; month=1 = Jan 2027
// type: clean|semi|annual|hv26|hv25s
const SCHEDULE_DATA = [
  // 花蓮聖若瑟
  {siteId:1,  month:2, type:'clean'}, {siteId:1,  month:4, type:'semi'},  {siteId:1,  month:9, type:'annual'},
  // 花蓮保祿牧靈
  {siteId:2,  month:2, type:'clean'}, {siteId:2,  month:4, type:'semi'},  {siteId:2,  month:9, type:'annual'},
  // 桃園大量八德廠
  {siteId:3,  month:2, type:'hv26'},  {siteId:3,  month:3, type:'semi'},  {siteId:3,  month:3, type:'clean'}, {siteId:3, month:11,type:'annual'}, {siteId:3,  month:1, type:'hv26'},
  // 桃園東培龍潭廠
  {siteId:4,  month:2, type:'hv26'},  {siteId:4,  month:3, type:'semi'},  {siteId:4,  month:3, type:'clean'}, {siteId:4, month:11,type:'annual'}, {siteId:4,  month:1, type:'hv26'},
  // 桃園億流
  {siteId:5,  month:2, type:'clean'}, {siteId:5,  month:3, type:'semi'},  {siteId:5,  month:11,type:'annual'},
  // 桃園萬隆
  {siteId:6,  month:2, type:'clean'}, {siteId:6,  month:3, type:'semi'},  {siteId:6,  month:3, type:'hv26'},  {siteId:6, month:11,type:'annual'},
  // 雲林西螺洪慶堂雞舍
  {siteId:7,  month:2, type:'clean'}, {siteId:7,  month:4, type:'semi'},  {siteId:7,  month:10,type:'annual'},
  // 雲林西螺尚盈電腦
  {siteId:8,  month:2, type:'clean'}, {siteId:8,  month:4, type:'semi'},  {siteId:8,  month:11,type:'annual'},
  // 雲林西螺亞展汽車
  {siteId:9,  month:2, type:'clean'}, {siteId:9,  month:4, type:'semi'},
  // 嘉義大林薯光
  {siteId:10, month:3, type:'hv26'},  {siteId:10, month:4, type:'semi'},  {siteId:10, month:4, type:'clean'},{siteId:10,month:10,type:'annual'},{siteId:10,month:10,type:'clean'},
  // 台南柳營黃燕良牛舍
  {siteId:11, month:2, type:'clean'}, {siteId:11, month:4, type:'semi'},  {siteId:11, month:5, type:'hv26'}, {siteId:11,month:9, type:'annual'},
  // 台南楠西一期
  {siteId:12, month:3, type:'clean'}, {siteId:12, month:5, type:'semi'},  {siteId:12, month:6, type:'hv26'}, {siteId:12,month:12,type:'annual'},
  // 台南天賜良園追日固定
  {siteId:13, month:2, type:'clean'}, {siteId:13, month:5, type:'semi'},  {siteId:13, month:9, type:'annual'},
  // 台南善化雞舍
  {siteId:14, month:2, type:'clean'}, {siteId:14, month:6, type:'semi'},  {siteId:14, month:11,type:'annual'},
  // 台南心德教養院
  {siteId:15, month:2, type:'clean'}, {siteId:15, month:5, type:'semi'},  {siteId:15, month:12,type:'annual'},
  // 高雄恩智浦
  {siteId:16, month:9, type:'semi'},  {siteId:16, month:9, type:'clean'},
  // 高雄小港盛餘鋼鐵(既設)
  {siteId:17, month:5, type:'semi'},  {siteId:17, month:5, type:'clean'}, {siteId:17, month:11,type:'annual'},{siteId:17,month:11,type:'clean'},
  // 高雄小港盛餘鋼鐵(新設)
  {siteId:18, month:4, type:'semi'},  {siteId:18, month:4, type:'clean'}, {siteId:18, month:10,type:'annual'},{siteId:18,month:10,type:'clean'},
  // 屏東汽車客運公司
  {siteId:19, month:2, type:'hv26'},  {siteId:19, month:3, type:'semi'},  {siteId:19, month:3, type:'clean'},{siteId:19,month:10,type:'annual'},{siteId:19,month:1,type:'hv26'},
  // 台東東職一期
  {siteId:20, month:2, type:'clean'}, {siteId:20, month:3, type:'semi'},  {siteId:20, month:3, type:'hv25s'},{siteId:20,month:11,type:'annual'},
  // 台東東職二期
  {siteId:21, month:2, type:'clean'}, {siteId:21, month:3, type:'semi'},  {siteId:21, month:3, type:'hv25s'},{siteId:21,month:11,type:'annual'},
  // 台東廣源國小
  {siteId:22, month:2, type:'clean'}, {siteId:22, month:3, type:'semi'},  {siteId:22, month:8, type:'annual'},
  // 台東廣源國小幼兒園
  {siteId:23, month:2, type:'clean'}, {siteId:23, month:3, type:'semi'},  {siteId:23, month:8, type:'annual'},
];

// ── Config ────────────────────────────────────────────────────────
const WORK_TYPES = {
  clean:  { label:'清洗模組', short:'洗',   symbol:'○', color:'#f59e0b', cls:'clean'  },
  semi:   { label:'半年檢',   short:'半',   symbol:'■', color:'#10b981', cls:'semi'   },
  annual: { label:'年檢',     short:'年',   symbol:'□', color:'#3b82f6', cls:'annual' },
  hv26:   { label:'高壓2026', short:'高壓', symbol:'★', color:'#ef4444', cls:'hv26'   },
  hv25s:  { label:'高壓2025(補)',short:'補', symbol:'☆', color:'#8b5cf6', cls:'hv25s'  },
};

const STATUS_CONFIG = {
  pending:     { label:'待派工',   cls:'badge-neutral' },
  assigned:    { label:'已派工',   cls:'badge-info'    },
  'in-progress':{ label:'施工中',  cls:'badge-warning' },
  review:      { label:'待驗收',   cls:'badge-purple'  },
  completed:   { label:'已完成',   cls:'badge-success' },
  overdue:     { label:'已逾期',   cls:'badge-danger'  },
};

const ENGINEERS = [
  { id:1, name:'王小明', zone:'北區', avatar:'王' },
  { id:2, name:'李大偉', zone:'北區', avatar:'李' },
  { id:3, name:'張建國', zone:'南區', avatar:'張' },
  { id:4, name:'陳美玲', zone:'南區', avatar:'陳' },
  { id:5, name:'林志豪', zone:'全區', avatar:'林' },
];

// ── Helpers ───────────────────────────────────────────────────────
function getSite(id) { return SITES_DATA.find(s => s.id === id); }

function totalCapacityMW() {
  const kw = SITES_DATA.reduce((s, x) => s + x.capacity, 0);
  return (kw / 1000).toFixed(2);
}

function capacityDisplay(kw) {
  if (kw >= 1000) return (kw/1000).toFixed(2) + ' MW';
  return kw + ' KW';
}

function monthLabel(m) {
  return m === 1 ? '翌1月' : m + '月';
}

// Fiscal year month order: Feb(2) to Jan(1)
const FISCAL_MONTHS = [2,3,4,5,6,7,8,9,10,11,12,1];

function fiscalYear(month) {
  return month === 1 ? 2027 : 2026;
}

// Today: June 9, 2026
const TODAY = new Date(2026, 5, 9); // month is 0-indexed

function getTaskStatus(month) {
  const y = fiscalYear(month);
  const taskDate = new Date(y, month - 1, 1);
  if (taskDate < new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)) return 'completed';
  if (taskDate.getMonth() === TODAY.getMonth() && taskDate.getFullYear() === TODAY.getFullYear()) return 'in-progress';
  return 'pending';
}

function isOverdue(month) {
  const y = fiscalYear(month);
  const taskDate = new Date(y, month - 1, 1);
  return taskDate < new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
}

// Auto-generate work orders from schedule
let _woCounter = 1;
function generateWorkOrders() {
  const engineers = ['王小明','李大偉','張建國','陳美玲','林志豪'];
  const assignMap = { 1:'王小明',2:'王小明',3:'李大偉',4:'李大偉',5:'王小明',6:'李大偉',
    7:'李大偉',8:'王小明',9:'王小明',10:'李大偉',
    11:'張建國',12:'張建國',13:'陳美玲',14:'陳美玲',15:'陳美玲',
    16:'張建國',17:'張建國',18:'陳美玲',19:'林志豪',
    20:'林志豪',21:'林志豪',22:'陳美玲',23:'陳美玲' };
  return SCHEDULE_DATA.map((entry, i) => {
    const site = getSite(entry.siteId);
    const y = fiscalYear(entry.month);
    const raw = getTaskStatus(entry.month);
    // Overdue = past month but not done → set some as overdue
    const status = raw === 'completed' && (i % 7 === 3) ? 'overdue' : raw;
    return {
      id: `OM-2026-${String(i+1).padStart(4,'0')}`,
      siteId: entry.siteId,
      siteName: site.name,
      type: entry.type,
      month: entry.month,
      year: y,
      scheduledDate: `${y}-${String(entry.month).padStart(2,'0')}-15`,
      assignee: raw === 'pending' ? '' : (assignMap[entry.siteId] || '王小明'),
      status: status,
      notes: '',
      completedDate: raw === 'completed' && status !== 'overdue' ? `${y}-${String(entry.month).padStart(2,'0')}-20` : null,
    };
  });
}

// History entries per site
function getSiteHistory(siteId) {
  const wo = generateWorkOrders().filter(w => w.siteId === siteId && w.status === 'completed');
  return wo.map(w => ({
    date: w.completedDate || w.scheduledDate,
    title: WORK_TYPES[w.type].label + '完成',
    desc: `工單 ${w.id}，執行人：${w.assignee}`,
    type: w.type,
  })).sort((a,b) => b.date.localeCompare(a.date));
}
