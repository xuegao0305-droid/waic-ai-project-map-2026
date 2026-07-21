import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");
const data = JSON.parse(await fs.readFile(path.join(projectRoot, "public/data/waic-dashboard.json"), "utf8"));
const css = (await fs.readFile(path.join(projectRoot, "app/globals.css"), "utf8")).replace('@import "tailwindcss";', "");
const defaultOutput = path.join(workspaceRoot, "outputs/019f8290-6d5c-70f1-b237-6bb4e0e451e5/WAIC_2026_具体趋势拆解_可交互版.html");
const output = process.env.WAIC_STANDALONE_OUTPUT
  ? path.resolve(projectRoot, process.env.WAIC_STANDALONE_OUTPUT)
  : defaultOutput;

const safeData = JSON.stringify(data).replaceAll("<", "\\u003c");

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WAIC 2026 AI项目全量拆解</title>
  <style>${css}
	  .static-page{display:none}.static-page.active{display:block}.static-page>section{margin-top:38px}
	  .side nav button span{display:grid}.side nav button small{display:block}
	  .static-action{cursor:pointer}.raw-switch{margin-bottom:0}
	  .metric-symbol,.heading-symbol{display:grid;place-items:center;border-radius:8px;background:var(--teal-light);color:var(--teal-dark);font-size:16px}.metric-symbol{width:23px;height:23px}.heading-symbol{width:27px;height:27px}.chart-heading{grid-template-columns:34px minmax(0,1fr)}
  @media(max-width:850px){.side{transform:none;position:relative;width:100%;height:auto;padding:22px}.side nav{grid-template-columns:repeat(4,minmax(0,1fr));padding:18px 0 0}.side-note{display:none}.content-shell{margin-left:0;padding-top:30px}.mobile-menu{display:none}.site-brand{padding-bottom:16px}}
  @media(max-width:620px){.side nav{grid-template-columns:repeat(2,minmax(0,1fr))}}
  </style>
</head>
<body>
<div class="site-shell">
  <aside class="side">
    <div class="site-brand"><small>WAIC 2026</small><b>AI项目全量拆解</b><span>行业、产品、任务、项目和公司</span></div>
    <nav>
	      <button class="active" data-page="overview"><i>01</i><span><b>行业全景</b><small>比较全部${data.metadata.level1Count}个行业</small></span></button>
	      <button data-page="drilldown"><i>02</i><span><b>行业拆解</b><small>看到具体产品和任务</small></span></button>
	      <button data-page="projects"><i>03</i><span><b>项目查询</b><small>搜索和筛选全部展品</small></span></button>
	      <button data-page="method"><i>04</i><span><b>数据说明</b><small>范围、单位和阅读方法</small></span></button>
    </nav>
	    <div class="side-note"><span>完整数据范围</span><b>${data.metadata.uniqueProjects.toLocaleString("zh-CN")}个WAIC项目</b><small>全部保留。同一家公司在同一具体方向下的相关展品合并为${data.metadata.productFamilies}个产品系列。</small></div>
  </aside>
  <main class="content-shell">
    <div id="overview" class="static-page active"></div>
    <div id="drilldown" class="static-page"></div>
    <div id="projects" class="static-page"></div>
    <div id="method" class="static-page"></div>
    <footer><span>数据来自WAIC 2026官方项目目录</span><a href="${data.metadata.officialPage}" target="_blank" rel="noreferrer">打开官方目录</a></footer>
  </main>
</div>
<button id="shade" aria-label="关闭详情" class="drawer-shade"></button>
<aside id="drawer" class="detail-drawer"><button id="drawerClose" class="drawer-close">关闭</button><div id="drawerBody"></div></aside>
<script>
const DATA=${safeData};
const $=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>new Intl.NumberFormat("zh-CN").format(n), pct=n=>(n*100).toFixed(1)+"%";
const fam=id=>DATA.families.find(x=>x.id===id), uniq=xs=>[...new Set(xs)];
const match=(row,m)=>(!m.l1||m.l1.includes(row.l1))&&(!m.l2||m.l2.includes(row.l2))&&(!m.l3||m.l3.includes(row.l3));
let selectedSector="核心技术", selectedL2="", projectRaw=false, projectPage=1;

function intro(kicker,title,text){return '<header class="page-intro"><span>'+esc(kicker)+'</span><h1>'+esc(title)+'</h1><p>'+esc(text)+'</p></header>'}
function openDrawer(content){$("#drawerBody").innerHTML=content;$("#shade").classList.add("open");$("#drawer").classList.add("open");bindActions($("#drawer"))}
function closeDrawer(){$("#shade").classList.remove("open");$("#drawer").classList.remove("open")}
$("#shade").onclick=closeDrawer;$("#drawerClose").onclick=closeDrawer;

