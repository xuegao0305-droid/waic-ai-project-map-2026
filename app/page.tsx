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
  work: string;
  audience: string;
  evidenceStage: string;
  evidenceStageBasis: string;
};

type EvidenceStage = { name: string; count: number };

type Level3 = {
  rank?: number;
  l1: string;
  l2: string;
  name: string;
  definition: string;
  work: string;
  audience: string;
  familyCount: number;
  enterpriseCount: number;
  projectCount: number;
  familyIds: string[];
  exampleFamilyIds: string[];
  evidenceStages: EvidenceStage[];
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
    level1Count: number;
    level2Count: number;
    level3Count: number;
    aggregationRule: string;
  };
  sectors: Sector[];
  globalL3: Level3[];
  importantCompanies: ImportantCompany[];
  embodied: {
    tasks: TaskSummary[];
    humanoidTasks: TaskSummary[];
  };
  families: Family[];
  projects: Project[];
};

type Match = { l1?: string[]; l2?: string[]; l3?: string[] };
type PageId = "overview" | "drilldown" | "projects" | "method";
type DetailState =
  | { kind: "match"; title: string; explanation: string; match: Match }
  | { kind: "task"; task: TaskSummary }
  | { kind: "family"; familyId: string }
  | null;

const navItems: { id: PageId; label: string; note: string }[] = [
  { id: "overview", label: "全量判断", note: "先比较全部20个行业" },
  { id: "drilldown", label: "逐层拆解", note: "每个行业用同一套字段" },
  { id: "projects", label: "全部项目", note: "搜索、筛选和查看原文" },
  { id: "method", label: "统计说明", note: "去重、热度和公司标准" },
];

const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const clip = (value: string, length = 120) => value.length > length ? `${value.slice(0, length)}…` : value;
const unique = <T,>(values: T[]) => [...new Set(values)];

function matches(row: Family, match: Match) {
  return (!match.l1 || match.l1.includes(row.l1))
    && (!match.l2 || match.l2.includes(row.l2))
    && (!match.l3 || match.l3.includes(row.l3));
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState<PageId>("overview");
  const [selectedSector, setSelectedSector] = useState("核心技术");
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

  const go = (next: PageId, sector?: string) => {
    if (sector) setSelectedSector(sector);
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
        <div className="site-brand"><small>WAIC 2026</small><b>AI项目全量拆解</b><span>行业、产品、任务、项目和公司</span></div>
        <nav>
          {navItems.map((item, index) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => go(item.id)}>
              <i>{String(index + 1).padStart(2, "0")}</i><span><b>{item.label}</b><small>{item.note}</small></span>
            </button>
          ))}
        </nav>
        <div className="side-note">
          <span>完整数据范围</span>
          <b>{formatNumber(data.metadata.uniqueProjects)}个WAIC项目</b>
          <small>全部保留。页面把同一家公司在同一三级方向下的重复展品合并成962组产品。</small>
        </div>
      </aside>
      <button aria-label="关闭目录" className={`page-shade ${mobileNav ? "open" : ""}`} onClick={() => setMobileNav(false)} />

      <main className="content-shell">
        {page === "overview" && <OverviewPage data={data} openDetail={setDetail} go={go} />}
        {page === "drilldown" && <DrilldownPage data={data} sectorName={selectedSector} setSectorName={setSelectedSector} openDetail={setDetail} />}
        {page === "projects" && <ProjectPage data={data} openDetail={setDetail} />}
        {page === "method" && <MethodPage data={data} />}
        <footer><span>数据来自WAIC 2026官方项目目录</span><a href={data.metadata.officialPage} target="_blank" rel="noreferrer">打开官方目录</a></footer>
      </main>

      <DetailDrawer data={data} state={detail} open={setDetail} close={() => setDetail(null)} />
    </div>
  );
}

