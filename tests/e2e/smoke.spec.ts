import { expect, test } from "@playwright/test";

test("the Phase 3 vanilla preview renders a lineage graph", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/examples/vanilla/");

  await expect(page).toHaveTitle("lineage-viewer Phase 3 preview");
  const viewer = page.locator("lineage-viewer");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("svg")).toHaveCount(1);
  await expect(viewer.locator(".node")).toHaveCount(3);
  await expect(viewer.locator(".edge")).toHaveCount(2);
  await expect(viewer.locator(".node-title").first()).toHaveText("DWD_ORDER");
  expect(errors).toEqual([]);
});