function showFamily(id){
  const f=fam(id), ps=DATA.projects.filter(x=>x.familyId===id);
  openDrawer('<span class="drawer-label">产品系列</span><h2>'+esc(f.representativeProject)+'</h2><p class="drawer-intro">'+esc(f.enterprise)+'</p><div class="path-tags drawer-path"><span>'+esc(f.l1)+'</span><span>'+esc(f.l2)+'</span><span>'+esc(f.l3)+'</span></div><div class="fact-grid"><article><span>交付形态</span><p>'+esc(f.productForms.join("、"))+'</p></article><article><span>具体做什么</span><p>'+esc(f.work)+'</p></article><article><span>谁会使用</span><p>'+esc(f.audience)+'</p></article><article><span>项目进展</span><p>'+esc(f.evidenceStage)+'</p><small>'+esc(f.evidenceStageBasis)+'</small></article>'+(f.task?'<article><span>机器人任务</span><p>'+esc(f.task)+'</p><small>'+esc(f.taskDirection)+'</small></article>':'')+'</div><div class="drawer-section"><h3>项目介绍</h3><p>'+esc(f.description||"WAIC目录没有填写项目简介")+'</p></div><div class="drawer-section"><h3>这个产品系列包含的展品</h3><div class="raw-projects">'+ps.map(p=>'<article><div><b>'+esc(p.name)+'</b><span>'+esc(p.booth||"展位未填写")+'</span></div><p>'+esc(p.description||"没有填写简介")+'</p><small>交付形态：'+esc(p.productForm)+'</small></article>').join("")+'</div></div>');
}

function showMatch(title,explanation,m){
  const rows=DATA.families.filter(x=>match(x,m));
  openDrawer('<span class="drawer-label">具体方向</span><h2>'+esc(title)+'</h2><p class="drawer-intro">'+esc(explanation)+'</p><div class="drawer-number"><b>'+rows.length+'</b><span>个产品系列 · '+rows.reduce((s,x)=>s+x.projectCount,0)+'件原始展品</span></div><div class="drawer-section"><h3>全部相关产品系列</h3><div class="family-buttons">'+rows.map(x=>'<button data-family="'+x.id+'"><span><b>'+esc(x.representativeProject)+'</b><small>'+esc(x.enterprise)+' · '+esc(x.evidenceStage)+'</small></span><strong>'+x.projectCount+'件</strong></button>').join("")+'</div></div>');
}

function showTask(name,mode){
  const list=mode==="humanoid"?DATA.embodied.humanoidTasks:DATA.embodied.tasks, t=list.find(x=>x.name===name), rows=t.familyIds.map(fam).filter(Boolean);
  openDrawer('<span class="drawer-label">机器人任务</span><h2>'+esc(t.name)+'</h2><p class="drawer-intro">'+esc(t.direction)+'</p><div class="drawer-number"><b>'+t.familyCount+'</b><span>个机器人产品系列 · '+t.projectCount+'件原始展品</span></div><div class="drawer-section"><h3>完成这个任务的项目</h3><div class="family-buttons">'+rows.map(x=>'<button data-family="'+x.id+'"><span><b>'+esc(x.representativeProject)+'</b><small>'+esc(x.enterprise)+' · '+esc(x.l3)+'</small></span><strong>'+x.projectCount+'件</strong></button>').join("")+'</div></div>');
}

function sectorComparisonChart(){
  const rows=DATA.sectors.slice(0,8),max=Math.max(...rows.flatMap(x=>[x.enterpriseCount,x.familyCount])),bar=v=>Math.max(2,v/max*100);
  return '<div class="chart-wrap sector-comparison-wrap"><div class="chart-heading"><span class="heading-symbol">▥</span><div><h2>核心技术与具身智能在企业数、产品系列数两项均居前两位</h2><p>按产品系列数列出前八个一级行业，两项指标使用同一条从零开始的刻度，点击行业可继续查看具体产品</p></div></div><div class="sector-comparison" role="group" aria-label="一级行业参展企业数与产品系列数对比"><div class="sector-comparison-head" aria-hidden="true"><span>一级行业</span><span>参展企业数</span><span>产品系列数</span></div>'+rows.map(s=>'<button type="button" class="sector-comparison-row'+(s.rank<=2?' is-leading':'')+'" data-sector="'+esc(s.name)+'" aria-label="'+esc(s.name)+'，'+s.enterpriseCount+'家参展企业，'+s.familyCount+'个产品系列"><span class="comparison-name"><i>'+String(s.rank).padStart(2,"0")+'</i><b>'+esc(s.name)+'</b></span><span class="comparison-measure enterprise-measure" data-label="参展企业"><span><i style="width:'+bar(s.enterpriseCount)+'%"></i></span><strong>'+s.enterpriseCount+'</strong></span><span class="comparison-measure family-measure" data-label="产品系列"><span><i style="width:'+bar(s.familyCount)+'%"></i></span><strong>'+s.familyCount+'</strong></span></button>').join('')+'</div></div>';
}

