import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("服务端返回WAIC仪表盘页面", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>WAIC 2026 AI项目全景<\/title>/i);
  assert.match(html, /正在读取全部项目/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("全量数据、合并口径和具身任务保持一致", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/waic-dashboard.json", import.meta.url), "utf8"));
  assert.equal(data.metadata.officialRows, 1435);
  assert.equal(data.metadata.uniqueProjects, 1432);
  assert.equal(data.projects.length, 1432);
  assert.equal(data.metadata.productFamilies, 959);
  assert.equal(data.families.length, 959);
  assert.equal(data.metadata.enterprises, 477);
  assert.equal(data.sectors.length, 20);
  assert.equal(data.metadata.level2Count, 90);
  assert.equal(data.metadata.level3Count, 208);
  assert.equal(data.families.reduce((sum, row) => sum + row.projectCount, 0), 1432);
  assert.ok(data.projects.every((project) => data.families.some((family) => family.id === project.familyId)));

  const embodied = data.sectors.find((sector) => sector.name === "具身智能");
  assert.equal(embodied.familyCount, 243);
  assert.equal(data.embodied.l3.find((row) => row.name === "人形机器人").familyCount, 39);
  assert.equal(data.embodied.humanoidTasks[0].name, "通用动作、科研与展示");
  assert.equal(data.embodied.humanoidTasks[1].name, "仓储拣选与搬运");
});

test("同一企业同一三级行业只生成一个产品族", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/waic-dashboard.json", import.meta.url), "utf8"));
  const keys = data.families.map((row) => [row.enterprise, row.l1, row.l2, row.l3].join("｜"));
  assert.equal(new Set(keys).size, keys.length);

  const merged = data.families.filter((row) => row.projectCount > 1);
  assert.ok(merged.length > 0);
  assert.ok(merged.every((row) => row.projectNames.length >= 1));
});

test("所有一级行业都使用同一套三级拆解字段", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/waic-dashboard.json", import.meta.url), "utf8"));
  assert.equal(data.globalL3.length, data.metadata.level3Count);
  assert.ok(data.globalL3.every((row) => row.work && row.audience));
  assert.ok(data.globalL3.every((row) => row.familyIds.length === row.familyCount));
  assert.ok(data.globalL3.every((row) => row.exampleFamilyIds.length > 0));
  assert.ok(data.globalL3.every((row) => row.evidenceStages.reduce((sum, stage) => sum + stage.count, 0) === row.familyCount));
  assert.ok(data.families.every((row) => row.work && row.audience && row.evidenceStage && row.evidenceStageBasis));

  for (const sector of data.sectors) {
    assert.ok(sector.l2.length > 0);
    assert.ok(sector.l2.every((row) => row.l3.length > 0));
  }
});

test("人形机器人按全量三级方向排序并保留任务拆解", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/waic-dashboard.json", import.meta.url), "utf8"));
  const counts = new Map(data.embodied.l3.map((row) => [row.name, row.familyCount]));
  assert.equal(counts.get("关节与传动部件"), 16);
  assert.equal(counts.get("人形机器人"), 39);
  assert.equal(counts.get("传感器与感知器件"), 26);
  assert.equal(counts.get("灵巧手与夹爪"), 28);

  const tasks = new Map(data.embodied.humanoidTasks.map((row) => [row.name, row.familyCount]));
  assert.equal(tasks.get("通用动作、科研与展示"), 19);
  assert.equal(tasks.get("工厂装配与生产"), 4);
  assert.equal(tasks.get("商用接待与导览"), 3);
  assert.equal(tasks.get("仓储拣选与搬运"), 5);

  const humanoid = data.globalL3.find((row) => row.name === "人形机器人");
  assert.equal(humanoid.rank, 1);
  assert.equal(data.globalL3[0].name, "人形机器人");
  assert.equal(data.globalL3[1].name, "灵巧手与夹爪");
});

test("分类先区分交付形态并保留关键回归样本", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/waic-dashboard.json", import.meta.url), "utf8"));
  assert.ok(data.projects.every((row) => row.productForm && row.productFormCode && row.productFormBasis));
  assert.ok(data.projects.every((row) => row.confidence !== "低"));
  assert.ok(!data.projects.some((row) => row.productFormCode === "unclear" || row.productForm === "形态待核"));
  assert.ok(!data.projects.some((row) => row.l3 === "具身生态与集成方案"));

  const leyun = data.projects.find((row) => row.code === "5872e1be139d4eada3f3fd1ca84b52af");
  assert.equal(leyun.productFormCode, "platform");
  assert.equal(leyun.l1, "具身智能");
  assert.equal(leyun.l2, "机器人软件与数据");
  assert.equal(leyun.l3, "具身研发、仿真训练与数据平台");

  const strictRobotCategories = new Set(["人形机器人", "通用具身机器人", "四足与仿生机器人", "轮式与移动机器人", "工业与协作机器人", "物流与搬运机器人", "清洁配送与接待机器人"]);
  assert.ok(data.projects.filter((row) => strictRobotCategories.has(row.l3)).every((row) => row.productFormCode === "robot_complete"));
});

test("页面使用结果化文案并包含三类核心图表", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /SectorBubbleChart/);
  assert.match(source, /SectorSankey/);
  assert.match(source, /ProgressChart/);
  assert.match(source, /典型公司/);
  assert.doesNotMatch(source, /只列证据排名靠前|证据评分|不随机|待核验|合并口径/);
  assert.doesNotMatch(source, /组产品|产品组|组机器人|\d+组/);
});

test("页面最小文字字号不低于12px", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const fontSizes = [...css.matchAll(/font-size:\s*(\d+)px/g)].map((match) => Number(match[1]));
  assert.ok(fontSizes.length > 0);
  assert.ok(fontSizes.every((value) => value >= 12));
});
