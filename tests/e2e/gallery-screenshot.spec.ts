import { expect, test } from "@playwright/test";

test.skip(!process.env["GALLERY_SCREENSHOT"], "Run only through npm run screenshot:gallery");
test("captures the documented gallery view", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/site/demo.html?id=warehouse-layers");
  await expect(page.locator("lineage-viewer .node")).toHaveCount(20);
  await page.screenshot({ path: "docs/assets/demo-gallery.png", fullPage: false });
});