function PageIntro({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return <header className="page-intro"><span>{kicker}</span><h1>{title}</h1><p>{text}</p></header>;
}

function OverviewPage({ data, openDetail, go }: { data: DashboardData; openDetail: (state: DetailState) => void; go: (page: PageId, sector?: string) => void }) {
  const topL2 = data.sectors.flatMap((sector) => sector.l2).sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount).slice(0, 8);
  const topL3 = data.globalL3.slice(0, 15);
  const core = data.sectors.find((row) => row.name === "核心技术")!;
  const embodied = data.sectors.find((row) => row.name === "具身智能")!;
  const humanoid = data.globalL3.find((row) => row.name === "人形机器人")!;
  const infrastructureShare = (core.familyCount + embodied.familyCount) / data.metadata.productFamilies;

  return (
    <>
      <PageIntro kicker="先做全量比较" title="WAIC最集中的项目是AI底座和机器人，具体热点要继续看到三级方向" text="本页先比较全部20个一级行业、89个二级方向和191个三级方向。用户举出的例子只作为待核验问题，最终排序全部来自同一套合并口径。" />

      <section className="metric-strip">
        <article><span>官方项目</span><b>{formatNumber(data.metadata.uniqueProjects)}</b><small>一条未少</small></article>
        <article><span>合并后产品组</span><b>{formatNumber(data.metadata.productFamilies)}</b><small>用于比较热度</small></article>
        <article><span>三级方向</span><b>{data.metadata.level3Count}</b><small>继续下钻的最细层</small></article>
        <article><span>参展企业</span><b>{data.metadata.enterprises}</b><small>标准化名称后</small></article>
      </section>

      <section className="answer-grid">
        <article className="primary-answer"><span>全量结论</span><h2>核心技术有{core.familyCount}组，具身智能有{embodied.familyCount}组，两者合计占全部产品组的{formatPercent(infrastructureShare)}</h2><p>WAIC展台的项目供给集中在算力、模型、企业软件、机器人整机和机器人部件。这个比例描述展会项目结构，不代表市场收入份额。</p></article>
        <article><span>人形机器人位置</span><h3>22组，排在191个三级方向的第{humanoid.rank}位</h3><p>通用具身机器人70组、AI芯片38组、大语言模型29组、机器人关节26组，数量都更高。</p></article>
        <article><span>软件侧集中点</span><h3>企业软件77组，大模型与算法69组</h3><p>办公协同、内容创作、客服营销和软件开发已经形成一批明确产品。</p></article>
      </section>

      <section>
        <div className="section-title"><span>一级行业</span><h2>全部20个板块按同一口径排名</h2><p>点击任意一行，会进入该行业的二级、三级、实际项目、使用对象和落地线索。</p></div>
        <div className="rank-list sector-rank-list">
          {data.sectors.map((sector) => (
            <button key={sector.name} onClick={() => go("drilldown", sector.name)}>
              <i>{String(sector.rank).padStart(2, "0")}</i>
              <span><b>{sector.name}</b><small>{sector.l2[0]?.name}是其中最大的二级方向</small></span>
              <div className="rank-bar"><u style={{ width: `${Math.max(2, sector.familyCount / core.familyCount * 100)}%` }} /></div>
              <strong>{sector.familyCount}</strong><em>组</em>
            </button>
          ))}
        </div>
      </section>

      <section className="split-section">
        <div>
          <div className="section-title"><span>二级方向</span><h2>项目最多的八个业务板块</h2></div>
          <div className="compact-rank">
            {topL2.map((row, index) => <button key={`${row.l1}-${row.name}`} onClick={() => openDetail({ kind: "match", title: row.name, explanation: row.definition, match: { l1: [row.l1], l2: [row.name] } })}><i>{index + 1}</i><span><b>{row.name}</b><small>{row.l1}</small></span><strong>{row.familyCount}</strong></button>)}
          </div>
        </div>
        <div>
          <div className="section-title"><span>整体方向</span><h2>展品正在沿三条路径形成产品</h2></div>
          <div className="direction-list">
            <article><i>1</i><div><h3>算力从单个芯片扩展到整套系统</h3><p>芯片38组，服务器24组，互联23组，液冷21组，智算集群19组，供应链各环节都有集中项目。</p></div></article>
            <article><i>2</i><div><h3>机器人同步补整机、关节、感知和操作</h3><p>通用具身整机70组，关节26组，传感器20组，灵巧手16组。人形机器人只是整机形态中的一个三级方向。</p></div></article>
            <article><i>3</i><div><h3>企业软件开始承接固定工作</h3><p>办公协同17组、内容创作19组、客服营销12组、软件开发10组，产品逐渐连接企业已有数据和流程。</p></div></article>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title"><span>三级方向</span><h2>191个具体方向中，前15名是什么</h2><p>每一行都可以打开实际项目。排序看合并后的产品组数量。</p></div>
        <div className="rank-list l3-global-list">
          {topL3.map((row) => <button key={`${row.l1}-${row.l2}-${row.name}`} onClick={() => openDetail({ kind: "match", title: row.name, explanation: row.work, match: { l1: [row.l1], l2: [row.l2], l3: [row.name] } })}><i>{String(row.rank).padStart(2, "0")}</i><span><b>{row.name}</b><small>{row.work}</small></span><u>{row.l1}</u><strong>{row.familyCount}</strong><em>查看项目</em></button>)}
        </div>
      </section>
    </>
  );
}

