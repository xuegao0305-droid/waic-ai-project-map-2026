"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  code: string;
  familyId: string;
  name: string;
  enterprise: string;
  l1: string;
  l2: string;
  l3: string;
  description: string;
  booth: string;
  basis: string;
};

type Family = {
  id: string;
  enterprise: string;
  l1: string;
  l2: string;
  l3: string;
  projectCount: number;
  projectNames: string[];
  representativeProject: string;
  description: string;
  task: string;
  taskDirection: string;
};

type Level3 = {
  l1: string;
  l2: string;
  name: string;
  definition: string;
  familyCount: number;
  enterpriseCount: number;
  projectCount: number;
};

type Level2 = {
  l1: string;
  name: string;
  definition: string;
  familyCount: number;
  enterpriseCount: number;
  projectCount: number;
  l3: Level3[];
};

type Sector = {
  rank: number;
  name: string;
  definition: string;
  familyCount: number;
  enterpriseCount: number;
  projectCount: number;
  direction: string;
  maturity: string;
  caveat: string;
  l2: Level2[];
};

type ImportantCompany = {
  key: string;
  l1: string;
  company: string;
  totalScore: number;
  scale: string;
  users: string;
  loop: string;
  sourceUrls: string[];
  evidenceDate: string;
  familyIds: string[];
};

type TaskSummary = {
  name: string;
  familyCount: number;
  enterpriseCount: number;
  projectCount: number;
  direction: string;
  familyIds: string[];
  examples: { familyId: string; enterprise: string; project: string; l3: string }[];
};

type DashboardData = {
  metadata: {
    officialPage: string;
    fetchedAt: string;
    officialRows: number;
    uniqueProjects: number;
    exactDuplicateRowsRemoved: number;
    productFamilies: number;
    enterprises: number;
  };
  sectors: Sector[];
  importantCompanies: ImportantCompany[];
  embodied: {
    familyCount: number;
    projectCount: number;
    enterpriseCount: number;
    l2: Level2[];
    l3: Level3[];
    tasks: TaskSummary[];
    humanoidTasks: TaskSummary[];
  };
  families: Family[];
  projects: Project[];
};

type Match = { l1?: string[]; l2?: string[]; l3?: string[] };
type Signal = { label: string; match: Match; explanation: string };
type Theme = {
  id: string;
  tab: string;
  scope: string[];
  headline: string;
  conclusion: string;
  signals: Signal[];
  directions: { title: string; text: string }[];
  companies: string[];
  exampleFamilyIds: string[];
};

type PageId = "trends" | "embodied" | "sectors" | "projects" | "method";
type DetailState =
  | { kind: "match"; title: string; explanation: string; match: Match }
  | { kind: "task"; task: TaskSummary }
  | { kind: "family"; familyId: string }
  | null;

