import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");
const sourcePath = path.join(workspaceRoot, "work/waic_2026_ledger/waic_2026_projects_classified.json");
const workbookBuilderPath = path.join(workspaceRoot, "work/waic_2026_ledger/build_waic_workbook_v2.mjs");
const outputPath = path.join(projectRoot, "public/data/waic-dashboard.json");

const raw = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const builderSource = await fs.readFile(workbookBuilderPath, "utf8");

function extractLiteral(startMarker, endMarker) {
  const start = builderSource.indexOf(startMarker);
  const end = builderSource.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`无法提取配置：${startMarker}`);
  const literal = builderSource.slice(start + startMarker.length, end).trim().replace(/;$/, "");
  return Function(`"use strict"; return (${literal});`)();
}

const sectorNotes = extractLiteral("const sectorNotes = ", "\n\nconst evidenceCatalog");
const evidenceCatalog = extractLiteral("const evidenceCatalog = ", "\n\nconst sectorEvidenceKeys");
const sectorEvidenceKeys = extractLiteral("const sectorEvidenceKeys = ", "\n\n// 同一标准化企业");

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const normalizeEnterprise = (value) => clean(value).replace(/\s*[｜|]\s*/g, "｜");
const unique = (values) => [...new Set(values.filter(Boolean))];
const countBy = (rows, getter) => {
  const counts = new Map();
  for (const row of rows) {
    const key = getter(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
};
const ranked = (counts) => [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));

const l1Definitions = {
  "核心技术": "做AI底座和通用工具，里面有芯片、服务器、模型、数据平台、开发平台和企业智能体",
  "具身智能": "让机器人能看懂环境、理解任务并完成动作，里面有整机、关节、传感器、灵巧手、控制软件和训练数据",
  "智能终端": "把AI放进手机、电脑、眼镜、家电、可穿戴设备和商用硬件",
  "工业互联与智能制造": "让工厂设备连起来并自动运行，包含工业网络、控制器、机器视觉、工业软件和无人运输",
  "制造业": "面向生产制造的器件、设备、控制、检测和工业软件",
  "智慧医疗": "把AI用于诊断、临床决策、健康监测、康复、养老和医院系统",
  "其他": "WAIC官方分类里未归入单一行业的项目，内容差异大，需要继续看二级和三级行业",
  "人才与教育": "把AI用于学习辅导、课堂教学、教师工作、实训测评和教育硬件",
  "文娱艺术与元宇宙": "把AI用于视频图像、数字人、音乐、游戏、XR和沉浸式互动",
  "金融科技": "把AI用于银行、投研、财富管理、支付、风控和金融运营",
  "智慧城市": "把AI用于城市平台、公共安全、设施巡检、园区和楼宇管理",
  "智能驾驶": "包含智能座舱、自动驾驶系统、感知定位、车路云和Robotaxi运营",
  "电力、热力、燃气及水生产和供应业": "把AI用于能源预测、调度、设备巡检、运行安全和能碳管理",
  "租赁业与商业服务业": "把AI用于采购、销售、经营分析、招投标、咨询和翻译服务",
  "交通运输、仓储和邮政业": "把AI用于物流、供应链、出行调度和仓储协同",
  "房地产业": "把AI用于住房运营、租赁管理、物业和门禁设备",
  "农、林、牧、渔业": "把AI用于植保、农业机器人和生产管理",
  "政府/机构": "把AI用于政务和司法流程，目前WAIC样本主要是法律司法智能体",
  "建筑业": "把AI用于建筑现场巡检、缺陷识别和工程数字化",
  "伦理治理": "提供AI风险识别、合规评估、治理记录和责任追溯工具",
};

const l2Definitions = {
  "机器人整机": "能直接移动或操作物体的完整机器人，包含人形、四足、轮式、协作机器人和通用具身机器人",
  "机器人核心部件": "让机器人站得住、走得动、看得见的硬件，包含关节、传动、电机、传感器、结构件和功能总成",
  "末端执行与操作": "机器人真正接触物体的手和手臂，主要是机械臂、灵巧手和夹爪",
  "具身感知与智能": "让机器人理解指令、规划动作和自主导航的模型与控制能力",
  "机器人软件与数据": "训练和管理机器人的工具，包含仿真、数据采集、操作系统、开发平台和集成服务",
  "服务机器人与自动化": "面向明确服务任务的机器人，包含清洁、配送、接待、餐饮、零售、陪伴和教育",
  "AI算力与硬件": "训练和运行AI所需的芯片、服务器、存储、网络、数据中心和液冷设备",
  "模型与算法": "让AI理解文字、图像、声音并生成内容或做判断的模型能力",
  "企业软件与通用应用": "可直接用于办公、研发、营销、客服和经营分析的AI软件",
  "AI开发与运营平台": "帮助企业开发、部署、监控和管理模型与智能体的平台",
  "数据与知识基础设施": "整理、存储、检索和治理企业数据与知识的系统",
  "云与基础软件": "承载AI应用的云平台、操作系统、中间件和数据库基础能力",
  "行业AI应用": "针对医疗、金融、教育、能源等具体行业流程开发的AI产品",
  "机器人与具身技术": "归在核心技术板块下的机器人模型、感知、控制和开发能力",
};

function l2Definition(name, l3Names) {
  if (l2Definitions[name]) return l2Definitions[name];
  const contents = l3Names.slice(0, 4).join("、");
  return `${name}包含${contents}${l3Names.length > 4 ? "等具体产品" : ""}`;
}

const embodiedL3Definitions = {
  "通用具身机器人": "强调一台机器人能换任务，可能是轮式、双臂或其他形态，重点看能否在多个场景复用",
  "人形机器人": "身体结构接近人，适合进入为人设计的工位、工具和空间，当前项目集中在运动、操作和场景试点",
  "四足与仿生机器人": "用四条腿或仿生结构通过楼梯、坡地和复杂地形，常用于巡检、应急和户外作业",
  "轮式与移动机器人": "用轮式底盘完成移动、搬运、配送和巡检，速度、续航和稳定性通常优于双足",
  "工业与协作机器人": "在产线工位完成装配、搬运、焊接、上下料等任务，并能与工人共享作业空间",
  "关节与传动部件": "机器人每个关节里的减速器、轴承、丝杠和一体化关节，决定负载、精度、速度和寿命",
  "传感器与感知器件": "给机器人提供视觉、触觉、力觉和位置数据，让它知道周围有什么、手上用了多大力",
  "电机与驱动系统": "给关节和轮子提供动力，并控制速度、扭矩和能耗",
  "本体套件与功能总成": "可直接装进机器人本体的头部、躯干、底盘、模组和开发套件",
  "结构件与连接件": "承载机器人重量并连接各部件的骨架、线束、密封和连接零件",
  "灵巧手与夹爪": "负责抓、拿、拧、按和精细操作，重点看自由度、力控、触觉和耐用性",
  "机械臂": "负责伸手、定位和搬运，重点看负载、工作半径、精度和安全协作",
  "具身大模型与VLA": "把视觉、语言指令和动作连接起来，让机器人看懂任务并生成动作",
  "具身大模型与机器人智能": "让机器人理解环境和任务，并在执行中继续调整动作",
  "运动控制与导航": "让机器人保持平衡、规划路线、避开障碍并稳定到达目标位置",
  "仿真训练与数据平台": "在虚拟环境或真实采集系统中训练机器人，降低真实机器反复试错的成本",
  "机器人操作系统与开发平台": "为机器人提供设备管理、任务编排、接口和二次开发工具",
  "具身生态与集成服务": "把整机、零部件、模型、软件和场景方组合成可交付方案",
  "餐饮与零售机器人": "完成做餐、饮品制作、货品售卖和门店服务",
  "清洁配送与接待机器人": "完成地面清洁、室内配送、引导和接待",
  "陪伴教育与娱乐机器人": "面向家庭、儿童和教育场景，提供对话、内容、互动和编程体验",
  "陪伴穿戴与情感交互": "通过穿戴设备或陪伴硬件提供情绪识别、对话和持续互动",
};

const taskRules = [
  {
    name: "工厂装配与生产",
    keywords: ["装配", "上下料", "产线", "工厂", "工业制造", "协作机器人", "工位", "焊接", "码垛", "打螺丝", "压装", "喷涂", "分拣"],
    direction: "项目正在补齐混线识别、柔性抓取、力控装配和MES指令连接，能否长时间稳定运行比单次演示更重要",
  },
  {
    name: "仓储拣选与搬运",
    keywords: ["仓储", "仓库", "物流", "搬运", "拣选", "取货", "货架", "SKU", "分装", "叉车", "托盘", "配送中心"],
    direction: "重点是识别更多SKU、处理不同包装、提高单小时取放量，并把取货、搬运和补货连成完整流程",
  },
  {
    name: "巡检、消防与特种作业",
    keywords: ["巡检", "消防", "应急", "救援", "危险", "防爆", "矿", "电力", "隧道", "复杂地形", "户外", "火情", "烟雾", "特种"],
    direction: "方向是复杂地形通过、远程操作和自主巡检结合，并补强防水、防尘、续航、通信和安全冗余",
  },
  {
    name: "商用接待与导览",
    keywords: ["接待", "迎宾", "导览", "讲解", "客服", "展厅", "文旅", "商超", "咨询", "营销", "前台"],
    direction: "产品在提高导航稳定性、多人对话、知识讲解和无人运维能力，商业价值取决于真实使用频次和运营成本",
  },
  {
    name: "清洁、配送与酒店服务",
    keywords: ["清洁", "洗地", "扫地", "酒店", "送餐", "配送", "送物", "客房", "餐厅配送"],
    direction: "该类任务已经有规模部署，下一步主要压低设备和运维成本，并提高跨楼层调度、续航和异常处理能力",
  },
  {
    name: "餐饮制作与零售",
    keywords: ["咖啡", "烹饪", "炒菜", "厨", "餐饮", "奶茶", "零售", "售卖", "门店", "饮品"],
    direction: "产品在提高出品速度、口味一致性、清洗维护和食品安全，并尝试覆盖更多非标准食材与动作",
  },
  {
    name: "医疗康复与养老照护",
    keywords: ["医疗", "医院", "康复", "护理", "养老", "助行", "照护", "外骨骼", "手术", "病房"],
    direction: "方向是更安全的人机接触、更精确的康复动作和更低的使用门槛，临床验证、责任边界和采购周期仍会限制扩张速度",
  },
  {
    name: "家庭陪伴、教育与娱乐",
    keywords: ["陪伴", "儿童", "家庭", "教育", "教学", "科研教育", "宠物", "玩具", "娱乐", "编程学习", "情感"],
    direction: "产品在降低价格、提高内容质量和长期互动能力，家庭场景还要继续看安全、留存和付费",
  },
  {
    name: "通用动作、科研与展示",
    keywords: ["科研", "教学", "二次开发", "开发平台", "动作展示", "舞", "奔跑", "跳", "运动性能", "本体平台", "开源", "自由度"],
    direction: "当前重点是本体稳定、动作能力、开放接口和开发者生态，项目数量多，但不能直接等同于生产任务已经规模落地",
  },
];

const fallbackTaskDirections = {
  "通用作业平台": "这类机器人强调一机多用，下一步需要用真实客户任务证明泛化能力、稳定性和单位任务成本",
};

function scoreTask(text, rule) {
  return rule.keywords.reduce((score, keyword) => score + (text.includes(keyword.toLowerCase()) ? (keyword.length >= 4 ? 3 : 2) : 0), 0);
}

function taskForFamily(family) {
  if (family.l1 !== "具身智能" || !["机器人整机", "服务机器人与自动化"].includes(family.l2)) return null;
  const text = clean(`${family.l3} ${family.projectNames.join(" ")} ${family.records.map((row) => row.productDescriptionCn).join(" ")}`).toLowerCase();
  const scored = taskRules.map((rule) => ({ ...rule, score: scoreTask(text, rule) })).sort((a, b) => b.score - a.score);
  if (scored[0].score > 0) return { name: scored[0].name, direction: scored[0].direction, score: scored[0].score };
  if (family.l3 === "四足与仿生机器人") return { name: "巡检、消防与特种作业", direction: taskRules[2].direction, score: 0 };
  if (family.l3 === "工业与协作机器人") return { name: "工厂装配与生产", direction: taskRules[0].direction, score: 0 };
  if (family.l3 === "轮式与移动机器人") return { name: "仓储拣选与搬运", direction: taskRules[1].direction, score: 0 };
  if (family.l3.includes("陪伴") || family.l3.includes("教育")) return { name: "家庭陪伴、教育与娱乐", direction: taskRules[7].direction, score: 0 };
  if (family.l3.includes("清洁") || family.l3.includes("配送")) return { name: "清洁、配送与酒店服务", direction: taskRules[4].direction, score: 0 };
  if (family.l3.includes("餐饮") || family.l3.includes("零售")) return { name: "餐饮制作与零售", direction: taskRules[5].direction, score: 0 };
  if (family.l3 === "人形机器人") return { name: "通用动作、科研与展示", direction: taskRules[8].direction, score: 0 };
  return { name: "通用作业平台", direction: fallbackTaskDirections["通用作业平台"], score: 0 };
}

const familyMap = new Map();
for (const record of raw.records) {
  const enterprise = normalizeEnterprise(record.enterpriseName);
  const key = [enterprise, record.industryLevel1, record.industryLevel2, record.industryLevel3].join("\u241F");
  if (!familyMap.has(key)) familyMap.set(key, { key, enterprise, records: [] });
  familyMap.get(key).records.push(record);
}

const preFamilies = [...familyMap.values()].map((family) => {
  const first = family.records[0];
  const projectNames = unique(family.records.map((row) => clean(row.productName)));
  return {
    ...family,
    l1: first.industryLevel1,
    l2: first.industryLevel2,
    l3: first.industryLevel3,
    projectNames,
    productCodes: unique(family.records.map((row) => row.productCode)),
    booths: unique(family.records.map((row) => row.boothNumber)),
    officialTags: unique(family.records.flatMap((row) => row.officialIndustryTags || [])),
    confidences: unique(family.records.map((row) => row.classificationConfidence)),
  };
});

const l1FamilyCounts = countBy(preFamilies, (family) => family.l1);
const l1Order = new Map(ranked(l1FamilyCounts).map(([name], index) => [name, index]));
preFamilies.sort((a, b) => (l1Order.get(a.l1) - l1Order.get(b.l1)) || a.l2.localeCompare(b.l2, "zh-CN") || a.l3.localeCompare(b.l3, "zh-CN") || a.enterprise.localeCompare(b.enterprise, "zh-CN"));

const families = preFamilies.map((family, index) => {
  const task = taskForFamily(family);
  const first = family.records[0];
  return {
    id: `PF${String(index + 1).padStart(4, "0")}`,
    enterprise: family.enterprise,
    l1: family.l1,
    l2: family.l2,
    l3: family.l3,
    projectCount: family.records.length,
    projectNames: family.projectNames,
    productCodes: family.productCodes,
    booths: family.booths,
    officialTags: family.officialTags,
    confidences: family.confidences,
    representativeProject: family.projectNames[0],
    description: clean(first.productDescriptionCn),
    logo: first.enterpriseLogoPath || "",
    image: first.productImageFilePath || "",
    task: task?.name || "",
    taskDirection: task?.direction || "",
  };
});

const familyIdByCode = new Map();
for (const family of families) for (const code of family.productCodes) familyIdByCode.set(code, family.id);

const projects = raw.records.map((record) => ({
  code: record.productCode,
  familyId: familyIdByCode.get(record.productCode),
  name: clean(record.productName),
  enterprise: normalizeEnterprise(record.enterpriseName),
  l1: record.industryLevel1,
  l2: record.industryLevel2,
  l3: record.industryLevel3,
  description: clean(record.productDescriptionCn),
  booth: record.boothNumber || "",
  officialTags: record.officialIndustryTags || [],
  confidence: record.classificationConfidence,
  basis: clean(record.classificationBasis),
  definition: clean(record.classificationDefinition),
  logo: record.enterpriseLogoPath || "",
  image: record.productImageFilePath || "",
  isNewProduct: Boolean(record.isNewProduct),
}));

const l3Rows = [];
for (const taxonomyRow of raw.taxonomy) {
  const matchingFamilies = families.filter((family) => family.l1 === taxonomyRow.industryLevel1 && family.l2 === taxonomyRow.industryLevel2 && family.l3 === taxonomyRow.industryLevel3);
  l3Rows.push({
    l1: taxonomyRow.industryLevel1,
    l2: taxonomyRow.industryLevel2,
    name: taxonomyRow.industryLevel3,
    definition: embodiedL3Definitions[taxonomyRow.industryLevel3] || `${taxonomyRow.industryLevel3}是${taxonomyRow.industryLevel2}下面的一类具体产品`,
    familyCount: matchingFamilies.length,
    enterpriseCount: new Set(matchingFamilies.map((family) => family.enterprise)).size,
    projectCount: matchingFamilies.reduce((sum, family) => sum + family.projectCount, 0),
  });
}

const l2Keys = unique(families.map((family) => `${family.l1}\u241F${family.l2}`));
const l2Rows = l2Keys.map((key) => {
  const [l1, name] = key.split("\u241F");
  const matchingFamilies = families.filter((family) => family.l1 === l1 && family.l2 === name);
  const matchingL3 = l3Rows.filter((row) => row.l1 === l1 && row.l2 === name).sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount);
  return {
    l1,
    name,
    definition: l2Definition(name, matchingL3.map((row) => row.name)),
    familyCount: matchingFamilies.length,
    enterpriseCount: new Set(matchingFamilies.map((family) => family.enterprise)).size,
    projectCount: matchingFamilies.reduce((sum, family) => sum + family.projectCount, 0),
    l3: matchingL3,
  };
}).sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount);