function sankeyChart(sector){
  const w=1180,top=[...sector.l2].sort((a,b)=>b.familyCount-a.familyCount).slice(0,6),other=sector.l2.slice(6).reduce((s,x)=>s+x.familyCount,0),l2=[...top.map(x=>({name:x.name,value:x.familyCount,source:x})),...(other?[{name:"其他方向",value:other,source:null}]:[])];
  const leaves=l2.flatMap(x=>{if(!x.source)return[{name:"其他具体产品",value:x.value,parent:x.name}];const t=[...x.source.l3].sort((a,b)=>b.familyCount-a.familyCount).slice(0,2),o=x.value-t.reduce((s,y)=>s+y.familyCount,0);return[...t.map(y=>({name:y.name,value:y.familyCount,parent:x.name})),...(o>0?[{name:"其他产品",value:o,parent:x.name}]:[])]});
  const h=Math.max(620,120+leaves.length*30),sc=Math.min(1.08,(h-110-(leaves.length-1)*18)/sector.familyCount),place=(rows,gap)=>{const th=rows.reduce((s,x)=>s+x.value*sc,0)+Math.max(0,rows.length-1)*gap;let c=(h-th)/2;return rows.map(x=>{const n={...x,y:c,h:x.value*sc};c+=n.h+gap;return n})},n2=place(l2,38),n3=place(leaves,18),rh=sector.familyCount*sc,ry=(h-rh)/2,curve=(x1,y1,x2,y2)=>'M'+x1+','+y1+' C'+(x1+125)+','+y1+' '+(x2-125)+','+y2+' '+x2+','+y2;
  let ro=ry;const a=n2.map(n=>{const sy=ro+n.h/2;ro+=n.h;return{n,sy}}),by=new Map;n3.forEach(n=>by.set(n.parent,[...(by.get(n.parent)||[]),n]));const b=n2.flatMap(n=>{let o=n.y;return(by.get(n.name)||[]).map(l=>{const sy=o+l.h/2;o+=l.h;return{n,l,sy}})});
  return '<div class="chart-wrap sankey-wrap"><div class="chart-heading"><span class="heading-symbol">⇢</span><div><h2>'+esc(sector.name)+'的产品从大板块继续拆到具体方向</h2><p>连线越宽，代表该方向包含的产品系列越多。</p></div></div><svg class="sankey-chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(sector.name)+'产品结构桑基图">'+a.map(x=>'<path d="'+curve(126,x.sy,410,x.n.y+x.n.h/2)+'" stroke-width="'+Math.max(2,x.n.h)+'" class="sankey-link sankey-link-primary"><title>'+esc(sector.name)+'到'+esc(x.n.name)+'：'+x.n.value+'个产品系列</title></path>').join('')+b.map(x=>'<path d="'+curve(436,x.sy,822,x.l.y+x.l.h/2)+'" stroke-width="'+Math.max(2,x.l.h)+'" class="sankey-link"><title>'+esc(x.n.name)+'到'+esc(x.l.name)+'：'+x.l.value+'个产品系列</title></path>').join('')+'<rect x="96" y="'+ry+'" width="30" height="'+Math.max(4,rh)+'" rx="5" class="sankey-node root-node"/><text x="82" y="'+(ry+rh/2-5)+'" text-anchor="end" class="sankey-name">'+esc(sector.name)+'</text><text x="82" y="'+(ry+rh/2+14)+'" text-anchor="end" class="sankey-value">'+sector.familyCount+'个</text>'+n2.map(n=>'<g><rect x="410" y="'+n.y+'" width="26" height="'+Math.max(4,n.h)+'" rx="4" class="sankey-node"/><text x="398" y="'+(n.y+n.h/2-4)+'" text-anchor="end" class="sankey-name">'+esc(n.name)+'</text><text x="398" y="'+(n.y+n.h/2+14)+'" text-anchor="end" class="sankey-value">'+n.value+'个</text></g>').join('')+n3.map(n=>'<g><rect x="822" y="'+n.y+'" width="22" height="'+Math.max(4,n.h)+'" rx="4" class="sankey-node leaf-node"/><text x="858" y="'+(n.y+n.h/2+5)+'" class="sankey-name">'+esc(n.name)+' · '+n.value+'</text></g>').join('')+'<text x="111" y="30" text-anchor="middle" class="sankey-column">一级行业</text><text x="423" y="30" text-anchor="middle" class="sankey-column">二级方向</text><text x="833" y="30" text-anchor="middle" class="sankey-column">具体产品</text></svg></div>';
}

