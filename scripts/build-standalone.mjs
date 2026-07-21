import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");
const data = JSON.parse(await fs.readFile(path.join(projectRoot, "public/data/waic-dashboard.json"), "utf8"));
const css = (await fs.readFile(path.join(projectRoot, "app/globals.css"), "utf8")).replace('@import "tailwindcss";', "");
const output = path.join(workspaceRoot, "outputs/019f8290-6d5c-70f1-b237-6bb4e0e451e5/WAIC_2026_具体趋势拆解_可交互版.html");

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
  @media(max-width:850px){.side{transform:none;position:relative;width:100%;height:auto;padding:22px}.side nav{grid-template-columns:repeat(4,minmax(0,1fr));padding:18px 0 0}.side-note{display:none}.content-shell{margin-left:0;padding-top:30px}.mobile-menu{display:none}.site-brand{padding-bottom:16px}}
  @media(max-width:620px){.side nav{grid-template-columns:repeat(2,minmax(0,1fr))}}
  </style>
</head>
<body>
<div class="site-shell">
  <aside class="side">
    <div class="site-brand"><small>WAIC 2026</small><b>AI项目全量拆解</b><span>行业、产品、任务、项目和公司</span></div>
    <nav>
      <button class="active" data-page="overview"><i>01</i><span><b>全量判断</b><small>先比较全部20个行业</small></span></button>
      <button data-page="drilldown"><i>02</i><span><b>逐层拆解</b><small>每个行业用同一套字段</small></span></button>
      <button data-page="projects"><i>03</i><span><b>全部项目</b><small>搜索、筛选和查看原文</small></span></button>
      <button data-page="method"><i>04</i><span><b>统计说明</b><small>去重、热度和公司标准</small></span></button>
    </nav>
    <div class="side-note"><span>完整数据范围</span><b>1,432个WAIC项目</b><small>全部保留。页面把同一家公司在同一三级方向下的重复展品合并成962组产品。</small></div>
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
  openDrawer('<span class="drawer-label">产品组</span><h2>'+esc(f.representativeProject)+'</h2><p class="drawer-intro">'+esc(f.enterprise)+'</p><div class="path-tags drawer-path"><span>'+esc(f.l1)+'</span><span>'+esc(f.l2)+'</span><span>'+esc(f.l3)+'</span></div><div class="fact-grid"><article><span>具体做什么</span><p>'+esc(f.work)+'</p></article><article><span>谁会使用</span><p>'+esc(f.audience)+'</p></article><article><span>WAIC落地线索</span><p>'+esc(f.evidenceStage)+'</p><small>'+esc(f.evidenceStageBasis)+'</small></article>'+(f.task?'<article><span>机器人任务</span><p>'+esc(f.task)+'</p><small>'+esc(f.taskDirection)+'</small></article>':'')+'</div><div class="drawer-section"><h3>项目介绍</h3><p>'+esc(f.description||"WAIC目录没有填写项目简介")+'</p></div><div class="drawer-section"><h3>合并前的原始展品</h3><div class="raw-projects">'+ps.map(p=>'<article><div><b>'+esc(p.name)+'</b><span>'+esc(p.booth||"展位未填写")+'</span></div><p>'+esc(p.description||"没有填写简介")+'</p><small>分类依据：'+esc(p.basis)+'</small></article>').join("")+'</div></div>');
}

function showMatch(title,explanation,m){
  const rows=DATA.families.filter(x=>match(x,m));
  openDrawer('<span class="drawer-label">具体方向</span><h2>'+esc(title)+'</h2><p class="drawer-intro">'+esc(explanation)+'</p><div class="drawer-number"><b>'+rows.length+'</b><span>组合并产品 · '+rows.reduce((s,x)=>s+x.projectCount,0)+'条原始展品</span></div><div class="drawer-section"><h3>全部相关产品组</h3><div class="family-buttons">'+rows.map(x=>'<button data-family="'+x.id+'"><span><b>'+esc(x.representativeProject)+'</b><small>'+esc(x.enterprise)+' · '+esc(x.evidenceStage)+'</small></span><strong>'+x.projectCount+'条</strong></button>').join("")+'</div></div>');
}

