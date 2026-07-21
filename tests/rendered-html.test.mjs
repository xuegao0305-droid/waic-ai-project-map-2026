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
  assert.match(html, /正在整理全部项目/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("全量数据、合并口径和具身任务保持一致", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/waic-dashboard.json", import.meta.url), "utf8"));
  assert.equal(data.metadata.officialRows, 1435);
  assert.equal(data.metadata.uniqueProjects, 1432);
  assert.equal(data.projects.length, 1432);
  assert.equal(data.metadata.productFamilies, 962);
  assert.equal(data.families.length, 962);
  assert.equal(data.metadata.enterprises, 477);
  assert.equal(data.sectors.length, 20);
  assert.equal(data.metadata.level2Count, 89);
  assert.equal(data.metadata.level3Count, 191);
  assert.equal(data.families.reduce((sum, row) => sum + row.projectCount, 0), 1432);
  assert.ok(data.projects.every((project) => data.families.some((family) => family.id === project.familyId)));

  const embodied = data.sectors.find((sector) => sector.name === "具身智能");
  assert.equal(embodied.familyCount, 236);
  assert.equal(data.embodied.l3.find((row) => row.name === "人形机器人").familyCount, 22);
  assert.equal(data.embodied.humanoidTasks[0].name, "通用动作、科研与展示");
  assert.equal(data.embodied.humanoidTasks[1].name, "工厂装配与生产");
});

test("同一企业同一三级行业只生成一个产品族", async () => {
  const data = JSON.parse(await readFile(new URL("../public/data/waic-dashboard.json", import.meta.url), "utf8"));
  const keys = data.families.map((row) => [row.enterprise, row.l1, row.l2, row.l3].join("｜"));
  assert.equal(new Set(keys).size, keys.length);

  const merged = data.families.filter((row) => row.projectCount > 1);
  assert.ok(merged.length > 0);
  assert.ok(merged.every((row) => row.projectNames.length >= 1));
});
