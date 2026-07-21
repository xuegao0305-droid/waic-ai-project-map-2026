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
const officialIndustryByName = new Map(raw.officialIndustries.map((row) => [row.industryPrimaryName, row]));

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
  "机器人应用与自动化": "把机器人、感知、规划和执行设备组成可完成具体作业的自动化系统",
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
  "具身研发、仿真训练与数据平台": "提供机器人算法研发、物理仿真、真实数据采集、训练和真机部署工具，降低从实验到硬件运行的成本",
  "机器人操作系统与开发平台": "为机器人提供设备管理、任务编排、接口和二次开发工具",
  "具身生态与集成服务": "把整机、零部件、模型、软件和场景方组合成可交付方案",
  "餐饮与零售机器人": "完成做餐、饮品制作、货品售卖和门店服务",
  "清洁配送与接待机器人": "完成地面清洁、室内配送、引导和接待",
  "陪伴教育与娱乐机器人": "面向家庭、儿童和教育场景，提供对话、内容、互动和编程体验",
  "陪伴穿戴与情感交互": "通过穿戴设备或陪伴硬件提供情绪识别、对话和持续互动",
  "结构与能源部件": "为机器人提供骨架、外壳、连接、供电和能源管理能力",
  "控制器与计算平台": "在机器人端运行感知、规划和运动控制，并连接传感器与执行器",
  "陪伴终端与情感交互": "通过桌面、手持或穿戴硬件提供情绪识别、对话和持续互动",
  "办公与自助服务机器人": "在办公场所完成自助服务、设备操作和无人值守流程",
  "个人护理与生活服务机器人": "在家庭和个人生活中执行理容、护理等具体动作",
  "工业装配与柔性工站": "把机器人、视觉、力控、仿真和工艺设备组成工站，完成装配、包装和多品种切换",
  "视觉引导抓取与操作方案": "用视觉识别工件与位姿，再生成抓取路径和控制动作，处理无序小件或透明物体",
  "机器人视觉开发与集成方案": "把多路相机、同步触发、边缘计算和开发接口组成机器人视觉开发套件",
  "消费品数智化与产品体验": "用AI连接供应链质量、生产管理和消费者服务，提升消费品的品质展示与服务体验",
};

const audienceByL1 = {
  "核心技术": "模型公司、开发者、云厂商和需要自建AI能力的企业",
  "具身智能": "工厂、仓库、商业服务场所、科研机构和机器人集成商",
  "智能终端": "个人消费者、办公人员、门店和行业现场人员",
  "工业互联与智能制造": "工厂的生产、设备、质量和信息化团队",
  "制造业": "制造企业、自动化设备商和产线集成商",
  "智慧医疗": "医院、医生、检验机构、患者和养老康复机构",
  "其他": "需要按具体产品继续判断，不能把这一兜底类当成同一批用户",
  "人才与教育": "学生、教师、学校、培训机构和企业学习部门",
  "文娱艺术与元宇宙": "内容创作者、游戏与直播平台、品牌和消费者",
  "金融科技": "银行、券商、资管机构、企业财务团队和金融消费者",
  "智慧城市": "政府、园区、楼宇运营方和公共设施管理单位",
  "智能驾驶": "车企、自动驾驶运营商、物流企业和车内用户",
  "电力、热力、燃气及水生产和供应业": "电网、能源企业、调度中心和设备运维团队",
  "租赁业与商业服务业": "企业采购、销售、经营管理和专业服务团队",
  "交通运输、仓储和邮政业": "物流企业、供应链团队和出行平台",
  "房地产业": "住房运营商、物业公司、租户和业主",
  "农、林、牧、渔业": "农业企业、合作社、种植户和植保服务商",
  "政府/机构": "政务、法院、检察和公共服务人员",
  "建筑业": "施工单位、项目管理团队和质量安全人员",
  "伦理治理": "AI产品团队、合规部门、审计机构和监管相关单位",
};