function showTask(name,mode){
  const list=mode==="humanoid"?DATA.embodied.humanoidTasks:DATA.embodied.tasks, t=list.find(x=>x.name===name), rows=t.familyIds.map(fam).filter(Boolean);
  openDrawer('<span class="drawer-label">机器人任务</span><h2>'+esc(t.name)+'</h2><p class="drawer-intro">'+esc(t.direction)+'</p><div class="drawer-number"><b>'+t.familyCount+'</b><span>组机器人整机 · '+t.projectCount+'条原始展品</span></div><div class="drawer-section"><h3>完成这个任务的项目</h3><div class="family-buttons">'+rows.map(x=>'<button data-family="'+x.id+'"><span><b>'+esc(x.representativeProject)+'</b><small>'+esc(x.enterprise)+' · '+esc(x.l3)+'</small></span><strong>'+x.projectCount+'条</strong></button>').join("")+'</div></div>');
}

function renderOverview(){
  const core=DATA.sectors.find(x=>x.name==="核心技术"), embodied=DATA.sectors.find(x=>x.name==="具身智能"), human=DATA.globalL3.find(x=>x.name==="人形机器人");
  const topL2=DATA.sectors.flatMap(x=>x.l2).sort((a,b)=>b.familyCount-a.familyCount||b.projectCount-a.projectCount).slice(0,8), topL3=DATA.globalL3.slice(0,15);
  $("#overview").innerHTML=intro("先做全量比较","WAIC最集中的项目是AI底座和机器人，具体热点要继续看到三级方向","本页先比较全部20个一级行业、89个二级方向和191个三级方向。用户举出的例子只作为待核验问题，最终排序全部来自同一套合并口径。")+
  '<section class="metric-strip"><article><span>官方项目</span><b>'+fmt(DATA.metadata.uniqueProjects)+'</b><small>一条未少</small></article><article><span>合并后产品组</span><b>'+fmt(DATA.metadata.productFamilies)+'</b><small>用于比较热度</small></article><article><span>三级方向</span><b>'+DATA.metadata.level3Count+'</b><small>继续下钻的最细层</small></article><article><span>参展企业</span><b>'+DATA.metadata.enterprises+'</b><small>标准化名称后</small></article></section>'+
  '<section class="answer-grid"><article class="primary-answer"><span>全量结论</span><h2>核心技术有'+core.familyCount+'组，具身智能有'+embodied.familyCount+'组，两者合计占全部产品组的'+pct((core.familyCount+embodied.familyCount)/DATA.metadata.productFamilies)+'</h2><p>WAIC展台的项目供给集中在算力、模型、企业软件、机器人整机和机器人部件。这个比例描述展会项目结构，不代表市场收入份额。</p></article><article><span>人形机器人位置</span><h3>22组，排在191个三级方向的第'+human.rank+'位</h3><p>通用具身机器人70组、AI芯片38组、大语言模型29组、机器人关节26组，数量都更高。</p></article><article><span>软件侧集中点</span><h3>企业软件77组，大模型与算法69组</h3><p>办公协同、内容创作、客服营销和软件开发已经形成一批明确产品。</p></article></section>'+
  '<section><div class="section-title"><span>一级行业</span><h2>全部20个板块按同一口径排名</h2><p>点击任意一行，会进入该行业的二级、三级、实际项目、使用对象和落地线索。</p></div><div class="rank-list sector-rank-list">'+DATA.sectors.map(s=>'<button data-sector="'+esc(s.name)+'"><i>'+String(s.rank).padStart(2,"0")+'</i><span><b>'+esc(s.name)+'</b><small>'+esc(s.l2[0]?.name||"")+'是其中最大的二级方向</small></span><div class="rank-bar"><u style="width:'+Math.max(2,s.familyCount/core.familyCount*100)+'%"></u></div><strong>'+s.familyCount+'</strong><em>组</em></button>').join("")+'</div></section>'+
  '<section class="split-section"><div><div class="section-title"><span>二级方向</span><h2>项目最多的八个业务板块</h2></div><div class="compact-rank">'+topL2.map((x,i)=>'<button data-match="'+encodeURIComponent(JSON.stringify({l1:[x.l1],l2:[x.name]}))+'" data-title="'+esc(x.name)+'" data-explanation="'+esc(x.definition)+'"><i>'+(i+1)+'</i><span><b>'+esc(x.name)+'</b><small>'+esc(x.l1)+'</small></span><strong>'+x.familyCount+'</strong></button>').join("")+'</div></div><div><div class="section-title"><span>整体方向</span><h2>展品正在沿三条路径形成产品</h2></div><div class="direction-list"><article><i>1</i><div><h3>算力从单个芯片扩展到整套系统</h3><p>芯片38组，服务器24组，互联23组，液冷21组，智算集群19组，供应链各环节都有集中项目。</p></div></article><article><i>2</i><div><h3>机器人同步补整机、关节、感知和操作</h3><p>通用具身整机70组，关节26组，传感器20组，灵巧手16组。人形机器人是整机形态中的一个三级方向。</p></div></article><article><i>3</i><div><h3>企业软件开始承接固定工作</h3><p>办公协同17组、内容创作19组、客服营销12组、软件开发10组，产品逐渐连接企业已有数据和流程。</p></div></article></div></div></section>'+
  '<section><div class="section-title"><span>三级方向</span><h2>191个具体方向中，前15名是什么</h2><p>每一行都可以打开实际项目。排序看合并后的产品组数量。</p></div><div class="rank-list l3-global-list">'+topL3.map(x=>'<button data-match="'+encodeURIComponent(JSON.stringify({l1:[x.l1],l2:[x.l2],l3:[x.name]}))+'" data-title="'+esc(x.name)+'" data-explanation="'+esc(x.work)+'"><i>'+String(x.rank).padStart(2,"0")+'</i><span><b>'+esc(x.name)+'</b><small>'+esc(x.work)+'</small></span><u>'+esc(x.l1)+'</u><strong>'+x.familyCount+'</strong><em>查看项目</em></button>').join("")+'</div></section>';
  bindActions($("#overview"));
}

