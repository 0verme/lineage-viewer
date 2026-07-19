import { expect, test } from "@playwright/test";

test("gallery provides real viewer cards and stable demo navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/site/?lang=en");
  await expect(page.locator("lineage-viewer")).toBeVisible();
  await expect(page.locator("lineage-viewer .node")).toHaveCount(3);
  await expect(page.locator("lineage-viewer .field-row")).toHaveCount(9);
  const showcase = page.locator(".showcase-controls");
  await expect(showcase.getByRole("button")).toHaveCount(3);
  await expect(showcase.getByRole("button", { name: "Basic column lineage" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await showcase.getByRole("button", { name: "Column transformations" }).click();
  await expect(page.locator("lineage-viewer .column-edge")).toHaveCount(5);
  await expect(page.locator(".showcase-copy")).toContainText("Column transformations");
  const cards = page.locator("#demos article");
  await expect(cards).toHaveCount(10);
  await expect(cards.first()).toContainText("nodes");
  await expect(
    cards.getByRole("heading", { name: "Basic column lineage", exact: true }),
  ).toBeVisible();
  await expect(
    cards.getByRole("heading", { name: "Column transformations", exact: true }),
  ).toBeVisible();
  await expect(
    cards.getByRole("heading", { name: "Mixed table and column lineage", exact: true }),
  ).toBeVisible();
  await cards.nth(6).getByRole("link", { name: "Open demo" }).click();
  await expect(page).toHaveURL(/demo\.html\?id=warehouse-layers/);
  await expect(page.locator("lineage-viewer .node")).toHaveCount(20);
  expect(errors).toEqual([]);
});

test("gallery column demos render fields, transforms, and view modes", async ({ page }) => {
  await page.goto("/site/demo.html?id=column-transform&lang=en");
  const viewer = page.locator("lineage-viewer");
  await expect(viewer.locator(".field-row")).toHaveCount(9);
  await expect(viewer.locator(".column-edge")).toHaveCount(5);
  expect((await viewer.locator(".edge-label").allTextContents()).sort()).toEqual([
    "concat",
    "concat",
    "convert",
    "rename",
    "sum",
  ]);
  await expect(page.getByLabel("Show edge labels")).toBeChecked();
  await viewer
    .locator('.node[data-node-id="fct_payments"] .field-row[data-field-id="amount_usd"]')
    .click();
  await expect(page.locator("aside")).toContainText("Selected field");
  await expect(page.locator("aside")).toContainText("amount_cents / 100.0");
  await expect(page.locator("aside")).toContainText("SUM(amount_usd)");
  await expect(page.locator("aside")).toContainText("lineage-field-click");

  await page.goto("/site/demo.html?id=mixed-lineage&lang=en");
  await expect(viewer.locator(".field-row")).toHaveCount(7);
  await expect(viewer.locator(".column-edge")).toHaveCount(4);
  await expect(viewer.locator(".table-edge")).toHaveCount(2);
  await page.getByLabel("View mode").selectOption("table");
  await expect(viewer.locator(".field-row")).toHaveCount(0);
  await expect(viewer.locator(".column-edge")).toHaveCount(0);
  await expect(viewer.locator(".table-edge")).toHaveCount(3);
});

test("demo controls, JSON and diagnostics are interactive", async ({ page }) => {
  await page.goto("/site/demo.html?id=cycles&lang=en");
  const viewer = page.locator("lineage-viewer");
  await expect(viewer.locator(".node")).toHaveCount(7);
  await page.getByLabel("Direction").selectOption("TB");
  await expect(page.locator(".summary")).toContainText("Direction: TB");
  await viewer.locator('.node[data-node-id="model_a"]').click();
  await expect(page.locator("aside")).toContainText("model_a");
  await expect(page.locator("aside")).toContainText("lineage-node-click");
  await page.getByRole("button", { name: "Copy JSON" }).click();
  await expect(page.locator(".notice")).toContainText(/JSON copied|Could not copy/);
  await expect(page.locator(".diagnostic").first()).toContainText("CYCLE");
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(page.locator(".summary")).toContainText("Selected: No node selected.");
});

test("unknown demo has a friendly static not-found page", async ({ page }) => {
  await page.goto("/site/demo.html?id=not-real&lang=en");
  await expect(page.getByText("Demo not found")).toBeVisible();
});
