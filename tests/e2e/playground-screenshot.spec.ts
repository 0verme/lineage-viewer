import { test } from "@playwright/test";

test("capture the JSON playground", async ({ page }) => {
  test.skip(!process.env["PLAYGROUND_SCREENSHOT"], "Dedicated screenshot command only.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/site/playground.html?demo=warehouse-layers");
  await page.screenshot({ path: "docs/assets/json-playground.png", fullPage: true });
});
