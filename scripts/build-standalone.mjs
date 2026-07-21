import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");
const data = JSON.parse(await fs.readFile(path.join(projectRoot, "public/data/waic-dashboard.json"), "utf8"));
const output = path.join(workspaceRoot, "outputs/019f8290-6d5c-70f1-b237-6bb4e0e451e5/WAIC_2026_具体趋势拆解_可交互版.html");

const themes = [
  {
    id: "core", name: "AI底座与软件", scope: ["核心技术"],
    title: "算力硬件占核心技术的31%，芯片、服务器、互联和数据中心都出现了二十组以上产品",
    text: "企业软件有77组，高于模型与算法的69组。内容创作、办公智能体和客服营销是应用端最集中的工作",
    signals: [
      ["AI芯片与加速卡", "AI芯片与加速卡", "训练和推理芯片、加速卡及板卡"],
      ["服务器与算力一体机", "服务器与算力一体机", "可直接部署的AI服务器和算力设备"],
      ["存储与高速互联", "存储与高速互联", "解决多卡和多机之间的数据传输"],
      ["数据中心与液冷", "数据中心与液冷", "解决高密度算力的供电和散热"],
      ["办公与协同智能体", "办公与协同智能体", "进入会议、文档和企业协作流程"],
    ],
    companies: ["华为", "阿里巴巴", "昆仑芯"],
    directions: ["芯片、服务器、网络和集群管理继续被组合成超节点和算力一体机", "企业应用继续进入内容制作、办公协同、客服营销和软件开发"],
  },
  {
    id: "embodied", name: "具身智能", scope: ["具身智能"],
    title: "关节有26组，数量高于22组人形机器人；人形整机中最多的仍是动作、科研和展示项目",
    text: "固定生产任务中工厂装配数量最多。部件公司集中解决稳定动作、环境感知和精细抓取",
    signals: [
      ["通用具身机器人", "通用具身机器人", "轮式双臂、移动操作平台和多用途机器人"],
      ["关节与传动", "关节与传动部件", "决定负载、精度、速度和寿命"],
      ["人形机器人", "人形机器人", "8组用于动作科研展示，4组用于工厂装配"],
      ["传感器", "传感器与感知器件", "提供视觉、触觉、力觉和位置数据"],
      ["灵巧手与夹爪", "灵巧手与夹爪", "完成抓取、拧动、按压和精细操作"],
    ],
    companies: ["宇树科技", "节卡机器人", "擎朗智能"],
    directions: ["工厂装配、商用接待、仓储搬运和消防巡检已经出现具体任务", "关节、传感器和灵巧手合计62组，手眼协调仍是企业集中补齐的能力"],
  },
  {
    id: "terminal", name: "智能终端", scope: ["智能终端"],
    title: "AI眼镜、显示交互设备和AI电脑手机各有8到9组，三种终端形态数量接近",
    text: "眼镜强调翻译、记录和拍摄，电脑手机强调本地运行，健康穿戴强调持续监测",
    signals: [
      ["AI眼镜与AR终端", "AI眼镜与AR终端", "翻译、记录、拍摄和视觉提示"],
      ["显示影音与交互设备", "显示影音与交互设备", "显示器、影音设备和空间交互硬件"],
      ["AI电脑平板与手机", "AI电脑平板与手机", "本地模型、多设备协同和个人助手"],
      ["健康与运动穿戴", "健康与运动穿戴", "持续采集健康和运动数据"],
      ["AI玩具与陪伴设备", "AI玩具与陪伴设备", "服务儿童、家庭和情感互动"],
    ],
    companies: ["荣耀", "科大讯飞", "中科创达"],
    directions: ["手机、电脑和眼镜继续增加设备端模型和本地数据处理", "AI眼镜先解决翻译、提词、记录和拍摄等高频小任务"],
  },
  {
    id: "industry", name: "工业制造", scope: ["工业互联与智能制造", "制造业"],
    title: "工业项目先解决连接、控制和检测，直接做排产与工艺优化的项目数量很少",
    text: "工业计算与网络有16组，自动化装备13组，电子器件与硬件12组。生产智能化的9组项目中有6组是机器视觉和质量检测",
    signals: [
      ["工业计算与网络", "服务器工作站与扩展硬件", "工业服务器、接口设备、边缘计算和网络硬件"],
      ["机器人无人机与清洁设备", "机器人无人机与清洁设备", "执行工厂和园区里的移动或操作任务"],
      ["电子器件与计算硬件", "电子器件与计算硬件", "生产设备和计算系统需要的基础硬件"],
      ["工业视觉与质量检测", "工业视觉与质量检测", "生产智能化中数量最多的具体任务"],
      ["排产工艺与生产优化", "排产工艺与生产优化", "直接改动生产计划和工艺参数"],
    ],
    companies: ["西门子", "海克斯康", "宝信软件"],
    directions: ["缺陷检测和质量判断有清楚的输入、输出和人工复核方式", "排产和工艺优化需要继续连接MES、PLC和设备实时数据"],
  },
  {
    id: "medical", name: "医疗健康", scope: ["智慧医疗"],
    title: "病理检验和早筛有7组，临床决策有5组，医学影像辅助诊断只有2组",
    text: "医疗项目的集中点已经扩到检验、早筛和医生决策。健康监测有9组，康复养老有7组",
    signals: [
      ["检验病理与早筛", "检验病理与早筛", "处理检验数据、病理信息和疾病早期筛查"],
      ["临床决策与医生智能体", "临床决策与医生智能体", "整理病历、查资料和制定诊疗建议"],
      ["慢病监测与生命体征", "慢病监测与生命体征", "持续记录心电、血压和其他健康数据"],
      ["康复训练与康复机器人", "康复训练与康复机器人", "完成训练、动作辅助和恢复评估"],
      ["医学影像辅助诊断", "医学影像辅助诊断", "数量少于病理早筛和医生智能体"],
    ],
    companies: ["联影智能", "蚂蚁集团"],
    directions: ["医生智能体继续连接病历、影像和医学知识，并保留医生确认记录", "慢病监测、健康咨询和康复设备继续连接医院外的长期服务"],
  },
];

