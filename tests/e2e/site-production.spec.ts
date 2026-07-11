import { expect, test } from "@playwright/test";

for (const path of ["/", "/demo.html?id=basic", "/playground.html"] as const) {
  test(`production site registers and renders lineage-viewer at ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("lineage-viewer")).toBeVisible();
    await expect(page.locator("lineage-viewer .node").first()).toBeVisible();

    const viewerState = await page.locator("lineage-viewer").evaluate((viewer) => ({
      isDefined: customElements.get("lineage-viewer") !== undefined,
      hasShadowRoot: viewer.shadowRoot !== null,
      nodeCount: viewer.shadowRoot?.querySelectorAll(".node").length ?? 0,
    }));
    expect(viewerState.isDefined).toBe(true);
    expect(viewerState.hasShadowRoot).toBe(true);
    expect(viewerState.nodeCount).toBeGreaterThan(0);
  });
}