function companyCard(c,i){
  const p=c.familyIds.map(fam).find(Boolean);
  return '<article class="company-card"><div><i>'+String(i+1).padStart(2,"0")+'</i><span>证据评分 '+c.totalScore+'/6</span></div><h3>'+esc(c.company)+'</h3><dl><div><dt>公司体量</dt><dd>'+esc(c.scale)+'</dd></div><div><dt>用户或客户</dt><dd>'+esc(c.users)+'</dd></div><div><dt>业务闭环</dt><dd>'+esc(c.loop)+'</dd></div></dl>'+(p?'<button data-family="'+p.id+'"><span>WAIC项目</span><b>'+esc(p.representativeProject)+'</b></button>':'')+'<footer>'+c.sourceUrls.slice(0,2).map((u,j)=>'<a href="'+esc(u)+'" target="_blank">公司依据'+(c.sourceUrls.length>1?j+1:"")+'</a>').join("")+'</footer></article>';
}

function robotTasks(mode="all"){
  const tasks=mode==="humanoid"?DATA.embodied.humanoidTasks:DATA.embodied.tasks;
  return '<section id="robotTasks"><div class="section-title"><span>整机再按任务拆</span><h2>机器人长什么样和它做什么工作分开统计</h2><p>这一步只用于机器人整机。部件、软件和模型不会被算成已经完成任务的机器人。</p></div><div class="task-toggle"><button data-task-mode="all" class="'+(mode==="all"?'active':'')+'">全部机器人整机</button><button data-task-mode="humanoid" class="'+(mode==="humanoid"?'active':'')+'">只看人形机器人</button></div><div class="task-list">'+tasks.map((t,i)=>'<button data-task="'+esc(t.name)+'" data-mode="'+mode+'"><i>'+String(i+1).padStart(2,"0")+'</i><span><b>'+esc(t.name)+'</b><small>'+t.examples.slice(0,3).map(x=>esc(x.enterprise+' · '+x.project)).join('；')+'</small></span><strong>'+t.familyCount+'</strong><em>组</em></button>').join("")+'</div></section>';
}