const audienceRules = [
  { pattern: /算力|芯片|服务器|存储|互联|数据中心|液冷|云平台/, text: "模型公司、云厂商、数据中心和需要部署算力的企业" },
  { pattern: /模型|算法|训练|微调|推理|开发平台|MLOps|LLMOps/, text: "AI开发者、算法团队和把模型接入业务的企业" },
  { pattern: /办公|协同|经营|决策|客服|营销|招投标|ERP|MES|PLM/, text: "企业管理、销售、客服、研发和运营团队" },
  { pattern: /关节|传动|电机|传感器|灵巧手|夹爪|机械臂|结构件|功能总成/, text: "机器人整机厂、自动化设备商和集成商" },
  { pattern: /健康|医疗|临床|医生|病理|影像|康复|养老|照护|中医|脑机/, text: "医院、医生、患者、健康管理和康复养老机构" },
  { pattern: /课堂|教学|教师|学生|学习|教育|实训|面试/, text: "学生、教师、学校、培训机构和企业学习部门" },
  { pattern: /投研|理财|银行|金融|风控|支付|资金/, text: "银行、券商、资管机构、企业财务团队和金融消费者" },
  { pattern: /工厂|工业|生产|装配|质量|缺陷|PLC|数控|加工/, text: "工厂的生产、设备、质量和自动化团队" },
  { pattern: /城市|园区|楼宇|设施|公共安全|应急/, text: "政府、园区、楼宇和公共设施运营单位" },
  { pattern: /驾驶|座舱|车辆|车载|Robotaxi|导航/, text: "车企、自动驾驶运营商、物流企业和车内用户" },
  { pattern: /电力|电网|能源|能碳|除冰/, text: "电网、能源企业、调度中心和设备运维团队" },
];

function audienceForCategory(l1, l2, l3) {
  const text = `${l2} ${l3}`;
  return audienceRules.find((rule) => rule.pattern.test(text))?.text || audienceByL1[l1] || "需要结合具体项目判断使用者";
}

const workOverrides = {
  "通用具身机器人": "让一台机器人在不同场景里移动、抓取和更换任务，重点验证是否真的能跨任务复用",
  "人形机器人": "用接近人的身体进入现有工位，完成行走、搬运、装配、接待或科研开发",
  "AI芯片与加速卡": "加速大模型训练和推理，降低每次计算的时间、能耗和成本",
  "大语言模型": "理解和生成文字、代码与知识问答，并作为应用和智能体的基础模型",
  "关节与传动部件": "把电机动力稳定传给机器人关节，决定负载、精度、速度和寿命",
  "服务器与算力一体机": "把芯片、内存、存储和网络装成可直接部署模型的计算设备",
  "存储与高速互联": "让多张卡和多台服务器更快交换数据，减少训练和推理等待",
  "数据中心与液冷": "给高密度算力供电和散热，让更多芯片能长时间稳定运行",
  "传感器与感知器件": "采集视觉、触觉、力觉和位置数据，让机器人知道周围和手上发生了什么",
  "内容创作与数字人": "生成文字、图片、视频或数字人内容，缩短制作和运营时间",
  "智算中心与计算集群": "把大量服务器组成统一算力池，并完成资源调度、监控和运维",
  "办公与协同智能体": "在文档、会议、邮件和组织知识中查找信息并执行办公流程",
  "灵巧手与夹爪": "完成抓、拿、拧、按和精细操作，重点处理不同形状和力度的物体",
  "四足与仿生机器人": "通过楼梯、坡地和复杂地形，承担巡检、应急和户外作业",
  "AI眼镜与AR终端": "在视野内完成翻译、提词、记录、拍摄和现场提示",
  "检验病理与早筛": "读取检验和病理数据，发现异常并辅助疾病早期筛查",
  "临床决策与医生智能体": "整理病历和医学知识，帮助医生形成诊疗建议并保留审核过程",
  "医学影像辅助诊断": "识别CT、MRI、超声等影像中的异常区域，辅助医生复核",
  "工业视觉与质量检测": "用相机识别缺陷、尺寸和装配错误，把判断接入质检流程",
  "排产工艺与生产优化": "根据订单、设备和工艺约束安排生产，并调整工艺参数",
  "智能投研与理财": "整理行情、公司和产品数据，生成研究、配置和客户服务建议",
  "自动驾驶车辆与Robotaxi": "让车辆在限定区域内自主行驶，并完成载客运营和车队调度",
  "电力大模型与智能体": "读取电网知识和运行数据，辅助规划、调度、检修和故障处置",
  "法律司法智能体": "检索法律知识、整理案件材料和生成文书，保留人工复核和过程记录",
  "建筑巡检与缺陷检测": "识别施工现场和建筑表面的缺陷，把问题定位给现场人员处理",
  "治理工具与合规服务": "记录模型风险、评估结果和责任链条，支持合规检查与追溯",
};

