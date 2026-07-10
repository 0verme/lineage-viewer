import { expect, test } from "@playwright/test";

test("the Phase 4 vanilla preview renders a layered lineage graph", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/examples/vanilla/");

  await expect(page).toHaveTitle("lineage-viewer Phase 4 preview");
  const viewer = page.locator("lineage-viewer");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("svg")).toHaveCount(1);
  await expect(viewer.locator(".node")).toHaveCount(4);
  await expect(viewer.locator(".edge")).toHaveCount(3);
  await expect(viewer.locator(".node-title").first()).toHaveText("DWD_ORDER");
  const odsOrderLayer = await viewer
    .locator('.node[data-node-id="ods_order"]')
    .getAttribute("data-node-layer");
  const odsItemLayer = await viewer
    .locator('.node[data-node-id="ods_item"]')
    .getAttribute("data-node-layer");
  const dwdOrderLayer = await viewer
    .locator('.node[data-node-id="dwd_order"]')
    .getAttribute("data-node-layer");
  expect(odsOrderLayer).toBe(odsItemLayer);
  expect(Number(dwdOrderLayer)).toBeGreaterThan(Number(odsOrderLayer));
  expect(
    await viewer
      .locator(".edge")
      .evaluateAll((edges) => edges.every((edge) => !edge.getAttribute("d")?.includes("NaN"))),
  ).toBe(true);
  expect(errors).toEqual([]);
});
