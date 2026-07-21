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
  officialTags: string[];
  confidence: string;
  basis: string;
  definition: string;
  logo: string;
  image: string;
  isNewProduct: boolean;
};

type Family = {
  id: string;
  enterprise: string;
  l1: string;
  l2: string;
  l3: string;
  projectCount: number;
  projectNames: string[];
  productCodes: string[];
  booths: string[];
  officialTags: string[];
  confidences: string[];
  representativeProject: string;
  description: string;
  logo: string;
  image: string;
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
  share: number;
  direction: string;
  maturity: string;
  caveat: string;
  l2: Level2[];
  importantCompanyKeys: string[];
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
  note: string;
  familyCount: number;
  projectCount: number;
  l3: string[];
  familyIds: string[];
};

type TaskSummary = {
  name: string;
  familyCount: number;
  enterpriseCount: number;
  projectCount: number;
  direction: string;
  familyIds: string[];
  importantCompanyKeys: string[];
  examples: { familyId: string; enterprise: string; project: string; l3: string }[];
};

type DashboardData = {
  metadata: {
    title: string;
    sourceName: string;
    officialPage: string;
    fetchedAt: string;
    officialRows: number;
    uniqueProjects: number;
    exactDuplicateRowsRemoved: number;
    productFamilies: number;
    enterprises: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
    aggregationRule: string;
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

type PageId = "overview" | "sectors" | "embodied" | "companies" | "projects" | "method";
type DrawerState =
  | { kind: "family"; familyId: string }
  | { kind: "l3"; row: Level3 }
  | { kind: "task"; task: TaskSummary }
  | null;

const pages: { id: PageId; number: string; label: string; note: string }[] = [
  { id: "overview", number: "01", label: "先看结论", note: "什么最热" },
  { id: "sectors", number: "02", label: "赛道下钻", note: "一级到三级" },
  { id: "embodied", number: "03", label: "具身智能", note: "部件与任务" },
  { id: "companies", number: "04", label: "重要公司", note: "有规模有闭环" },
  { id: "projects", number: "05", label: "全部项目", note: "筛选与回查" },
  { id: "method", number: "06", label: "口径说明", note: "为什么这样算" },
];

const pageCopy: Record<PageId, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "WAIC 2026 AI PROJECT MAP",
    title: "核心技术和具身智能最热，但具身的热度主要分布在整机、关节和灵巧操作",
    description: "先看合并后的产品族数量，再下钻到二级、三级行业和具体项目，避免同一家公司重复展示多个型号后把热度抬高",
  },
  sectors: {
    eyebrow: "SECTOR EXPLORER",
    title: "每个板块都能继续点开，直到看到它到底在做什么",
    description: "左侧选择一级行业，右侧先看白话解释和发展方向，再看二级、三级行业以及全部相关项目",
  },
  embodied: {
    eyebrow: "EMBODIED INTELLIGENCE",
    title: "具身智能最热的是整机，部件端最热的是关节、传感器和灵巧手",
    description: "任务层只统计能直接执行工作的整机和服务机器人，人形机器人单独拆开看，避免把关节和数据平台误算成机器人任务",
  },
  companies: {
    eyebrow: "IMPORTANT COMPANIES",
    title: "重要公司按公司体量、用户或客户规模、业务闭环筛选",
    description: "只列能找到规模、用户或客户、交付与收入闭环证据的公司，没有达到标准的板块不随机补公司",
  },
  projects: {
    eyebrow: "FULL PROJECT LEDGER",
    title: "962个产品族和1,432个原始项目都能筛选、搜索和回查",
    description: "默认看合并后的产品族，也可以切换到全部原始项目；昆仑芯等同一企业的同类展品已放在一个产品族里",
  },
  method: {
    eyebrow: "METHOD AND BOUNDARY",
    title: "热度看产品族数量，项目明细保留原始记录，重要公司另设证据门槛",
    description: "这三套口径分别回答赛道热度、项目完整性和代表公司重要性，不能混成一个数字",
  },
};

const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const shortCompany = (value: string) => value
  .replace(/股份有限公司|有限责任公司|有限公司|科技集团/g, "")
  .replace(/[（）()]/g, "")
  .trim();
