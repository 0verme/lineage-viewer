import { expect, test } from "@playwright/test";

const repository = "https://github.com/0verme/lineage-viewer";

for (const path of [
  "/site/?lang=en",
  "/site/demo.html?id=basic&lang=zh-CN",
  "/site/playground.html?lang=en",
]) {
  test(`GitHub project links are available on ${path}`, async ({ page }) => {
    await page.goto(path);

    const navigationLink = page.locator(".github-link");
    await expect(navigationLink).toHaveAccessibleName("GitHub");
    await expect(navigationLink).toHaveAttribute("href", repository);
    await expect(navigationLink).toHaveAttribute("target", "_blank");
    await expect(navigationLink).toHaveAttribute("rel", "noopener noreferrer");

    const footerLink = page.locator(".site-footer a");
    await expect(footerLink).toHaveAccessibleName("GitHub");
    await expect(footerLink).toHaveAttribute("href", repository);
    await expect(footerLink).toHaveAttribute("target", "_blank");
    await expect(footerLink).toHaveAttribute("rel", "noopener noreferrer");
  });
}

test("mobile navigation keeps an accessible GitHub project link", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/site/?lang=zh-CN");

  const navigationLink = page.locator(".github-link");
  await expect(navigationLink).toBeVisible();
  await expect(navigationLink).toHaveAccessibleName("GitHub");
  await expect(navigationLink).toHaveAttribute("title", "GitHub");
});