const themes: Theme[] = [
  {
    id: "core",
    tab: "AI底座与软件",
    scope: ["核心技术"],
    headline: "算力硬件占核心技术的31%，芯片、服务器、互联和数据中心都出现了二十组以上产品",
    conclusion: "这块热度分布在完整的算力供给链。应用端也已经形成第二个集中区，企业软件有77组，高于模型与算法的69组",
    signals: [
      { label: "AI芯片与加速卡", match: { l3: ["AI芯片与加速卡"] }, explanation: "38组，包含训练和推理芯片、加速卡及板卡" },
      { label: "服务器与算力一体机", match: { l3: ["服务器与算力一体机"] }, explanation: "24组，把芯片、存储和网络装进可直接部署的服务器" },
      { label: "存储与高速互联", match: { l3: ["存储与高速互联"] }, explanation: "23组，解决多卡和多机之间的数据传输" },
      { label: "数据中心与液冷", match: { l3: ["数据中心与液冷"] }, explanation: "21组，重点解决高密度算力的供电和散热" },
      { label: "办公与协同智能体", match: { l3: ["办公与协同智能体"] }, explanation: "17组，模型已经被放进会议、文档和企业协作流程" },
    ],
    directions: [
      { title: "算力产品继续做大系统", text: "芯片厂商和服务器厂商正在把板卡、互联、存储和集群管理组合成超节点或算力一体机" },
      { title: "企业软件继续进入固定工作流", text: "内容制作、办公协同、客服营销和软件开发是当前产品最集中的四类工作" },
    ],
    companies: ["华为", "阿里巴巴", "昆仑芯"],
    exampleFamilyIds: ["PF0372", "PF0366", "PF0394", "PF0058", "PF0140"],
  },
  {
    id: "embodied",
    tab: "具身智能",
    scope: ["具身智能"],
    headline: "关节有26组，数量高于22组人形机器人；人形整机中最多的仍是动作、科研和展示项目",
    conclusion: "人形机器人已经开始进入装配、接待和仓储任务，但固定生产任务的数量仍少于本体和动作展示。部件端的竞争集中在关节、传感器和灵巧手",
    signals: [
      { label: "通用具身机器人", match: { l3: ["通用具身机器人"] }, explanation: "70组，形态包含轮式双臂、移动操作平台和多用途机器人" },
      { label: "关节与传动", match: { l3: ["关节与传动部件"] }, explanation: "26组，决定机器人负载、精度、速度和寿命" },
      { label: "人形机器人", match: { l3: ["人形机器人"] }, explanation: "22组，其中8组主要用于动作、科研和展示，4组用于工厂装配" },
      { label: "传感器", match: { l3: ["传感器与感知器件"] }, explanation: "20组，主要提供视觉、触觉、力觉和位置数据" },
      { label: "灵巧手与夹爪", match: { l3: ["灵巧手与夹爪"] }, explanation: "16组，重点解决抓取、拧动、按压和精细操作" },
    ],
    directions: [
      { title: "人形机器人先进入边界清楚的任务", text: "工厂装配、商用接待、仓储搬运和消防巡检已经出现具体项目，工厂装配的项目数量最多" },
      { title: "操作能力比单纯行走更受关注", text: "关节、传感器和灵巧手合计62组，企业在补齐稳定动作、感知和抓取能力" },
    ],
    companies: ["宇树科技", "节卡机器人", "擎朗智能"],
    exampleFamilyIds: ["PF0534", "PF0523", "PF0574", "PF0431", "PF0454"],
  },
  {
    id: "terminal",
    tab: "智能终端",
    scope: ["智能终端"],
    headline: "AI眼镜、显示交互设备和AI电脑手机各有8到9组，三种终端形态的数量非常接近",
    conclusion: "终端项目没有集中在单一硬件。眼镜强调随身语音和视觉，电脑手机强调本地运行，健康穿戴强调持续监测",
    signals: [
      { label: "AI眼镜与AR终端", match: { l3: ["AI眼镜与AR终端"] }, explanation: "9组，主要做翻译、记录、拍摄和视觉提示" },
      { label: "显示影音与交互设备", match: { l3: ["显示影音与交互设备"] }, explanation: "9组，包含显示器、影音设备和空间交互硬件" },
      { label: "AI电脑平板与手机", match: { l3: ["AI电脑平板与手机"] }, explanation: "8组，重点是本地模型、多设备协同和个人助手" },
      { label: "健康与运动穿戴", match: { l3: ["健康与运动穿戴"] }, explanation: "6组，持续采集健康和运动数据" },
      { label: "AI玩具与陪伴设备", match: { l3: ["AI玩具与陪伴设备"] }, explanation: "5组，主要服务儿童、家庭和情感互动" },
    ],
    directions: [
      { title: "终端继续增加本地运行能力", text: "手机、电脑和眼镜把语音、视觉和个人数据放在设备端处理，以降低延迟并减少云端调用" },
      { title: "眼镜先解决高频小任务", text: "翻译、提词、记录和拍摄比复杂自主操作更常见，产品价值取决于佩戴时长和使用频次" },
    ],
    companies: ["荣耀", "科大讯飞", "中科创达"],
    exampleFamilyIds: ["PF0667", "PF0688", "PF0663", "PF0693", "PF0722"],
  },
  {
    id: "industry",
    tab: "工业制造",
    scope: ["工业互联与智能制造", "制造业"],
    headline: "工业项目先解决连接、控制和检测，直接做排产与工艺优化的项目数量很少",
    conclusion: "工业计算与网络有16组，自动化装备有13组，电子器件与硬件有12组。生产智能化只有9组，其中6组是机器视觉和质量检测",
    signals: [
      { label: "工业计算与网络", match: { l1: ["工业互联与智能制造"], l2: ["工业计算与网络"] }, explanation: "16组，包含工业服务器、接口设备、边缘计算和网络硬件" },
      { label: "工业自动化与装备", match: { l1: ["工业互联与智能制造"], l2: ["工业自动化与装备"] }, explanation: "13组，包含机器人、PLC、运动控制和测量设备" },
      { label: "电子元器件与硬件", match: { l1: ["制造业"], l2: ["电子元器件与硬件"] }, explanation: "12组，主要提供生产设备和计算系统需要的基础硬件" },
      { label: "工业视觉与质量检测", match: { l3: ["工业视觉与质量检测"] }, explanation: "6组，是生产智能化中数量最多的具体任务" },
      { label: "排产工艺与生产优化", match: { l3: ["排产工艺与生产优化"] }, explanation: "1组，直接改动生产计划和工艺参数的项目仍少" },
    ],
    directions: [
      { title: "机器视觉继续承担最清楚的AI任务", text: "缺陷检测和质量判断有明确输入、输出和人工复核方式，企业更容易算清投入和节省的成本" },
      { title: "工业智能体需要接入控制系统", text: "当前项目更多停在查询、分析和辅助决策，排产和工艺优化需要连接MES、PLC和设备数据" },
    ],
    companies: ["西门子", "海克斯康", "宝信软件"],
    exampleFamilyIds: ["PF0783", "PF0785", "PF0821", "PF0829", "PF0810"],
  },
  {
    id: "medical",
    tab: "医疗健康",
    scope: ["智慧医疗"],
    headline: "病理检验和早筛有7组，临床决策有5组，医学影像辅助诊断只有2组",
    conclusion: "WAIC医疗项目的集中点已经扩到检验、早筛和医生决策。健康监测有9组，康复养老有7组，医疗AI也在连接院外长期服务",
    signals: [
      { label: "检验病理与早筛", match: { l3: ["检验病理与早筛"] }, explanation: "7组，处理检验数据、病理信息和疾病早期筛查" },
      { label: "临床决策与医生智能体", match: { l3: ["临床决策与医生智能体"] }, explanation: "5组，帮助医生整理病历、查资料和制定诊疗建议" },
      { label: "慢病监测与生命体征", match: { l3: ["慢病监测与生命体征"] }, explanation: "5组，持续记录心电、血压和其他健康数据" },
      { label: "康复训练与康复机器人", match: { l3: ["康复训练与康复机器人"] }, explanation: "5组，完成训练、动作辅助和恢复评估" },
      { label: "医学影像辅助诊断", match: { l3: ["医学影像辅助诊断"] }, explanation: "2组，数量少于病理早筛和医生智能体" },
    ],
    directions: [
      { title: "医生智能体继续进入临床流程", text: "产品开始连接病历、影像和医学知识，医院需要把建议、医生确认和记录保存放进同一流程" },
      { title: "健康服务继续连接医院外用户", text: "慢病监测、健康咨询和康复设备可以持续获取数据，服务周期长于单次诊断" },
    ],
    companies: ["联影智能", "蚂蚁集团"],
    exampleFamilyIds: ["PF0862", "PF0853", "PF0838", "PF0832", "PF0848"],
  },
];