const clip = (value: string, length = 120) => value.length > length ? `${value.slice(0, length)}…` : value;

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState<PageId>("overview");
  const [selectedSector, setSelectedSector] = useState("核心技术");
  const [navOpen, setNavOpen] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  useEffect(() => {
    fetch("/data/waic-dashboard.json")
      .then((response) => {
        if (!response.ok) throw new Error("数据文件读取失败");
        return response.json();
      })
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "数据读取失败"));
  }, []);

  useEffect(() => {
    const readHash = () => {
      const next = window.location.hash.replace("#", "") as PageId;
      if (pages.some((item) => item.id === next)) setPage(next);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
    };
  }, []);

  const go = (next: PageId, sectorName?: string) => {
    if (sectorName) setSelectedSector(sectorName);
    setPage(next);
    setNavOpen(false);
    window.history.pushState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) return <div className="load-state"><b>页面数据没有读出来</b><span>{error}</span></div>;
  if (!data) return <div className="load-state"><span className="loading-dot" /><b>正在整理全部项目</b><span>产品族、行业和任务场景正在载入</span></div>;

  const currentCopy = pageCopy[page];
  return (
    <div className="app-shell">
      <button className="nav-toggle" onClick={() => setNavOpen(true)} aria-label="打开目录">目录</button>
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="brand">
          <span>WAIC 2026</span>
          <b>AI项目全景</b>
          <small>一级行业到具体任务</small>
        </div>
        <nav className="side-nav" aria-label="页面目录">
          {pages.map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => go(item.id)}>
              <i>{item.number}</i>
              <span><b>{item.label}</b><small>{item.note}</small></span>
            </button>
          ))}
        </nav>
        <div className="side-source">
          <span>官方目录原始行</span>
          <b>{formatNumber(data.metadata.officialRows)}</b>
          <small>去除3条完全重复记录后，保留1,432个唯一项目</small>
        </div>
      </aside>
      <button className={`nav-shade ${navOpen ? "open" : ""}`} onClick={() => setNavOpen(false)} aria-label="关闭目录" />

      <div className="page-shell">
        <header className="page-head">
          <div className="eyebrow">{currentCopy.eyebrow}</div>
          <h1>{currentCopy.title}</h1>
          <p>{currentCopy.description}</p>
          <a className="date-chip" href={data.metadata.officialPage} target="_blank" rel="noreferrer">WAIC官方全量目录</a>
        </header>
        <main>
          {page === "overview" && <Overview data={data} go={go} openDrawer={setDrawer} />}
          {page === "sectors" && <SectorExplorer data={data} initialSector={selectedSector} openDrawer={setDrawer} go={go} />}
          {page === "embodied" && <EmbodiedExplorer data={data} openDrawer={setDrawer} />}
          {page === "companies" && <CompanyExplorer data={data} openDrawer={setDrawer} />}
          {page === "projects" && <ProjectLibrary data={data} openDrawer={setDrawer} />}
          {page === "method" && <Methodology data={data} />}
        </main>
        <footer>
          <span>数据来源：WAIC 2026官方展品目录</span>
          <span>抓取时间：{new Date(data.metadata.fetchedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span>
        </footer>
      </div>

      <DetailDrawer data={data} state={drawer} open={setDrawer} close={() => setDrawer(null)} />
    </div>
  );
}

