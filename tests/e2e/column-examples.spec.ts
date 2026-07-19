import { expect, test } from "@playwright/test";

test("column-basic renders field mappings and supports field selection", async ({ page }) => {
  await page.goto("/examples/column-basic/");
  const viewer = page.locator("lineage-viewer");
  await expect(page).toHaveTitle("Column lineage: basic mapping");
  await expect(viewer.locator("svg")).toHaveAttribute("data-view-mode", "column");
  await expect(viewer.locator(".field-row")).toHaveCount(9);
  await expect(viewer.locator(".column-edge")).toHaveCount(6);

  await viewer
    .locator('.node[data-node-id="stg_orders"] .field-row[data-field-id="order_id"]')
    .click();
  await expect(viewer.locator(".field-row[data-highlighted]")).toHaveCount(2);
  await expect(page.locator(".status")).toContainText("stg_orders.order_id");
});

test("column-transform exposes transformation labels and details", async ({ page }) => {
  await page.goto("/examples/column-transform/");
  const viewer = page.locator("lineage-viewer");
  await expect(viewer.locator(".column-edge")).toHaveCount(3);
  await expect(viewer.locator(".edge-label")).toHaveCount(3);
  expect((await viewer.locator(".edge-label").allTextContents()).sort()).toEqual([
    "convert",
    "rename",
    "sum",
  ]);

  await viewer
    .locator('.node[data-node-id="fct_payments"] .field-row[data-field-id="amount_usd"]')
    .click();
  await expect(page.locator(".status")).toContainText("amount_cents / 100.0");
  await expect(page.locator(".status")).toContainText("SUM(amount_usd)");
});

test("mixed-lineage switches views and searches fields", async ({ page }) => {
  await page.goto("/examples/mixed-lineage/");
  const viewer = page.locator("lineage-viewer");
  await expect(viewer.locator("svg")).toHaveAttribute("data-view-mode", "mixed");
  await expect(viewer.locator(".table-edge")).toHaveCount(2);
  await expect(viewer.locator(".column-edge")).toHaveCount(4);

  await page.locator('[data-action="view"]').selectOption("table");
  await expect(viewer.locator(".field-row")).toHaveCount(0);
  await expect(viewer.locator(".table-edge")).toHaveCount(3);

  await page.locator('[data-action="view"]').selectOption("mixed");
  await page.locator('[data-action="type"]').selectOption("bigint");
  await expect(viewer.locator(".field-row[data-search-match]")).toHaveCount(2);
  await expect(page.locator(".status")).toContainText("2 matches");
});

test("sqlglot adapter demo renders generated aggregate field lineage", async ({ page }) => {
  await page.goto("/examples/sqlglot-adapter/");
  const viewer = page.locator("lineage-viewer");
  await expect(page).toHaveTitle("SQLGlot adapter: SQL to column lineage");
  await expect(page.locator("[data-sql]")).toContainText("SUM(amount) AS total_amount");
  await expect(viewer.locator(".field-row")).toHaveCount(4);
  await expect(viewer.locator(".column-edge")).toHaveCount(2);
  expect((await viewer.locator(".edge-label").allTextContents()).sort()).toEqual([
    "aggregate",
    "passthrough",
  ]);
  await expect(page.locator(".status")).toContainText("2 field mappings generated from SQL");
});

test("openlineage adapter demo renders job, datasets, and column lineage", async ({ page }) => {
  await page.goto("/examples/openlineage-adapter/");
  const viewer = page.locator("lineage-viewer");
  await expect(page).toHaveTitle("OpenLineage Adapter example");
  await expect(page.locator("[data-event]")).toContainText('"eventType": "COMPLETE"');
  await expect(viewer.locator(".node")).toHaveCount(3);
  await expect(viewer.locator(".field-row")).toHaveCount(4);
  await expect(viewer.locator(".table-edge")).toHaveCount(2);
  await expect(viewer.locator(".column-edge")).toHaveCount(2);
  expect((await viewer.locator(".edge-label").allTextContents()).sort()).toEqual([
    "aggregate",
    "reads",
    "rename",
    "writes",
  ]);
  await expect(page.locator(".status")).toContainText("4 edges generated from one RunEvent");
});