const importantCompanies = [];
for (const [l1, keys] of Object.entries(sectorEvidenceKeys)) {
  for (const key of keys) {
    const evidence = evidenceCatalog[key];
    const matchingFamilies = families.filter((family) => family.l1 === l1 && evidence.matcher.test(family.enterprise));
    if (!matchingFamilies.length) continue;
    importantCompanies.push({
      key,
      l1,
      company: evidence.company,
      totalScore: evidence.scores.reduce((sum, value) => sum + value, 0),
      scale: evidence.scale,
      users: evidence.users,
      loop: evidence.loop,
      sourceUrls: String(evidence.source).split("\n"),
      evidenceDate: evidence.evidenceDate,
      note: evidence.note || "",
      familyCount: matchingFamilies.length,
      projectCount: matchingFamilies.reduce((sum, family) => sum + family.projectCount, 0),
      l3: unique(matchingFamilies.map((family) => family.l3)),
      familyIds: matchingFamilies.map((family) => family.id),
    });
  }
}

const l1Rows = ranked(l1FamilyCounts).map(([name, familyCount], index) => {
  const matchingFamilies = families.filter((family) => family.l1 === name);
  const matchingL2 = l2Rows.filter((row) => row.l1 === name).sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount);
  return {
    rank: index + 1,
    name,
    definition: l1Definitions[name] || `${name}下面包含${matchingL2.slice(0, 4).map((row) => row.name).join("、")}`,
    familyCount,
    enterpriseCount: new Set(matchingFamilies.map((family) => family.enterprise)).size,
    projectCount: matchingFamilies.reduce((sum, family) => sum + family.projectCount, 0),
    share: familyCount / families.length,
    direction: sectorNotes[name]?.direction || "现有样本不足以单独判断发展方向",
    maturity: sectorNotes[name]?.maturity || "现有样本不足以单独判断成熟度",
    caveat: sectorNotes[name]?.caveat || "需要继续下钻二级和三级行业",
    l2: matchingL2,
    importantCompanyKeys: importantCompanies.filter((company) => company.l1 === name).map((company) => company.key),
  };
});