function Overview({ data, go, openDrawer }: { data: DashboardData; go: (page: PageId, sectorName?: string) => void; openDrawer: (state: DrawerState) => void }) {
  const topSectors = data.sectors.slice(0, 12);
  const maxSector = topSectors[0].familyCount;
  const combined = (data.sectors.find((row) => row.name === "核心技术")?.familyCount || 0) + data.embodied.familyCount;
  const topL3 = data.sectors.flatMap((sector) => sector.l2.flatMap((l2) => l2.l3)).sort((a, b) => b.familyCount - a.familyCount).slice(0, 8);
  const core = data.sectors.find((row) => row.name === "核心技术")!;
  const embodied = data.sectors.find((row) => row.name === "具身智能")!;

  return (
    <>
      <section>
        <div className="metric-grid">
          <MetricCard label="合并后产品族" value={formatNumber(data.metadata.productFamilies)} note="判断赛道热度的主口径" tone="teal" />
          <MetricCard label="唯一原始项目" value={formatNumber(data.metadata.uniqueProjects)} note="全部项目都保留" tone="blue" />
          <MetricCard label="参展企业" value={formatNumber(data.metadata.enterprises)} note="标准化企业名称后去重" tone="gold" />
          <MetricCard label="一级到三级分类" value={`${data.metadata.level1Count} / ${data.metadata.level2Count} / ${data.metadata.level3Count}`} note="可逐层下钻" tone="olive" />
        </div>
      </section>

      <section>
        <div className="section-head">
          <div><span className="section-kicker">一句话结论</span><h2>核心技术和具身智能占全部产品族的{formatPercent(combined / data.metadata.productFamilies)}</h2></div>
          <button className="text-button" onClick={() => go("sectors")}>进入赛道下钻</button>
        </div>
        <div className="judgement-grid">
          <article className="judgement-card dark">
            <span>01</span>
            <h3>核心技术排第一，但里面最热的是AI算力与硬件</h3>
            <p>{core.familyCount}个产品族中，芯片、服务器、存储、网络和数据中心占了最大一块；模型、企业软件和开发平台紧随其后</p>
          </article>
          <article className="judgement-card">
            <span>02</span>
            <h3>具身智能排第二，热度已经拆到整机和关键部件</h3>
            <p>{embodied.familyCount}个产品族中，机器人整机最多；部件端以关节、传感器、灵巧手和夹爪最集中</p>
          </article>
          <article className="judgement-card">
            <span>03</span>
            <h3>项目多不等于规模落地，人形机器人尤其要看任务</h3>
            <p>人形机器人有22个产品族，通用动作和科研展示最多，工厂装配第二；接待、仓储和消防已经出现具体任务项目</p>
          </article>
        </div>
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="panel-head"><div><h2>一级行业热度</h2><p>按合并后的产品族数量排序</p></div></div>
          <div className="bar-list">
            {topSectors.map((sector) => (
              <button className="bar-row" key={sector.name} onClick={() => sector.name === "具身智能" ? go("embodied") : go("sectors", sector.name)}>
                <span className="bar-rank">{String(sector.rank).padStart(2, "0")}</span>
                <span className="bar-name">{sector.name}</span>
                <span className="bar-track"><i style={{ width: `${Math.max(3, sector.familyCount / maxSector * 100)}%` }} /></span>
                <b>{sector.familyCount}</b>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><h2>三级产品类型热度</h2><p>告诉你每个大词下面具体是什么</p></div></div>
          <div className="ranked-list">
            {topL3.map((row, index) => (
              <button key={`${row.l1}-${row.l2}-${row.name}`} onClick={() => openDrawer({ kind: "l3", row })}>
                <i>{index + 1}</i>
                <span><b>{row.name}</b><small>{row.l1}，{row.l2}</small></span>
                <strong>{row.familyCount}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="section-head"><div><span className="section-kicker">先看这些公司</span><h2>重要公司有规模、用户或客户，也有完整交付闭环</h2></div><button className="text-button" onClick={() => go("companies")}>查看全部重要公司</button></div>
        <div className="company-strip">
          {data.importantCompanies.slice(0, 8).map((company) => (
            <article key={`${company.l1}-${company.key}`}>
              <span>{company.l1}</span>
              <h3>{company.company}</h3>
              <p>{company.scale}</p>
              <div><b>{company.familyCount}</b>个产品族，<b>{company.projectCount}</b>个项目</div>
              <button onClick={() => company.familyIds[0] && openDrawer({ kind: "family", familyId: company.familyIds[0] })}>看WAIC项目</button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function MetricCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <article className={`metric-card ${tone}`}><span>{label}</span><b>{value}</b><small>{note}</small></article>;
}

function SectorExplorer({ data, initialSector, openDrawer, go }: { data: DashboardData; initialSector: string; openDrawer: (state: DrawerState) => void; go: (page: PageId) => void }) {
  const [sectorName, setSectorName] = useState(initialSector);
  const sector = data.sectors.find((row) => row.name === sectorName) || data.sectors[0];
  const [l2Name, setL2Name] = useState(sector.l2[0]?.name || "");
  const activeL2 = sector.l2.find((row) => row.name === l2Name) || sector.l2[0];
  const companies = data.importantCompanies.filter((company) => company.l1 === sector.name);
  const maxL2 = Math.max(...sector.l2.map((row) => row.familyCount), 1);

  const chooseSector = (name: string) => {
    const next = data.sectors.find((row) => row.name === name)!;
    setSectorName(name);
    setL2Name(next.l2[0]?.name || "");
  };

  return (
    <section className="sector-layout">
      <aside className="sector-list panel">
        {data.sectors.map((row) => (
          <button key={row.name} className={row.name === sector.name ? "active" : ""} onClick={() => chooseSector(row.name)}>
            <span><b>{row.rank}</b>{row.name}</span><strong>{row.familyCount}</strong>
          </button>
        ))}
      </aside>
      <div className="sector-content">
        <article className="sector-hero">
          <div><span>一级行业 #{sector.rank}</span><h2>{sector.name}</h2><p>{sector.definition}</p></div>
          <div className="sector-stats"><div><b>{sector.familyCount}</b><span>产品族</span></div><div><b>{sector.enterpriseCount}</b><span>企业</span></div><div><b>{sector.projectCount}</b><span>原始项目</span></div></div>
        </article>
        <div className="explain-grid">
          <article><span>现在往哪里发展</span><p>{sector.direction}</p></article>
          <article><span>现在做到什么阶段</span><p>{sector.maturity}</p></article>
          <article><span>读数字时注意</span><p>{sector.caveat}</p></article>
        </div>
        {sector.name === "具身智能" && <button className="embodied-jump" onClick={() => go("embodied")}><b>具身智能还有一层任务图谱</b><span>查看人形机器人、关节、灵巧手，以及装配、搬运、巡检等具体任务</span></button>}

        <div className="section-head compact"><div><span className="section-kicker">二级行业</span><h2>{sector.name}下面有哪些板块</h2></div></div>
        <div className="l2-grid">
          {sector.l2.map((row) => (
            <button key={row.name} className={activeL2?.name === row.name ? "active" : ""} onClick={() => setL2Name(row.name)}>
              <div><h3>{row.name}</h3><b>{row.familyCount}</b></div>
              <p>{row.definition}</p>
              <span className="mini-track"><i style={{ width: `${Math.max(4, row.familyCount / maxL2 * 100)}%` }} /></span>
              <small>{row.enterpriseCount}家企业，{row.projectCount}个原始项目</small>
            </button>
          ))}
        </div>

        {activeL2 && <>
          <div className="section-head compact"><div><span className="section-kicker">三级行业</span><h2>{activeL2.name}具体包括什么</h2><p>{activeL2.definition}</p></div></div>
          <div className="l3-grid">
            {activeL2.l3.map((row, index) => (
              <button key={row.name} onClick={() => openDrawer({ kind: "l3", row })}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{row.name}</h3>
                <p>{row.definition}</p>
                <div><b>{row.familyCount}</b>个产品族 <i>{row.projectCount}个项目</i></div>
              </button>
            ))}
          </div>
        </>}

        <div className="section-head compact"><div><span className="section-kicker">重要公司</span><h2>{companies.length ? `${sector.name}里达到统一证据标准的公司` : `${sector.name}暂不强行举例`}</h2></div></div>
        {companies.length ? <div className="important-mini-grid">{companies.map((company) => <ImportantCompanyCard key={company.key} company={company} openDrawer={openDrawer} />)}</div> : <div className="empty-panel">现有样本里没有同时满足公司体量、用户或客户、业务闭环证据标准的公司，项目仍可在项目库中查看</div>}
      </div>
    </section>
  );
}

function EmbodiedExplorer({ data, openDrawer }: { data: DashboardData; openDrawer: (state: DrawerState) => void }) {
  const [taskMode, setTaskMode] = useState<"all" | "humanoid">("all");
  const tasks = taskMode === "all" ? data.embodied.tasks : data.embodied.humanoidTasks;
  const maxTask = Math.max(...tasks.map((task) => task.familyCount), 1);
  const maxL2 = Math.max(...data.embodied.l2.map((row) => row.familyCount), 1);
  const humanoidTop = data.embodied.humanoidTasks[0];
  const humanoidSecond = data.embodied.humanoidTasks[1];

  return (
    <>
      <section>
        <div className="answer-banner">
          <div><span>直接回答你的问题</span><h2>具身智能最热的是机器人整机；整机里通用具身机器人最多，人形机器人排第二</h2><p>部件端最热的是关节与传动，其后是传感器、灵巧手与夹爪；软件端的仿真训练和数据平台已经成为单独一类</p></div>
          <div className="answer-number"><b>{data.embodied.familyCount}</b><span>个具身智能产品族</span></div>
        </div>
      </section>

      <section>
        <div className="section-head"><div><span className="section-kicker">产业链热度</span><h2>先分清是整机热、部件热，还是模型和数据热</h2></div></div>
        <div className="chain-grid">
          {data.embodied.l2.map((row, index) => (
            <article key={row.name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{row.name}</h3><p>{row.definition}</p></div>
              <strong>{row.familyCount}</strong>
              <i className="chain-bar"><em style={{ width: `${Math.max(4, row.familyCount / maxL2 * 100)}%` }} /></i>
              <small>{row.l3.slice(0, 3).map((item) => item.name).join("、")}</small>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head"><div><span className="section-kicker">三级产品类型</span><h2>具身智能下面最集中的具体产品</h2></div></div>
        <div className="hotspot-grid">
          {data.embodied.l3.slice(0, 10).map((row, index) => (
            <button key={row.name} onClick={() => openDrawer({ kind: "l3", row })}>
              <i>{index + 1}</i><span><b>{row.name}</b><small>{row.definition}</small></span><strong>{row.familyCount}</strong>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="task-head">
          <div><span className="section-kicker">机器人任务</span><h2>{taskMode === "all" ? "现在参展机器人主要在完成什么任务" : "人形机器人里，哪一种具体任务最热"}</h2></div>
          <div className="segmented"><button className={taskMode === "all" ? "active" : ""} onClick={() => setTaskMode("all")}>全部整机</button><button className={taskMode === "humanoid" ? "active" : ""} onClick={() => setTaskMode("humanoid")}>只看人形</button></div>
        </div>
        {taskMode === "humanoid" && humanoidTop && <div className="humanoid-callout"><b>人形机器人当前最集中的是{humanoidTop.name}，共{humanoidTop.familyCount}个产品族</b><p>{humanoidSecond ? `${humanoidSecond.name}排第二，共${humanoidSecond.familyCount}个产品族；` : ""}这说明当前参展项目里，本体和动作能力展示仍多于已经固定下来的生产任务</p></div>}
        <div className="task-grid">
          {tasks.map((task, index) => (
            <button key={task.name} onClick={() => openDrawer({ kind: "task", task })}>
              <div className="task-title"><span>{String(index + 1).padStart(2, "0")}</span><h3>{task.name}</h3><b>{task.familyCount}</b></div>
              <span className="task-track"><i style={{ width: `${Math.max(4, task.familyCount / maxTask * 100)}%` }} /></span>
              <p>{task.direction}</p>
              <small>{task.examples.slice(0, 3).map((example) => shortCompany(example.enterprise)).join("、")}</small>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head"><div><span className="section-kicker">重要公司</span><h2>具身智能里优先看有量产、客户和完整交付的公司</h2></div></div>
        <div className="important-mini-grid">
          {data.importantCompanies.filter((company) => company.l1 === "具身智能").map((company) => <ImportantCompanyCard key={company.key} company={company} openDrawer={openDrawer} />)}
        </div>
      </section>
    </>
  );
}

function CompanyExplorer({ data, openDrawer }: { data: DashboardData; openDrawer: (state: DrawerState) => void }) {
  const sectors = unique(data.importantCompanies.map((company) => company.l1));
  const [sector, setSector] = useState("全部");
  const rows = sector === "全部" ? data.importantCompanies : data.importantCompanies.filter((company) => company.l1 === sector);
  return (
    <section>
      <div className="company-method">
        <div><span>筛选标准</span><h2>满足公司体量、用户或客户规模、业务闭环中的至少两项</h2></div>
        <p>公司体量看上市公司、集团规模或明确的专业龙头地位；用户或客户看公开披露数量；闭环看产品是否已经形成销售、部署、订阅、运营或持续服务</p>
      </div>
      <div className="filter-bar simple">
        <label><span>按板块筛选</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option>全部</option>{sectors.map((name) => <option key={name}>{name}</option>)}</select></label>
        <strong>{rows.length}家公司和板块组合</strong>
      </div>
      <div className="important-grid">
        {rows.map((company) => <ImportantCompanyCard key={`${company.l1}-${company.key}`} company={company} openDrawer={openDrawer} detailed />)}
      </div>
    </section>
  );
}

function ImportantCompanyCard({ company, openDrawer, detailed = false }: { company: ImportantCompany; openDrawer: (state: DrawerState) => void; detailed?: boolean }) {
  return (
    <article className={`important-card ${detailed ? "detailed" : ""}`}>
      <div className="important-head"><span>{company.l1}</span><b>{company.totalScore}/6</b></div>
      <h3>{company.company}</h3>
      <dl>
        <div><dt>公司体量</dt><dd>{company.scale}</dd></div>
        <div><dt>用户或客户</dt><dd>{company.users}</dd></div>
        <div><dt>业务闭环</dt><dd>{company.loop}</dd></div>
      </dl>
      <div className="company-tags">{company.l3.slice(0, 5).map((name) => <span key={name}>{name}</span>)}</div>
      <div className="company-footer"><span>{company.familyCount}个产品族，{company.projectCount}个项目</span><button onClick={() => company.familyIds[0] && openDrawer({ kind: "family", familyId: company.familyIds[0] })}>查看项目</button></div>
      {detailed && <div className="source-row">{company.sourceUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">证据来源{company.sourceUrls.length > 1 ? index + 1 : ""}</a>)}<span>{company.evidenceDate}</span></div>}
    </article>
  );
}

function ProjectLibrary({ data, openDrawer }: { data: DashboardData; openDrawer: (state: DrawerState) => void }) {
  const [view, setView] = useState<"families" | "projects">("families");
  const [query, setQuery] = useState("");
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [l3, setL3] = useState("");
  const [task, setTask] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const familyById = useMemo(() => new Map(data.families.map((family) => [family.id, family])), [data.families]);
  const l2Options = unique(data.families.filter((row) => !l1 || row.l1 === l1).map((row) => row.l2)).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const l3Options = unique(data.families.filter((row) => (!l1 || row.l1 === l1) && (!l2 || row.l2 === l2)).map((row) => row.l3)).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const taskOptions = unique(data.families.map((row) => row.task)).filter(Boolean);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = view === "families" ? data.families : data.projects;
    return rows.filter((row) => {
      const family = view === "families" ? row as Family : familyById.get((row as Project).familyId)!;
      const project = view === "projects" ? row as Project : null;
      const haystack = view === "families"
        ? `${family.enterprise} ${family.projectNames.join(" ")} ${family.description} ${family.l1} ${family.l2} ${family.l3}`
        : `${project!.enterprise} ${project!.name} ${project!.description} ${project!.l1} ${project!.l2} ${project!.l3}`;
      return (!needle || haystack.toLowerCase().includes(needle))
        && (!l1 || family.l1 === l1)
        && (!l2 || family.l2 === l2)
        && (!l3 || family.l3 === l3)
        && (!task || family.task === task);
    }).sort((a, b) => {
      const af = view === "families" ? a as Family : familyById.get((a as Project).familyId)!;
      const bf = view === "families" ? b as Family : familyById.get((b as Project).familyId)!;
      return (bf.projectCount || 1) - (af.projectCount || 1) || af.enterprise.localeCompare(bf.enterprise, "zh-CN");
    });
  }, [data.families, data.projects, familyById, l1, l2, l3, query, task, view]);

  const pagesCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, page * pageSize);
  const reset = () => { setQuery(""); setL1(""); setL2(""); setL3(""); setTask(""); setPage(1); };

  return (
    <section>
      <div className="library-toolbar">
        <div><h2>{view === "families" ? "合并后的产品族" : "全部原始项目"}</h2><p>{view === "families" ? "适合判断哪个方向最热，同一企业同一三级行业只算一个产品族" : "适合核对具体产品名、展位、简介和分类依据"}</p></div>
        <div className="segmented"><button className={view === "families" ? "active" : ""} onClick={() => { setView("families"); setPage(1); }}>产品族 962</button><button className={view === "projects" ? "active" : ""} onClick={() => { setView("projects"); setPage(1); }}>原始项目 1,432</button></div>
      </div>
      <div className="filter-bar">
        <label className="search-field"><span>搜索公司或项目</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="例如：昆仑芯、人形机器人、巡检" /></label>
        <label><span>一级行业</span><select value={l1} onChange={(event) => { setL1(event.target.value); setL2(""); setL3(""); setPage(1); }}><option value="">全部</option>{data.sectors.map((row) => <option key={row.name}>{row.name}</option>)}</select></label>
        <label><span>二级行业</span><select value={l2} onChange={(event) => { setL2(event.target.value); setL3(""); setPage(1); }}><option value="">全部</option>{l2Options.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label><span>三级行业</span><select value={l3} onChange={(event) => { setL3(event.target.value); setPage(1); }}><option value="">全部</option>{l3Options.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label><span>机器人任务</span><select value={task} onChange={(event) => { setTask(event.target.value); setPage(1); }}><option value="">全部</option>{taskOptions.map((name) => <option key={name}>{name}</option>)}</select></label>
        <button className="reset-button" onClick={reset}>重置</button>
      </div>
      <div className="result-line"><span>当前找到 <b>{formatNumber(filtered.length)}</b> 条</span><span>第 {page} / {pagesCount} 页</span></div>
      <div className="library-grid">
        {slice.map((row) => {
          const family = view === "families" ? row as Family : familyById.get((row as Project).familyId)!;
          const project = view === "projects" ? row as Project : null;
          return (
            <article key={view === "families" ? family.id : project!.code}>
              <div className="library-tags"><span>{family.l1}</span><span>{family.l2}</span>{family.task && <span className="task-tag">{family.task}</span>}</div>
              <h3>{view === "families" ? family.representativeProject : project!.name}</h3>
              <b className="library-company">{view === "families" ? family.enterprise : project!.enterprise}</b>
              <p>{clip(view === "families" ? family.description : project!.description, 150)}</p>
              <div className="library-meta"><span>{family.l3}</span><span>{view === "families" ? `${family.projectCount}个项目已合并` : (project!.booth || "展位未披露")}</span></div>
              <button onClick={() => openDrawer({ kind: "family", familyId: family.id })}>{view === "families" ? "查看合并明细" : "查看所属产品族"}</button>
            </article>
          );
        })}
      </div>
      {!slice.length && <div className="empty-panel">没有符合当前条件的项目，可以减少筛选条件后再看</div>}
      <div className="pager"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</button><span>第 {page} / {pagesCount} 页</span><button disabled={page >= pagesCount} onClick={() => setPage((value) => value + 1)}>下一页</button></div>
    </section>
  );
}

function Methodology({ data }: { data: DashboardData }) {
  return (
    <>
      <section>
        <div className="method-grid">
          <article><span>01</span><h2>项目范围</h2><p>WAIC官方目录共返回{formatNumber(data.metadata.officialRows)}行，去除{data.metadata.exactDuplicateRowsRemoved}条完全重复记录后，得到{formatNumber(data.metadata.uniqueProjects)}个唯一项目。所有唯一项目都进入项目库，没有抽样</p></article>
          <article><span>02</span><h2>热度口径</h2><p>{data.metadata.aggregationRule}。因此热度排行使用{formatNumber(data.metadata.productFamilies)}个产品族，避免同一家公司报很多型号后重复计数</p></article>
          <article><span>03</span><h2>三级分类</h2><p>一级行业沿用WAIC官方首个行业标签，二级和三级行业根据项目名称与简介细分。每个项目都保留分类依据和置信度，可在原始项目中回查</p></article>
          <article><span>04</span><h2>任务口径</h2><p>机器人任务只在“机器人整机”和“服务机器人与自动化”中判断。关节、灵巧手、传感器、模型和数据平台属于能力供给，不计入完成任务的机器人数量</p></article>
          <article><span>05</span><h2>重要公司</h2><p>重要公司需要满足公司体量、用户或客户规模、业务闭环中的至少两项，并提供可打开的来源。没有达到标准的板块不随机举例</p></article>
          <article><span>06</span><h2>结论边界</h2><p>这个前端反映WAIC 2026参展项目结构，可以说明哪些方向展示更集中。它不能直接替代收入、出货量、融资额或市场份额</p></article>
        </div>
      </section>
      <section className="source-panel">
        <div><span>唯一主数据源</span><h2>{data.metadata.sourceName}</h2><p>官方页面、项目名称、企业名称、展位、项目简介和官方行业标签均来自WAIC目录</p></div>
        <a href={data.metadata.officialPage} target="_blank" rel="noreferrer">打开WAIC官方目录</a>
      </section>
    </>
  );
}

function DetailDrawer({ data, state, open, close }: { data: DashboardData; state: DrawerState; open: (state: DrawerState) => void; close: () => void }) {
  const family = state?.kind === "family" ? data.families.find((row) => row.id === state.familyId) : null;
  const l3 = state?.kind === "l3" ? state.row : null;
  const task = state?.kind === "task" ? state.task : null;
  const matchingFamilies = l3
    ? data.families.filter((row) => row.l1 === l3.l1 && row.l2 === l3.l2 && row.l3 === l3.name)
    : task
      ? task.familyIds.map((id) => data.families.find((row) => row.id === id)!).filter(Boolean)
      : [];
  const projects = family ? data.projects.filter((project) => project.familyId === family.id) : [];

  return (
    <>
      <button className={`drawer-shade ${state ? "open" : ""}`} onClick={close} aria-label="关闭详情" />
      <aside className={`drawer ${state ? "open" : ""}`} aria-hidden={!state}>
        <button className="drawer-close" onClick={close}>关闭</button>
        {family && <>
          <span className="drawer-kicker">{family.id}，{family.l1}，{family.l2}</span>
          <h2>{family.representativeProject}</h2>
          <p className="drawer-lead">{family.enterprise}</p>
          <div className="drawer-stats"><div><b>{family.projectCount}</b><span>合并项目</span></div><div><b>{family.productCodes.length}</b><span>唯一编号</span></div><div><b>{family.booths.length}</b><span>展位</span></div></div>
          <div className="drawer-path"><span>一级</span><b>{family.l1}</b><span>二级</span><b>{family.l2}</b><span>三级</span><b>{family.l3}</b>{family.task && <><span>任务</span><b>{family.task}</b></>}</div>
          <section className="drawer-section"><h3>这个产品族在做什么</h3><p>{family.description || "项目简介未披露"}</p></section>
          {family.taskDirection && <section className="drawer-section direction-box"><h3>这一任务往哪里发展</h3><p>{family.taskDirection}</p></section>}
          <section className="drawer-section"><h3>合并进来的全部原始项目</h3><div className="drawer-projects">{projects.map((project) => <article key={project.code}><b>{project.name}</b><span>{project.booth || "展位未披露"}</span><p>{project.description || "项目简介未披露"}</p><small>分类依据：{project.basis}</small></article>)}</div></section>
        </>}
        {l3 && <>
          <span className="drawer-kicker">{l3.l1}，{l3.l2}</span>
          <h2>{l3.name}</h2>
          <p className="drawer-lead">{l3.definition}</p>
          <div className="drawer-stats"><div><b>{l3.familyCount}</b><span>产品族</span></div><div><b>{l3.enterpriseCount}</b><span>企业</span></div><div><b>{l3.projectCount}</b><span>原始项目</span></div></div>
          <section className="drawer-section"><h3>具体项目</h3><div className="drawer-family-list">{matchingFamilies.map((row) => <button key={row.id} onClick={() => open({ kind: "family", familyId: row.id })}><span><b>{row.representativeProject}</b><small>{row.enterprise}</small></span><strong>{row.projectCount}</strong></button>)}</div></section>
        </>}
        {task && <>
          <span className="drawer-kicker">机器人任务</span>
          <h2>{task.name}</h2>
          <p className="drawer-lead">{task.direction}</p>
          <div className="drawer-stats"><div><b>{task.familyCount}</b><span>产品族</span></div><div><b>{task.enterpriseCount}</b><span>企业</span></div><div><b>{task.projectCount}</b><span>原始项目</span></div></div>
          <section className="drawer-section"><h3>这一任务下面的具体项目</h3><div className="drawer-family-list">{matchingFamilies.map((row) => <button key={row.id} onClick={() => open({ kind: "family", familyId: row.id })}><span><b>{row.representativeProject}</b><small>{row.enterprise}，{row.l3}</small></span><strong>{row.projectCount}</strong></button>)}</div></section>
        </>}
      </aside>
    </>
  );
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}
