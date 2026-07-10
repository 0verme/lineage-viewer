import { expect, test } from "@playwright/test";

test("the E2E smoke fixture is served", async ({ page }) => {
  await page.goto("/tests/e2e/fixtures/smoke.html");

  await expect(page).toHaveTitle("Lineage Viewer E2E Baseline");
  await expect(page.getByRole("heading", { name: "E2E baseline" })).toBeVisible();
});