function DrilldownPage({ data, sectorName, setSectorName, openDetail }: { data: DashboardData; sectorName: string; setSectorName: (name: string) => void; openDetail: (state: DetailState) => void }) {
  const sector = data.sectors.find((row) => row.name === sectorName) || data.sectors[0];
  const [l2Name, setL2Name] = useState(sector.l2[0]?.name || "");

  const l2 = sector.l2.find((row) => row.name === l2Name) || sector.l2[0];
  const topL3 = sector.l2.flatMap((row) => row.l3).sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount)[0];
  const exampleIds = unique((l2?.l3 || []).flatMap((row) => row.exampleFamilyIds)).slice(0, 6);
  const examples = exampleIds.map((id) => data.families.find((row) => row.id === id)).filter(Boolean) as Family[];
  const companies = sector.importantCompanyKeys.map((key) => data.importantCompanies.find((row) => row.key === key)).filter(Boolean) as ImportantCompany[];
  const showRobotTasks = sector.name === "具身智能" && l2?.name === "机器人整机";

  const chooseSector = (name: string) => {
    const next = data.sectors.find((row) => row.name === name)!;
    setSectorName(name);
    setL2Name(next.l2[0]?.name || "");
  };

  return (
    <>
      <PageIntro kicker="所有行业使用同一套拆法" title="先看大板块，再看具体产品、工作、使用对象和实际项目" text="选择任何一级行业，页面都会继续拆到二级和三级。机器人整机额外按任务重算，因为“人形、四足、轮式”只说明外形，无法说明它实际完成什么工作。" />

      <section className="sector-picker">
        {data.sectors.map((row) => <button key={row.name} className={row.name === sector.name ? "active" : ""} onClick={() => chooseSector(row.name)}><span>{row.name}</span><b>{row.familyCount}</b></button>)}
      </section>

      <section className="sector-summary">
        <div><span>第{sector.rank}位 · 一级行业</span><h2>{sector.name}</h2><p>{sector.definition}</p></div>
        <div><b>{sector.familyCount}</b><span>组不同产品</span><small>{sector.enterpriseCount}家公司 · {sector.projectCount}条原始项目</small></div>
      </section>

      <section className="plain-answer">
        <span>这个板块具体热在哪里</span>
        <h2>{sector.l2[0]?.name}是最大的二级方向，有{sector.l2[0]?.familyCount}组；继续下钻后，{topL3?.name}最多，有{topL3?.familyCount}组</h2>
        <p>{topL3?.work}。主要面向{topL3?.audience}。</p>
      </section>

      <section>
        <div className="section-title"><span>第一层下钻</span><h2>{sector.name}下面有哪些二级业务</h2></div>
        <div className="l2-list">
          {sector.l2.map((row) => <button key={row.name} className={row.name === l2?.name ? "active" : ""} onClick={() => setL2Name(row.name)}><div><b>{row.name}</b><strong>{row.familyCount}</strong></div><p>{row.definition}</p><small>{row.l3.length}个三级方向</small></button>)}
        </div>
      </section>

      {l2 && <section>
        <div className="section-title"><span>第二层下钻</span><h2>{l2.name}具体在做什么</h2><p>这里的“落地线索”只读取WAIC项目自述中的量产、交付、试点、研发等关键词，不替代外部尽调。</p></div>
        <div className="deep-list">
          {l2.l3.map((row, index) => (
            <button key={row.name} onClick={() => openDetail({ kind: "match", title: row.name, explanation: row.work, match: { l1: [row.l1], l2: [row.l2], l3: [row.name] } })}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              <div><b>{row.name}</b><p>{row.work}</p><small>使用对象：{row.audience}</small></div>
              <aside><span>{row.evidenceStages[0]?.name || "产品说明"}</span><small>{row.evidenceStages[0]?.count || row.familyCount}/{row.familyCount}组</small></aside>
              <strong>{row.familyCount}</strong>
              <em>查看项目</em>
            </button>
          ))}
        </div>
      </section>}

      {showRobotTasks && <RobotTaskSection data={data} openDetail={openDetail} />}

      <section className="split-section">
        <div>
          <div className="section-title"><span>实际项目</span><h2>{l2?.name}里的代表性展品</h2><p>优先显示有重要公司依据、合并项目较多或说明较完整的产品，点击后可看原始项目。</p></div>
          <div className="example-list">
            {examples.map((family) => <button key={family.id} onClick={() => openDetail({ kind: "family", familyId: family.id })}><span>{family.l3}</span><h3>{family.representativeProject}</h3><p>{family.enterprise}</p><small>{family.evidenceStage} · {family.projectCount > 1 ? `${family.projectCount}条同类展品已合并` : "1条WAIC展品"}</small></button>)}
          </div>
        </div>
        <div>
          <div className="section-title"><span>发展方向</span><h2>{sector.name}正在往哪里走</h2></div>
          <div className="direction-list">
            <article><i>1</i><div><h3>产品方向</h3><p>{sector.direction}</p></div></article>
            <article><i>2</i><div><h3>当前落地状态</h3><p>{sector.maturity}</p></div></article>
            <article><i>3</i><div><h3>阅读边界</h3><p>{sector.caveat}</p></div></article>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title"><span>代表公司</span><h2>{companies.length ? `${sector.name}只列证据排名靠前的${companies.length}家公司` : `${sector.name}暂未选代表公司`}</h2><p>入选依据是公司体量、用户或客户规模、已经形成的交付闭环。WAIC展品数量不参与公司重要性评分。</p></div>
        {companies.length > 0 ? <div className="company-grid">{companies.map((company, index) => <CompanyCard key={company.key} rank={index + 1} company={company} data={data} openDetail={openDetail} />)}</div> : <div className="empty-note">现有公开证据不足，页面保留全部项目，不随机挑选公司填满版面。</div>}
      </section>
    </>
  );
}