function progressChart(sector){
  const names={"规模使用线索":"规模应用","客户交付线索":"客户交付","试点验证线索":"试点验证","研发教学线索":"研发教学","产品说明":"产品发布"},counts=new Map;DATA.families.filter(x=>x.l1===sector.name).forEach(x=>{const n=names[x.evidenceStage]||x.evidenceStage;counts.set(n,(counts.get(n)||0)+1)});const rows=["规模应用","客户交付","试点验证","研发教学","产品发布"].map(name=>({name,value:counts.get(name)||0})).filter(x=>x.value),top=[...rows].sort((a,b)=>b.value-a.value)[0];
  return '<div class="chart-wrap progress-wrap"><div class="chart-heading"><span class="heading-symbol">↗</span><div><h2>'+esc(top?.name||"产品发布")+'是'+esc(sector.name)+'项目介绍中最多的进展阶段</h2><p>按产品系列汇总WAIC目录中出现的应用、交付、试点、研发和发布信息。</p></div></div><div class="progress-bar" role="img" aria-label="'+esc(rows.map(x=>x.name+x.value+'个').join('，'))+'">'+rows.map((x,i)=>{const share=x.value/sector.familyCount*100;return'<span class="stage-'+(i+1)+'" style="width:'+share+'%">'+(share>=8?'<b>'+x.value+'</b>':'')+'</span>'}).join('')+'</div><div class="progress-legend">'+rows.map((x,i)=>'<div><i class="stage-'+(i+1)+'"></i><span>'+esc(x.name)+'</span><b>'+x.value+'个</b></div>').join('')+'</div></div>';
}

