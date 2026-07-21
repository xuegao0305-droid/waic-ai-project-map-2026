"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, Building2, Database, GitBranch, Search, Sparkles, Target, TrendingUp } from "lucide-react";

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
  productForm: string;
  productFormCode: string;
};

type Family = {
  id: string;
  enterprise: string;
  l1: string;
  l2: string;
  l3: string;
  projectCount: number;
  projectNames: string[];
  productForms: string[];
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
  officialCode: string;
  officialNameEn: string;
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
    level1Source: string;
    level2Level3Source: string;
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
  { id: "overview", label: "行业全景", note: "比较全部20个行业" },
  { id: "drilldown", label: "行业拆解", note: "看到具体产品和任务" },
  { id: "projects", label: "项目查询", note: "搜索和筛选全部展品" },
  { id: "method", label: "数据说明", note: "范围、单位和阅读方法" },
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
      <div className="mobile-topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}>目录</button><span>WAIC项目拆解</span></div>
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
          <small>全部保留。同一家公司在同一具体方向下的重复展品合并为{formatNumber(data.metadata.productFamilies)}个产品系列。</small>
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

function SectorComparisonChart({ data, go }: { data: DashboardData; go: (page: PageId, sector?: string) => void }) {
  const rows = data.sectors.slice(0, 8);
  const maxValue = Math.max(...rows.flatMap((row) => [row.enterpriseCount, row.familyCount]));
  const barWidth = (value: number) => `${Math.max(2, value / maxValue * 100)}%`;

  return <div className="chart-wrap sector-comparison-wrap">
    <div className="chart-heading"><BarChart3 aria-hidden="true" /><div><h2>核心技术与具身智能在企业数、产品系列数两项均居前两位</h2><p>按产品系列数列出前八个一级行业，两项指标使用同一条从零开始的刻度，点击行业可继续查看具体产品</p></div></div>
    <div className="sector-comparison" role="group" aria-label="一级行业参展企业数与产品系列数对比">
      <div className="sector-comparison-head" aria-hidden="true"><span>一级行业</span><span>参展企业数</span><span>产品系列数</span></div>
      {rows.map((sector) => <button key={sector.name} type="button" className={`sector-comparison-row${sector.rank <= 2 ? " is-leading" : ""}`} onClick={() => go("drilldown", sector.name)} aria-label={`${sector.name}，${sector.enterpriseCount}家参展企业，${sector.familyCount}个产品系列`}>
        <span className="comparison-name"><i>{String(sector.rank).padStart(2, "0")}</i><b>{sector.name}</b></span>
        <span className="comparison-measure enterprise-measure" data-label="参展企业"><span><i style={{ width: barWidth(sector.enterpriseCount) }} /></span><strong>{sector.enterpriseCount}</strong></span>
        <span className="comparison-measure family-measure" data-label="产品系列"><span><i style={{ width: barWidth(sector.familyCount) }} /></span><strong>{sector.familyCount}</strong></span>
      </button>)}
    </div>
  </div>;
}

function SectorStructureChart({ sector, l2, setL2Name, openDetail }: { sector: Sector; l2: Level2; setL2Name: (name: string) => void; openDetail: (state: DetailState) => void }) {
  const maxL2 = Math.max(...sector.l2.map((row) => row.familyCount));
  const maxL3 = Math.max(...l2.l3.map((row) => row.familyCount));
  return <div className="chart-wrap structure-wrap">
    <div className="chart-heading"><GitBranch aria-hidden="true" /><div><h2>{sector.name}包含{sector.l2.length}个二级方向，{l2.name}进一步分成{l2.l3.length}类具体产品</h2><p>左侧列出全部二级方向，点击后右侧显示该方向下的全部具体产品类别</p></div></div>
    <div className="structure-chart" role="group" aria-label={`${sector.name}从一级分类到二级方向和具体产品的完整结构`}>
      <article className="structure-root"><span>WAIC官方一级分类</span><h3>{sector.name}</h3><b>{sector.familyCount}</b><small>个产品系列</small><em>{sector.officialCode}</em></article>
      <div className="structure-column structure-l2"><header><span>全部二级方向</span><b>{sector.l2.length}个</b></header>{sector.l2.map((row) => <button key={row.name} type="button" className={row.name === l2.name ? "active" : ""} aria-pressed={row.name === l2.name} onClick={() => setL2Name(row.name)}><span><b>{row.name}</b><small>{row.l3.length}类具体产品</small></span><i><u style={{ width: `${Math.max(3, row.familyCount / maxL2 * 100)}%` }} /></i><strong>{row.familyCount}</strong></button>)}</div>
      <div className="structure-column structure-l3"><header><span>{l2.name}的全部具体产品</span><b>{l2.familyCount}个系列</b></header>{l2.l3.map((row) => <button key={row.name} type="button" onClick={() => openDetail({ kind: "match", title: row.name, explanation: row.work, match: { l1: [row.l1], l2: [row.l2], l3: [row.name] } })}><span><b>{row.name}</b><small>{row.work}</small></span><i><u style={{ width: `${Math.max(3, row.familyCount / maxL3 * 100)}%` }} /></i><strong>{row.familyCount}</strong></button>)}</div>
    </div>
  </div>;
}

function ProgressChart({ data, sector }: { data: DashboardData; sector: Sector }) {
  const stageMap: Record<string, string> = { "规模使用线索": "规模应用", "客户交付线索": "客户交付", "试点验证线索": "试点验证", "研发教学线索": "研发教学", "产品说明": "产品发布" };
  const counts = new Map<string, number>();
  data.families.filter((row) => row.l1 === sector.name).forEach((row) => { const name = stageMap[row.evidenceStage] || row.evidenceStage; counts.set(name, (counts.get(name) || 0) + 1); });
  const order = ["规模应用", "客户交付", "试点验证", "研发教学", "产品发布"];
  const rows = order.map((name) => ({ name, value: counts.get(name) || 0 })).filter((row) => row.value > 0);
  const top = [...rows].sort((a, b) => b.value - a.value)[0];
  return <div className="chart-wrap progress-wrap">
    <div className="chart-heading"><TrendingUp aria-hidden="true" /><div><h2>{top?.name}是{sector.name}项目介绍中最多的进展阶段</h2><p>按产品系列汇总WAIC目录中出现的应用、交付、试点、研发和发布信息。</p></div></div>
    <div className="progress-bar" role="img" aria-label={`${sector.name}各进展阶段产品系列数量：${rows.map((row) => `${row.name}${row.value}个`).join("，")}`}>
      {rows.map((row, index) => { const share = row.value / sector.familyCount * 100; return <span key={row.name} className={`stage-${index + 1}`} style={{ width: `${share}%` }}>{share >= 8 && <b>{row.value}</b>}</span>; })}
    </div>
    <div className="progress-legend">{rows.map((row, index) => <div key={row.name}><i className={`stage-${index + 1}`} /><span>{row.name}</span><b>{row.value}个</b></div>)}</div>
  </div>;
}

function OverviewPage({ data, openDetail, go }: { data: DashboardData; openDetail: (state: DetailState) => void; go: (page: PageId, sector?: string) => void }) {
  const topL2 = data.sectors.flatMap((sector) => sector.l2).sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount).slice(0, 8);
  const topL3 = data.globalL3.slice(0, 15);
  const core = data.sectors.find((row) => row.name === "核心技术")!;
  const embodied = data.sectors.find((row) => row.name === "具身智能")!;
  const humanoid = data.globalL3.find((row) => row.name === "人形机器人")!;
  const infrastructureShare = (core.familyCount + embodied.familyCount) / data.metadata.productFamilies;
  const l3Count = (name: string) => data.globalL3.find((row) => row.name === name)?.familyCount || 0;
  const l2Count = (name: string) => data.sectors.flatMap((sector) => sector.l2).find((row) => row.name === name)?.familyCount || 0;

  return (
    <>
      <PageIntro kicker="行业全景" title="WAIC最集中的项目是AI底座和机器人，具体热点已经落到人形本体、机器人感知与操作、AI芯片和服务器" text={`${data.metadata.level1Count}个一级行业继续拆成${data.metadata.level2Count}个二级方向和${data.metadata.level3Count}个具体产品方向。页面先比较全局热度，再逐层看到产品、任务、项目和典型公司。`} />

      <section className="metric-strip">
        <article><Database aria-hidden="true" /><span>WAIC展品</span><b>{formatNumber(data.metadata.uniqueProjects)}</b><small>全部项目可查询</small></article>
        <article><Boxes aria-hidden="true" /><span>产品系列</span><b>{formatNumber(data.metadata.productFamilies)}</b><small>用于比较行业热度</small></article>
        <article><GitBranch aria-hidden="true" /><span>具体方向</span><b>{data.metadata.level3Count}</b><small>最细行业分类</small></article>
        <article><Building2 aria-hidden="true" /><span>参展企业</span><b>{data.metadata.enterprises}</b><small>覆盖全部项目</small></article>
      </section>

      <section className="answer-grid">
        <article className="primary-answer"><span>全量结论</span><h2>核心技术有{core.familyCount}个产品系列，具身智能有{embodied.familyCount}个，两者合计占{formatPercent(infrastructureShare)}</h2><p>项目供给集中在算力、模型、企业软件、机器人整机和机器人部件。这个比例反映WAIC展品结构。</p></article>
        <article><span>人形机器人位置</span><h3>{humanoid.familyCount}个产品系列，在{data.metadata.level3Count}个具体方向中排第{humanoid.rank}</h3><p>机器人传感器{l3Count("传感器与感知器件")}个、灵巧手与夹爪{l3Count("灵巧手与夹爪")}个、AI芯片{l3Count("AI芯片与加速卡")}个、服务器{l3Count("服务器与算力一体机")}个，热点同时覆盖本体、感知、操作和算力。</p></article>
        <article><span>软件侧集中点</span><h3>企业软件{l2Count("企业软件与通用应用")}个，模型与算法{l2Count("模型与算法")}个</h3><p>内容创作、办公协同、客服营销和模型能力已经形成清晰的产品方向。</p></article>
      </section>

      <section><SectorComparisonChart data={data} go={go} /></section>

      <section>
        <div className="section-title"><span>一级行业</span><h2>20个行业按产品系列数量排名</h2><p>点击任意行业，可以继续查看二级方向、具体产品、项目进展和典型公司。</p></div>
        <div className="rank-list sector-rank-list">
          {data.sectors.map((sector) => (
            <button key={sector.name} onClick={() => go("drilldown", sector.name)}>
              <i>{String(sector.rank).padStart(2, "0")}</i>
              <span><b>{sector.name}</b><small>{sector.l2[0]?.name}是其中最大的二级方向</small></span>
              <div className="rank-bar"><u style={{ width: `${Math.max(2, sector.familyCount / core.familyCount * 100)}%` }} /></div>
              <strong>{sector.familyCount}</strong><em>个</em>
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
            <article><i><Database aria-hidden="true" /></i><div><h3>算力从芯片扩展到整套系统</h3><p>芯片{l3Count("AI芯片与加速卡")}个产品系列，服务器{l3Count("服务器与算力一体机")}个，互联{l3Count("存储与高速互联")}个，数据中心与液冷{l3Count("数据中心与液冷")}个，智算集群{l3Count("智算中心与计算集群")}个。</p></div></article>
            <article><i><Target aria-hidden="true" /></i><div><h3>机器人热点集中在本体、感知和操作三层</h3><p>人形机器人{l3Count("人形机器人")}个产品系列，传感器{l3Count("传感器与感知器件")}个，灵巧手{l3Count("灵巧手与夹爪")}个，关节{l3Count("关节与传动部件")}个，仿真训练与数据平台{l3Count("具身研发、仿真训练与数据平台")}个。</p></div></article>
            <article><i><Sparkles aria-hidden="true" /></i><div><h3>企业软件开始承接固定工作</h3><p>内容创作{l3Count("内容创作与数字人")}个产品系列、办公协同{l3Count("办公与协同智能体")}个、客服营销{l3Count("客户服务与营销")}个、软件开发{l3Count("软件开发与编程")}个。</p></div></article>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title"><span>具体产品</span><h2>{data.metadata.level3Count}个具体方向中数量最多的15类产品</h2><p>点击任意一行，可以查看对应的全部产品系列和原始展品。</p></div>
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
      <PageIntro kicker="行业拆解" title="从行业进入业务方向，再看到具体产品、任务和项目" text="选择任意一级行业，都可以查看二级业务、具体产品、项目进展、代表性展品和典型公司。机器人整机还可以按实际任务继续拆分。" />

      <section className="sector-picker">
        {data.sectors.map((row) => <button key={row.name} className={row.name === sector.name ? "active" : ""} onClick={() => chooseSector(row.name)}><span>{row.name}</span><b>{row.familyCount}</b></button>)}
      </section>

      <section className="sector-summary">
        <div><span>WAIC官方一级分类，热度第{sector.rank}位</span><h2>{sector.name}</h2><p>WAIC将这个一级分类命名为{sector.name}。{sector.definition}</p></div>
        <div><b>{sector.familyCount}</b><span>个产品系列</span><small>{sector.enterpriseCount}家公司，{sector.projectCount}件展品</small></div>
      </section>

      <section className="plain-answer">
        <span>这个板块具体热在哪里</span>
        <h2>{sector.l2[0]?.name}是最大的二级方向，有{sector.l2[0]?.familyCount}个产品系列；其中{topL3?.name}最多，有{topL3?.familyCount}个</h2>
        <p>{topL3?.work}。主要面向{topL3?.audience}。</p>
      </section>

      {l2 && <section><SectorStructureChart sector={sector} l2={l2} setL2Name={setL2Name} openDetail={openDetail} /></section>}

      <section><ProgressChart data={data} sector={sector} /></section>

      <section>
        <div className="section-title"><span>业务方向</span><h2>{sector.name}下面有哪些二级业务</h2></div>
        <div className="l2-list">
          {sector.l2.map((row) => <button key={row.name} className={row.name === l2?.name ? "active" : ""} onClick={() => setL2Name(row.name)}><div><b>{row.name}</b><strong>{row.familyCount}</strong></div><p>{row.definition}</p><small>{row.l3.length}个三级方向</small></button>)}
        </div>
      </section>

      {l2 && <section>
        <div className="section-title"><span>具体产品</span><h2>{l2.name}具体在做什么</h2><p>每一项都写明产品完成的工作、使用对象和项目介绍中的进展阶段。</p></div>
        <div className="deep-list">
          {l2.l3.map((row, index) => (
            <button key={row.name} onClick={() => openDetail({ kind: "match", title: row.name, explanation: row.work, match: { l1: [row.l1], l2: [row.l2], l3: [row.name] } })}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              <div><b>{row.name}</b><p>{row.work}</p><small>使用对象：{row.audience}</small></div>
              <aside><span>{row.evidenceStages[0]?.name || "产品说明"}</span><small>{row.evidenceStages[0]?.count || row.familyCount}/{row.familyCount}个</small></aside>
              <strong>{row.familyCount}</strong>
              <em>查看项目</em>
            </button>
          ))}
        </div>
      </section>}

      {showRobotTasks && <RobotTaskSection data={data} openDetail={openDetail} />}

      <section className="split-section">
        <div>
          <div className="section-title"><span>实际项目</span><h2>{l2?.name}里的代表性展品</h2><p>点击展品，可以查看产品用途、使用对象和同一产品系列包含的原始项目。</p></div>
          <div className="example-list">
            {examples.map((family) => <button key={family.id} onClick={() => openDetail({ kind: "family", familyId: family.id })}><span>{family.l3}</span><h3>{family.representativeProject}</h3><p>{family.enterprise}</p><small>{family.evidenceStage} · {family.projectCount > 1 ? `${family.projectCount}条同类展品已合并` : "1条WAIC展品"}</small></button>)}
          </div>
        </div>
        <div>
          <div className="section-title"><span>发展方向</span><h2>{sector.name}正在往哪里走</h2></div>
          <div className="direction-list">
            <article><i><Target aria-hidden="true" /></i><div><h3>产品方向</h3><p>{sector.direction}</p></div></article>
            <article><i><TrendingUp aria-hidden="true" /></i><div><h3>当前进展</h3><p>{sector.maturity}</p></div></article>
            <article><i><BarChart3 aria-hidden="true" /></i><div><h3>数据含义</h3><p>{sector.caveat}</p></div></article>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title"><span>典型公司</span><h2>{companies.length ? `${sector.name}的典型公司` : `${sector.name}暂未展示典型公司`}</h2><p>{companies.length ? "这些公司已经形成较大的业务规模、用户或客户基础，并拥有可持续的产品与交付闭环。" : "全部相关展品仍可在项目查询页查看。"}</p></div>
        {companies.length > 0 ? <div className="company-grid">{companies.map((company, index) => <CompanyCard key={company.key} rank={index + 1} company={company} data={data} openDetail={openDetail} />)}</div> : <div className="empty-note">当前板块的全部展品可在项目查询页查看。</div>}
      </section>
    </>
  );
}

function RobotTaskSection({ data, openDetail }: { data: DashboardData; openDetail: (state: DetailState) => void }) {
  const [mode, setMode] = useState<"all" | "humanoid">("all");
  const tasks = mode === "humanoid" ? data.embodied.humanoidTasks : data.embodied.tasks;
  return <section><div className="section-title"><span>机器人任务</span><h2>机器人整机最常完成哪些任务</h2><p>外形和任务分开查看，可以区分人形、四足、轮式机器人分别在做什么工作。</p></div><div className="task-toggle"><button className={mode === "all" ? "active" : ""} onClick={() => setMode("all")}>全部机器人整机</button><button className={mode === "humanoid" ? "active" : ""} onClick={() => setMode("humanoid")}>人形机器人</button></div><div className="task-list">{tasks.map((task, index) => <button key={task.name} onClick={() => openDetail({ kind: "task", task })}><i>{String(index + 1).padStart(2, "0")}</i><span><b>{task.name}</b><small>{task.examples.slice(0, 3).map((item) => `${item.enterprise} · ${item.project}`).join("；")}</small></span><strong>{task.familyCount}</strong><em>个</em></button>)}</div></section>;
}

function CompanyCard({ rank, company, data, openDetail }: { rank: number; company: ImportantCompany; data: DashboardData; openDetail: (state: DetailState) => void }) {
  const project = company.familyIds.map((id) => data.families.find((row) => row.id === id)).find(Boolean);
  return <article className="company-card"><div><i>{String(rank).padStart(2, "0")}</i><Building2 aria-hidden="true" /></div><h3>{company.company}</h3><dl><div><dt>业务规模</dt><dd>{company.scale}</dd></div><div><dt>用户与客户</dt><dd>{company.users}</dd></div><div><dt>产品闭环</dt><dd>{company.loop}</dd></div></dl>{project && <button onClick={() => openDetail({ kind: "family", familyId: project.id })}><span>WAIC展品</span><b>{project.representativeProject}</b></button>}<footer>{company.sourceUrls.slice(0, 2).map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">公司资料{company.sourceUrls.length > 1 ? index + 1 : ""}</a>)}</footer></article>;
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
  return <><PageIntro kicker="项目查询" title={`${formatNumber(data.metadata.uniqueProjects)}件展品全部可查，${formatNumber(data.metadata.productFamilies)}个产品系列用于比较趋势`} text="可以搜索公司、产品和简介，也可以按一级、二级和具体产品方向筛选。产品系列视图可以继续打开其中每一件原始展品。" /><section className="project-controls"><div className="view-switch"><button className={!raw ? "active" : ""} onClick={() => { setRaw(false); setPage(1); }}>产品系列</button><button className={raw ? "active" : ""} onClick={() => { setRaw(true); setPage(1); }}>全部展品</button></div><label className="search"><span><Search aria-hidden="true" />搜索</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="公司、产品或简介" /></label><label><span>一级行业</span><select value={l1} onChange={(event) => { setL1(event.target.value); setL2(""); setL3(""); setPage(1); }}><option value="">全部</option>{data.sectors.map((row) => <option key={row.name}>{row.name}</option>)}</select></label><label><span>二级方向</span><select value={l2} onChange={(event) => { setL2(event.target.value); setL3(""); setPage(1); }}><option value="">全部</option>{l2Options.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>具体产品</span><select value={l3} onChange={(event) => { setL3(event.target.value); setPage(1); }}><option value="">全部</option>{l3Options.map((value) => <option key={value}>{value}</option>)}</select></label></section><p className="result-count">找到 <b>{formatNumber(filtered.length)}</b> {raw ? "件展品" : "个产品系列"}</p><section className="project-grid">{pageRows.map((row) => { const family = "representativeProject" in row ? row : data.families.find((item) => item.id === row.familyId)!; const name = "name" in row ? row.name : row.representativeProject; return <article key={raw ? (row as Project).code : (row as Family).id}><div className="path-tags"><span>{row.l1}</span><span>{row.l2}</span><span>{row.l3}</span></div><h3>{name}</h3><b>{row.enterprise}</b><p>{clip(row.description)}</p><small>{raw ? `展位 ${(row as Project).booth || "未填写"}` : `${(row as Family).evidenceStage} · ${(row as Family).projectCount}件原始展品`}</small><button onClick={() => openDetail({ kind: "family", familyId: family.id })}>查看完整信息</button></article>; })}</section><div className="pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>上一页</button><span>{page} / {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>下一页</button></div></>;
}

function MethodPage({ data }: { data: DashboardData }) {
  return <><PageIntro kicker="数据说明" title="展品、产品系列和行业热度分别表示什么" text="这里给出页面中各类数字的含义，方便在行业比较和项目查询之间切换。" /><section className="method-list"><article><span><Database aria-hidden="true" /></span><div><h2>{formatNumber(data.metadata.uniqueProjects)}件展品覆盖WAIC官方项目目录</h2><p>项目查询页保留名称、企业、展位、简介和行业分类，可以直接查看每一件原始展品。</p></div></article><article><span><Boxes aria-hidden="true" /></span><div><h2>{formatNumber(data.metadata.productFamilies)}个产品系列用于比较供给热度</h2><p>同一家公司在同一具体方向中的多个相关型号合并为一个产品系列，原始展品仍可逐件查看。</p></div></article><article><span><GitBranch aria-hidden="true" /></span><div><h2>{data.metadata.level1Count}个一级行业名称来自WAIC官方目录</h2><p>“核心技术”“具身智能”等一级名称均沿用WAIC官方项目主标签。</p></div></article><article><span><GitBranch aria-hidden="true" /></span><div><h2>{data.metadata.level2Count}个二级方向和{data.metadata.level3Count}个具体产品方向来自本台账细分</h2><p>细分时结合项目名称、项目简介和交付形态，行业拆解页会列出每个二级方向下的全部具体产品类别。</p></div></article><article><span><BarChart3 aria-hidden="true" /></span><div><h2>热度表示WAIC展品中的产品集中度</h2><p>行业排名使用产品系列数量，适合比较展会上哪些供给更集中，不等同于收入、出货量或市场份额。</p></div></article><article><span><TrendingUp aria-hidden="true" /></span><div><h2>进展阶段来自WAIC项目介绍</h2><p>规模应用、客户交付、试点验证、研发教学和产品发布，表示企业在项目简介中介绍到的当前进展。</p></div></article></section></>;
}

function DetailDrawer({ data, state, open, close }: { data: DashboardData; state: DetailState; open: (state: DetailState) => void; close: () => void }) {
  let body = null;
  if (state?.kind === "match") {
    const rows = data.families.filter((row) => matches(row, state.match));
    body = <><span className="drawer-label">具体方向</span><h2>{state.title}</h2><p className="drawer-intro">{state.explanation}</p><div className="drawer-number"><b>{rows.length}</b><span>个产品系列 · {rows.reduce((sum, row) => sum + row.projectCount, 0)}件原始展品</span></div><div className="drawer-section"><h3>全部相关产品系列</h3><div className="family-buttons">{rows.map((row) => <button key={row.id} onClick={() => open({ kind: "family", familyId: row.id })}><span><b>{row.representativeProject}</b><small>{row.enterprise} · {row.evidenceStage}</small></span><strong>{row.projectCount}件</strong></button>)}</div></div></>;
  }
  if (state?.kind === "task") {
    const rows = state.task.familyIds.map((id) => data.families.find((row) => row.id === id)).filter(Boolean) as Family[];
    body = <><span className="drawer-label">机器人任务</span><h2>{state.task.name}</h2><p className="drawer-intro">{state.task.direction}</p><div className="drawer-number"><b>{state.task.familyCount}</b><span>个机器人产品系列 · {state.task.projectCount}件原始展品</span></div><div className="drawer-section"><h3>完成这个任务的项目</h3><div className="family-buttons">{rows.map((row) => <button key={row.id} onClick={() => open({ kind: "family", familyId: row.id })}><span><b>{row.representativeProject}</b><small>{row.enterprise} · {row.l3}</small></span><strong>{row.projectCount}件</strong></button>)}</div></div></>;
  }
  if (state?.kind === "family") {
    const family = data.families.find((row) => row.id === state.familyId);
    const projects = data.projects.filter((row) => row.familyId === state.familyId);
    if (family) body = <><span className="drawer-label">产品系列</span><h2>{family.representativeProject}</h2><p className="drawer-intro">{family.enterprise}</p><div className="path-tags drawer-path"><span>{family.l1}</span><span>{family.l2}</span><span>{family.l3}</span></div><div className="fact-grid"><article><span>交付形态</span><p>{family.productForms.join("、")}</p></article><article><span>具体做什么</span><p>{family.work}</p></article><article><span>谁会使用</span><p>{family.audience}</p></article><article><span>项目进展</span><p>{family.evidenceStage}</p><small>{family.evidenceStageBasis}</small></article>{family.task && <article><span>机器人任务</span><p>{family.task}</p><small>{family.taskDirection}</small></article>}</div><div className="drawer-section"><h3>项目介绍</h3><p>{family.description || "WAIC目录没有填写项目简介"}</p></div><div className="drawer-section"><h3>这个产品系列包含的展品</h3><div className="raw-projects">{projects.map((project) => <article key={project.code}><div><b>{project.name}</b><span>{project.booth || "展位未填写"}</span></div><p>{project.description || "没有填写简介"}</p><small>交付形态：{project.productForm}</small></article>)}</div></div></>;
  }
  return <><button aria-label="关闭详情" className={`drawer-shade ${state ? "open" : ""}`} onClick={close} /><aside className={`detail-drawer ${state ? "open" : ""}`}><button className="drawer-close" onClick={close}>关闭</button>{body}</aside></>;
}