function renderDrilldown(){
  const sector=DATA.sectors.find(x=>x.name===selectedSector)||DATA.sectors[0];
  if(!selectedL2||!sector.l2.some(x=>x.name===selectedL2))selectedL2=sector.l2[0]?.name||"";
  const l2=sector.l2.find(x=>x.name===selectedL2)||sector.l2[0];
  const topL3=sector.l2.flatMap(x=>x.l3).sort((a,b)=>b.familyCount-a.familyCount||b.projectCount-a.projectCount)[0];
  const examples=uniq((l2?.l3||[]).flatMap(x=>x.exampleFamilyIds)).slice(0,6).map(fam).filter(Boolean);
  const companies=sector.importantCompanyKeys.map(k=>DATA.importantCompanies.find(x=>x.key===k)).filter(Boolean);
  $("#drilldown").innerHTML=intro("所有行业使用同一套拆法","先看大板块，再看具体产品、工作、使用对象和实际项目","选择任何一级行业，页面都会继续拆到二级和三级。机器人整机额外按任务重算，因为人形、四足、轮式只说明外形，无法说明它实际完成什么工作。")+
  '<section class="sector-picker">'+DATA.sectors.map(x=>'<button data-sector="'+esc(x.name)+'" class="'+(x.name===sector.name?'active':'')+'"><span>'+esc(x.name)+'</span><b>'+x.familyCount+'</b></button>').join("")+'</section>'+
  '<section class="sector-summary"><div><span>第'+sector.rank+'位 · 一级行业</span><h2>'+esc(sector.name)+'</h2><p>'+esc(sector.definition)+'</p></div><div><b>'+sector.familyCount+'</b><span>组不同产品</span><small>'+sector.enterpriseCount+'家公司 · '+sector.projectCount+'条原始项目</small></div></section>'+
  '<section class="plain-answer"><span>这个板块具体热在哪里</span><h2>'+esc(sector.l2[0]?.name||"")+'是最大的二级方向，有'+(sector.l2[0]?.familyCount||0)+'组；继续下钻后，'+esc(topL3?.name||"")+'最多，有'+(topL3?.familyCount||0)+'组</h2><p>'+esc(topL3?.work||"")+'。主要面向'+esc(topL3?.audience||"")+'。</p></section>'+
  '<section><div class="section-title"><span>第一层下钻</span><h2>'+esc(sector.name)+'下面有哪些二级业务</h2></div><div class="l2-list">'+sector.l2.map(x=>'<button data-l2="'+esc(x.name)+'" class="'+(x.name===l2.name?'active':'')+'"><div><b>'+esc(x.name)+'</b><strong>'+x.familyCount+'</strong></div><p>'+esc(x.definition)+'</p><small>'+x.l3.length+'个三级方向</small></button>').join("")+'</div></section>'+
  '<section><div class="section-title"><span>第二层下钻</span><h2>'+esc(l2.name)+'具体在做什么</h2><p>落地线索只读取WAIC项目自述中的量产、交付、试点、研发等关键词，不替代外部尽调。</p></div><div class="deep-list">'+l2.l3.map((x,i)=>'<button data-match="'+encodeURIComponent(JSON.stringify({l1:[x.l1],l2:[x.l2],l3:[x.name]}))+'" data-title="'+esc(x.name)+'" data-explanation="'+esc(x.work)+'"><i>'+String(i+1).padStart(2,"0")+'</i><div><b>'+esc(x.name)+'</b><p>'+esc(x.work)+'</p><small>使用对象：'+esc(x.audience)+'</small></div><aside><span>'+esc(x.evidenceStages[0]?.name||"产品说明")+'</span><small>'+(x.evidenceStages[0]?.count||x.familyCount)+'/'+x.familyCount+'组</small></aside><strong>'+x.familyCount+'</strong><em>查看项目</em></button>').join("")+'</div></section>'+
  (sector.name==="具身智能"&&l2.name==="机器人整机"?robotTasks("all"):"")+
  '<section class="split-section"><div><div class="section-title"><span>实际项目</span><h2>'+esc(l2.name)+'里的代表性展品</h2><p>优先显示有重要公司依据、合并项目较多或说明较完整的产品，点击后可看原始项目。</p></div><div class="example-list">'+examples.map(x=>'<button data-family="'+x.id+'"><span>'+esc(x.l3)+'</span><h3>'+esc(x.representativeProject)+'</h3><p>'+esc(x.enterprise)+'</p><small>'+esc(x.evidenceStage)+' · '+(x.projectCount>1?x.projectCount+'条同类展品已合并':'1条WAIC展品')+'</small></button>').join("")+'</div></div><div><div class="section-title"><span>发展方向</span><h2>'+esc(sector.name)+'正在往哪里走</h2></div><div class="direction-list"><article><i>1</i><div><h3>产品方向</h3><p>'+esc(sector.direction)+'</p></div></article><article><i>2</i><div><h3>当前落地状态</h3><p>'+esc(sector.maturity)+'</p></div></article><article><i>3</i><div><h3>阅读边界</h3><p>'+esc(sector.caveat)+'</p></div></article></div></div></section>'+
  '<section><div class="section-title"><span>代表公司</span><h2>'+(companies.length?esc(sector.name)+'只列证据排名靠前的'+companies.length+'家公司':esc(sector.name)+'暂未选代表公司')+'</h2><p>入选依据是公司体量、用户或客户规模、已经形成的交付闭环。WAIC展品数量不参与公司重要性评分。</p></div>'+(companies.length?'<div class="company-grid">'+companies.map(companyCard).join("")+'</div>':'<div class="empty-note">现有公开证据不足，页面保留全部项目，不随机挑选公司填满版面。</div>')+'</section>';
  bindActions($("#drilldown"));
}