function RobotTaskSection({ data, openDetail }: { data: DashboardData; openDetail: (state: DetailState) => void }) {
  const [mode, setMode] = useState<"all" | "humanoid">("all");
  const tasks = mode === "humanoid" ? data.embodied.humanoidTasks : data.embodied.tasks;
  return <section><div className="section-title"><span>整机再按任务拆</span><h2>机器人长什么样和它做什么工作分开统计</h2><p>这一步只用于机器人整机。部件、软件和模型不会被算成已经完成任务的机器人。</p></div><div className="task-toggle"><button className={mode === "all" ? "active" : ""} onClick={() => setMode("all")}>全部机器人整机</button><button className={mode === "humanoid" ? "active" : ""} onClick={() => setMode("humanoid")}>只看人形机器人</button></div><div className="task-list">{tasks.map((task, index) => <button key={task.name} onClick={() => openDetail({ kind: "task", task })}><i>{String(index + 1).padStart(2, "0")}</i><span><b>{task.name}</b><small>{task.examples.slice(0, 3).map((item) => `${item.enterprise} · ${item.project}`).join("；")}</small></span><strong>{task.familyCount}</strong><em>组</em></button>)}</div></section>;
}

function CompanyCard({ rank, company, data, openDetail }: { rank: number; company: ImportantCompany; data: DashboardData; openDetail: (state: DetailState) => void }) {
  const project = company.familyIds.map((id) => data.families.find((row) => row.id === id)).find(Boolean);
  return <article className="company-card"><div><i>{String(rank).padStart(2, "0")}</i><span>证据评分 {company.totalScore}/6</span></div><h3>{company.company}</h3><dl><div><dt>公司体量</dt><dd>{company.scale}</dd></div><div><dt>用户或客户</dt><dd>{company.users}</dd></div><div><dt>业务闭环</dt><dd>{company.loop}</dd></div></dl>{project && <button onClick={() => openDetail({ kind: "family", familyId: project.id })}><span>WAIC项目</span><b>{project.representativeProject}</b></button>}<footer>{company.sourceUrls.slice(0, 2).map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">公司依据{company.sourceUrls.length > 1 ? index + 1 : ""}</a>)}</footer></article>;
}

function ProjectPage({ data, openDetail }: { data: DashboardData; openDetail: (state: DetailState) => void }) {
  const [raw, setRaw] = useState(false);
  const [query, setQuery] = useState("");
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [l3, setL3] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const rows = raw ? data.projects : data.families;
  const l2Options = unique(rows.filter((row) => !l1 || row.l1 === l1).map((row) => row.l2)).sort();
  const l3Options = unique(rows.filter((row) => (!l1 || row.l1 === l1) && (!l2 || row.l2 === l2)).map((row) => row.l3)).sort();

  const filtered = useMemo(() => rows.filter((row) => {
    const name = "name" in row ? row.name : row.representativeProject;
    const text = `${name} ${row.enterprise} ${row.description} ${row.l1} ${row.l2} ${row.l3}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (!l1 || row.l1 === l1) && (!l2 || row.l2 === l2) && (!l3 || row.l3 === l3);
  }), [rows, query, l1, l2, l3]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  return <><PageIntro kicker="完整项目库" title="1432条原始项目全部可查，962组合并产品用于看趋势" text="可以搜索公司、产品和简介，也可以按一级、二级、三级行业筛选。合并视图不会删除原始项目，点开产品组就能看到里面每一条展品。" /><section className="project-controls"><div className="view-switch"><button className={!raw ? "active" : ""} onClick={() => { setRaw(false); setPage(1); }}>合并产品组</button><button className={raw ? "active" : ""} onClick={() => { setRaw(true); setPage(1); }}>原始1432条</button></div><label className="search"><span>搜索</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="公司、产品或简介" /></label><label><span>一级行业</span><select value={l1} onChange={(event) => { setL1(event.target.value); setL2(""); setL3(""); setPage(1); }}><option value="">全部</option>{data.sectors.map((row) => <option key={row.name}>{row.name}</option>)}</select></label><label><span>二级方向</span><select value={l2} onChange={(event) => { setL2(event.target.value); setL3(""); setPage(1); }}><option value="">全部</option>{l2Options.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>三级方向</span><select value={l3} onChange={(event) => { setL3(event.target.value); setPage(1); }}><option value="">全部</option>{l3Options.map((value) => <option key={value}>{value}</option>)}</select></label></section><p className="result-count">找到 <b>{formatNumber(filtered.length)}</b> {raw ? "条原始项目" : "组产品"}</p><section className="project-grid">{pageRows.map((row) => { const family = "representativeProject" in row ? row : data.families.find((item) => item.id === row.familyId)!; const name = "name" in row ? row.name : row.representativeProject; return <article key={raw ? (row as Project).code : (row as Family).id}><div className="path-tags"><span>{row.l1}</span><span>{row.l2}</span><span>{row.l3}</span></div><h3>{name}</h3><b>{row.enterprise}</b><p>{clip(row.description)}</p><small>{raw ? `展位 ${(row as Project).booth || "未填写"}` : `${(row as Family).evidenceStage} · ${(row as Family).projectCount}条原始展品`}</small><button onClick={() => openDetail({ kind: "family", familyId: family.id })}>查看完整信息</button></article>; })}</section><div className="pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>上一页</button><span>{page} / {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>下一页</button></div></>;
}

function MethodPage({ data }: { data: DashboardData }) {
  return <><PageIntro kicker="统计说明" title="每个结论都能回到同一套数据和规则" text="本页解释完整性、去重、行业拆解、落地线索和代表公司怎么处理。" /><section className="method-list"><article><span>01</span><div><h2>项目范围包含官方目录中的全部{formatNumber(data.metadata.uniqueProjects)}条项目</h2><p>抓取时间为{data.metadata.fetchedAt}。原始项目全部留在查询页，并保留项目名称、企业、展位、简介和官方行业标签。</p></div></article><article><span>02</span><div><h2>重复展品只在趋势统计时合并</h2><p>{data.metadata.aggregationRule}。这样可以避免同一家公司用多个型号把某个方向的热度抬高。</p></div></article><article><span>03</span><div><h2>20个一级行业都继续拆到二级、三级和实际项目</h2><p>所有行业共用“是什么、做什么工作、谁使用、项目有哪些、WAIC材料出现什么落地词”的字段。用户举例不改变排名。</p></div></article><article><span>04</span><div><h2>热度表示WAIC展品集中度</h2><p>一级、二级、三级排名都使用合并后的产品组数量。它适合回答展会上哪类供给最集中，无法直接替代收入、出货量、市场份额和融资规模。</p></div></article><article><span>05</span><div><h2>落地线索只读取项目自述</h2><p>页面把“量产、交付、试点、科研”等词分组显示，帮助区分项目介绍写到了哪一步。这些内容来自企业在WAIC目录中的自述，没有被当成外部核验后的成熟度结论。</p></div></article><article><span>06</span><div><h2>代表公司最多保留三家</h2><p>公司体量、用户或客户规模、销售或部署闭环各按0至2分评分。只有证据较完整的公司才展示；样本或证据不足的板块保持空缺。</p></div></article></section></>;
}

function DetailDrawer({ data, state, open, close }: { data: DashboardData; state: DetailState; open: (state: DetailState) => void; close: () => void }) {
  let body = null;
  if (state?.kind === "match") {
    const rows = data.families.filter((row) => matches(row, state.match));
    body = <><span className="drawer-label">具体方向</span><h2>{state.title}</h2><p className="drawer-intro">{state.explanation}</p><div className="drawer-number"><b>{rows.length}</b><span>组合并产品 · {rows.reduce((sum, row) => sum + row.projectCount, 0)}条原始展品</span></div><div className="drawer-section"><h3>全部相关产品组</h3><div className="family-buttons">{rows.map((row) => <button key={row.id} onClick={() => open({ kind: "family", familyId: row.id })}><span><b>{row.representativeProject}</b><small>{row.enterprise} · {row.evidenceStage}</small></span><strong>{row.projectCount}条</strong></button>)}</div></div></>;
  }
  if (state?.kind === "task") {
    const rows = state.task.familyIds.map((id) => data.families.find((row) => row.id === id)).filter(Boolean) as Family[];
    body = <><span className="drawer-label">机器人任务</span><h2>{state.task.name}</h2><p className="drawer-intro">{state.task.direction}</p><div className="drawer-number"><b>{state.task.familyCount}</b><span>组机器人整机 · {state.task.projectCount}条原始展品</span></div><div className="drawer-section"><h3>完成这个任务的项目</h3><div className="family-buttons">{rows.map((row) => <button key={row.id} onClick={() => open({ kind: "family", familyId: row.id })}><span><b>{row.representativeProject}</b><small>{row.enterprise} · {row.l3}</small></span><strong>{row.projectCount}条</strong></button>)}</div></div></>;
  }
  if (state?.kind === "family") {
    const family = data.families.find((row) => row.id === state.familyId);
    const projects = data.projects.filter((row) => row.familyId === state.familyId);
    if (family) body = <><span className="drawer-label">产品组</span><h2>{family.representativeProject}</h2><p className="drawer-intro">{family.enterprise}</p><div className="path-tags drawer-path"><span>{family.l1}</span><span>{family.l2}</span><span>{family.l3}</span></div><div className="fact-grid"><article><span>具体做什么</span><p>{family.work}</p></article><article><span>谁会使用</span><p>{family.audience}</p></article><article><span>WAIC落地线索</span><p>{family.evidenceStage}</p><small>{family.evidenceStageBasis}</small></article>{family.task && <article><span>机器人任务</span><p>{family.task}</p><small>{family.taskDirection}</small></article>}</div><div className="drawer-section"><h3>项目介绍</h3><p>{family.description || "WAIC目录没有填写项目简介"}</p></div><div className="drawer-section"><h3>合并前的原始展品</h3><div className="raw-projects">{projects.map((project) => <article key={project.code}><div><b>{project.name}</b><span>{project.booth || "展位未填写"}</span></div><p>{project.description || "没有填写简介"}</p><small>分类依据：{project.basis}</small></article>)}</div></div></>;
  }
  return <><button aria-label="关闭详情" className={`drawer-shade ${state ? "open" : ""}`} onClick={close} /><aside className={`detail-drawer ${state ? "open" : ""}`}><button className="drawer-close" onClick={close}>关闭</button>{body}</aside></>;
}
