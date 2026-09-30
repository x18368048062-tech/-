/* 独立工作台：只保存当前浏览器的方案历史，不创建云端登录会话。 */
(() => {
  if (!LOCAL_WORKSPACE) return;
  const KEY = 'planbook_local_records_v1';
  const imported = window.WORKSPACE_RECORDS || [];
  let saved = [];
  let storageIssue = '';
  try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(saved)) throw Error('记录格式错误'); }
  catch (_) { saved = []; storageIssue = '本机记录暂时无法读取，请先导出备份。'; }
  const allRecords = () => [...saved, ...imported].sort((a,b) => String(b.created_at).localeCompare(String(a.created_at)));
  const panel = document.getElementById('panel');
  const tools = document.createElement('section');
  tools.className = 'workspace-tools';
  tools.innerHTML = '<div class="workspace-session"><div class="workspace-session-status"><span class="workspace-status-dot"></span><span><b>独立工作台</b><small>方案记录仅保存在当前浏览器，不会同步到云端</small></span></div><div class="workspace-actions"><button type="button" id="showLocalPlans">📊 本机方案历史</button></div><p id="workspaceStatus" role="status" aria-live="polite"></p></div>';
  panel.insertBefore(tools, panel.querySelector('details.note'));
  const style = document.createElement('style');
  style.textContent = `.workspace-tools{padding:15px;margin:18px 0 12px;border:1px solid #dbe4ed;border-radius:14px;background:#fff;font-size:13px;color:#46576b}.workspace-session-status{display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px dashed #dbe2ea}.workspace-session-status>span:last-of-type{display:flex;flex-direction:column;gap:3px}.workspace-session-status small{font-size:11px;color:#8795a7}.workspace-status-dot{width:10px;height:10px;border-radius:50%;background:#2e9e8f;flex:0 0 auto}.workspace-actions{display:flex;gap:8px;margin:12px 0}.workspace-actions button,.local-dialog button{border:1px solid #d5dde7;border-radius:9px;padding:9px 12px;background:white;color:#526276;cursor:pointer}.workspace-actions button:first-child{background:#3e7fba;border-color:#3e7fba;color:#fff;flex:1}.workspace-cloud-button{display:flex;align-items:center;justify-content:center;text-align:center;text-decoration:none;border:1px solid #d5dde7;border-radius:9px;padding:9px 12px;background:#fff;color:#526276;flex:1}.local-dialog header>.spacer{flex:1}.workspace-tools p{font-size:11px;line-height:1.6;margin-bottom:0}.local-dialog{width:min(1500px,96vw);max-width:96vw;height:min(94vh,1100px);max-height:94vh;margin:auto;padding:0;border:1px solid #dce5ee;border-radius:18px;color:#26384b;box-shadow:0 16px 80px #152a4940}.local-dialog::backdrop{background:#17283c66}.local-dialog header{display:flex;align-items:center;gap:10px;padding:15px 20px;border-bottom:1px solid #e5ebf2}.local-dialog h2{font-size:20px;margin:0 12px 0 0}.local-dialog p{color:#78879a;font-size:12px;margin:8px 0}.local-dialog .history-body{padding:16px 22px;overflow:auto;max-height:calc(94vh - 65px)}.history-tabs{display:flex;align-items:center;gap:8px}.history-tabs button.active{background:#3e7fba;color:#fff;border-color:#3e7fba}.history-tabs button:disabled{opacity:.55}.history-toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:12px;margin:8px 0 16px}.history-toolbar label{display:grid;gap:5px;color:#758399;font-size:12px}.history-toolbar select,.local-dialog input{padding:10px;border:1px solid #dce5ee;border-radius:8px;background:#fff;color:#26384b}.history-toolbar .spacer{flex:1}.history-toolbar .danger,.local-dialog .danger{color:#b34040;border-color:#edcccc}.history-stats{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0 18px}.history-stat{min-width:135px;padding:14px 16px;background:#f4f6f9;border:1px solid #e8edf3;border-radius:12px}.history-stat strong{display:block;font-size:21px;color:#26384b}.history-stat span{display:block;margin-top:4px;color:#9aa5b4;font-size:12px}.local-dialog input{width:100%;margin:0}.local-scroll{overflow:auto;max-height:calc(94vh - 340px);border:1px solid #e5ebf2}.local-dialog table{border-collapse:collapse;width:100%;font-size:13px;white-space:nowrap}.local-dialog th,.local-dialog td{text-align:left;padding:12px 14px;border-bottom:1px solid #e5ebf2}.local-dialog th{position:sticky;top:0;background:#f0f3f7;color:#68778c}.local-dialog button:disabled{opacity:.45;cursor:default}.workspace-invalid{padding:10px;color:#ac493c;background:#fff1ed;border-radius:8px;margin:10px 0;font-size:12px}@media print{.workspace-tools,.local-dialog,.workspace-invalid{display:none!important}}`;
  document.head.appendChild(style);
  const say = message => { document.getElementById('workspaceStatus').textContent = message; };
  const dialog = document.createElement('dialog');
  dialog.className = 'local-dialog';
  dialog.innerHTML = '<header><h2>📊 我的后台</h2><div class="history-tabs"><button type="button" class="active">计划书记录</button><button type="button" disabled title="本机模式没有云端账号管理">账号管理</button></div><span class="spacer"></span><button type="button" id="closeLocalPlans" aria-label="关闭">✕</button></header><div class="history-body"><p>按顾问和时间查询计划书记录；导入的历史数据保留原始信息，本机生成记录可在这里恢复。</p><div class="history-toolbar"><label>顾问账号<select id="localAccount"><option value="">全部顾问</option></select></label><label>时间范围<select id="localRange"><option value="all">全部时间</option><option value="today">今天</option><option value="7">近 7 天</option><option value="30">近 30 天</option></select></label><button type="button" id="exportLocalCsv">⬇ 导出 CSV</button><button type="button" id="refreshLocalPlans">🔄 刷新</button><button type="button" id="downloadLocalBackup">备份全部记录</button><span class="spacer"></span><button type="button" class="danger" id="clearLocalPlans">清空本机记录</button></div><div class="history-stats"><div class="history-stat"><strong id="historyCount">0</strong><span>记录数</span></div><div class="history-stat"><strong id="historyAgents">0</strong><span>涉及顾问</span></div><div class="history-stat"><strong id="historyCustomers">0</strong><span>客户数</span></div><div class="history-stat"><strong id="historyPremium">0万</strong><span>年缴保费合计</span></div></div><label for="localSearch">搜索客户、顾问或产品</label><input id="localSearch" placeholder="输入姓名或产品名称"><p id="localCount"></p><div class="local-scroll"><table><thead><tr><th>保存时间</th><th>客户 / 顾问</th><th>产品</th><th>投保信息</th><th>来源</th><th>操作</th></tr></thead><tbody id="localRows"></tbody></table></div></div>';
  document.body.appendChild(dialog);
  const productFor = r => r.snapshot?.product==='taiying'||/泰盈人生/.test(r.plan_name||'')?'taiying':r.snapshot && PRODUCTS[r.snapshot.product] ? r.snapshot.product : /鑫享世家/.test(r.plan_name || '') ? (/庆典30/.test(r.plan_name) ? 'qd30' : /尊享/.test(r.plan_name) ? 'zx' : null) : null;
  let visibleRows = [];
  function paintHistory() {
    const query = document.getElementById('localSearch').value.trim().toLowerCase();
    const account = document.getElementById('localAccount').value, range = document.getElementById('localRange').value;
    const cutoff = range==='today' ? new Date().setHours(0,0,0,0) : range==='all' ? 0 : Date.now()-Number(range)*86400000;
    const accountNames=[...new Set(allRecords().map(r=>r.agent).filter(Boolean))].sort();
    const accountSelect=document.getElementById('localAccount'),oldAccount=accountSelect.value;
    accountSelect.innerHTML='<option value="">全部顾问</option>'+accountNames.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    accountSelect.value=accountNames.includes(oldAccount)?oldAccount:'';
    const filtered=allRecords().filter(r=>(!account||r.agent===account)&&(!cutoff||new Date(r.created_at).getTime()>=cutoff));
    visibleRows = filtered.filter(r => [r.customer_name,r.agent,r.plan_name,r.pb_id].join(' ').toLowerCase().includes(query));
    document.getElementById('localCount').textContent = `共 ${allRecords().length} 条，当前显示 ${visibleRows.length} 条`;
    document.getElementById('historyCount').textContent=filtered.length;
    document.getElementById('historyAgents').textContent=new Set(filtered.map(r=>r.agent).filter(Boolean)).size;
    document.getElementById('historyCustomers').textContent=new Set(filtered.map(r=>r.customer_name).filter(Boolean)).size;
    document.getElementById('historyPremium').textContent=(filtered.reduce((n,r)=>n+Number(r.premium||0),0)/10000).toFixed(1)+'万';
    document.getElementById('localRows').innerHTML = visibleRows.map((r,i) => `<tr><td>${esc(tsLabel(r.created_at))}</td><td>${esc(r.customer_name || '未填写客户')}<br>${esc(r.agent || '未填写顾问')}</td><td>${esc(r.plan_name || '原备份未记录产品')}</td><td>${esc(r.age)}岁 · ${esc(r.gender)} · ${esc(moneyWan(r.premium))}/年 · ${esc(r.term)}年</td><td>${r.local_id ? '本机' : '导入备份'}</td><td><button type="button" data-restore="${i}" ${productFor(r) ? '' : 'disabled'}>${r.snapshot ? '恢复方案' : '恢复投保信息'}</button> ${r.local_id?`<button type="button" class="danger" data-delete-local="${esc(r.local_id)}">删除</button>`:''}</td></tr>`).join('') || '<tr><td colspan="6">没有找到匹配的记录</td></tr>';
  }
  function savePlan(kind) {
    if(storageIssue){say('本机历史记录读取异常，暂不覆盖已有存储。');return false;}
    if (!validWorkspaceInputs()) { say('请先填写有效的投保信息。'); return false; }
    genFromForm();
    const snapshot=JSON.parse(JSON.stringify(state)),activeProduct=window.PLANBOOK_ACTIVE_PRODUCT?.();
    if(activeProduct){snapshot.product=activeProduct;if(activeProduct==='taiying')snapshot.taiying=window.PLANBOOK_TAIYING_SETTINGS?.();}
    const r = {...recordPayload(), local_id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), created_at:new Date().toISOString(), kind, snapshot};
    const next = [r,...saved];
    try { localStorage.setItem(KEY, JSON.stringify(next)); saved=next; say('方案已保存到本机，可在“历史计划”中恢复。'); return true; }
    catch (_) { say('浏览器存储不可用或已满，方案未保存。请先备份历史记录。'); return false; }
  }
  document.getElementById('showLocalPlans').onclick = () => { paintHistory(); dialog.showModal(); };
  document.getElementById('closeLocalPlans').onclick = () => dialog.close();
  document.getElementById('localSearch').oninput = paintHistory;
  document.getElementById('localAccount').onchange = paintHistory;
  document.getElementById('localRange').onchange = paintHistory;
  document.getElementById('refreshLocalPlans').onclick = paintHistory;
  document.getElementById('clearLocalPlans').onclick = () => {if(!saved.length){say('没有可清除的本机记录。');return;}if(!confirm(`确定清空 ${saved.length} 条本机记录吗？导入的历史记录不会删除。`))return;saved=[];localStorage.removeItem(KEY);paintHistory();say('本机记录已清空；导入的历史记录仍保留。');};
  document.getElementById('exportLocalCsv').onclick = () => {const cols=['created_at','customer_name','agent','plan_name','gender','age','premium','term','pb_id'];const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const csv='\ufeff'+[cols.join(','),...visibleRows.map(r=>cols.map(c=>quote(r[c])).join(','))].join('\r\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),'计划书记录_'+new Date().toISOString().slice(0,10)+'.csv');};
  document.getElementById('downloadLocalBackup').onclick = () => downloadBlob(new Blob([JSON.stringify({version:1,exported_at:new Date().toISOString(),records:allRecords()},null,2)],{type:'application/json'}),'计划书记录备份_'+new Date().toISOString().slice(0,10)+'.json');
  document.getElementById('localRows').onclick = e => {
    const del=e.target.closest('[data-delete-local]');if(del){if(!confirm('确定删除这条本机计划书记录吗？'))return;saved=saved.filter(x=>x.local_id!==del.dataset.deleteLocal);localStorage.setItem(KEY,JSON.stringify(saved));paintHistory();return;}
    const b=e.target.closest('[data-restore]'); if(!b)return;
    const r=visibleRows[Number(b.dataset.restore)],product=productFor(r); if(!product)return;
    const snapshot=r.snapshot || {product,age:Number(r.age),gender:r.gender,prem:Number(r.premium),term:Number(r.term),name:r.customer_name||'',agent:r.agent||'',mode:'normal',wdList:[]};
    if(product==='taiying'){
      const settings=snapshot.taiying||{};Object.assign(state,snapshot,{product:settings.baseProduct||'zx',pbId:null});
      $('#fAge').value=state.age;$('#fPrem').value=state.prem/10000;$('#fName').value=state.name||'';$('#fAgent').value=state.agent||'';
      $('#fGender').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.v===state.gender));
      taiyingAccount=settings.contract||'福泰2026';taiyingAccountLevel=settings.accountLevel||'万能结息利益演示';taiyingCustomRate=settings.customRate?settings.customRate*100:3;taiyingSchedule=settings.schedules||[];
      $('#taiyingAccount').value=taiyingAccount;$('#taiyingCustomRate').value=taiyingCustomRate;$('#taiyingCustomRateBox').hidden=taiyingAccountLevel!=='自定义利益演示';
      $('#taiyingAccountLevel').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.v===taiyingAccountLevel));
      $('#fTerm').innerHTML=`<option value="${state.term}">缴 ${state.term} 年</option>`;state.mode=snapshot.mode||'normal';syncModeUI();renderTaiyingSchedule();openTaiyingInWorkspace();syncTaiyingFrame();dialog.close();say('已恢复泰盈人生方案与账户演示设置。');return;
    }
    if(!PRODUCTS[product].tbl[snapshot.term]?.[snapshot.gender]?.[String(snapshot.age)]){
      document.getElementById('localCount').textContent='当前源表没有这条记录对应的投保组合，未更改正在编辑的方案。';return;
    }
    Object.assign(state,snapshot,{product,pbId:null});
    $('#fAge').value=state.age;$('#fPrem').value=state.prem/10000;$('#fName').value=state.name;$('#fAgent').value=state.agent;
    $('#fGender').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===state.gender));
    refreshProdUI();refreshTermOptions();$('#fTerm').value=state.term;syncModeUI();renderWdList();genFromForm();syncPrintGate();updateExportButtonsState();save();dialog.close();
    say(r.snapshot ? '已恢复完整方案与领取安排。' : '已恢复历史投保信息；旧备份未包含领取安排。');
  };
  const cloudLog=logExport;
  logExport=function(){if(LOCAL_WORKSPACE){savePlan('exported');return;}cloudLog();};
  window.addEventListener('afterprint',()=>{if(ensureAgent())logExport();});
  let pending;
  ['fAge','fPrem','fName'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{
    clearTimeout(pending);pending=setTimeout(()=>{if(id==='fAge')refreshTermOptions();genFromForm();updateExportButtonsState();if(validWorkspaceInputs())save();},180);
  }));
  bootApp();refreshProdUI();genFromForm();updateExportButtonsState();
  document.getElementById('sessBar').hidden=true;
  if(storageIssue)say(storageIssue);
})();