function renderProjects(){
  const root=$("#projects"), oldQ=$("#q")?.value||"", oldL1=$("#f1")?.value||"", oldL2=$("#f2")?.value||"", oldL3=$("#f3")?.value||"";
  const rows=projectRaw?DATA.projects:DATA.families;
  const l2s=uniq(rows.filter(x=>!oldL1||x.l1===oldL1).map(x=>x.l2)).sort(), l3s=uniq(rows.filter(x=>(!oldL1||x.l1===oldL1)&&(!oldL2||x.l2===oldL2)).map(x=>x.l3)).sort();
  const filtered=rows.filter(x=>{const name=x.name||x.representativeProject,text=(name+' '+x.enterprise+' '+x.description+' '+x.l1+' '+x.l2+' '+x.l3).toLowerCase();return(!oldQ||text.includes(oldQ.toLowerCase()))&&(!oldL1||x.l1===oldL1)&&(!oldL2||x.l2===oldL2)&&(!oldL3||x.l3===oldL3)});
  const size=30,pages=Math.max(1,Math.ceil(filtered.length/size));projectPage=Math.min(projectPage,pages);const pageRows=filtered.slice((projectPage-1)*size,projectPage*size);
  root.innerHTML=intro("完整项目库","1432条原始项目全部可查，962组合并产品用于看趋势","可以搜索公司、产品和简介，也可以按一级、二级、三级行业筛选。合并视图保留原始项目，点开产品组就能看到里面每一条展品。")+
  '<section class="project-controls"><div class="view-switch raw-switch"><button data-raw="0" class="'+(!projectRaw?'active':'')+'">合并产品组</button><button data-raw="1" class="'+(projectRaw?'active':'')+'">原始1432条</button></div><label class="search"><span>搜索</span><input id="q" value="'+esc(oldQ)+'" placeholder="公司、产品或简介"></label><label><span>一级行业</span><select id="f1"><option value="">全部</option>'+DATA.sectors.map(x=>'<option '+(x.name===oldL1?'selected':'')+'>'+esc(x.name)+'</option>').join("")+'</select></label><label><span>二级方向</span><select id="f2"><option value="">全部</option>'+l2s.map(x=>'<option '+(x===oldL2?'selected':'')+'>'+esc(x)+'</option>').join("")+'</select></label><label><span>三级方向</span><select id="f3"><option value="">全部</option>'+l3s.map(x=>'<option '+(x===oldL3?'selected':'')+'>'+esc(x)+'</option>').join("")+'</select></label></section><p class="result-count">找到 <b>'+fmt(filtered.length)+'</b> '+(projectRaw?'条原始项目':'组产品')+'</p><section class="project-grid">'+pageRows.map(x=>{const f=x.representativeProject?x:fam(x.familyId),name=x.name||x.representativeProject;return '<article><div class="path-tags"><span>'+esc(x.l1)+'</span><span>'+esc(x.l2)+'</span><span>'+esc(x.l3)+'</span></div><h3>'+esc(name)+'</h3><b>'+esc(x.enterprise)+'</b><p>'+esc((x.description||"").slice(0,120))+(x.description?.length>120?'…':'')+'</p><small>'+(projectRaw?'展位 '+esc(x.booth||"未填写"):esc(x.evidenceStage)+' · '+x.projectCount+'条原始展品')+'</small><button data-family="'+f.id+'">查看完整信息</button></article>'}).join("")+'</section><div class="pagination"><button id="prev" '+(projectPage===1?'disabled':'')+'>上一页</button><span>'+projectPage+' / '+pages+'</span><button id="next" '+(projectPage===pages?'disabled':'')+'>下一页</button></div>';
  bindActions(root);
  $("#q").oninput=()=>{projectPage=1;renderProjects()};
  $("#f1").onchange=()=>{projectPage=1;$("#f2").value="";$("#f3").value="";renderProjects()};
  $("#f2").onchange=()=>{projectPage=1;$("#f3").value="";renderProjects()};
  $("#f3").onchange=()=>{projectPage=1;renderProjects()};
  $("#prev").onclick=()=>{projectPage--;renderProjects()};$("#next").onclick=()=>{projectPage++;renderProjects()};
}