const workRules = [
  { pattern: /服务器|工作站|算力一体机|计算集群|智算中心|本地算力/, text: "提供模型训练和推理所需的计算设备，并管理资源、网络和运行状态" },
  { pattern: /存储|互联|光模块|网络硬件|网卡/, text: "在算力设备之间存放和传输数据，减少多机多卡协作的等待" },
  { pattern: /模型|算法|多模态|生成式AI|语言技术|计算机视觉/, text: "让软件理解文字、图像或声音，并完成生成、识别、预测或优化" },
  { pattern: /智能体开发|Agent操作系统|开发平台|应用交付/, text: "帮助开发者连接模型、工具和业务系统，搭建可以执行多步任务的智能体" },
  { pattern: /推理与部署|训练与微调|MLOps|LLMOps|可观测/, text: "把模型训练、部署、监控和更新做成可重复管理的工程流程" },
  { pattern: /数据库|湖仓|知识库|检索增强|数据治理|数据服务|可信流通/, text: "整理企业数据和知识，让模型能检索、调用并追踪数据来源" },
  { pattern: /安全|隐私|合规|治理/, text: "识别数据、网络、内容和模型风险，并记录处置和责任过程" },
  { pattern: /量子|光计算/, text: "提供新型计算硬件或开发平台，处理传统计算成本较高的问题" },
  { pattern: /机器人|机械臂|外骨骼/, text: "让机器移动、抓取或辅助人体完成明确的物理任务" },
  { pattern: /关节|传动|电机|驱动|结构件|连接件|传感器|感知器件|功能总成|灵巧手|夹爪/, text: "提供机器人运动、感知和操作所需的核心部件" },
  { pattern: /仿真|训练与数据平台/, text: "在虚拟环境和真实采集中训练机器人，降低反复试错成本" },
  { pattern: /运动控制|导航/, text: "规划路线和动作，让设备保持平衡、避障并到达目标位置" },
  { pattern: /眼镜|AR|穿戴|耳机|助听/, text: "把语音、视觉、健康或提示能力放到随身设备里持续使用" },
  { pattern: /电脑|平板|手机|终端|家电|家居|显示|影音|交互设备/, text: "把AI放进个人或商用硬件，完成本地交互、内容处理和设备控制" },
  { pattern: /会议|翻译|记录/, text: "把现场语音转成翻译、文字记录或会议结果" },
  { pattern: /工业网络|接口|工控机|边缘计算/, text: "连接工厂设备并在现场处理数据，让控制和判断不必全部回传云端" },
  { pattern: /PLC|运动控制|数控|工业控制/, text: "控制设备、产线和机械动作，并把生产指令稳定执行到现场" },
  { pattern: /运维|预测维护|巡检|状态感知|设备管理/, text: "持续监测设备状态，发现故障并安排巡检或维修" },
  { pattern: /质量|缺陷|检测|测量|数据采集/, text: "采集现场数据并识别质量、尺寸、状态或安全异常" },
  { pattern: /MES|ERP|PLM|经营管理/, text: "连接订单、设计、生产和经营数据，帮助企业安排和追踪业务流程" },
  { pattern: /物流|仓储|供应链|无人车/, text: "连接订单、库存、车辆和路线，完成搬运、配送或供应链调度" },
  { pattern: /病理|早筛|影像|临床|诊疗|监护|给药/, text: "辅助医生发现异常、形成诊疗判断或执行监护和给药" },
  { pattern: /慢病|生命体征|健康|睡眠/, text: "持续采集身体和行为数据，提供健康提醒、监测和干预" },
  { pattern: /康复|照护|助行|适老/, text: "帮助患者和老人训练、移动或完成日常照护" },
  { pattern: /医院系统|医疗数据/, text: "连接医院业务和医疗数据，支持诊疗、运营和信息管理" },
  { pattern: /学生|学习|课堂|教学|教师|实训|面试|教育/, text: "帮助学生学习、教师备课教学，或完成训练和能力评价" },
  { pattern: /视频|图像|短片|数字人|虚拟角色|音乐|乐器|游戏|社交|XR|动作捕捉/, text: "生成或驱动内容、角色和互动体验，服务创作、娱乐和平台运营" },
  { pattern: /投研|理财|银行|金融|风控|支付|资金/, text: "处理金融数据和流程，辅助研究、服务、风控、支付或资金管理" },
  { pattern: /城市|园区|楼宇|公共安全|应急/, text: "连接城市和园区设备，支持设施管理、巡检、安全和公共服务" },
  { pattern: /座舱|驾驶|车辆|车载|Robotaxi|导航|定位/, text: "帮助车辆理解环境、规划驾驶、服务乘客或管理运营车队" },
  { pattern: /电力|电网|能源|能碳|除冰/, text: "预测能源供需、辅助调度，并管理设备运行、安全和能碳数据" },
  { pattern: /采购|销售|招投标|咨询|经营驾驶舱/, text: "读取企业业务数据，完成采购、销售、投标、咨询或经营分析" },
  { pattern: /住房|租赁|物业|门锁|门禁/, text: "连接房源、租户、物业流程和门禁设备，支持住房日常运营" },
  { pattern: /农业|植保/, text: "识别农田状态并安排植保、机器人作业和生产管理" },
];