function renderOverview(){
  const core=DATA.sectors.find(x=>x.name==="核心技术"),embodied=DATA.sectors.find(x=>x.name==="具身智能"),human=DATA.globalL3.find(x=>x.name==="人形机器人"),topL2=DATA.sectors.flatMap(x=>x.l2).sort((a,b)=>b.familyCount-a.familyCount||b.projectCount-a.projectCount).slice(0,8),topL3=DATA.globalL3.slice(0,15);
  const l3=n=>(DATA.globalL3.find(x=>x.name===n)||{familyCount:0}).familyCount,l2=n=>(DATA.sectors.flatMap(x=>x.l2).find(x=>x.name===n)||{familyCount:0}).familyCount;
  $("#overview").innerHTML=intro("行业全景","WAIC最集中的项目是AI底座和机器人，具体热点已经落到人形本体、机器人感知与操作、AI芯片和服务器",DATA.metadata.level1Count+"个一级行业继续拆成"+DATA.metadata.level2Count+"个二级方向和"+DATA.metadata.level3Count+"个具体产品方向。页面先比较全局热度，再逐层看到产品、任务、项目和典型公司。")+
  '<section class="metric-strip"><article><span class="metric-symbol">◆</span><span>WAIC展品</span><b>'+fmt(DATA.metadata.uniqueProjects)+'</b><small>全部项目可查询</small></article><article><span class="metric-symbol">▦</span><span>产品系列</span><b>'+fmt(DATA.metadata.productFamilies)+'</b><small>用于比较行业热度</small></article><article><span class="metric-symbol">⑂</span><span>具体方向</span><b>'+DATA.metadata.level3Count+'</b><small>最细行业分类</small></article><article><span class="metric-symbol">▥</span><span>参展企业</span><b>'+DATA.metadata.enterprises+'</b><small>覆盖全部项目</small></article></section>'+
  '<section class="answer-grid"><article class="primary-answer"><span>全量结论</span><h2>核心技术有'+core.familyCount+'个产品系列，具身智能有'+embodied.familyCount+'个，两者合计占'+pct((core.familyCount+embodied.familyCount)/DATA.metadata.productFamilies)+'</h2><p>项目供给集中在算力、模型、企业软件、机器人整机和机器人部件。这个比例反映WAIC展品结构。</p></article><article><span>人形机器人位置</span><h3>'+human.familyCount+'个产品系列，在'+DATA.metadata.level3Count+'个具体方向中排第'+human.rank+'</h3><p>机器人传感器'+l3("传感器与感知器件")+'个、灵巧手与夹爪'+l3("灵巧手与夹爪")+'个、AI芯片'+l3("AI芯片与加速卡")+'个、服务器'+l3("服务器与算力一体机")+'个，热点同时覆盖本体、感知、操作和算力。</p></article><article><span>软件侧集中点</span><h3>企业软件'+l2("企业软件与通用应用")+'个，模型与算法'+l2("模型与算法")+'个</h3><p>内容创作、办公协同、客服营销和模型能力已经形成清晰的产品方向。</p></article></section><section>'+sectorComparisonChart()+'</section>'+
  '<section><div class="section-title"><span>一级行业</span><h2>20个行业按产品系列数量排名</h2><p>点击任意行业，可以继续查看二级方向、具体产品、项目进展和典型公司。</p></div><div class="rank-list sector-rank-list">'+DATA.sectors.map(s=>'<button data-sector="'+esc(s.name)+'"><i>'+String(s.rank).padStart(2,"0")+'</i><span><b>'+esc(s.name)+'</b><small>'+esc(s.l2[0]?.name||"")+'是其中最大的二级方向</small></span><div class="rank-bar"><u style="width:'+Math.max(2,s.familyCount/core.familyCount*100)+'%"></u></div><strong>'+s.familyCount+'</strong><em>个</em></button>').join("")+'</div></section>'+
  '<section class="split-section"><div><div class="section-title"><span>二级方向</span><h2>项目最多的八个业务板块</h2></div><div class="compact-rank">'+topL2.map((x,i)=>'<button data-match="'+encodeURIComponent(JSON.stringify({l1:[x.l1],l2:[x.name]}))+'" data-title="'+esc(x.name)+'" data-explanation="'+esc(x.definition)+'"><i>'+(i+1)+'</i><span><b>'+esc(x.name)+'</b><small>'+esc(x.l1)+'</small></span><strong>'+x.familyCount+'</strong></button>').join("")+'</div></div><div><div class="section-title"><span>整体方向</span><h2>展品正在沿三条路径形成产品</h2></div><div class="direction-list"><article><i>◆</i><div><h3>算力从芯片扩展到整套系统</h3><p>芯片'+l3("AI芯片与加速卡")+'个产品系列，服务器'+l3("服务器与算力一体机")+'个，互联'+l3("存储与高速互联")+'个，数据中心与液冷'+l3("数据中心与液冷")+'个，智算集群'+l3("智算中心与计算集群")+'个。</p></div></article><article><i>◎</i><div><h3>机器人热点集中在本体、感知和操作三层</h3><p>人形机器人'+l3("人形机器人")+'个产品系列，传感器'+l3("传感器与感知器件")+'个，灵巧手'+l3("灵巧手与夹爪")+'个，关节'+l3("关节与传动部件")+'个，仿真训练与数据平台'+l3("具身研发、仿真训练与数据平台")+'个。</p></div></article><article><i>✦</i><div><h3>企业软件开始承接固定工作</h3><p>内容创作'+l3("内容创作与数字人")+'个产品系列、办公协同'+l3("办公与协同智能体")+'个、客服营销'+l3("客户服务与营销")+'个、软件开发'+l3("软件开发与编程")+'个。</p></div></article></div></div></section>'+
  '<section><div class="section-title"><span>具体产品</span><h2>'+DATA.metadata.level3Count+'个具体方向中数量最多的15类产品</h2><p>点击任意一行，可以查看对应的全部产品系列和原始展品。</p></div><div class="rank-list l3-global-list">'+topL3.map(x=>'<button data-match="'+encodeURIComponent(JSON.stringify({l1:[x.l1],l2:[x.l2],l3:[x.name]}))+'" data-title="'+esc(x.name)+'" data-explanation="'+esc(x.work)+'"><i>'+String(x.rank).padStart(2,"0")+'</i><span><b>'+esc(x.name)+'</b><small>'+esc(x.work)+'</small></span><u>'+esc(x.l1)+'</u><strong>'+x.familyCount+'</strong><em>查看项目</em></button>').join("")+'</div></section>';
  bindActions($("#overview"));
}

function companyCard(c,i){
  const p=c.familyIds.map(fam).find(Boolean);
  return '<article class="company-card"><div><i>'+String(i+1).padStart(2,"0")+'</i><span class="heading-symbol">▥</span></div><h3>'+esc(c.company)+'</h3><dl><div><dt>业务规模</dt><dd>'+esc(c.scale)+'</dd></div><div><dt>用户与客户</dt><dd>'+esc(c.users)+'</dd></div><div><dt>产品闭环</dt><dd>'+esc(c.loop)+'</dd></div></dl>'+(p?'<button data-family="'+p.id+'"><span>WAIC展品</span><b>'+esc(p.representativeProject)+'</b></button>':'')+'<footer>'+c.sourceUrls.slice(0,2).map((u,j)=>'<a href="'+esc(u)+'" target="_blank">公司资料'+(c.sourceUrls.length>1?j+1:"")+'</a>').join("")+'</footer></article>';
}