const embodiedFamilies = families.filter((family) => family.l1 === "具身智能");
const taskNames = unique([
  ...taskRules.map((rule) => rule.name),
  "通用作业平台",
]);

function taskSummaryFor(rows) {
  return taskNames.map((name) => {
    const matching = rows.filter((family) => family.task === name);
    if (!matching.length) return null;
    const direction = matching[0].taskDirection || fallbackTaskDirections[name] || "继续观察任务稳定性、单位任务成本和客户复购";
    const important = importantCompanies.filter((company) => company.l1 === "具身智能" && company.familyIds.some((id) => matching.some((family) => family.id === id)));
    const examples = [...matching].sort((a, b) => {
      const aImportant = importantCompanies.some((company) => company.familyIds.includes(a.id)) ? 1 : 0;
      const bImportant = importantCompanies.some((company) => company.familyIds.includes(b.id)) ? 1 : 0;
      return bImportant - aImportant || b.projectCount - a.projectCount || a.enterprise.localeCompare(b.enterprise, "zh-CN");
    }).slice(0, 6);
    return {
      name,
      familyCount: matching.length,
      enterpriseCount: new Set(matching.map((family) => family.enterprise)).size,
      projectCount: matching.reduce((sum, family) => sum + family.projectCount, 0),
      direction,
      familyIds: matching.map((family) => family.id),
      importantCompanyKeys: important.map((company) => company.key),
      examples: examples.map((family) => ({ familyId: family.id, enterprise: family.enterprise, project: family.representativeProject, l3: family.l3 })),
    };
  }).filter(Boolean).sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount);
}

