import { expect, test } from "@playwright/test";

test("gallery provides real viewer cards and stable demo navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/site/?lang=en");
  await expect(page.locator("lineage-viewer")).toBeVisible();
  await expect(page.locator("lineage-viewer .node")).toHaveCount(4);
  const cards = page.locator("#demos article");
  await expect(cards).toHaveCount(7);
  await expect(cards.first()).toContainText("nodes");
  await cards.nth(3).getByRole("link", { name: "Open demo" }).click();
  await expect(page).toHaveURL(/demo\.html\?id=warehouse-layers/);
  await expect(page.locator("lineage-viewer .node")).toHaveCount(20);
  expect(errors).toEqual([]);
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