function robotTasks(mode="all"){
  const tasks=mode==="humanoid"?DATA.embodied.humanoidTasks:DATA.embodied.tasks;
  return '<section id="robotTasks"><div class="section-title"><span>机器人任务</span><h2>机器人整机最常完成哪些任务</h2><p>外形和任务分开查看，可以区分人形、四足、轮式机器人分别在做什么工作。</p></div><div class="task-toggle"><button data-task-mode="all" class="'+(mode==="all"?'active':'')+'">全部机器人整机</button><button data-task-mode="humanoid" class="'+(mode==="humanoid"?'active':'')+'">人形机器人</button></div><div class="task-list">'+tasks.map((t,i)=>'<button data-task="'+esc(t.name)+'" data-mode="'+mode+'"><i>'+String(i+1).padStart(2,"0")+'</i><span><b>'+esc(t.name)+'</b><small>'+t.examples.slice(0,3).map(x=>esc(x.enterprise+' · '+x.project)).join('；')+'</small></span><strong>'+t.familyCount+'</strong><em>个</em></button>').join("")+'</div></section>';
}

function renderDrilldown(){
  const sector=DATA.sectors.find(x=>x.name===selectedSector)||DATA.sectors[0];
  if(!selectedL2||!sector.l2.some(x=>x.name===selectedL2))selectedL2=sector.l2[0]?.name||"";
  const l2=sector.l2.find(x=>x.name===selectedL2)||sector.l2[0];
  const topL3=sector.l2.flatMap(x=>x.l3).sort((a,b)=>b.familyCount-a.familyCount||b.projectCount-a.projectCount)[0];
  const examples=uniq((l2?.l3||[]).flatMap(x=>x.exampleFamilyIds)).slice(0,6).map(fam).filter(Boolean);
  const companies=sector.importantCompanyKeys.map(k=>DATA.importantCompanies.find(x=>x.key===k)).filter(Boolean);
  $("#drilldown").innerHTML=intro("行业拆解","从行业进入业务方向，再看到具体产品、任务和项目","选择任意一级行业，都可以查看二级业务、具体产品、项目进展、代表性展品和典型公司。机器人整机还可以按实际任务继续拆分。")+
  '<section class="sector-picker">'+DATA.sectors.map(x=>'<button data-sector="'+esc(x.name)+'" class="'+(x.name===sector.name?'active':'')+'"><span>'+esc(x.name)+'</span><b>'+x.familyCount+'</b></button>').join("")+'</section>'+
  '<section class="sector-summary"><div><span>第'+sector.rank+'位 · 一级行业</span><h2>'+esc(sector.name)+'</h2><p>'+esc(sector.definition)+'</p></div><div><b>'+sector.familyCount+'</b><span>个产品系列</span><small>'+sector.enterpriseCount+'家公司 · '+sector.projectCount+'件展品</small></div></section>'+
  '<section class="plain-answer"><span>这个板块具体热在哪里</span><h2>'+esc(sector.l2[0]?.name||"")+'是最大的二级方向，有'+(sector.l2[0]?.familyCount||0)+'个产品系列；其中'+esc(topL3?.name||"")+'最多，有'+(topL3?.familyCount||0)+'个</h2><p>'+esc(topL3?.work||"")+'。主要面向'+esc(topL3?.audience||"")+'。</p></section><section>'+sankeyChart(sector)+'</section><section>'+progressChart(sector)+'</section>'+
  '<section><div class="section-title"><span>业务方向</span><h2>'+esc(sector.name)+'下面有哪些二级业务</h2></div><div class="l2-list">'+sector.l2.map(x=>'<button data-l2="'+esc(x.name)+'" class="'+(x.name===l2.name?'active':'')+'"><div><b>'+esc(x.name)+'</b><strong>'+x.familyCount+'</strong></div><p>'+esc(x.definition)+'</p><small>'+x.l3.length+'个具体产品方向</small></button>').join("")+'</div></section>'+
  '<section><div class="section-title"><span>具体产品</span><h2>'+esc(l2.name)+'具体在做什么</h2><p>每一项都写明产品完成的工作、使用对象和项目介绍中的进展阶段。</p></div><div class="deep-list">'+l2.l3.map((x,i)=>'<button data-match="'+encodeURIComponent(JSON.stringify({l1:[x.l1],l2:[x.l2],l3:[x.name]}))+'" data-title="'+esc(x.name)+'" data-explanation="'+esc(x.work)+'"><i>'+String(i+1).padStart(2,"0")+'</i><div><b>'+esc(x.name)+'</b><p>'+esc(x.work)+'</p><small>使用对象：'+esc(x.audience)+'</small></div><aside><span>'+esc(x.evidenceStages[0]?.name||"产品说明")+'</span><small>'+(x.evidenceStages[0]?.count||x.familyCount)+'/'+x.familyCount+'个</small></aside><strong>'+x.familyCount+'</strong><em>查看项目</em></button>').join("")+'</div></section>'+
  (sector.name==="具身智能"&&l2.name==="机器人整机"?robotTasks("all"):"")+
  '<section class="split-section"><div><div class="section-title"><span>实际项目</span><h2>'+esc(l2.name)+'里的代表性展品</h2><p>点击展品，可以查看产品用途、使用对象和同一产品系列包含的原始项目。</p></div><div class="example-list">'+examples.map(x=>'<button data-family="'+x.id+'"><span>'+esc(x.l3)+'</span><h3>'+esc(x.representativeProject)+'</h3><p>'+esc(x.enterprise)+'</p><small>'+esc(x.evidenceStage)+' · '+(x.projectCount>1?x.projectCount+'件同类展品已合并':'1件WAIC展品')+'</small></button>').join("")+'</div></div><div><div class="section-title"><span>发展方向</span><h2>'+esc(sector.name)+'正在往哪里走</h2></div><div class="direction-list"><article><i>◎</i><div><h3>产品方向</h3><p>'+esc(sector.direction)+'</p></div></article><article><i>↗</i><div><h3>当前进展</h3><p>'+esc(sector.maturity)+'</p></div></article><article><i>◫</i><div><h3>数据含义</h3><p>'+esc(sector.caveat)+'</p></div></article></div></div></section>'+
  '<section><div class="section-title"><span>典型公司</span><h2>'+(companies.length?esc(sector.name)+'的典型公司':esc(sector.name)+'暂未展示典型公司')+'</h2><p>'+(companies.length?'这些公司已经形成较大的业务规模、用户或客户基础，并拥有可持续的产品与交付闭环。':'全部相关展品仍可在项目查询页查看。')+'</p></div>'+(companies.length?'<div class="company-grid">'+companies.map(companyCard).join("")+'</div>':'<div class="empty-note">当前板块的全部展品可在项目查询页查看。</div>')+'</section>';
  bindActions($("#drilldown"));
}