function workForCategory(l1, l2, l3) {
  if (workOverrides[l3]) return workOverrides[l3];
  const text = `${l2} ${l3}`;
  return workRules.find((rule) => rule.pattern.test(text))?.text || `提供${l3}产品，处理${l2}中的具体工作`;
}

const stageRules = [
  { name: "规模使用线索", keywords: ["量产", "规模化", "大规模", "累计交付", "出货", "覆盖超过", "万家", "万名", "百万", "千万用户"] },
  { name: "客户交付线索", keywords: ["商用", "已部署", "部署于", "交付", "采购", "正式上线", "投入运营", "落地", "应用于", "已在"] },
  { name: "试点验证线索", keywords: ["试点", "示范", "验证", "测试", "原型", "首发", "即将", "联合研发"] },
  { name: "研发教学线索", keywords: ["科研", "教学", "开发套件", "二次开发", "开源", "实验室"] },
];

function stageForFamily(family) {
  const text = clean(`${family.projectNames.join(" ")} ${family.records.map((row) => row.productDescriptionCn).join(" ")}`);
  for (const rule of stageRules) {
    const keyword = rule.keywords.find((item) => text.includes(item));
    if (keyword) return { name: rule.name, basis: `WAIC项目介绍出现“${keyword}”` };
  }
  return { name: "产品说明", basis: "WAIC项目介绍给出了产品或方案，但没有出现规模、交付或试点关键词" };
}

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

function embodiedTaskForFamily(family) {
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
    productForms: unique(family.records.map((row) => row.productForm)),
  };
});

const l1FamilyCounts = countBy(preFamilies, (family) => family.l1);
const l1Order = new Map(ranked(l1FamilyCounts).map(([name], index) => [name, index]));
preFamilies.sort((a, b) => (l1Order.get(a.l1) - l1Order.get(b.l1)) || a.l2.localeCompare(b.l2, "zh-CN") || a.l3.localeCompare(b.l3, "zh-CN") || a.enterprise.localeCompare(b.enterprise, "zh-CN"));

