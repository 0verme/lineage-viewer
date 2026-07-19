import { expect, test } from "@playwright/test";

test.skip(!process.env["GALLERY_SCREENSHOT"], "Run only through npm run screenshot:gallery");
test("captures the documented column lineage view", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/site/demo.html?id=column-transform&lang=en");
  const viewer = page.locator("lineage-viewer");
  await expect(viewer.locator(".column-edge")).toHaveCount(5);
  await viewer
    .locator('.node[data-node-id="fct_payments"] .field-row[data-field-id="amount_usd"]')
    .click();
  await expect(page.locator("aside")).toContainText("SUM(amount_usd)");
  await page.screenshot({ path: "docs/assets/column-lineage.png", fullPage: false });
});