function renderProjects(){
  const root=$("#projects"), oldQ=$("#q")?.value||"", oldL1=$("#f1")?.value||"", oldL2=$("#f2")?.value||"", oldL3=$("#f3")?.value||"";
  const rows=projectRaw?DATA.projects:DATA.families;
  const l2s=uniq(rows.filter(x=>!oldL1||x.l1===oldL1).map(x=>x.l2)).sort(), l3s=uniq(rows.filter(x=>(!oldL1||x.l1===oldL1)&&(!oldL2||x.l2===oldL2)).map(x=>x.l3)).sort();
  const filtered=rows.filter(x=>{const name=x.name||x.representativeProject,text=(name+' '+x.enterprise+' '+x.description+' '+x.l1+' '+x.l2+' '+x.l3).toLowerCase();return(!oldQ||text.includes(oldQ.toLowerCase()))&&(!oldL1||x.l1===oldL1)&&(!oldL2||x.l2===oldL2)&&(!oldL3||x.l3===oldL3)});
  const size=30,pages=Math.max(1,Math.ceil(filtered.length/size));projectPage=Math.min(projectPage,pages);const pageRows=filtered.slice((projectPage-1)*size,projectPage*size);
  root.innerHTML=intro("项目查询",fmt(DATA.metadata.uniqueProjects)+"件展品全部可查，"+fmt(DATA.metadata.productFamilies)+"个产品系列用于比较趋势","可以搜索公司、产品和简介，也可以按一级、二级和具体产品方向筛选。产品系列视图可以继续打开其中每一件原始展品。")+
  '<section class="project-controls"><div class="view-switch raw-switch"><button data-raw="0" class="'+(!projectRaw?'active':'')+'">产品系列</button><button data-raw="1" class="'+(projectRaw?'active':'')+'">全部展品</button></div><label class="search"><span>搜索</span><input id="q" value="'+esc(oldQ)+'" placeholder="公司、产品或简介"></label><label><span>一级行业</span><select id="f1"><option value="">全部</option>'+DATA.sectors.map(x=>'<option '+(x.name===oldL1?'selected':'')+'>'+esc(x.name)+'</option>').join("")+'</select></label><label><span>二级方向</span><select id="f2"><option value="">全部</option>'+l2s.map(x=>'<option '+(x===oldL2?'selected':'')+'>'+esc(x)+'</option>').join("")+'</select></label><label><span>具体产品</span><select id="f3"><option value="">全部</option>'+l3s.map(x=>'<option '+(x===oldL3?'selected':'')+'>'+esc(x)+'</option>').join("")+'</select></label></section><p class="result-count">找到 <b>'+fmt(filtered.length)+'</b> '+(projectRaw?'件展品':'个产品系列')+'</p><section class="project-grid">'+pageRows.map(x=>{const f=x.representativeProject?x:fam(x.familyId),name=x.name||x.representativeProject;return '<article><div class="path-tags"><span>'+esc(x.l1)+'</span><span>'+esc(x.l2)+'</span><span>'+esc(x.l3)+'</span></div><h3>'+esc(name)+'</h3><b>'+esc(x.enterprise)+'</b><p>'+esc((x.description||"").slice(0,120))+(x.description?.length>120?'…':'')+'</p><small>'+(projectRaw?'展位 '+esc(x.booth||"未填写"):esc(x.evidenceStage)+' · '+x.projectCount+'件原始展品')+'</small><button data-family="'+f.id+'">查看完整信息</button></article>'}).join("")+'</section><div class="pagination"><button id="prev" '+(projectPage===1?'disabled':'')+'>上一页</button><span>'+projectPage+' / '+pages+'</span><button id="next" '+(projectPage===pages?'disabled':'')+'>下一页</button></div>';
  bindActions(root);
  $("#q").oninput=()=>{projectPage=1;renderProjects()};
  $("#f1").onchange=()=>{projectPage=1;$("#f2").value="";$("#f3").value="";renderProjects()};
  $("#f2").onchange=()=>{projectPage=1;$("#f3").value="";renderProjects()};
  $("#f3").onchange=()=>{projectPage=1;renderProjects()};
  $("#prev").onclick=()=>{projectPage--;renderProjects()};$("#next").onclick=()=>{projectPage++;renderProjects()};
}