const dashboard = {
  metadata: {
    title: "WAIC 2026 AI项目全景与任务图谱",
    sourceName: raw.metadata.datasetName,
    officialPage: raw.metadata.officialPage,
    fetchedAt: raw.metadata.fetchedAt,
    officialRows: raw.metadata.officialTotal,
    uniqueProjects: projects.length,
    exactDuplicateRowsRemoved: raw.metadata.exactDuplicateRowsRemoved,
    productFamilies: families.length,
    enterprises: new Set(projects.map((project) => project.enterprise)).size,
    level1Count: l1Rows.length,
    level2Count: l2Rows.length,
    level3Count: l3Rows.length,
    aggregationRule: "同一标准化企业在同一一级、二级、三级行业下的项目合并为一个产品族，原始项目仍全部保留",
  },
  sectors: l1Rows,
  importantCompanies,
  embodied: {
    familyCount: embodiedFamilies.length,
    projectCount: embodiedFamilies.reduce((sum, family) => sum + family.projectCount, 0),
    enterpriseCount: new Set(embodiedFamilies.map((family) => family.enterprise)).size,
    l2: l2Rows.filter((row) => row.l1 === "具身智能").sort((a, b) => b.familyCount - a.familyCount),
    l3: l3Rows.filter((row) => row.l1 === "具身智能").sort((a, b) => b.familyCount - a.familyCount),
    tasks: taskSummaryFor(embodiedFamilies),
    humanoidTasks: taskSummaryFor(embodiedFamilies.filter((family) => family.l3 === "人形机器人")),
  },
  families,
  projects,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(dashboard));

const checks = {
  projects: dashboard.projects.length === 1432,
  families: dashboard.families.length === 962,
  familyProjectSum: dashboard.families.reduce((sum, family) => sum + family.projectCount, 0) === dashboard.projects.length,
  enterprises: dashboard.metadata.enterprises === 477,
  level1: dashboard.sectors.length === 20,
  level2: dashboard.metadata.level2Count === 89,
  level3: dashboard.metadata.level3Count === 191,
  embodiedFamilies: dashboard.embodied.familyCount === 236,
  allProjectsHaveFamily: dashboard.projects.every((project) => project.familyId),
};
if (Object.values(checks).some((value) => !value)) throw new Error(`数据检查失败：${JSON.stringify(checks)}`);

console.log(JSON.stringify({ outputPath, checks, tasks: dashboard.embodied.tasks.map(({ name, familyCount, projectCount }) => ({ name, familyCount, projectCount })), humanoidTasks: dashboard.embodied.humanoidTasks.map(({ name, familyCount, projectCount }) => ({ name, familyCount, projectCount })) }, null, 2));