function renderMethod(){
  $("#method").innerHTML=intro("统计说明","每个结论都能回到同一套数据和规则","本页解释完整性、去重、行业拆解、落地线索和代表公司怎么处理。")+'<section class="method-list"><article><span>01</span><div><h2>项目范围包含官方目录中的全部'+fmt(DATA.metadata.uniqueProjects)+'条项目</h2><p>原始项目全部留在查询页，并保留项目名称、企业、展位、简介和官方行业标签。</p></div></article><article><span>02</span><div><h2>重复展品只在趋势统计时合并</h2><p>'+esc(DATA.metadata.aggregationRule)+'。这样可以避免同一家公司用多个型号把某个方向的热度抬高。</p></div></article><article><span>03</span><div><h2>20个一级行业都继续拆到二级、三级和实际项目</h2><p>所有行业共用“是什么、做什么工作、谁使用、项目有哪些、WAIC材料出现什么落地词”的字段。用户举例不改变排名。</p></div></article><article><span>04</span><div><h2>热度表示WAIC展品集中度</h2><p>一级、二级、三级排名都使用合并后的产品组数量。它适合回答展会上哪类供给最集中，无法直接替代收入、出货量、市场份额和融资规模。</p></div></article><article><span>05</span><div><h2>落地线索只读取项目自述</h2><p>页面把量产、交付、试点、科研等词分组显示，帮助区分项目介绍写到了哪一步。这些内容没有被当成外部核验后的成熟度结论。</p></div></article><article><span>06</span><div><h2>代表公司最多保留三家</h2><p>公司体量、用户或客户规模、销售或部署闭环各按0至2分评分。只有证据较完整的公司才展示；样本或证据不足的板块保持空缺。</p></div></article></section>';
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