const navItems: { id: PageId; label: string; note: string }[] = [
  { id: "trends", label: "具体趋势", note: "先看五个重点板块" },
  { id: "embodied", label: "具身任务", note: "哪种机器人做什么" },
  { id: "sectors", label: "全部行业", note: "查看每一块下面有什么" },
  { id: "projects", label: "全部项目", note: "搜索和筛选" },
  { id: "method", label: "怎么统计", note: "热度和公司标准" },
];

const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
const clip = (value: string, length = 125) => value.length > length ? `${value.slice(0, length)}…` : value;
const unique = <T,>(values: T[]) => [...new Set(values)];

function matches(row: Family, match: Match) {
  return (!match.l1 || match.l1.includes(row.l1))
    && (!match.l2 || match.l2.includes(row.l2))
    && (!match.l3 || match.l3.includes(row.l3));
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState<PageId>("trends");
  const [detail, setDetail] = useState<DetailState>(null);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    fetch("/data/waic-dashboard.json")
      .then((response) => {
        if (!response.ok) throw new Error("数据文件没有读出来");
        return response.json();
      })
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "数据读取失败"));
  }, []);

  useEffect(() => {
    const readHash = () => {
      const value = window.location.hash.replace("#", "") as PageId;
      if (navItems.some((item) => item.id === value)) setPage(value);
    };
    readHash();
    window.addEventListener("popstate", readHash);
    return () => window.removeEventListener("popstate", readHash);
  }, []);

  const go = (next: PageId) => {
    setPage(next);
    setMobileNav(false);
    window.history.pushState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) return <div className="loading-screen"><b>页面没有打开</b><span>{error}</span></div>;
  if (!data) return <div className="loading-screen"><span className="pulse" /><b>正在读取全部项目</b></div>;

  return (
    <div className="site-shell">
      <button className="mobile-menu" onClick={() => setMobileNav(true)}>目录</button>
      <aside className={`side ${mobileNav ? "open" : ""}`}>
        <div className="site-brand"><small>WAIC 2026</small><b>具体趋势拆解</b><span>产品、任务、项目和公司</span></div>
        <nav>
          {navItems.map((item, index) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => go(item.id)}>
              <i>{String(index + 1).padStart(2, "0")}</i><span><b>{item.label}</b><small>{item.note}</small></span>
            </button>
          ))}
        </nav>
        <div className="side-note">
          <span>数据范围</span>
          <b>{formatNumber(data.metadata.uniqueProjects)}个WAIC项目</b>
          <small>全部保留，同一家公司重复展出的同类产品已合并展示</small>
        </div>
      </aside>
      <button aria-label="关闭目录" className={`page-shade ${mobileNav ? "open" : ""}`} onClick={() => setMobileNav(false)} />

      <div className="content-shell">
        {page === "trends" && <TrendPage data={data} openDetail={setDetail} go={go} />}
        {page === "embodied" && <EmbodiedPage data={data} openDetail={setDetail} />}
        {page === "sectors" && <SectorPage data={data} openDetail={setDetail} />}
        {page === "projects" && <ProjectPage data={data} openDetail={setDetail} />}
        {page === "method" && <MethodPage data={data} />}
        <footer><span>数据来自WAIC 2026官方项目目录</span><a href={data.metadata.officialPage} target="_blank" rel="noreferrer">打开官方目录</a></footer>
      </div>

      <DetailDrawer data={data} state={detail} open={setDetail} close={() => setDetail(null)} />
    </div>
  );
}