const safeData = JSON.stringify(data).replaceAll("<", "\\u003c");
const safeThemes = JSON.stringify(themes).replaceAll("<", "\\u003c");

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WAIC 2026 具体趋势拆解</title>
<style>
:root{--n:#071b32;--i:#132943;--m:#68798b;--p:#f4f6f5;--w:#fff;--l:#dce3e5;--t:#009b90;--tl:#ddf2ef}*{box-sizing:border-box}body{margin:0;background:var(--p);color:var(--i);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}button,input,select{font:inherit}button{color:inherit}.side{position:fixed;inset:0 auto 0 0;width:238px;padding:28px 20px;background:var(--n);color:#fff}.brand{padding:6px 7px 24px;border-bottom:1px solid #ffffff20}.brand small,.kick{color:var(--t);font-size:10px;font-weight:800;letter-spacing:.12em}.brand b{display:block;margin-top:7px;font-size:21px}.brand span{display:block;margin-top:4px;color:#97a9bc;font-size:10px}.side nav{display:grid;gap:7px;padding:24px 0}.side nav button{padding:12px;border:0;border-radius:6px;background:transparent;color:#c2cedb;text-align:left;cursor:pointer}.side nav button.active,.side nav button:hover{background:#009b9028;color:#fff}.side nav small{display:block;margin-top:3px;color:#8296aa;font-size:9px}.main{margin-left:238px;padding:45px clamp(22px,4vw,65px);max-width:1500px}.page{display:none}.page.active{display:block}.intro{max-width:1000px;padding-bottom:30px;border-bottom:1px solid var(--l)}h1{margin:12px 0;font-size:clamp(34px,4.4vw,57px);line-height:1.1;letter-spacing:-.045em}.intro p,.answer p,.sectorHero p{max-width:820px;margin:0;color:var(--m);font-size:13px;line-height:1.8}.tabs{display:flex;gap:7px;margin:36px 0 15px;overflow:auto}.tabs button,.toggle button{flex:0 0 auto;padding:9px 13px;border:1px solid #cbd5da;border-radius:6px;background:#fff;color:var(--m);font-size:10px;font-weight:750;cursor:pointer}.tabs button.active,.toggle button.active{border-color:var(--n);background:var(--n);color:#fff}.answer,.sectorHero{display:grid;grid-template-columns:1fr 160px;gap:25px;padding:28px;border-radius:9px;background:var(--n);color:#fff}.answer h2,.sectorHero h2{margin:9px 0 12px;font-size:clamp(25px,3vw,39px);line-height:1.28}.answer p,.sectorHero p{color:#b2c1d0}.total{display:grid;align-content:center;justify-items:center;border-left:1px solid #ffffff25}.total b{font-size:50px}.total span{color:#aebed0;font-size:10px}section.block{margin-top:38px}.blockHead{margin-bottom:14px}.blockHead h2{margin:7px 0;font-size:26px}.blockHead p{margin:0;color:var(--m);font-size:11px}.signals,.tasks,.l3s{border:1px solid var(--l);border-radius:8px;background:#fff}.signals button,.tasks button,.l3s button{display:grid;grid-template-columns:1fr 50px 70px;gap:12px;align-items:center;width:100%;padding:15px 17px;border:0;border-bottom:1px solid #edf0f1;background:transparent;text-align:left;cursor:pointer}.signals button:last-child,.tasks button:last-child,.l3s button:last-child{border-bottom:0}.signals button:hover,.tasks button:hover,.l3s button:hover{background:#f5faf9}.signals span,.tasks span,.l3s span{display:grid;gap:4px}.signals small,.tasks small,.l3s small{color:var(--m);font-size:10px;line-height:1.5}.signals strong,.tasks strong,.l3s strong{font-size:22px;text-align:right}.signals em,.l3s em{color:#007970;font-size:9px;font-style:normal;text-align:right}.two{display:grid;grid-template-columns:1fr 1fr;gap:24px}.directions{display:grid;gap:9px}.directions article{padding:17px;border:1px solid var(--l);border-radius:7px;background:#fff}.directions h3{margin:0 0 8px;font-size:15px}.directions p{margin:0;color:var(--m);font-size:10px;line-height:1.7}.companies{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.company{padding:18px;border:1px solid var(--l);border-radius:8px;background:#fff}.company>span{color:var(--t);font-size:9px;font-weight:800}.company h3{margin:20px 0 14px;font-size:19px}.company dl{display:grid;gap:10px;margin:0}.company dl div{display:grid;grid-template-columns:62px 1fr;gap:7px}.company dt{font-size:9px;font-weight:800}.company dd{margin:0;color:var(--m);font-size:9px;line-height:1.55}.company button{width:100%;margin-top:15px;padding:10px;border:0;border-radius:5px;background:#eef4f4;color:#007970;font-size:9px;font-weight:800;text-align:left;cursor:pointer}.taskCall{margin:32px 0 0;padding:22px;border-left:5px solid var(--t);background:#fff}.taskCall h2{margin:8px 0;font-size:27px}.taskCall p{margin:0;color:var(--m);font-size:11px;line-height:1.7}.toggle{display:flex;gap:6px;margin-bottom:10px}.sectorBtns{display:flex;gap:6px;margin:34px 0 12px;overflow:auto}.sectorBtns button{flex:0 0 auto;padding:9px 11px;border:1px solid #cbd5da;border-radius:5px;background:#fff;font-size:9px;cursor:pointer}.sectorBtns button.active{border-color:var(--t);background:var(--tl);color:#006e66}.l2s{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.l2s button{min-height:130px;padding:14px;border:1px solid var(--l);border-radius:7px;background:#fff;text-align:left;cursor:pointer}.l2s button.active{border-color:var(--t)}.l2s div{display:flex;justify-content:space-between;gap:8px}.l2s p{margin:18px 0 0;color:var(--m);font-size:9px;line-height:1.6}.filters{display:grid;grid-template-columns:1.3fr repeat(3,.7fr);gap:7px;margin:35px 0 12px;padding:12px;border:1px solid var(--l);border-radius:8px;background:#fff}.filters label{display:grid;gap:4px}.filters span{color:var(--m);font-size:8px}.filters input,.filters select{width:100%;height:35px;padding:0 8px;border:1px solid #cbd5da;border-radius:4px;font-size:10px}.result{margin-bottom:10px;color:var(--m);font-size:9px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.card{display:flex;min-height:220px;flex-direction:column;padding:15px;border:1px solid var(--l);border-radius:7px;background:#fff}.tags{display:flex;flex-wrap:wrap;gap:4px}.tags span{padding:3px 5px;background:#eef2f3;color:var(--m);font-size:7px}.card h3{margin:14px 0 5px;font-size:14px}.card>b{color:#007970;font-size:9px}.card p{margin:11px 0;color:var(--m);font-size:9px;line-height:1.6}.card small{margin-top:auto;color:#8793a1;font-size:8px}.card button{align-self:flex-start;margin-top:10px;padding:0;border:0;background:none;color:#007970;font-size:9px;font-weight:800;cursor:pointer}.pager{display:flex;justify-content:center;gap:12px;align-items:center;margin-top:18px;font-size:9px}.pager button{padding:7px 10px;border:1px solid #cbd5da;border-radius:4px;background:#fff}.shade{position:fixed;inset:0;z-index:70;display:none;background:#071b328c}.shade.open{display:block}.drawer{position:fixed;inset:0 0 0 auto;z-index:80;width:min(570px,94vw);overflow:auto;padding:26px;background:#fff;transform:translateX(105%);transition:.2s}.drawer.open{transform:none}.close{float:right;padding:7px 9px;border:1px solid #cbd5da;border-radius:4px;background:#fff;font-size:9px}.drawer h2{clear:both;padding-top:20px;margin:10px 0 7px;font-size:28px}.drawerIntro{color:var(--m);font-size:11px;line-height:1.7}.drawerList{display:grid;gap:6px;margin-top:22px}.drawerList button,.raw{padding:12px;border:1px solid var(--l);border-radius:5px;background:#fff;text-align:left}.drawerList button{display:flex;justify-content:space-between;gap:10px;cursor:pointer}.drawerList span{display:grid;gap:4px}.drawerList small,.raw small{color:var(--m);font-size:8px}.raw{margin-top:7px}.raw div{display:flex;justify-content:space-between;gap:10px}.raw p{color:var(--m);font-size:9px;line-height:1.6}.method{display:grid;gap:0;margin-top:34px;border-top:1px solid var(--l)}.method article{display:grid;grid-template-columns:50px 1fr;gap:16px;padding:22px 5px;border-bottom:1px solid var(--l)}.method article>span{color:var(--t);font-size:10px;font-weight:800}.method h2{margin:0 0 7px;font-size:18px}.method p{margin:0;color:var(--m);font-size:11px;line-height:1.7}
@media(max-width:900px){.side{transform:translateX(-100%)}.main{margin-left:0;padding:30px 16px}.companies,.cards,.l2s{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.answer,.sectorHero,.two{grid-template-columns:1fr}.total{min-height:100px;border-top:1px solid #ffffff25;border-left:0}.companies,.cards,.l2s{grid-template-columns:1fr}.signals button,.l3s button{grid-template-columns:1fr 36px}.signals em,.l3s em{display:none}.filters{grid-template-columns:1fr}h1{font-size:34px}}
</style></head><body>
<aside class="side"><div class="brand"><small>WAIC 2026</small><b>具体趋势拆解</b><span>产品、任务、项目和公司</span></div><nav><button data-page="trends" class="active">具体趋势<small>先看五个重点板块</small></button><button data-page="embodied">具身任务<small>哪种机器人做什么</small></button><button data-page="sectors">全部行业<small>每一块下面有什么</small></button><button data-page="projects">全部项目<small>搜索和筛选</small></button><button data-page="method">怎么统计<small>热度和公司标准</small></button></nav></aside>
<main class="main">
<div id="trends" class="page active"><div class="intro"><span class="kick">先看具体结论</span><h1>WAIC里具体什么产品多，机器人具体在做什么</h1><p>热度先看有多少家公司展出相似产品，再看这些产品完成什么任务。项目多只代表WAIC展示集中，不代表收入和市场份额</p></div><div id="themeTabs" class="tabs"></div><div id="themeContent"></div></div>
<div id="embodied" class="page"><div class="intro"><span class="kick">具身智能继续拆</span><h1>机器人形态只回答长什么样，任务才能回答它有没有进入真实工作</h1><p>这里把整机和部件分开，再把人形机器人按任务重新统计</p></div><div class="taskCall"><span class="kick">最具体的结论</span><h2>人形机器人当前最多的是本体动作和科研展示，工厂装配是数量最多的生产任务</h2><p>22组人形机器人中，8组用于动作、科研和展示，4组用于工厂装配，3组用于家庭教育，3组用于接待，仓储和特种作业各有2组</p></div><section class="block"><div class="blockHead"><span class="kick">具体任务</span><h2>每一类都能查看具体项目</h2></div><div class="toggle"><button data-taskmode="human" class="active">只看人形机器人</button><button data-taskmode="all">全部机器人整机</button></div><div id="taskList" class="tasks"></div></section></div>
<div id="sectors" class="page"><div class="intro"><span class="kick">全部行业</span><h1>每个大板块都可以继续拆到具体产品和项目</h1><p>先选一级行业，再选里面的业务板块。三级产品会说明具体是什么，并列出相关项目</p></div><div id="sectorBtns" class="sectorBtns"></div><div id="sectorContent"></div></div>
<div id="projects" class="page"><div class="intro"><span class="kick">全部项目</span><h1>搜索公司、产品名称或具体任务</h1><p>同一家公司重复展出的同类产品已经放在一起，1432个原始项目仍然全部保留</p></div><div class="filters"><label><span>搜索</span><input id="q" placeholder="输入公司、产品或任务"></label><label><span>一级行业</span><select id="f1"></select></label><label><span>二级行业</span><select id="f2"></select></label><label><span>具体产品</span><select id="f3"></select></label></div><div id="result" class="result"></div><div id="cards" class="cards"></div><div class="pager"><button id="prev">上一页</button><span id="pageNo"></span><button id="next">下一页</button></div></div>
<div id="method" class="page"><div class="intro"><span class="kick">怎么统计</span><h1>项目热度、代表公司和发展方向使用三套不同标准</h1><p>项目多只能说明WAIC展示集中。代表公司需要有规模、用户或客户、销售和部署记录</p></div><div class="method"><article><span>01</span><div><h2>所有项目都保留</h2><p>官方目录共有1435行。删除3条完全重复记录后，页面保留1432个项目，没有抽样</p></div></article><article><span>02</span><div><h2>同一家公司重复展出的同类产品放在一起</h2><p>热度使用962组不同产品。同一家公司在同一细分产品下展出多个型号，只计算一组</p></div></article><article><span>03</span><div><h2>代表公司每个板块最多三家</h2><p>入选公司需要在公司体量、用户或客户规模、销售和部署记录中有至少两项公开依据</p></div></article></div></div>
</main><div id="shade" class="shade"></div><aside id="drawer" class="drawer"><button id="close" class="close">关闭</button><div id="drawerBody"></div></aside>
<script>const DATA=${safeData};const THEMES=${safeThemes};
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fam=id=>DATA.families.find(x=>x.id===id);const company=n=>DATA.importantCompanies.find(x=>x.company===n);
function openDrawer(html){$("#drawerBody").innerHTML=html;$("#shade").classList.add("open");$("#drawer").classList.add("open")}
function closeDrawer(){$("#shade").classList.remove("open");$("#drawer").classList.remove("open")}
$("#shade").onclick=closeDrawer;$("#close").onclick=closeDrawer;
function showFamily(id){const f=fam(id),ps=DATA.projects.filter(x=>x.familyId===id);openDrawer(\`<h2>\${esc(f.representativeProject)}</h2><p class="drawerIntro">\${esc(f.enterprise)}<br>\${esc(f.l1)}，\${esc(f.l2)}，\${esc(f.l3)}</p>\${f.task?\`<div class="taskCall"><span class="kick">它完成的任务</span><h3>\${esc(f.task)}</h3><p>\${esc(f.taskDirection)}</p></div>\`:""}<section class="block"><div class="blockHead"><h2>项目在做什么</h2><p>\${esc(f.description||"项目简介没有填写")}</p></div>\${ps.map(p=>\`<article class="raw"><div><b>\${esc(p.name)}</b><span>\${esc(p.booth||"展位未填写")}</span></div><p>\${esc(p.description||"")}</p><small>分类依据：\${esc(p.basis)}</small></article>\`).join("")}</section>\`)}
function showFamilies(title,text,rows){openDrawer(\`<h2>\${esc(title)}</h2><p class="drawerIntro">\${esc(text)}</p><div class="drawerList">\${rows.sort((a,b)=>b.projectCount-a.projectCount).map(f=>\`<button data-family="\${f.id}"><span><b>\${esc(f.representativeProject)}</b><small>\${esc(f.enterprise)}</small></span><strong>\${f.projectCount}条</strong></button>\`).join("")}</div>\`);all("[data-family]").forEach(b=>b.onclick=()=>showFamily(b.dataset.family))}
function renderTheme(id){const t=THEMES.find(x=>x.id===id),rows=DATA.families.filter(f=>t.scope.includes(f.l1));all("#themeTabs button").forEach(b=>b.classList.toggle("active",b.dataset.theme===id));$("#themeContent").innerHTML=\`<div class="answer"><div><span class="kick">\${esc(t.name)}</span><h2>\${esc(t.title)}</h2><p>\${esc(t.text)}</p></div><div class="total"><b>\${rows.length}</b><span>组不同产品</span></div></div><section class="block"><div class="blockHead"><span class="kick">继续往下拆</span><h2>这个板块里数量最多的具体产品</h2></div><div class="signals">\${t.signals.map(s=>{const r=DATA.families.filter(f=>f.l3===s[1]);return \`<button data-l3="\${esc(s[1])}" data-label="\${esc(s[0])}" data-text="\${esc(s[2])}"><span><b>\${esc(s[0])}</b><small>\${esc(s[2])}</small></span><strong>\${r.length}</strong><em>查看项目</em></button>\`}).join("")}</div></section><section class="block two"><div><div class="blockHead"><span class="kick">发展方向</span><h2>接下来主要解决什么问题</h2></div><div class="directions">\${t.directions.map((x,i)=>\`<article><h3>\${i+1}. \${esc(x)}</h3></article>\`).join("")}</div></div><div><div class="blockHead"><span class="kick">代表公司</span><h2>每个板块最多三家</h2><p>公司体量、用户或客户、销售和部署记录是入选依据</p></div><div class="companies">\${t.companies.map((n,i)=>{const c=company(n);if(!c)return"";const p=c.familyIds.map(fam).find(f=>f&&t.scope.includes(f.l1));return \`<article class="company"><span>0\${i+1} 本板块代表公司</span><h3>\${esc(c.company)}</h3><dl><div><dt>公司规模</dt><dd>\${esc(c.scale)}</dd></div><div><dt>用户客户</dt><dd>\${esc(c.users)}</dd></div><div><dt>已有业务</dt><dd>\${esc(c.loop)}</dd></div></dl>\${p?\`<button data-family="\${p.id}">WAIC项目　\${esc(p.representativeProject)}</button>\`:""}</article>\`}).join("")}</div></div></section>\`;all("#themeContent [data-l3]").forEach(b=>b.onclick=()=>showFamilies(b.dataset.label,b.dataset.text,DATA.families.filter(f=>f.l3===b.dataset.l3)));all("#themeContent [data-family]").forEach(b=>b.onclick=()=>showFamily(b.dataset.family))}
$("#themeTabs").innerHTML=THEMES.map(t=>\`<button data-theme="\${t.id}">\${esc(t.name)}</button>\`).join("");all("#themeTabs button").forEach(b=>b.onclick=()=>renderTheme(b.dataset.theme));renderTheme("embodied");
let taskMode="human";function renderTasks(){const rows=taskMode==="human"?DATA.embodied.humanoidTasks:DATA.embodied.tasks;$("#taskList").innerHTML=rows.map(t=>\`<button data-task="\${esc(t.name)}"><span><b>\${esc(t.name)}</b><small>\${t.examples.slice(0,3).map(x=>esc(x.enterprise+" "+x.project)).join("；")}</small></span><strong>\${t.familyCount}</strong></button>\`).join("");all("#taskList button").forEach(b=>b.onclick=()=>{const t=rows.find(x=>x.name===b.dataset.task);showFamilies(t.name,t.direction,t.familyIds.map(fam).filter(Boolean))})}all("[data-taskmode]").forEach(b=>b.onclick=()=>{taskMode=b.dataset.taskmode;all("[data-taskmode]").forEach(x=>x.classList.toggle("active",x===b));renderTasks()});renderTasks();
let sector=DATA.sectors[0],l2=sector.l2[0];function renderSectorBtns(){$("#sectorBtns").innerHTML=DATA.sectors.map(s=>\`<button data-sector="\${esc(s.name)}" class="\${s.name===sector.name?"active":""}">\${esc(s.name)} \${s.familyCount}</button>\`).join("");all("#sectorBtns button").forEach(b=>b.onclick=()=>{sector=DATA.sectors.find(s=>s.name===b.dataset.sector);l2=sector.l2[0];renderSectorBtns();renderSector()})}function renderSector(){$("#sectorContent").innerHTML=\`<div class="sectorHero"><div><span class="kick">一级行业</span><h2>\${esc(sector.name)}</h2><p>\${esc(sector.definition)}</p></div><div class="total"><b>\${sector.familyCount}</b><span>组不同产品</span></div></div><section class="block"><div class="blockHead"><span class="kick">里面有哪些业务</span><h2>二级分类</h2></div><div class="l2s">\${sector.l2.map(x=>\`<button data-l2="\${esc(x.name)}" class="\${x.name===l2.name?"active":""}"><div><b>\${esc(x.name)}</b><strong>\${x.familyCount}</strong></div><p>\${esc(x.definition)}</p></button>\`).join("")}</div></section><section class="block"><div class="blockHead"><span class="kick">再往下是什么产品</span><h2>\${esc(l2.name)}</h2></div><div class="l3s">\${l2.l3.map(x=>\`<button data-l3="\${esc(x.name)}"><span><b>\${esc(x.name)}</b><small>\${esc(x.definition)}</small></span><strong>\${x.familyCount}</strong><em>查看项目</em></button>\`).join("")}</div></section>\`;all("[data-l2]").forEach(b=>b.onclick=()=>{l2=sector.l2.find(x=>x.name===b.dataset.l2);renderSector()});all("#sectorContent [data-l3]").forEach(b=>b.onclick=()=>{const x=l2.l3.find(y=>y.name===b.dataset.l3);showFamilies(x.name,x.definition,DATA.families.filter(f=>f.l1===x.l1&&f.l2===x.l2&&f.l3===x.name))})}renderSectorBtns();renderSector();
let p=1;const size=30;function fillSelect(el,items){el.innerHTML='<option value="">全部</option>'+items.map(x=>\`<option>\${esc(x)}</option>\`).join("")}fillSelect($("#f1"),DATA.sectors.map(x=>x.name));function renderFilters(){const f1=$("#f1").value,f2=$("#f2").value;fillSelect($("#f2"),[...new Set(DATA.families.filter(x=>!f1||x.l1===f1).map(x=>x.l2))]);$("#f2").value=f2;fillSelect($("#f3"),[...new Set(DATA.families.filter(x=>(!f1||x.l1===f1)&&(!f2||x.l2===f2)).map(x=>x.l3))])}function renderProjects(){const q=$("#q").value.trim().toLowerCase(),f1=$("#f1").value,f2=$("#f2").value,f3=$("#f3").value;const rows=DATA.families.filter(x=>(!q||(x.representativeProject+" "+x.enterprise+" "+x.description+" "+x.projectNames.join(" ")).toLowerCase().includes(q))&&(!f1||x.l1===f1)&&(!f2||x.l2===f2)&&(!f3||x.l3===f3));const pages=Math.max(1,Math.ceil(rows.length/size));p=Math.min(p,pages);$("#result").textContent=\`找到 \${rows.length} 条\`;$("#cards").innerHTML=rows.slice((p-1)*size,p*size).map(x=>\`<article class="card"><div class="tags"><span>\${esc(x.l1)}</span><span>\${esc(x.l2)}</span><span>\${esc(x.l3)}</span></div><h3>\${esc(x.representativeProject)}</h3><b>\${esc(x.enterprise)}</b><p>\${esc((x.description||"").slice(0,120))}</p><small>\${x.projectCount}条同类展品</small><button data-family="\${x.id}">查看详情</button></article>\`).join("");$("#pageNo").textContent=\`\${p} / \${pages}\`;$("#prev").disabled=p===1;$("#next").disabled=p===pages;$("#prev").onclick=()=>{p--;renderProjects()};$("#next").onclick=()=>{p++;renderProjects()};all("#cards [data-family]").forEach(b=>b.onclick=()=>showFamily(b.dataset.family))}$("#q").oninput=()=>{p=1;renderProjects()};$("#f1").onchange=()=>{p=1;renderFilters();renderProjects()};$("#f2").onchange=()=>{p=1;const f1=$("#f1").value,f2=$("#f2").value;fillSelect($("#f3"),[...new Set(DATA.families.filter(x=>(!f1||x.l1===f1)&&(!f2||x.l2===f2)).map(x=>x.l3))]);renderProjects()};$("#f3").onchange=()=>{p=1;renderProjects()};renderFilters();renderProjects();
all(".side nav button").forEach(b=>b.onclick=()=>{all(".side nav button").forEach(x=>x.classList.toggle("active",x===b));all(".page").forEach(x=>x.classList.toggle("active",x.id===b.dataset.page));window.scrollTo(0,0)});
</script></body></html>`;

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, html, "utf8");
console.log(output);
