// ── App State ─────────────────────────────────────────────────────
const App = {
  state: {
    view: 'dashboard',
    scheduleData: null,   // mutable (drag-drop)
    workOrders: null,
    selectedSite: null,
    woFilter: 'all',
    clTab: 'semi',
    photoCat: 'all',
    histSite: null,
    ganttZone: 'all',
    dispatchMonth: 6,
  },

  // ── Init ──────────────────────────────────────────────────────
  init() {
    // Load mutable schedule from localStorage or generate
    const saved = localStorage.getItem('om_schedule_2026');
    this.state.scheduleData = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(SCHEDULE_DATA));
    this.state.workOrders = generateWorkOrders();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        this.navigate(el.dataset.view);
      });
    });

    // Sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
      const sb = document.getElementById('sidebar');
      if (window.innerWidth <= 768) sb.classList.toggle('mobile-open');
      else sb.classList.toggle('collapsed');
    });

    // Render default view
    this.navigate('dashboard');
  },

  // ── Router ────────────────────────────────────────────────────
  navigate(view) {
    this.state.view = view;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });
    const titles = {
      dashboard:'儀表板', sites:'案場清單', schedule:'年度計畫甘特圖',
      workorders:'工單管理', checklists:'維護檢查表', cleaning:'模組清洗管理',
      dispatch:'派工管理', history:'維運履歷', photos:'照片管理',
      reports:'報表中心', users:'權限管理',
    };
    document.getElementById('topbarTitle').textContent = titles[view] || view;
    this.render();
  },

  render() {
    const el = document.getElementById('content');
    el.innerHTML = this.views[this.state.view]
      ? this.views[this.state.view].call(this)
      : '<div class="loading">頁面載入中...</div>';
    this.bindEvents();
  },

  // ── Modal ─────────────────────────────────────────────────────
  openModal(title, body, footerHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    const footer = document.querySelector('.modal-footer');
    if (footer) footer.innerHTML = footerHtml || '<button class="btn btn-outline" onclick="App.closeModal()">關閉</button>';
    document.getElementById('modalOverlay').classList.add('open');
  },
  closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  },

  // ── Search ────────────────────────────────────────────────────
  search(q) {
    if (!q.trim()) return;
    const results = SITES_DATA.filter(s => s.name.includes(q));
    if (results.length === 1) { this.navigate('sites'); setTimeout(() => this.showSiteDetail(results[0].id), 100); }
  },

  // ── Bind Events ───────────────────────────────────────────────
  bindEvents() {
    // Work order filter tabs
    document.querySelectorAll('.wo-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.state.woFilter = tab.dataset.filter;
        document.querySelectorAll('.wo-tab').forEach(t => t.classList.toggle('active', t === tab));
        this.renderWOList();
      });
    });
    // Checklist tabs
    document.querySelectorAll('.cl-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.state.clTab = tab.dataset.tab;
        document.querySelectorAll('.cl-tab').forEach(t => t.classList.toggle('active', t === tab));
        document.querySelectorAll('.cl-panel').forEach(p => p.style.display = p.dataset.panel === this.state.clTab ? '' : 'none');
      });
    });
    // Photo cats
    document.querySelectorAll('.photo-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.photoCat = btn.dataset.cat;
        document.querySelectorAll('.photo-cat-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderPhotoGrid();
      });
    });
    // Gantt drag-drop (re-bind)
    this.bindGanttDrag();
  },

  // ── Helper chips ─────────────────────────────────────────────
  typeChip(type) {
    const t = WORK_TYPES[type];
    return `<span class="chip ${t.cls}">${t.symbol} ${t.short}</span>`;
  },
  statusBadge(status) {
    const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },
  dotStatus(status) {
    return `<span class="status-dot ${status}"></span>`;
  },

  // ════════════════════════════════════════════════════════════
  // VIEWS
  // ════════════════════════════════════════════════════════════
  views: {

    // ── Dashboard ────────────────────────────────────────────
    dashboard() {
      const wo = generateWorkOrders();
      const totalSites = SITES_DATA.length;
      const totalMW = totalCapacityMW();
      const thisMonth = wo.filter(w => w.month === TODAY.getMonth() + 1 && w.year === TODAY.getFullYear());
      const overdue = wo.filter(w => w.status === 'overdue');
      const completed = wo.filter(w => w.status === 'completed');

      const byType = t => thisMonth.filter(w => w.type === t).length;
      const northSites = SITES_DATA.filter(s => s.zone === '北區').length;
      const southSites = SITES_DATA.filter(s => s.zone === '南區').length;

      // Monthly completion rate (past months this year)
      const pastMonths = FISCAL_MONTHS.filter(m => {
        const y = fiscalYear(m);
        return new Date(y, m-1, 1) < new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
      });
      const totalPast = wo.filter(w => pastMonths.includes(w.month) && fiscalYear(w.month) <= TODAY.getFullYear()).length;
      const completedPast = wo.filter(w => pastMonths.includes(w.month) && w.status === 'completed').length;
      const rate = totalPast ? Math.round(completedPast / totalPast * 100) : 0;

      const recent = wo.filter(w => w.status !== 'pending').slice(0, 8);

      return `
      <div class="page-header">
        <div class="page-title">維運作業總覽</div>
        <div class="page-subtitle">2026年度 — 今日：2026年6月9日</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">總案場數</div>
          <div class="stat-value">${totalSites} <span class="stat-unit">座</span></div>
          <div class="stat-sub">北區 ${northSites} 座 / 南區 ${southSites} 座</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">總裝置容量</div>
          <div class="stat-value">${totalMW} <span class="stat-unit">MW</span></div>
          <div class="stat-sub">共 ${(totalMW*1000).toFixed(2)} KW</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">本月待執行工作</div>
          <div class="stat-value">${thisMonth.filter(w=>w.status!=='completed').length} <span class="stat-unit">件</span></div>
          <div class="stat-sub">本月共 ${thisMonth.length} 件</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">已完成工作</div>
          <div class="stat-value">${completed.length} <span class="stat-unit">件</span></div>
          <div class="stat-sub">本年度完成率 ${rate}%</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">逾期未完成</div>
          <div class="stat-value">${overdue.length} <span class="stat-unit">件</span></div>
          <div class="stat-sub">需立即處理</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-label">年度總工單</div>
          <div class="stat-value">${wo.length} <span class="stat-unit">件</span></div>
          <div class="stat-sub">含所有維護類型</div>
        </div>
      </div>

      <div class="dash-grid">
        <div>
          <div class="card mb-16">
            <div class="card-header">
              <span class="card-title">本月工作 (2026年6月)</span>
            </div>
            <div class="card-body">
              ${thisMonth.length === 0 ? '<div class="empty-state"><div class="empty-state-text">本月無排程工作</div></div>' : `
              <div class="month-tasks">
                ${['clean','semi','annual','hv26','hv25s'].map(t => {
                  const cnt = byType(t);
                  if (!cnt) return '';
                  const wt = WORK_TYPES[t];
                  return `<div class="month-task-item">
                    <div class="month-task-count" style="color:${wt.color}">${cnt}</div>
                    <span class="chip ${wt.cls} mt-4">${wt.symbol} ${wt.label}</span>
                  </div>`;
                }).join('')}
              </div>`}
              ${overdue.length ? `
              <div class="divider"></div>
              <div style="font-size:12px;font-weight:600;color:var(--danger);margin-bottom:8px">⚠ 逾期 ${overdue.length} 件</div>
              ${overdue.slice(0,3).map(w => `
                <div class="timeline-item">
                  <div class="timeline-dot" style="background:var(--danger)"></div>
                  <div class="timeline-body">
                    <div class="timeline-title">${w.siteName}</div>
                    <div class="timeline-meta">${WORK_TYPES[w.type].label} · ${w.scheduledDate}</div>
                  </div>
                </div>`).join('')}
              ` : ''}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">近期工單動態</span>
              <button class="btn btn-outline btn-sm" onclick="App.navigate('workorders')">查看全部</button>
            </div>
            <div class="card-body" style="padding:0">
              <table class="data-table">
                <thead><tr>
                  <th>工單編號</th><th>案場</th><th>類型</th><th>狀態</th><th>負責人</th>
                </tr></thead>
                <tbody>
                  ${recent.map(w => `<tr class="clickable" onclick="App.showWODetail('${w.id}')">
                    <td style="font-family:monospace;font-size:11px">${w.id}</td>
                    <td><span class="zone-badge ${w.siteId<=10?'zone-north':'zone-south'}" style="margin-right:4px">${getSite(w.siteId).zone}</span>${w.siteName}</td>
                    <td>${App.typeChip(w.type)}</td>
                    <td>${App.statusBadge(w.status)}</td>
                    <td>${w.assignee || '<span class="text-muted">未派工</span>'}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-header"><span class="card-title">年度完成率</span></div>
            <div class="card-body">
              ${FISCAL_MONTHS.slice(0,10).map(m => {
                const y = fiscalYear(m);
                const total = wo.filter(w => w.month === m && w.year === y).length;
                if (!total) return '';
                const done = wo.filter(w => w.month === m && w.year === y && w.status === 'completed').length;
                const pct = Math.round(done/total*100);
                const isCurrent = m === TODAY.getMonth()+1;
                return `<div class="progress-row">
                  <span style="width:38px;text-align:right;color:var(--text-2)">${monthLabel(m)}</span>
                  <div class="progress-bar-wrap">
                    <div class="progress-bar" style="width:${pct}%;background:${isCurrent?'var(--warning)':pct===100?'var(--success)':'var(--primary)'}"></div>
                  </div>
                  <span style="width:36px;font-size:12px;color:var(--text-2)">${done}/${total}</span>
                </div>`;
              }).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">區域分佈</span></div>
            <div class="card-body">
              ${['北區','南區'].map(zone => {
                const sites = SITES_DATA.filter(s => s.zone === zone);
                const kw = sites.reduce((s,x) => s+x.capacity, 0);
                const pct = Math.round(kw / (parseFloat(totalMW)*1000) * 100);
                return `<div class="mb-16">
                  <div class="flex justify-between mb-4">
                    <span class="zone-badge ${zone==='北區'?'zone-north':'zone-south'}">${zone}</span>
                    <span style="font-size:12px;color:var(--text-2)">${sites.length}座 · ${(kw/1000).toFixed(2)} MW</span>
                  </div>
                  <div class="progress-bar-wrap" style="height:12px">
                    <div class="progress-bar" style="width:${pct}%;background:${zone==='北區'?'var(--info)':'#f472b6'}"></div>
                  </div>
                </div>`;
              }).join('')}
              <div class="divider"></div>
              <div style="font-size:12px;color:var(--text-3)">
                ${SITES_DATA.reduce((acc,s)=>{ acc[s.city]=(acc[s.city]||0)+1; return acc; },{}
                ) && Object.entries(SITES_DATA.reduce((acc,s)=>{ acc[s.city]=(acc[s.city]||0)+1; return acc; },{})).map(([c,n])=>`${c} ${n}座`).join(' · ')}
              </div>
            </div>
          </div>
        </div>
      </div>`;
    },

    // ── Sites ─────────────────────────────────────────────────
    sites() {
      const selected = this.state.selectedSite;
      return `
      <div class="page-header-row">
        <div class="page-header">
          <div class="page-title">案場清單</div>
          <div class="page-subtitle">共 ${SITES_DATA.length} 座案場，總容量 ${totalCapacityMW()} MW</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.showAddSite()">＋ 新增案場</button>
        </div>
      </div>
      <div class="filters">
        <select class="filter-select" onchange="App.filterSites(this.value,'zone')" id="zoneFilter">
          <option value="">全部區域</option>
          <option value="北區">北區</option>
          <option value="南區">南區</option>
        </select>
        <select class="filter-select" onchange="App.filterSites(this.value,'city')" id="cityFilter">
          <option value="">全部縣市</option>
          ${[...new Set(SITES_DATA.map(s=>s.city))].map(c=>`<option>${c}</option>`).join('')}
        </select>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="data-table" id="sitesTable">
            <thead><tr>
              <th>#</th><th>案場名稱</th><th>容量</th><th>縣市</th><th>區域</th><th>業主</th><th>年度工單</th><th>操作</th>
            </tr></thead>
            <tbody id="sitesBody">
              ${this.renderSiteRows()}
            </tbody>
          </table>
        </div>
      </div>
      ${selected ? this.renderSiteDetailPanel(selected) : ''}`;
    },

    // ── Schedule / Gantt ──────────────────────────────────────
    schedule() {
      const data = this.state.scheduleData;
      const zone = this.state.ganttZone;
      const sites = zone === 'all' ? SITES_DATA : SITES_DATA.filter(s => s.zone === zone);
      const currentM = TODAY.getMonth() + 1;

      // Group by month+siteId
      function getCell(siteId, month) {
        return data.filter(d => d.siteId === siteId && d.month === month);
      }

      const legend = Object.entries(WORK_TYPES).map(([k,v]) =>
        `<div class="legend-item"><div class="legend-dot" style="background:${v.color}"></div><span>${v.symbol} ${v.label}</span></div>`
      ).join('');

      const zones = zone === 'all' ? ['北區','南區'] : [zone];

      const ganttRows = zones.map(z => {
        const zoneSites = sites.filter(s => s.zone === z);
        const siteRows = zoneSites.map(site => {
          const cells = FISCAL_MONTHS.map(m => {
            const items = getCell(site.id, m);
            const chips = items.map(d =>
              `<div class="gantt-chip ${d.type}" draggable="true"
                data-site="${d.siteId}" data-month="${d.month}" data-type="${d.type}"
                onclick="App.showGanttTask(${d.siteId},${d.month},'${d.type}')"
                title="${site.name} - ${WORK_TYPES[d.type].label}"
              >${WORK_TYPES[d.type].symbol}${WORK_TYPES[d.type].short}</div>`
            ).join('');
            const isCur = m === currentM;
            return `<td class="gantt-cell${isCur?' current-m':''}"
              data-site="${site.id}" data-month="${m}"
              style="${isCur?'background:#f0fdf4':''}"
              ondragover="event.preventDefault();this.classList.add('drag-over')"
              ondragleave="this.classList.remove('drag-over')"
              ondrop="App.onGanttDrop(event,${site.id},${m})"
            >
              <div class="gantt-chips">
                ${chips}
                <span class="gantt-add-btn" onclick="App.addGanttTask(${site.id},${m})" title="新增工作">＋</span>
              </div>
            </td>`;
          }).join('');
          return `<tr>
            <td class="site-col" title="${site.name}">${site.name}<br><span style="font-size:10px;color:var(--text-3)">${capacityDisplay(site.capacity)}</span></td>
            ${cells}
          </tr>`;
        }).join('');
        return `
          <tr class="gantt-zone-row">
            <td class="site-col">${z}</td>
            ${FISCAL_MONTHS.map(m=>`<td style="text-align:center;font-size:10px;color:var(--text-3)"></td>`).join('')}
          </tr>
          ${siteRows}`;
      }).join('');

      return `
      <div class="page-header-row">
        <div>
          <div class="page-title">年度計畫甘特圖</div>
          <div class="page-subtitle">2026年度維運排程 — 可拖曳調整月份，點擊 ＋ 新增工作</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="App.exportSchedule()">匯出 PDF</button>
        </div>
      </div>
      <div class="filters">
        <select class="filter-select" onchange="App.state.ganttZone=this.value;App.render()">
          <option value="all">全部區域</option>
          <option value="北區">北區</option>
          <option value="南區">南區</option>
        </select>
      </div>
      <div class="gantt-legend">
        ${legend}
        <span style="font-size:11px;color:var(--text-3);margin-left:8px">▌ 綠底 = 本月</span>
      </div>
      <div class="card">
        <div class="gantt-wrap">
          <table class="gantt-table">
            <thead>
              <tr>
                <th class="site-col" style="min-width:170px">案場</th>
                ${FISCAL_MONTHS.map(m => {
                  const isCur = m === currentM;
                  return `<th class="gantt-month-col${isCur?' current-month':''}" style="${isCur?'background:#d1fae5;color:#065f46;':''}">
                    ${monthLabel(m)}${isCur ? '<br><span style="font-size:9px">本月</span>' : ''}
                  </th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>${ganttRows}</tbody>
          </table>
        </div>
      </div>`;
    },

    // ── Work Orders ───────────────────────────────────────────
    workorders() {
      return `
      <div class="page-header-row">
        <div>
          <div class="page-title">工單管理</div>
          <div class="page-subtitle">總計 ${this.state.workOrders.length} 份工單</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.showNewWOModal()">＋ 建立工單</button>
        </div>
      </div>
      <div class="wo-status-tabs">
        ${[
          {f:'all',l:'全部'},
          {f:'pending',l:'待派工'},
          {f:'assigned',l:'已派工'},
          {f:'in-progress',l:'施工中'},
          {f:'review',l:'待驗收'},
          {f:'completed',l:'已完成'},
          {f:'overdue',l:'已逾期'},
        ].map(t => `<div class="wo-tab${this.state.woFilter===t.f?' active':''}" data-filter="${t.f}">${t.l}</div>`).join('')}
      </div>
      <div id="woListWrap"></div>`;
    },

    // ── Checklists ────────────────────────────────────────────
    checklists() {
      const panels = {
        semi: {
          title: '半年檢查表', sections: [
            { name: 'DC 側', items: ['模組外觀目視檢查（碎裂、燒焦、變色）','接線盒外觀檢查','MC4接頭檢查與清潔','直流側開關功能確認','熱顯像儀掃描（若有）','字串電壓/電流量測','接地電阻量測'] },
            { name: 'AC 側', items: ['配電盤外觀檢查','MCCB功能確認','交流側接線緊固度確認','盤體接地電阻量測','逆變器告警記錄確認','逆變器效率確認'] },
            { name: '結構檢查', items: ['支撐架鏽蝕檢查','螺栓緊固確認','線槽完整性確認','雜草清除確認'] },
          ]
        },
        annual: {
          title: '年度檢查表', sections: [
            { name: '電氣測試', items: ['絕緣電阻測試（各字串對地）','接地系統電阻測試','保護裝置動作測試','IV Curve量測（各字串）','逆功率保護測試','孤島效應保護測試'] },
            { name: '系統評估', items: ['年發電量與PR值分析','逆變器效率曲線確認','監控系統功能確認','SCADA數據準確性確認','異常停機記錄分析','保固與維護合約確認'] },
            { name: '文件更新', items: ['竣工圖更新（如有變更）','設備台帳更新','年度報告書製作','業主簽收確認'] },
          ]
        },
        hv: {
          title: '高壓設備保養表', sections: [
            { name: '主要設備', items: ['PT（電壓互感器）清潔與測試','CT（電流互感器）清潔與測試','VCB（真空斷路器）動作試驗','DS（隔離開關）外觀與功能確認','避雷器接地確認'] },
            { name: '保護電驛', items: ['OC電驛功能測試','EF電驛功能測試','Reclosing電驛確認','告警回路確認','遠端信號傳輸確認'] },
            { name: '接地系統', items: ['接地母排外觀確認','接地電阻量測（< 10Ω）','接地線連接緊固確認','盤面接地導通確認'] },
          ]
        }
      };

      const active = this.state.clTab || 'semi';
      return `
      <div class="page-header-row">
        <div>
          <div class="page-title">維護檢查表</div>
          <div class="page-subtitle">數位化現場檢查表，可手機填寫</div>
        </div>
        <div class="page-actions">
          <select class="filter-select">
            <option>選擇工單...</option>
            ${this.state.workOrders.filter(w=>w.status==='assigned'||w.status==='in-progress').slice(0,10).map(w=>`<option>${w.id} - ${w.siteName}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm">套用工單</button>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="checklist-tabs">
            ${Object.entries(panels).map(([k,v])=>
              `<div class="cl-tab${active===k?' active':''}" data-tab="${k}">${v.title}</div>`
            ).join('')}
          </div>
          ${Object.entries(panels).map(([k,v])=>`
            <div class="cl-panel" data-panel="${k}" style="${active!==k?'display:none':''}">
              ${v.sections.map(sec=>`
                <div class="checklist-section">
                  <div class="checklist-section-title">${sec.name}</div>
                  ${sec.items.map((item,i)=>`
                    <div class="checklist-item">
                      <input type="checkbox" id="cl_${k}_${i}" onchange="this.nextElementSibling.classList.toggle('checked',this.checked)">
                      <label for="cl_${k}_${i}">${item}</label>
                      <select style="font-size:11px;border:1px solid var(--border);border-radius:3px;padding:2px 4px;color:var(--text-2)">
                        <option>正常</option><option>異常</option><option>待確認</option>
                      </select>
                    </div>`).join('')}
                </div>`).join('')}
              <div class="form-group mt-16">
                <label class="form-label">備注 / 異常說明</label>
                <textarea class="form-control" rows="3" placeholder="填寫異常說明或備注..."></textarea>
              </div>
              <div class="flex gap-8 mt-16">
                <button class="btn btn-primary" onclick="App.submitChecklist('${k}')">提交檢查表</button>
                <button class="btn btn-outline">儲存草稿</button>
                <button class="btn btn-outline" onclick="window.print()">列印</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
    },

    // ── Cleaning ──────────────────────────────────────────────
    cleaning() {
      // Last cleaning = schedule month in past, next = schedule month in future or current
      const cleaningInfo = SITES_DATA.map(site => {
        const cleanTasks = SCHEDULE_DATA.filter(d => d.siteId === site.id && d.type === 'clean');
        const past = cleanTasks.filter(d => { const y=fiscalYear(d.month); return new Date(y,d.month-1,1) < TODAY; });
        const future = cleanTasks.filter(d => { const y=fiscalYear(d.month); return new Date(y,d.month-1,1) >= new Date(TODAY.getFullYear(),TODAY.getMonth(),1); });
        const last = past.length ? past[past.length-1] : null;
        const next = future.length ? future[0] : null;
        return { site, last, next };
      }).filter(x => x.last || x.next);

      return `
      <div class="page-header-row">
        <div>
          <div class="page-title">模組清洗管理</div>
          <div class="page-subtitle">清洗計畫追蹤與成果記錄</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.showUploadClean()">上傳清洗成果</button>
        </div>
      </div>
      <div class="card mb-16">
        <div class="card-header"><span class="card-title">清洗排程總覽</span></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>案場</th><th>容量</th><th>區域</th><th>上次清洗</th><th>預計清洗</th><th>狀態</th><th>操作</th></tr></thead>
            <tbody>
              ${cleaningInfo.map(({site,last,next})=>{
                const lastStr = last ? `2026年${last.month}月` : '未記錄';
                const nextStr = next ? `2026年${next.month}月` : '已完成';
                const hasNext = !!next;
                const soonM = next && next.month === (TODAY.getMonth()+1) ? 'soon' : next && new Date(fiscalYear(next.month),next.month-1,1) < new Date(TODAY.getFullYear(),TODAY.getMonth()+2,1) ? 'soon' : 'ok';
                return `<tr>
                  <td>${site.name}</td>
                  <td>${capacityDisplay(site.capacity)}</td>
                  <td><span class="zone-badge ${site.zone==='北區'?'zone-north':'zone-south'}">${site.zone}</span></td>
                  <td>${lastStr}</td>
                  <td class="${hasNext?'cleaning-due '+soonM:'text-muted'}">${nextStr}</td>
                  <td>${hasNext ? `<span class="badge badge-warning">待清洗</span>` : `<span class="badge badge-success">已清洗</span>`}</td>
                  <td><button class="btn btn-outline btn-sm" onclick="App.showCleanDetail(${site.id})">詳情</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">清洗成果上傳</span></div>
        <div class="card-body">
          <div class="photo-upload-area" onclick="alert('請選擇要上傳的清洗前後照片')">
            <div style="font-size:32px;margin-bottom:8px">📷</div>
            <div>點擊上傳清洗前後照片</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:4px">支援 JPG / PNG，最大 10MB</div>
          </div>
        </div>
      </div>`;
    },

    // ── Dispatch ──────────────────────────────────────────────
    dispatch() {
      const m = 6; // June 2026
      const y = 2026;
      const firstDay = new Date(y, m-1, 1).getDay();
      const daysInMonth = new Date(y, m, 0).getDate();
      const wo = this.state.workOrders.filter(w => w.month === m && w.year === y);
      const dayMap = {};
      wo.forEach(w => {
        const d = parseInt(w.scheduledDate.split('-')[2]);
        if (!dayMap[d]) dayMap[d] = [];
        dayMap[d].push(w);
      });
      const days = ['日','一','二','三','四','五','六'];
      let calCells = Array(firstDay).fill(null);
      for (let i=1; i<=daysInMonth; i++) calCells.push(i);

      return `
      <div class="page-header-row">
        <div>
          <div class="page-title">派工管理</div>
          <div class="page-subtitle">2026年6月工作行程</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.showDispatchModal()">＋ 指派工作</button>
        </div>
      </div>
      <div class="dispatch-grid">
        <div>
          <div class="card">
            <div class="card-header">
              <span class="card-title">2026年 6月</span>
              <div class="flex gap-8">
                <button class="btn btn-outline btn-sm">◀ 上月</button>
                <button class="btn btn-outline btn-sm">下月 ▶</button>
              </div>
            </div>
            <div class="card-body">
              <div class="calendar-grid mb-8">
                ${days.map(d=>`<div class="cal-header">${d}</div>`).join('')}
              </div>
              <div class="calendar-grid">
                ${calCells.map(d => {
                  if (!d) return `<div class="cal-day other-month"></div>`;
                  const isToday = d === 9;
                  const events = dayMap[d] || [];
                  return `<div class="cal-day${isToday?' today':''}">
                    <div class="cal-day-num">${d}</div>
                    ${events.slice(0,2).map(w=>`<div class="cal-event" title="${w.siteName}">${w.siteName.slice(0,4)}</div>`).join('')}
                    ${events.length>2?`<div class="cal-event">+${events.length-2}件</div>`:''}
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="card mb-16">
            <div class="card-header"><span class="card-title">技術人員</span></div>
            <div class="card-body" style="padding:0 16px">
              ${ENGINEERS.map(eng => {
                const tasks = wo.filter(w=>w.assignee===eng.name).length;
                return `<div class="tech-item">
                  <div class="tech-avatar">${eng.avatar}</div>
                  <div class="flex-1">
                    <div class="tech-name">${eng.name}</div>
                    <div class="tech-tasks">${eng.zone} · 本月 ${tasks} 件</div>
                  </div>
                  <span class="badge ${tasks>0?'badge-info':'badge-neutral'}">${tasks}</span>
                </div>`;
              }).join('')}
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">本月工單</span></div>
            <div class="card-body" style="padding:0">
              ${wo.length === 0 ? '<div class="empty-state" style="padding:20px"><div class="empty-state-text">本月無工單</div></div>' :
              wo.map(w=>`<div class="timeline-item" style="padding:10px 16px;cursor:pointer" onclick="App.showWODetail('${w.id}')">
                <div class="timeline-dot ${w.status}" style="background:${w.status==='completed'?'var(--success)':w.status==='in-progress'?'var(--warning)':'var(--text-3)'}"></div>
                <div class="timeline-body">
                  <div class="timeline-title">${w.siteName}</div>
                  <div class="timeline-meta">${WORK_TYPES[w.type].label} · ${w.assignee||'未派工'}</div>
                </div>
                ${App.statusBadge(w.status)}
              </div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    },

    // ── History ───────────────────────────────────────────────
    history() {
      const site = this.state.histSite || SITES_DATA[0];
      const hist = getSiteHistory(site.id);
      return `
      <div class="page-header">
        <div class="page-title">維運履歷</div>
        <div class="page-subtitle">每個案場自動建立完整維護記錄</div>
      </div>
      <div class="filters mb-16">
        <select class="filter-select" onchange="App.state.histSite=SITES_DATA.find(s=>s.id===+this.value);App.render()" style="min-width:200px">
          ${SITES_DATA.map(s=>`<option value="${s.id}"${s.id===site.id?' selected':''}>${s.name}</option>`).join('')}
        </select>
        <select class="filter-select">
          <option>2026年度</option><option>2025年度</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">${site.name} — 維運履歷</span>
            <button class="btn btn-outline btn-sm">匯出報告</button>
          </div>
          <div class="card-body">
            ${hist.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">尚無完成記錄</div></div>` : `
            <div class="history-timeline">
              ${hist.map(h=>`<div class="ht-item">
                <div class="ht-dot" style="background:${WORK_TYPES[h.type]?.color||'var(--primary)'}"></div>
                <div class="ht-card">
                  <div class="ht-date">${h.date}</div>
                  <div class="ht-title">${h.title}</div>
                  <div class="ht-desc">${h.desc}</div>
                </div>
              </div>`).join('')}
            </div>`}
          </div>
        </div>
        <div>
          <div class="card mb-16">
            <div class="card-header"><span class="card-title">案場資訊</span></div>
            <div class="card-body">
              <div class="info-grid">
                <div class="info-item"><div class="label">容量</div><div class="value">${capacityDisplay(site.capacity)}</div></div>
                <div class="info-item"><div class="label">縣市</div><div class="value">${site.city}</div></div>
                <div class="info-item"><div class="label">區域</div><div class="value">${site.zone}</div></div>
                <div class="info-item"><div class="label">業主</div><div class="value">${site.owner}</div></div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">維護統計</span></div>
            <div class="card-body">
              ${Object.entries(WORK_TYPES).map(([k,v])=>{
                const cnt = hist.filter(h=>h.type===k).length;
                return cnt ? `<div class="flex justify-between mb-8 text-sm">
                  <span class="chip ${v.cls}">${v.symbol} ${v.label}</span>
                  <span class="font-bold">${cnt} 次</span>
                </div>` : '';
              }).join('')}
            </div>
          </div>
        </div>
      </div>`;
    },

    // ── Photos ────────────────────────────────────────────────
    photos() {
      return `
      <div class="page-header-row">
        <div>
          <div class="page-title">照片管理</div>
          <div class="page-subtitle">維運照片資料庫</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="App.showPhotoUpload()">上傳照片</button>
        </div>
      </div>
      <div class="photo-cats">
        ${[{k:'all',l:'全部'},
           {k:'annual',l:'年度檢查'},
           {k:'clean',l:'清洗紀錄'},
           {k:'fault',l:'故障紀錄'},
           {k:'improve',l:'施工改善'},
           {k:'aerial',l:'空拍照片'}
        ].map(c=>`<button class="photo-cat-btn${this.state.photoCat===c.k?' active':''}" data-cat="${c.k}">${c.l}</button>`).join('')}
      </div>
      <div id="photoGrid">${this.renderPhotoGrid()}</div>`;
    },

    // ── Reports ───────────────────────────────────────────────
    reports() {
      return `
      <div class="page-header">
        <div class="page-title">報表中心</div>
        <div class="page-subtitle">自動產出維運報告</div>
      </div>
      <div class="report-cards mb-20">
        ${[
          {icon:'📋',t:'月報',d:'工作完成率、異常事件、發電量分析'},
          {icon:'📊',t:'年報',d:'年檢記錄、保養統計、KPI分析'},
          {icon:'🔧',t:'異常報告',d:'故障紀錄、處理措施、改善建議'},
          {icon:'🏭',t:'案場月報',d:'單一案場完整維護報告'},
        ].map(r=>`<div class="report-card" onclick="App.generateReport('${r.t}')">
          <div class="report-icon">${r.icon}</div>
          <div class="report-title">${r.t}</div>
          <div class="report-desc">${r.d}</div>
          <button class="btn btn-primary mt-16 w-full">產出 PDF</button>
        </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">2026年度統計摘要</span></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
            ${Object.entries(WORK_TYPES).map(([k,v])=>{
              const total = SCHEDULE_DATA.filter(d=>d.type===k).length;
              const done = this.state.workOrders.filter(w=>w.type===k&&w.status==='completed').length;
              return `<div style="padding:12px;border:1px solid var(--border);border-radius:8px">
                <div class="chip ${v.cls} mb-8">${v.symbol} ${v.label}</div>
                <div style="font-size:22px;font-weight:700">${done}/${total}</div>
                <div class="text-sm text-muted">已完成 / 總計</div>
                <div class="progress-bar-wrap mt-8"><div class="progress-bar" style="width:${total?Math.round(done/total*100):0}%;background:${v.color}"></div></div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
    },

    // ── Users ─────────────────────────────────────────────────
    users() {
      const roles = [
        {name:'王志明',role:'管理員',zone:'全區',avatar:'王',perms:[1,1,1,1,1]},
        {name:'陳維運',role:'維運主管',zone:'全區',avatar:'陳',perms:[1,1,1,1,0]},
        {name:'李大偉',role:'維運工程師',zone:'北區',avatar:'李',perms:[1,0,1,1,0]},
        {name:'張建國',role:'維運工程師',zone:'南區',avatar:'張',perms:[1,0,1,1,0]},
        {name:'林志豪',role:'維運工程師',zone:'全區',avatar:'林',perms:[1,0,1,1,0]},
        {name:'陳美玲',role:'維運工程師',zone:'南區',avatar:'陳',perms:[1,0,1,1,0]},
      ];
      const permLabels = ['查看案場','新增/修改案場','執行工單','上傳照片','系統設定'];
      return `
      <div class="page-header-row">
        <div>
          <div class="page-title">權限管理</div>
          <div class="page-subtitle">使用者帳號與角色權限設定</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm">＋ 新增使用者</button>
        </div>
      </div>
      <div class="user-grid mb-20">
        ${roles.map(u=>`<div class="user-card">
          <div class="user-card-avatar">${u.avatar}</div>
          <div class="user-card-name">${u.name}</div>
          <div class="user-card-role">${u.role}</div>
          <div class="user-card-zone mt-8">
            <span class="zone-badge ${u.zone==='南區'?'zone-south':'zone-north'}">${u.zone}</span>
          </div>
          <button class="btn btn-outline btn-sm mt-8 w-full" onclick="App.showUserEdit('${u.name}')">編輯</button>
        </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">角色權限對照表</span></div>
        <div class="table-wrap">
          <table class="perm-table">
            <thead><tr>
              <th>使用者</th><th>角色</th>
              ${permLabels.map(p=>`<th>${p}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${roles.map(u=>`<tr>
                <td>${u.name}</td>
                <td><span class="badge badge-info">${u.role}</span></td>
                ${u.perms.map(p=>`<td>${p?'<span class="perm-check">✓</span>':'<span class="perm-x">✕</span>'}</td>`).join('')}
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    },
  }, // end views

  // ── Render helpers ────────────────────────────────────────────
  renderSiteRows(filterZone, filterCity) {
    let sites = SITES_DATA;
    if (filterZone) sites = sites.filter(s => s.zone === filterZone);
    if (filterCity) sites = sites.filter(s => s.city === filterCity);
    return sites.map((s,i) => {
      const wo = this.state.workOrders.filter(w => w.siteId === s.id).length;
      return `<tr class="clickable${this.state.selectedSite?.id===s.id?' selected':''}" onclick="App.showSiteDetail(${s.id})">
        <td class="text-muted text-xs">${i+1}</td>
        <td style="font-weight:500">${s.name}</td>
        <td>${capacityDisplay(s.capacity)}</td>
        <td>${s.city}</td>
        <td><span class="zone-badge ${s.zone==='北區'?'zone-north':'zone-south'}">${s.zone}</span></td>
        <td class="text-muted">${s.owner}</td>
        <td><span class="badge badge-info">${wo}件</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();App.showSiteDetail(${s.id})">詳情</button>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();App.navigate('history');App.state.histSite=getSite(${s.id});App.render()">履歷</button>
        </td>
      </tr>`;
    }).join('');
  },

  filterSites(val, type) {
    const zone = type === 'zone' ? val : document.getElementById('zoneFilter')?.value;
    const city = type === 'city' ? val : document.getElementById('cityFilter')?.value;
    const tbody = document.getElementById('sitesBody');
    if (tbody) tbody.innerHTML = this.renderSiteRows(zone, city);
  },

  renderSiteDetailPanel(site) {
    const wo = this.state.workOrders.filter(w => w.siteId === site.id);
    const hist = getSiteHistory(site.id).slice(0, 4);
    return `
    <div class="card mt-20">
      <div class="card-header">
        <span class="card-title">${site.name} — 詳細資料</span>
        <button class="btn btn-outline btn-sm" onclick="App.state.selectedSite=null;App.render()">關閉 ✕</button>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
          <div>
            <div class="checklist-section-title">基本資訊</div>
            <div class="info-grid">
              ${[['案場名稱',site.name],['業主',site.owner],['容量',capacityDisplay(site.capacity)],['縣市',site.city],['區域',site.zone]].map(([l,v])=>`
              <div class="info-item"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('')}
            </div>
          </div>
          <div>
            <div class="checklist-section-title">年度工單 (${wo.length}件)</div>
            ${wo.slice(0,5).map(w=>`<div class="flex justify-between mb-4 text-sm">
              <span>${w.id}</span>
              <span class="chip ${WORK_TYPES[w.type].cls}">${WORK_TYPES[w.type].short}</span>
              ${App.statusBadge(w.status)}
            </div>`).join('')}
          </div>
          <div>
            <div class="checklist-section-title">近期維護記錄</div>
            ${hist.length === 0 ? '<div class="text-muted text-sm">尚無記錄</div>' : hist.map(h=>`<div class="mb-8">
              <div class="text-xs text-muted">${h.date}</div>
              <div class="text-sm">${h.title}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  },

  showSiteDetail(id) {
    this.state.selectedSite = getSite(id);
    this.render();
    setTimeout(() => document.querySelector('.card.mt-20')?.scrollIntoView({behavior:'smooth'}), 50);
  },

  renderWOList() {
    const filter = this.state.woFilter;
    let wo = this.state.workOrders;
    if (filter !== 'all') wo = wo.filter(w => w.status === filter);
    const wrap = document.getElementById('woListWrap');
    if (!wrap) return;
    if (wo.length === 0) {
      wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">無符合條件的工單</div></div>';
      return;
    }
    wrap.innerHTML = `<div class="wo-cards">
      ${wo.map(w => `<div class="wo-card ${w.status}" onclick="App.showWODetail('${w.id}')">
        <div>
          <div class="wo-id">${w.id}</div>
          <div class="wo-site">${w.siteName}</div>
          <div class="wo-meta">${this.typeChip(w.type)} · 預定 ${w.scheduledDate} · ${w.assignee||'<span class="text-muted">未派工</span>'}</div>
        </div>
        <div class="text-right">
          ${this.statusBadge(w.status)}
          <div class="wo-date mt-4">${monthLabel(w.month)}</div>
        </div>
      </div>`).join('')}
    </div>`;
  },

  showWODetail(id) {
    const w = this.state.workOrders.find(x => x.id === id);
    if (!w) return;
    const site = getSite(w.siteId);
    const body = `
    <div class="info-grid mb-16">
      ${[
        ['工單編號',w.id],['案場',w.siteName],
        ['工作類型',`<span class="chip ${WORK_TYPES[w.type].cls}">${WORK_TYPES[w.type].symbol} ${WORK_TYPES[w.type].label}</span>`],
        ['狀態',this.statusBadge(w.status)],
        ['預定日期',w.scheduledDate],['負責人',w.assignee||'未派工'],
        ['區域',`<span class="zone-badge ${site.zone==='北區'?'zone-north':'zone-south'}">${site.zone}</span>`],
        ['容量',capacityDisplay(site.capacity)],
      ].map(([l,v])=>`<div class="info-item"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('')}
    </div>
    <div class="form-group">
      <label class="form-label">指派工程師</label>
      <select class="form-control" id="woAssignee">
        <option value="">選擇工程師...</option>
        ${ENGINEERS.map(e=>`<option${w.assignee===e.name?' selected':''}>${e.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">更新狀態</label>
      <select class="form-control" id="woStatus">
        ${Object.entries(STATUS_CONFIG).map(([k,v])=>`<option value="${k}"${w.status===k?' selected':''}>${v.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">備注</label>
      <textarea class="form-control" rows="3" id="woNotes">${w.notes||''}</textarea>
    </div>`;

    this.openModal(`工單詳情 — ${w.id}`, body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="App.saveWO('${id}')">儲存</button>`);
  },

  saveWO(id) {
    const w = this.state.workOrders.find(x => x.id === id);
    if (!w) return;
    w.assignee = document.getElementById('woAssignee').value;
    w.status = document.getElementById('woStatus').value;
    w.notes = document.getElementById('woNotes').value;
    this.closeModal();
    this.renderWOList();
  },

  showNewWOModal() {
    const body = `
    <div class="form-group">
      <label class="form-label">案場</label>
      <select class="form-control" id="newWOSite">
        ${SITES_DATA.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">工作類型</label>
        <select class="form-control" id="newWOType">
          ${Object.entries(WORK_TYPES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">預定日期</label>
        <input type="date" class="form-control" id="newWODate" value="2026-06-15">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">負責工程師</label>
      <select class="form-control" id="newWOEngineer">
        ${ENGINEERS.map(e=>`<option>${e.name}</option>`).join('')}
      </select>
    </div>`;
    this.openModal('建立新工單', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="App.createWO()">建立</button>`);
  },

  createWO() {
    const siteId = +document.getElementById('newWOSite').value;
    const type = document.getElementById('newWOType').value;
    const date = document.getElementById('newWODate').value;
    const assignee = document.getElementById('newWOEngineer').value;
    const site = getSite(siteId);
    const month = +date.split('-')[1];
    const id = `OM-2026-${String(this.state.workOrders.length+1).padStart(4,'0')}`;
    this.state.workOrders.push({ id, siteId, siteName:site.name, type, month, year:2026, scheduledDate:date, assignee, status:'assigned', notes:'', completedDate:null });
    this.closeModal();
    this.renderWOList();
  },

  // ── Gantt helpers ─────────────────────────────────────────────
  bindGanttDrag() {
    document.querySelectorAll('.gantt-chip[draggable]').forEach(chip => {
      chip.addEventListener('dragstart', e => {
        chip.classList.add('dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({
          siteId: +chip.dataset.site, month: +chip.dataset.month, type: chip.dataset.type
        }));
      });
      chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
    });
  },

  onGanttDrop(event, toSite, toMonth) {
    event.target.closest('td')?.classList.remove('drag-over');
    try {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'));
      const sd = this.state.scheduleData;
      const idx = sd.findIndex(d => d.siteId===data.siteId && d.month===data.month && d.type===data.type);
      if (idx === -1) return;
      if (data.siteId !== toSite) return; // only allow same-site month change
      sd[idx] = { ...sd[idx], month: toMonth };
      localStorage.setItem('om_schedule_2026', JSON.stringify(sd));
      this.render();
    } catch(e) {}
  },

  showGanttTask(siteId, month, type) {
    const site = getSite(siteId);
    const wt = WORK_TYPES[type];
    const wo = this.state.workOrders.filter(w => w.siteId===siteId && w.month===month && w.type===type);
    const body = `
    <div class="info-grid mb-16">
      <div class="info-item"><div class="label">案場</div><div class="value">${site.name}</div></div>
      <div class="info-item"><div class="label">月份</div><div class="value">${monthLabel(month)}</div></div>
      <div class="info-item"><div class="label">工作類型</div><div class="value"><span class="chip ${wt.cls}">${wt.symbol} ${wt.label}</span></div></div>
      <div class="info-item"><div class="label">工單數</div><div class="value">${wo.length}</div></div>
    </div>
    ${wo.map(w=>`<div class="wo-card ${w.status} mb-8" onclick="App.closeModal();App.showWODetail('${w.id}')">
      <div><div class="wo-id">${w.id}</div><div class="wo-meta">${w.assignee||'未派工'}</div></div>
      ${App.statusBadge(w.status)}
    </div>`).join('')}
    <button class="btn btn-danger btn-sm mt-8" onclick="App.removeGanttTask(${siteId},${month},'${type}')">移除此排程</button>`;
    this.openModal(`${site.name} · ${monthLabel(month)} · ${wt.label}`, body);
  },

  removeGanttTask(siteId, month, type) {
    const sd = this.state.scheduleData;
    const idx = sd.findIndex(d => d.siteId===siteId && d.month===month && d.type===type);
    if (idx !== -1) { sd.splice(idx, 1); localStorage.setItem('om_schedule_2026', JSON.stringify(sd)); }
    this.closeModal();
    this.render();
  },

  addGanttTask(siteId, month) {
    const site = getSite(siteId);
    const body = `
    <div class="form-group">
      <label class="form-label">案場</label>
      <div class="value">${site.name}</div>
    </div>
    <div class="form-group">
      <label class="form-label">月份</label>
      <div class="value">${monthLabel(month)}</div>
    </div>
    <div class="form-group">
      <label class="form-label">工作類型</label>
      <select class="form-control" id="newTaskType">
        ${Object.entries(WORK_TYPES).map(([k,v])=>`<option value="${k}">${v.symbol} ${v.label}</option>`).join('')}
      </select>
    </div>`;
    this.openModal('新增排程工作', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="App.confirmAddTask(${siteId},${month})">確認新增</button>`);
  },

  confirmAddTask(siteId, month) {
    const type = document.getElementById('newTaskType').value;
    const sd = this.state.scheduleData;
    // Avoid duplicates
    if (!sd.find(d => d.siteId===siteId && d.month===month && d.type===type)) {
      sd.push({ siteId, month, type });
      localStorage.setItem('om_schedule_2026', JSON.stringify(sd));
    }
    this.closeModal();
    this.render();
  },

  exportSchedule() {
    alert('PDF匯出功能需搭配後端服務。\n目前版本可使用瀏覽器列印功能 (Ctrl+P)。');
  },

  // ── Photo helpers ─────────────────────────────────────────────
  renderPhotoGrid() {
    const cat = this.state.photoCat;
    const photos = [
      {cat:'annual',site:'桃園萬隆',date:'2026-03-20',icon:'🔍'},
      {cat:'annual',site:'台東東職一期',date:'2026-03-15',icon:'🔍'},
      {cat:'clean',site:'花蓮聖若瑟',date:'2026-02-18',icon:'🧹'},
      {cat:'clean',site:'雲林西螺洪慶堂',date:'2026-02-22',icon:'🧹'},
      {cat:'annual',site:'台南楠西一期',date:'2026-05-10',icon:'🔍'},
      {cat:'fault',site:'高雄恩智浦',date:'2026-01-05',icon:'⚠️'},
      {cat:'improve',site:'屏東汽車客運',date:'2026-03-18',icon:'🔧'},
      {cat:'aerial',site:'嘉義大林薯光',date:'2025-11-01',icon:'🚁'},
    ].filter(p => cat === 'all' || p.cat === cat);
    const grid = document.getElementById('photoGrid');
    const html = `<div class="photo-grid">
      ${photos.map(p=>`<div class="photo-item">
        <div class="photo-thumb">${p.icon}</div>
        <div class="photo-info">
          <div class="photo-name">${p.site}</div>
          <div class="photo-date">${p.date}</div>
        </div>
      </div>`).join('')}
      <div class="photo-upload-area" style="min-height:140px" onclick="App.showPhotoUpload()">
        <div style="font-size:24px">＋</div>
        <div style="font-size:12px">上傳照片</div>
      </div>
    </div>`;
    if (grid) { grid.innerHTML = html; return ''; }
    return html;
  },

  showPhotoUpload() {
    alert('照片上傳功能需搭配後端儲存服務。\n此為前端展示版本。');
  },

  showUploadClean() {
    alert('清洗成果上傳功能需搭配後端儲存服務。');
  },

  showAddSite() {
    const body = `
    <div class="form-group"><label class="form-label">案場名稱</label><input class="form-control" placeholder="輸入案場名稱..."></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">容量 (KW)</label><input type="number" class="form-control" placeholder="0"></div>
      <div class="form-group"><label class="form-label">縣市</label><input class="form-control" placeholder="縣市"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">區域</label><select class="form-control"><option>北區</option><option>南區</option></select></div>
      <div class="form-group"><label class="form-label">業主</label><input class="form-control" placeholder="業主名稱"></div>
    </div>`;
    this.openModal('新增案場', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="alert('案場新增功能需搭配資料庫');App.closeModal()">確認新增</button>`);
  },

  showCleanDetail(siteId) {
    const site = getSite(siteId);
    const body = `<div class="info-grid">
      <div class="info-item"><div class="label">案場</div><div class="value">${site.name}</div></div>
      <div class="info-item"><div class="label">容量</div><div class="value">${capacityDisplay(site.capacity)}</div></div>
    </div>
    <div class="mt-16">
      <div class="photo-upload-area" onclick="alert('上傳照片功能需後端支援')">
        <div style="font-size:24px;margin-bottom:8px">📷</div>
        <div style="font-size:13px">上傳清洗前後照片</div>
      </div>
    </div>`;
    this.openModal(`${site.name} — 清洗紀錄`, body);
  },

  showDispatchModal() {
    const body = `
    <div class="form-group"><label class="form-label">案場</label><select class="form-control">${SITES_DATA.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">工作類型</label><select class="form-control">${Object.entries(WORK_TYPES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">日期</label><input type="date" class="form-control" value="2026-06-15"></div>
    </div>
    <div class="form-group"><label class="form-label">指派工程師</label><select class="form-control">${ENGINEERS.map(e=>`<option>${e.name}</option>`).join('')}</select></div>`;
    this.openModal('指派工作', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="alert('已成功指派！');App.closeModal()">確認指派</button>`);
  },

  showUserEdit(name) {
    const body = `
    <div class="form-group"><label class="form-label">姓名</label><input class="form-control" value="${name}"></div>
    <div class="form-group"><label class="form-label">角色</label><select class="form-control"><option>管理員</option><option>維運主管</option><option>維運工程師</option></select></div>
    <div class="form-group"><label class="form-label">負責區域</label><select class="form-control"><option>北區</option><option>南區</option><option>全區</option></select></div>`;
    this.openModal(`編輯使用者 — ${name}`, body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="App.closeModal()">儲存</button>`);
  },

  submitChecklist(type) {
    const checkboxes = document.querySelectorAll(`.cl-panel[data-panel="${type}"] input[type="checkbox"]`);
    const checked = [...checkboxes].filter(c => c.checked).length;
    alert(`${WORK_TYPES[type]?.label || type}檢查表已提交！\n完成 ${checked}/${checkboxes.length} 項`);
  },

  generateReport(type) {
    alert(`正在產出 ${type}...\n\n此功能需搭配後端PDF產生服務。\n目前版本可使用 Ctrl+P 列印。`);
  },
};

// ── Bootstrap ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.state.workOrders = generateWorkOrders();
  App.init();

  // After each render, re-render the WO list if on workorders page
  const origRender = App.render.bind(App);
  App.render = function() {
    origRender();
    if (this.state.view === 'workorders') setTimeout(() => this.renderWOList(), 0);
  };
  App.init(); // re-init to pick up overridden render
});