function renderMethod(){
  $("#method").innerHTML=intro("数据说明","展品、产品系列和行业热度分别表示什么","这里给出页面中各类数字的含义，方便在行业比较和项目查询之间切换。")+'<section class="method-list"><article><span>◆</span><div><h2>'+fmt(DATA.metadata.uniqueProjects)+'件展品覆盖WAIC官方项目目录</h2><p>项目查询页保留名称、企业、展位、简介和行业分类，可以直接查看每一件原始展品。</p></div></article><article><span>▦</span><div><h2>'+fmt(DATA.metadata.productFamilies)+'个产品系列用于比较供给热度</h2><p>同一家公司在同一具体方向中的多个相关型号合并为一个产品系列，原始展品仍可逐件查看。</p></div></article><article><span>⑂</span><div><h2>'+DATA.metadata.level1Count+'个一级行业拆成'+DATA.metadata.level2Count+'个二级方向和'+DATA.metadata.level3Count+'个具体产品方向</h2><p>行业拆解页可以从大板块进入业务方向，再查看产品完成的工作、使用对象、项目进展和实际展品。</p></div></article><article><span>◫</span><div><h2>热度表示WAIC展品中的产品集中度</h2><p>行业排名使用产品系列数量，适合比较展会上哪些供给更集中，不等同于收入、出货量或市场份额。</p></div></article><article><span>↗</span><div><h2>进展阶段来自WAIC项目介绍</h2><p>规模应用、客户交付、试点验证、研发教学和产品发布，表示企业在项目简介中介绍到的当前进展。</p></div></article></section>';
}

function bindActions(root=document){
  root.querySelectorAll('[data-family]').forEach(b=>b.onclick=()=>showFamily(b.dataset.family));
  root.querySelectorAll('[data-match]').forEach(b=>b.onclick=()=>showMatch(b.dataset.title,b.dataset.explanation,JSON.parse(decodeURIComponent(b.dataset.match))));
  root.querySelectorAll('[data-sector]').forEach(b=>b.onclick=()=>{selectedSector=b.dataset.sector;selectedL2="";showPage("drilldown")});
  root.querySelectorAll('[data-l2]').forEach(b=>b.onclick=()=>{selectedL2=b.dataset.l2;renderDrilldown()});
  root.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>showTask(b.dataset.task,b.dataset.mode));
  root.querySelectorAll('[data-task-mode]').forEach(b=>b.onclick=()=>{const holder=$("#robotTasks");holder.outerHTML=robotTasks(b.dataset.taskMode);bindActions($("#drilldown"))});
  root.querySelectorAll('[data-raw]').forEach(b=>b.onclick=()=>{projectRaw=b.dataset.raw==="1";projectPage=1;renderProjects()});
}

function showPage(id){
  all('.static-page').forEach(x=>x.classList.toggle('active',x.id===id));
  all('.side nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));
  if(id==='drilldown')renderDrilldown();if(id==='projects')renderProjects();
  window.scrollTo(0,0);
}
all('.side nav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
renderOverview();renderDrilldown();renderProjects();renderMethod();
</script>
</body>
</html>`;

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, html, "utf8");
console.log(output);
