import { expect, test } from "@playwright/test";

test("playground loads a sample and preserves the previous preview on parse errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/site/playground.html?lang=en");
  await expect(page.getByLabel("Lineage JSON editor")).toHaveValue(/"ods_orders"/);
  await expect(page.locator("lineage-viewer .node")).toHaveCount(4);
  await page.getByLabel("Lineage JSON editor").fill('{"nodes":');
  await expect(page.locator("#parse-status")).toContainText("JSON parse error:", { timeout: 1500 });
  await expect(
    page.getByText("Preview is showing the last successfully parsed JSON."),
  ).toBeVisible();
  await expect(page.locator("lineage-viewer .node")).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("playground accepts a registered demo and supports manual run", async ({ page }) => {
  await page.goto("/site/playground.html?demo=cycles&lang=en");
  await expect(page.getByLabel("Demo sample")).toHaveValue("cycles");
  await expect(page.locator("lineage-viewer .node")).toHaveCount(7);
  await page.getByLabel("Auto-render").uncheck();
  await page.getByLabel("Lineage JSON editor").fill('{"nodes":[],"edges":[]}');
  await expect(page.getByText("The editor contains unapplied changes.")).toBeVisible();
  await page.getByRole("button", { name: "Render" }).click();
  await expect(page.locator("lineage-viewer .node")).toHaveCount(0);
});
