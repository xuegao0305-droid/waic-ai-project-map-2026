"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, Building2, Database, GitBranch, Search, Sparkles, Target, TrendingUp, Users, Workflow } from "lucide-react";

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

function SectorBubbleChart({ data, go }: { data: DashboardData; go: (page: PageId, sector?: string) => void }) {
  const width = 1040;
  const height = 520;
  const margin = { top: 38, right: 44, bottom: 62, left: 76 };
  const maxX = Math.max(...data.sectors.map((row) => row.enterpriseCount));
  const maxY = Math.max(...data.sectors.map((row) => row.familyCount));
  const maxProject = Math.max(...data.sectors.map((row) => row.projectCount));
  const x = (value: number) => margin.left + (value / maxX) * (width - margin.left - margin.right);
  const y = (value: number) => height - margin.bottom - (value / maxY) * (height - margin.top - margin.bottom);
  const r = (value: number) => 8 + Math.sqrt(value / maxProject) * 23;
  const xTicks = [0, .25, .5, .75, 1].map((value) => Math.round(value * maxX));
  const yTicks = [0, .25, .5, .75, 1].map((value) => Math.round(value * maxY));
  const labelNames = new Set(data.sectors.slice(0, 3).map((row) => row.name));
  return <div className="chart-wrap bubble-chart-wrap">
    <div className="chart-heading"><BarChart3 aria-hidden="true" /><div><h2>核心技术和具身智能同时拥有更多企业与产品系列</h2><p>越靠右参展企业越多，越靠上产品系列越多，圆越大代表原始展品越多。</p></div></div>
    <svg className="bubble-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="bubble-title bubble-desc">
      <title id="bubble-title">WAIC二十个一级行业热度气泡图</title>
      <desc id="bubble-desc">横轴为参展企业数，纵轴为产品系列数，气泡大小为原始展品数。</desc>
      {yTicks.map((tick) => <g key={`y-${tick}`}><line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} className="chart-grid" /><text x={margin.left - 16} y={y(tick) + 5} textAnchor="end" className="chart-tick">{tick}</text></g>)}
      {xTicks.map((tick) => <g key={`x-${tick}`}><line x1={x(tick)} x2={x(tick)} y1={margin.top} y2={height - margin.bottom} className="chart-grid" /><text x={x(tick)} y={height - margin.bottom + 28} textAnchor="middle" className="chart-tick">{tick}</text></g>)}
      <text x={(margin.left + width - margin.right) / 2} y={height - 10} textAnchor="middle" className="chart-axis">参展企业数</text>
      <text transform={`translate(20 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="chart-axis">产品系列数</text>
      {data.sectors.map((sector) => <a key={sector.name} href="#drilldown" onClick={(event) => { event.preventDefault(); go("drilldown", sector.name); }} aria-label={`${sector.name}，${sector.enterpriseCount}家企业，${sector.familyCount}个产品系列，${sector.projectCount}件展品`}>
        <circle cx={x(sector.enterpriseCount)} cy={y(sector.familyCount)} r={r(sector.projectCount)} className={sector.rank <= 3 ? "bubble bubble-primary" : "bubble"}><title>{sector.name}：{sector.enterpriseCount}家企业，{sector.familyCount}个产品系列，{sector.projectCount}件展品</title></circle>
        {labelNames.has(sector.name) && <text x={x(sector.enterpriseCount)} y={sector.rank === 1 ? y(sector.familyCount) + 5 : y(sector.familyCount) - r(sector.projectCount) - 9} textAnchor="middle" className="bubble-label">{sector.name}</text>}
      </a>)}
    </svg>
  </div>;
}

type SankeyNode = { name: string; value: number; y: number; h: number; parent?: string };

function SectorSankey({ sector }: { sector: Sector }) {
  const width = 1120;
  const height = 560;
  const topL2 = [...sector.l2].sort((a, b) => b.familyCount - a.familyCount).slice(0, 6);
  const otherL2Value = sector.l2.slice(6).reduce((sum, row) => sum + row.familyCount, 0);
  const l2Rows = [...topL2.map((row) => ({ name: row.name, value: row.familyCount, source: row })), ...(otherL2Value ? [{ name: "其他方向", value: otherL2Value, source: null }] : [])];
  const leaves = l2Rows.flatMap((row) => {
    if (!row.source) return [{ name: "其他具体产品", value: row.value, parent: row.name }];
    const top = [...row.source.l3].sort((a, b) => b.familyCount - a.familyCount).slice(0, 2);
    const other = row.value - top.reduce((sum, item) => sum + item.familyCount, 0);
    return [...top.map((item) => ({ name: item.name, value: item.familyCount, parent: row.name })), ...(other > 0 ? [{ name: "其他产品", value: other, parent: row.name }] : [])];
  });
  const scale = Math.min(1.18, (height - 86 - (leaves.length - 1) * 8) / sector.familyCount);
  const place = <T extends { name: string; value: number }>(rows: T[], gap: number) => {
    const totalH = rows.reduce((sum, row) => sum + row.value * scale, 0) + Math.max(0, rows.length - 1) * gap;
    let cursor = (height - totalH) / 2;
    return rows.map((row) => { const node = { ...row, y: cursor, h: row.value * scale }; cursor += node.h + gap; return node; });
  };
  const l2Nodes = place(l2Rows, 14) as SankeyNode[];
  const leafNodes = place(leaves, 8) as SankeyNode[];
  const rootH = sector.familyCount * scale;
  const rootY = (height - rootH) / 2;
  let rootOffset = rootY;
  const l1Links = l2Nodes.map((node) => { const sourceY = rootOffset + node.h / 2; rootOffset += node.h; return { node, sourceY }; });
  const leafByParent = new Map<string, SankeyNode[]>();
  leafNodes.forEach((node) => leafByParent.set(node.parent!, [...(leafByParent.get(node.parent!) || []), node]));
  const l2Links = l2Nodes.flatMap((node) => {
    let offset = node.y;
    return (leafByParent.get(node.name) || []).map((leaf) => { const sourceY = offset + leaf.h / 2; offset += leaf.h; return { node, leaf, sourceY }; });
  });
  const curve = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${x1 + 125},${y1} ${x2 - 125},${y2} ${x2},${y2}`;
  return <div className="chart-wrap sankey-wrap">
    <div className="chart-heading"><Workflow aria-hidden="true" /><div><h2>{sector.name}的产品从大板块继续拆到具体方向</h2><p>连线越宽，代表该方向包含的产品系列越多。</p></div></div>
    <svg className="sankey-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="sankey-title sankey-desc">
      <title id="sankey-title">{sector.name}产品结构桑基图</title><desc id="sankey-desc">从{sector.name}流向主要二级方向，再流向各方向中数量最多的具体产品。</desc>
      {l1Links.map(({ node, sourceY }) => <path key={`l1-${node.name}`} d={curve(126, sourceY, 410, node.y + node.h / 2)} strokeWidth={Math.max(2, node.h)} className="sankey-link sankey-link-primary"><title>{sector.name}到{node.name}：{node.value}个产品系列</title></path>)}
      {l2Links.map(({ node, leaf, sourceY }, index) => <path key={`l2-${index}`} d={curve(436, sourceY, 782, leaf.y + leaf.h / 2)} strokeWidth={Math.max(2, leaf.h)} className="sankey-link"><title>{node.name}到{leaf.name}：{leaf.value}个产品系列</title></path>)}
      <rect x="96" y={rootY} width="30" height={Math.max(4, rootH)} rx="5" className="sankey-node root-node" />
      <text x="82" y={rootY + rootH / 2 - 5} textAnchor="end" className="sankey-name">{sector.name}</text><text x="82" y={rootY + rootH / 2 + 14} textAnchor="end" className="sankey-value">{sector.familyCount}个</text>
      {l2Nodes.map((node) => <g key={node.name}><rect x="410" y={node.y} width="26" height={Math.max(4, node.h)} rx="4" className="sankey-node" /><text x="398" y={node.y + node.h / 2 - 4} textAnchor="end" className="sankey-name">{node.name}</text><text x="398" y={node.y + node.h / 2 + 14} textAnchor="end" className="sankey-value">{node.value}个</text></g>)}
      {leafNodes.map((node, index) => <g key={`${node.parent}-${node.name}-${index}`}><rect x="782" y={node.y} width="22" height={Math.max(4, node.h)} rx="4" className="sankey-node leaf-node" /><text x="818" y={node.y + node.h / 2 + 5} className="sankey-name">{node.name} · {node.value}</text></g>)}
      <text x="111" y="28" textAnchor="middle" className="sankey-column">一级行业</text><text x="423" y="28" textAnchor="middle" className="sankey-column">二级方向</text><text x="793" y="28" textAnchor="middle" className="sankey-column">具体产品</text>
    </svg>
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
      {rows.map((row, index) => <span key={row.name} className={`stage-${index + 1}`} style={{ width: `${row.value / sector.familyCount * 100}%` }}><b>{row.value}</b></span>)}
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

  return (
    <>
      <PageIntro kicker="行业全景" title="WAIC最集中的项目是AI底座和机器人，具体热点分布在算力、模型、企业软件和机器人各环节" text="20个一级行业可以继续拆成89个二级方向和191个具体产品方向。页面先比较全局热度，再逐层看到产品、任务、项目和典型公司。" />

      <section className="metric-strip">
        <article><Database aria-hidden="true" /><span>WAIC展品</span><b>{formatNumber(data.metadata.uniqueProjects)}</b><small>全部项目可查询</small></article>
        <article><Boxes aria-hidden="true" /><span>产品系列</span><b>{formatNumber(data.metadata.productFamilies)}</b><small>用于比较行业热度</small></article>
        <article><GitBranch aria-hidden="true" /><span>具体方向</span><b>{data.metadata.level3Count}</b><small>最细行业分类</small></article>
        <article><Building2 aria-hidden="true" /><span>参展企业</span><b>{data.metadata.enterprises}</b><small>覆盖全部项目</small></article>
      </section>

      <section className="answer-grid">
        <article className="primary-answer"><span>全量结论</span><h2>核心技术有{core.familyCount}个产品系列，具身智能有{embodied.familyCount}个，两者合计占{formatPercent(infrastructureShare)}</h2><p>项目供给集中在算力、模型、企业软件、机器人整机和机器人部件。这个比例反映WAIC展品结构。</p></article>
        <article><span>人形机器人位置</span><h3>22个产品系列，在191个具体方向中排第{humanoid.rank}</h3><p>通用具身机器人70个、AI芯片38个、大语言模型29个、机器人关节26个，数量均高于人形机器人。</p></article>
        <article><span>软件侧集中点</span><h3>企业软件77个，大模型与算法69个</h3><p>内容创作、办公协同、客服营销和软件开发已经形成清晰的产品方向。</p></article>
      </section>

      <section><SectorBubbleChart data={data} go={go} /></section>

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
            <article><i><Database aria-hidden="true" /></i><div><h3>算力从芯片扩展到整套系统</h3><p>芯片38个产品系列，服务器24个，互联23个，液冷21个，智算集群19个，供应链各环节都有集中项目。</p></div></article>
            <article><i><Target aria-hidden="true" /></i><div><h3>机器人同时补齐整机、关节、感知和操作</h3><p>通用具身整机70个产品系列，关节26个，传感器20个，灵巧手16个。人形机器人是整机形态中的一个具体方向。</p></div></article>
            <article><i><Sparkles aria-hidden="true" /></i><div><h3>企业软件开始承接固定工作</h3><p>内容创作19个产品系列、办公协同17个、客服营销12个、软件开发10个，产品正在连接企业已有数据和流程。</p></div></article>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title"><span>具体产品</span><h2>191个具体方向中数量最多的15类产品</h2><p>点击任意一行，可以查看对应的全部产品系列和原始展品。</p></div>
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
        <div><span>第{sector.rank}位 · 一级行业</span><h2>{sector.name}</h2><p>{sector.definition}</p></div>
        <div><b>{sector.familyCount}</b><span>个产品系列</span><small>{sector.enterpriseCount}家公司 · {sector.projectCount}件展品</small></div>
      </section>

      <section className="plain-answer">
        <span>这个板块具体热在哪里</span>
        <h2>{sector.l2[0]?.name}是最大的二级方向，有{sector.l2[0]?.familyCount}个产品系列；其中{topL3?.name}最多，有{topL3?.familyCount}个</h2>
        <p>{topL3?.work}。主要面向{topL3?.audience}。</p>
      </section>

      <section><SectorSankey sector={sector} /></section>

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
  return <><PageIntro kicker="数据说明" title="展品、产品系列和行业热度分别表示什么" text="这里给出页面中各类数字的含义，方便在行业比较和项目查询之间切换。" /><section className="method-list"><article><span><Database aria-hidden="true" /></span><div><h2>{formatNumber(data.metadata.uniqueProjects)}件展品覆盖WAIC官方项目目录</h2><p>项目查询页保留名称、企业、展位、简介和行业分类，可以直接查看每一件原始展品。</p></div></article><article><span><Boxes aria-hidden="true" /></span><div><h2>{formatNumber(data.metadata.productFamilies)}个产品系列用于比较供给热度</h2><p>同一家公司在同一具体方向中的多个相关型号合并为一个产品系列，原始展品仍可逐件查看。</p></div></article><article><span><GitBranch aria-hidden="true" /></span><div><h2>20个一级行业拆成89个二级方向和191个具体产品方向</h2><p>行业拆解页可以从大板块进入业务方向，再查看产品完成的工作、使用对象、项目进展和实际展品。</p></div></article><article><span><BarChart3 aria-hidden="true" /></span><div><h2>热度表示WAIC展品中的产品集中度</h2><p>行业排名使用产品系列数量，适合比较展会上哪些供给更集中，不等同于收入、出货量或市场份额。</p></div></article><article><span><TrendingUp aria-hidden="true" /></span><div><h2>进展阶段来自WAIC项目介绍</h2><p>规模应用、客户交付、试点验证、研发教学和产品发布，表示企业在项目简介中介绍到的当前进展。</p></div></article></section></>;
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
    if (family) body = <><span className="drawer-label">产品系列</span><h2>{family.representativeProject}</h2><p className="drawer-intro">{family.enterprise}</p><div className="path-tags drawer-path"><span>{family.l1}</span><span>{family.l2}</span><span>{family.l3}</span></div><div className="fact-grid"><article><span>具体做什么</span><p>{family.work}</p></article><article><span>谁会使用</span><p>{family.audience}</p></article><article><span>项目进展</span><p>{family.evidenceStage}</p><small>{family.evidenceStageBasis}</small></article>{family.task && <article><span>机器人任务</span><p>{family.task}</p><small>{family.taskDirection}</small></article>}</div><div className="drawer-section"><h3>项目介绍</h3><p>{family.description || "WAIC目录没有填写项目简介"}</p></div><div className="drawer-section"><h3>这个产品系列包含的展品</h3><div className="raw-projects">{projects.map((project) => <article key={project.code}><div><b>{project.name}</b><span>{project.booth || "展位未填写"}</span></div><p>{project.description || "没有填写简介"}</p><small>行业分类：{project.basis}</small></article>)}</div></div></>;
  }
  return <><button aria-label="关闭详情" className={`drawer-shade ${state ? "open" : ""}`} onClick={close} /><aside className={`detail-drawer ${state ? "open" : ""}`}><button className="drawer-close" onClick={close}>关闭</button>{body}</aside></>;
}