const families = preFamilies.map((family, index) => {
  const task = embodiedTaskForFamily(family);
  const stage = stageForFamily(family);
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
    productForms: family.productForms,
    representativeProject: family.projectNames[0],
    description: clean(first.productDescriptionCn),
    logo: first.enterpriseLogoPath || "",
    image: first.productImageFilePath || "",
    task: task?.name || "",
    taskDirection: task?.direction || "",
    work: workForCategory(family.l1, family.l2, family.l3),
    audience: audienceForCategory(family.l1, family.l2, family.l3),
    evidenceStage: stage.name,
    evidenceStageBasis: stage.basis,
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
  productForm: record.productForm,
  productFormCode: record.productFormCode,
  productFormBasis: clean(record.productFormBasis),
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
    definition: embodiedL3Definitions[taxonomyRow.industryLevel3] || workForCategory(taxonomyRow.industryLevel1, taxonomyRow.industryLevel2, taxonomyRow.industryLevel3),
    work: workForCategory(taxonomyRow.industryLevel1, taxonomyRow.industryLevel2, taxonomyRow.industryLevel3),
    audience: audienceForCategory(taxonomyRow.industryLevel1, taxonomyRow.industryLevel2, taxonomyRow.industryLevel3),
    familyCount: matchingFamilies.length,
    enterpriseCount: new Set(matchingFamilies.map((family) => family.enterprise)).size,
    projectCount: matchingFamilies.reduce((sum, family) => sum + family.projectCount, 0),
    familyIds: matchingFamilies.map((family) => family.id),
    evidenceStages: ranked(countBy(matchingFamilies, (family) => family.evidenceStage)).map(([name, count]) => ({ name, count })),
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

const importantFamilyIds = new Set(importantCompanies.flatMap((company) => company.familyIds));
for (const row of l3Rows) {
  const matchingFamilies = row.familyIds.map((id) => families.find((family) => family.id === id)).filter(Boolean);
  const ordered = matchingFamilies.sort((a, b) => Number(importantFamilyIds.has(b.id)) - Number(importantFamilyIds.has(a.id)) || b.projectCount - a.projectCount || b.description.length - a.description.length || a.enterprise.localeCompare(b.enterprise, "zh-CN"));
  row.exampleFamilyIds = ordered.slice(0, 6).map((family) => family.id);
}

const l1Rows = ranked(l1FamilyCounts).map(([name, familyCount], index) => {
  const matchingFamilies = families.filter((family) => family.l1 === name);
  const matchingL2 = l2Rows.filter((row) => row.l1 === name).sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount);
  return {
    rank: index + 1,
    name,
    officialCode: officialIndustryByName.get(name)?.industryPrimaryCode || "",
    officialNameEn: officialIndustryByName.get(name)?.industryPrimaryNameEn || "",
    definition: l1Definitions[name] || `${name}下面包含${matchingL2.slice(0, 4).map((row) => row.name).join("、")}`,
    familyCount,
    enterpriseCount: new Set(matchingFamilies.map((family) => family.enterprise)).size,
    projectCount: matchingFamilies.reduce((sum, family) => sum + family.projectCount, 0),
    share: familyCount / families.length,
    direction: sectorNotes[name]?.direction || "现有样本不足以单独判断发展方向",
    maturity: sectorNotes[name]?.maturity || "现有样本不足以单独判断成熟度",
    caveat: sectorNotes[name]?.caveat || "需要继续下钻二级和三级行业",
    l2: matchingL2,
    importantCompanyKeys: importantCompanies.filter((company) => company.l1 === name).sort((a, b) => b.totalScore - a.totalScore || b.familyCount - a.familyCount).slice(0, 3).map((company) => company.key),
  };
});

const globalL3 = [...l3Rows]
  .sort((a, b) => b.familyCount - a.familyCount || b.projectCount - a.projectCount || a.name.localeCompare(b.name, "zh-CN"))
  .map((row, index) => ({ ...row, rank: index + 1 }));

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
    level1Source: "WAIC官方项目目录的主行业标签",
    level2Level3Source: "本台账根据项目名称、简介和交付形态统一细分",
  },
  sectors: l1Rows,
  globalL3,
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
  families: dashboard.families.length > 0,
  familyProjectSum: dashboard.families.reduce((sum, family) => sum + family.projectCount, 0) === dashboard.projects.length,
  enterprises: dashboard.metadata.enterprises === 477,
  level1: dashboard.sectors.length === 20,
  level2: dashboard.metadata.level2Count > 0,
  level3: dashboard.metadata.level3Count > 0,
  embodiedFamilies: dashboard.embodied.familyCount > 0,
  allProjectsHaveFamily: dashboard.projects.every((project) => project.familyId),
  allProjectsHaveProductForm: dashboard.projects.every((project) => project.productForm && project.productFormCode),
  allFamiliesHavePlainWork: dashboard.families.every((family) => family.work && family.audience && family.evidenceStage),
  allLevel3HaveDrilldown: dashboard.globalL3.every((row) => row.work && row.audience && row.familyIds.length === row.familyCount && row.exampleFamilyIds.length > 0),
};
if (Object.values(checks).some((value) => !value)) throw new Error(`数据检查失败：${JSON.stringify(checks)}`);

console.log(JSON.stringify({ outputPath, checks, tasks: dashboard.embodied.tasks.map(({ name, familyCount, projectCount }) => ({ name, familyCount, projectCount })), humanoidTasks: dashboard.embodied.humanoidTasks.map(({ name, familyCount, projectCount }) => ({ name, familyCount, projectCount })) }, null, 2));