function PageIntro({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return <header className="page-intro"><span>{kicker}</span><h1>{title}</h1><p>{text}</p></header>;
}

function TrendPage({ data, openDetail, go }: { data: DashboardData; openDetail: (state: DetailState) => void; go: (page: PageId) => void }) {
  const [themeId, setThemeId] = useState("embodied");
  const theme = themes.find((row) => row.id === themeId) || themes[0];
  const scopeFamilies = data.families.filter((row) => theme.scope.includes(row.l1));
  const exampleFamilies = theme.exampleFamilyIds.map((id) => data.families.find((row) => row.id === id)).filter(Boolean) as Family[];
  const companies = theme.companies.map((name) => data.importantCompanies.find((row) => row.company === name && theme.scope.includes(row.l1))).filter(Boolean) as ImportantCompany[];

  return (
    <>
      <PageIntro kicker="先看具体结论" title="WAIC里具体什么产品多，机器人具体在做什么" text="热度先看有多少家公司展出相似产品，再看这些产品完成什么任务。项目多只代表WAIC展示集中，不代表收入和市场份额" />

      <section className="theme-tabs" aria-label="重点板块">
        {themes.map((row) => <button key={row.id} className={row.id === theme.id ? "active" : ""} onClick={() => setThemeId(row.id)}>{row.tab}</button>)}
      </section>

      <section className="theme-answer">
        <div><span>{theme.tab}</span><h2>{theme.headline}</h2><p>{theme.conclusion}</p></div>
        <div className="theme-total"><b>{scopeFamilies.length}</b><span>组不同产品</span><small>同公司同类展品合并后</small></div>
      </section>

      <section>
        <div className="section-title"><span>继续往下拆</span><h2>这个板块里数量最多的具体产品</h2></div>
        <div className="signal-list">
          {theme.signals.map((signal, index) => {
            const rows = data.families.filter((row) => matches(row, signal.match));
            return (
              <button key={signal.label} onClick={() => openDetail({ kind: "match", title: signal.label, explanation: signal.explanation, match: signal.match })}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <span><b>{signal.label}</b><small>{signal.explanation}</small></span>
                <strong>{rows.length}</strong>
                <em>查看项目</em>
              </button>
            );
          })}
        </div>
      </section>

      {theme.id === "embodied" && <section className="focus-link"><div><span>人形机器人继续拆到任务</span><h2>22组人形机器人里，8组用于动作、科研和展示，4组用于工厂装配</h2><p>接待有3组，仓储有2组，消防和巡检有2组。每一类都可以查看具体项目</p></div><button onClick={() => go("embodied")}>查看全部任务</button></section>}

      <section className="split-section">
        <div>
          <div className="section-title"><span>具体项目</span><h2>这些项目能代表上面的细分方向</h2></div>
          <div className="example-list">
            {exampleFamilies.map((family) => (
              <button key={family.id} onClick={() => openDetail({ kind: "family", familyId: family.id })}>
                <span>{family.l3}</span><h3>{family.representativeProject}</h3><p>{family.enterprise}</p><small>{family.projectCount > 1 ? `${family.projectCount}条同类展品已合并` : "1条WAIC展品"}</small>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-title"><span>发展方向</span><h2>接下来主要解决什么问题</h2></div>
          <div className="direction-list">
            {theme.directions.map((item, index) => <article key={item.title}><i>{index + 1}</i><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}
          </div>
        </div>
      </section>

      <section>
        <div className="section-title"><span>代表公司</span><h2>每个板块只保留最有规模和交付记录的公司</h2><p>公司入选看体量、用户或客户规模、销售和部署记录，WAIC项目数量只用来说明它带来了什么</p></div>
        <div className="featured-companies">
          {companies.map((company, index) => <FeaturedCompany key={company.key} rank={index + 1} company={company} data={data} theme={theme} openDetail={openDetail} />)}
        </div>
      </section>
    </>
  );
}

function FeaturedCompany({ rank, company, data, theme, openDetail }: { rank: number; company: ImportantCompany; data: DashboardData; theme: Theme; openDetail: (state: DetailState) => void }) {
  const project = company.familyIds.map((id) => data.families.find((row) => row.id === id)).find((row) => row && theme.scope.includes(row.l1));
  return (
    <article className="featured-company">
      <div className="company-rank"><i>{String(rank).padStart(2, "0")}</i><span>本板块代表公司</span></div>
      <h3>{company.company}</h3>
      <dl><div><dt>公司规模</dt><dd>{company.scale}</dd></div><div><dt>用户或客户</dt><dd>{company.users}</dd></div><div><dt>已经形成的业务</dt><dd>{company.loop}</dd></div></dl>
      {project && <button onClick={() => openDetail({ kind: "family", familyId: project.id })}><span>WAIC代表项目</span><b>{project.representativeProject}</b></button>}
      <div className="evidence-links">{company.sourceUrls.slice(0, 2).map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">公司依据{company.sourceUrls.length > 1 ? index + 1 : ""}</a>)}</div>
    </article>
  );
}

function EmbodiedPage({ data, openDetail }: { data: DashboardData; openDetail: (state: DetailState) => void }) {
  const [mode, setMode] = useState<"humanoid" | "all">("humanoid");
  const tasks = mode === "humanoid" ? data.embodied.humanoidTasks : data.embodied.tasks;
  const parts = ["关节与传动部件", "传感器与感知器件", "灵巧手与夹爪", "仿真训练与数据平台", "具身大模型与VLA"]
    .map((name) => data.embodied.l3.find((row) => row.name === name)).filter(Boolean) as Level3[];

  return (
    <>
      <PageIntro kicker="具身智能继续拆" title="机器人形态只回答长什么样，任务才能回答它有没有进入真实工作" text="这里把整机和部件分开，再把人形机器人按任务重新统计。关节、灵巧手和模型没有被算成完成任务的机器人" />
      <section className="direct-answer"><span>最具体的结论</span><h2>人形机器人当前最多的是本体动作和科研展示，工厂装配是数量最多的生产任务</h2><p>22组人形机器人中，8组用于动作、科研和展示，4组用于工厂装配，3组用于家庭教育，3组用于接待，仓储和特种作业各有2组</p></section>

      <section className="split-section embodied-split">
        <div>
          <div className="section-title"><span>整机在做什么</span><h2>按任务看人形机器人</h2></div>
          <div className="task-toggle"><button className={mode === "humanoid" ? "active" : ""} onClick={() => setMode("humanoid")}>只看人形机器人</button><button className={mode === "all" ? "active" : ""} onClick={() => setMode("all")}>全部机器人整机</button></div>
          <div className="task-list">
            {tasks.map((task, index) => (
              <button key={task.name} onClick={() => openDetail({ kind: "task", task })}>
                <i>{String(index + 1).padStart(2, "0")}</i><span><b>{task.name}</b><small>{task.examples.slice(0, 3).map((item) => `${item.enterprise} ${item.project}`).join("；")}</small></span><strong>{task.familyCount}</strong>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-title"><span>部件在解决什么</span><h2>关节、感知和手部操作最集中</h2></div>
          <div className="part-list">
            {parts.map((part) => <button key={part.name} onClick={() => openDetail({ kind: "match", title: part.name, explanation: part.definition, match: { l1: ["具身智能"], l3: [part.name] } })}><div><b>{part.name}</b><span>{part.familyCount}</span></div><p>{part.definition}</p></button>)}
          </div>
        </div>
      </section>

      <section className="reading-grid">
        <article><span>01</span><h3>能走和能展示的项目最多</h3><p>动作、科研和展示占人形机器人的8组。这些项目先证明本体稳定和开发接口，生产效率还要看固定任务</p></article>
        <article><span>02</span><h3>工厂装配最早形成重复任务</h3><p>工厂装配有4组，项目已经写到汽车电子装配、上下料和工位操作，任务边界比家庭服务清楚</p></article>
        <article><span>03</span><h3>部件公司集中解决手眼协调</h3><p>关节、传感器和灵巧手合计62组，数量远高于任何单一整机任务，稳定动作和精细抓取仍是主要问题</p></article>
      </section>
    </>
  );
}

function SectorPage({ data, openDetail }: { data: DashboardData; openDetail: (state: DetailState) => void }) {
  const [sectorName, setSectorName] = useState("核心技术");
  const sector = data.sectors.find((row) => row.name === sectorName) || data.sectors[0];
  const [l2Name, setL2Name] = useState(sector.l2[0]?.name || "");
  const l2 = sector.l2.find((row) => row.name === l2Name) || sector.l2[0];
  const chooseSector = (name: string) => {
    const next = data.sectors.find((row) => row.name === name)!;
    setSectorName(name);
    setL2Name(next.l2[0]?.name || "");
  };
  const companies = data.importantCompanies.filter((row) => row.l1 === sector.name).slice(0, 3);
  const simpleTheme: Theme = { id: sector.name, tab: sector.name, scope: [sector.name], headline: "", conclusion: "", signals: [], directions: [], companies: [], exampleFamilyIds: [] };

  return (
    <>
      <PageIntro kicker="全部行业" title="每个大板块都可以继续拆到具体产品和项目" text="先选一级行业，再选里面的业务板块。三级产品会说明具体是什么，并列出所有相关项目" />
      <section className="sector-picker">
        {data.sectors.map((row) => <button key={row.name} className={row.name === sector.name ? "active" : ""} onClick={() => chooseSector(row.name)}><span>{row.name}</span><b>{row.familyCount}</b></button>)}
      </section>
      <section className="sector-summary"><div><span>一级行业</span><h2>{sector.name}</h2><p>{sector.definition}</p></div><div><b>{sector.familyCount}</b><span>组不同产品</span><small>{sector.enterpriseCount}家公司</small></div></section>
      <section>
        <div className="section-title"><span>里面有哪些业务</span><h2>{sector.name}的二级分类</h2></div>
        <div className="l2-list">{sector.l2.map((row) => <button key={row.name} className={row.name === l2?.name ? "active" : ""} onClick={() => setL2Name(row.name)}><div><b>{row.name}</b><strong>{row.familyCount}</strong></div><p>{row.definition}</p></button>)}</div>
      </section>
      {l2 && <section>
        <div className="section-title"><span>再往下是什么产品</span><h2>{l2.name}包含这些具体产品</h2><p>{l2.definition}</p></div>
        <div className="l3-list">{l2.l3.map((row, index) => <button key={row.name} onClick={() => openDetail({ kind: "match", title: row.name, explanation: row.definition, match: { l1: [row.l1], l2: [row.l2], l3: [row.name] } })}><i>{String(index + 1).padStart(2, "0")}</i><span><b>{row.name}</b><small>{row.definition}</small></span><strong>{row.familyCount}</strong><em>查看项目</em></button>)}</div>
      </section>}
      <section>
        <div className="section-title"><span>代表公司</span><h2>{companies.length ? `只列${sector.name}里证据最完整的公司` : "这个板块暂时没有足够证据选出代表公司"}</h2></div>
        {companies.length > 0 && <div className="featured-companies">{companies.map((company, index) => <FeaturedCompany key={company.key} rank={index + 1} company={company} data={data} theme={simpleTheme} openDetail={openDetail} />)}</div>}
      </section>
    </>
  );
}

function ProjectPage({ data, openDetail }: { data: DashboardData; openDetail: (state: DetailState) => void }) {
  const [raw, setRaw] = useState(false);
  const [query, setQuery] = useState("");
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [l3, setL3] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const familyMap = useMemo(() => new Map(data.families.map((row) => [row.id, row])), [data.families]);
  const l2Options = unique(data.families.filter((row) => !l1 || row.l1 === l1).map((row) => row.l2));
  const l3Options = unique(data.families.filter((row) => (!l1 || row.l1 === l1) && (!l2 || row.l2 === l2)).map((row) => row.l3));

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (raw) return data.projects.filter((row) => (!needle || `${row.name} ${row.enterprise} ${row.description}`.toLowerCase().includes(needle)) && (!l1 || row.l1 === l1) && (!l2 || row.l2 === l2) && (!l3 || row.l3 === l3));
    return data.families.filter((row) => (!needle || `${row.representativeProject} ${row.enterprise} ${row.projectNames.join(" ")} ${row.description}`.toLowerCase().includes(needle)) && (!l1 || row.l1 === l1) && (!l2 || row.l2 === l2) && (!l3 || row.l3 === l3));
  }, [data.families, data.projects, l1, l2, l3, query, raw]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  const resetPage = () => setPage(1);

  return (
    <>
      <PageIntro kicker="全部项目" title="搜索公司、产品名称或具体任务" text="默认把同一家公司重复展出的同类产品放在一起。需要核对官方原始目录时，可以切换到1432个原始项目" />
      <section className="project-controls">
        <div className="view-switch"><button className={!raw ? "active" : ""} onClick={() => { setRaw(false); resetPage(); }}>合并同类展品</button><button className={raw ? "active" : ""} onClick={() => { setRaw(true); resetPage(); }}>WAIC原始目录</button></div>
        <label className="search"><span>搜索</span><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="输入公司、产品或任务" /></label>
        <label><span>一级行业</span><select value={l1} onChange={(event) => { setL1(event.target.value); setL2(""); setL3(""); resetPage(); }}><option value="">全部</option>{data.sectors.map((row) => <option key={row.name}>{row.name}</option>)}</select></label>
        <label><span>二级行业</span><select value={l2} onChange={(event) => { setL2(event.target.value); setL3(""); resetPage(); }}><option value="">全部</option>{l2Options.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label><span>具体产品</span><select value={l3} onChange={(event) => { setL3(event.target.value); resetPage(); }}><option value="">全部</option>{l3Options.map((name) => <option key={name}>{name}</option>)}</select></label>
      </section>
      <div className="result-count">找到 <b>{formatNumber(rows.length)}</b> 条，第 {page} 页，共 {pageCount} 页</div>
      <section className="project-grid">
        {visible.map((row) => {
          const family = raw ? familyMap.get((row as Project).familyId)! : row as Family;
          const project = raw ? row as Project : null;
          return <article key={raw ? project!.code : family.id}><div className="path-tags"><span>{family.l1}</span><span>{family.l2}</span><span>{family.l3}</span></div><h3>{raw ? project!.name : family.representativeProject}</h3><b>{raw ? project!.enterprise : family.enterprise}</b><p>{clip(raw ? project!.description : family.description)}</p><small>{raw ? (project!.booth || "展位未填写") : (family.projectCount > 1 ? `${family.projectCount}条同类展品已合并` : "1条WAIC展品")}</small><button onClick={() => openDetail({ kind: "family", familyId: family.id })}>查看详情</button></article>;
        })}
      </section>
      <div className="pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>上一页</button><span>{page} / {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>下一页</button></div>
    </>
  );
}

function MethodPage({ data }: { data: DashboardData }) {
  return (
    <>
      <PageIntro kicker="怎么统计" title="项目热度、代表公司和发展方向使用三套不同标准" text="项目多只能说明WAIC展示集中。代表公司需要有规模、用户或客户、销售和部署记录。发展方向来自具体产品和任务分布" />
      <section className="method-list">
        <article><span>01</span><div><h2>所有项目都保留</h2><p>官方目录共有{formatNumber(data.metadata.officialRows)}行。删除{data.metadata.exactDuplicateRowsRemoved}条完全重复记录后，页面保留{formatNumber(data.metadata.uniqueProjects)}个项目，没有抽样</p></div></article>
        <article><span>02</span><div><h2>同一家公司重复展出的同类产品放在一起</h2><p>热度统计使用{formatNumber(data.metadata.productFamilies)}组不同产品。同一家公司在同一细分产品下展出多个型号，只计算一组，项目详情里仍保留全部原始名称</p></div></article>
        <article><span>03</span><div><h2>具体任务只统计能直接工作的机器人整机</h2><p>关节、传感器、灵巧手、模型和训练平台提供机器人能力，没有被算进装配、搬运或巡检任务</p></div></article>
        <article><span>04</span><div><h2>代表公司每个板块最多三家</h2><p>入选公司需要在公司体量、用户或客户规模、销售和部署记录中有至少两项公开依据。项目多不会自动进入代表公司</p></div></article>
        <article><span>05</span><div><h2>发展方向写到产品和任务</h2><p>页面先比较具体产品数量，再看项目正在完成的任务和头部公司的交付记录。市场份额、收入和融资额没有混进项目热度</p></div></article>
      </section>
    </>
  );
}

function DetailDrawer({ data, state, open, close }: { data: DashboardData; state: DetailState; open: (state: DetailState) => void; close: () => void }) {
  const family = state?.kind === "family" ? data.families.find((row) => row.id === state.familyId) : null;
  const task = state?.kind === "task" ? state.task : null;
  const matchState = state?.kind === "match" ? state : null;
  const families = matchState ? data.families.filter((row) => matches(row, matchState.match)) : task ? task.familyIds.map((id) => data.families.find((row) => row.id === id)).filter(Boolean) as Family[] : [];
  const projects = family ? data.projects.filter((row) => row.familyId === family.id) : [];

  return <>
    <button aria-label="关闭详情" className={`drawer-shade ${state ? "open" : ""}`} onClick={close} />
    <aside className={`detail-drawer ${state ? "open" : ""}`}>
      <button className="drawer-close" onClick={close}>关闭</button>
      {matchState && <><span className="drawer-label">具体产品</span><h2>{matchState.title}</h2><p className="drawer-intro">{matchState.explanation}</p><div className="drawer-number"><b>{families.length}</b><span>组不同产品</span></div><FamilyButtons rows={families} open={open} /></>}
      {task && <><span className="drawer-label">机器人任务</span><h2>{task.name}</h2><p className="drawer-intro">{task.direction}</p><div className="drawer-number"><b>{task.familyCount}</b><span>组机器人</span></div><FamilyButtons rows={families} open={open} /></>}
      {family && <><span className="drawer-label">{family.l1}，{family.l2}，{family.l3}</span><h2>{family.representativeProject}</h2><p className="drawer-intro">{family.enterprise}</p>{family.task && <div className="task-box"><span>它完成的任务</span><b>{family.task}</b><p>{family.taskDirection}</p></div>}<section className="drawer-section"><h3>项目在做什么</h3><p>{family.description || "项目简介没有填写"}</p></section><section className="drawer-section"><h3>合并进来的全部WAIC展品</h3><div className="raw-projects">{projects.map((project) => <article key={project.code}><div><b>{project.name}</b><span>{project.booth || "展位未填写"}</span></div><p>{project.description || "项目简介没有填写"}</p><small>分类依据：{project.basis}</small></article>)}</div></section></>}
    </aside>
  </>;
}

function FamilyButtons({ rows, open }: { rows: Family[]; open: (state: DetailState) => void }) {
  return <section className="drawer-section"><h3>这一类下面的具体项目</h3><div className="family-buttons">{rows.sort((a, b) => b.projectCount - a.projectCount).map((row) => <button key={row.id} onClick={() => open({ kind: "family", familyId: row.id })}><span><b>{row.representativeProject}</b><small>{row.enterprise}</small></span><strong>{row.projectCount > 1 ? `${row.projectCount}条` : "1条"}</strong></button>)}</div></section>;
}
