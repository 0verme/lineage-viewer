import { expect, test } from "@playwright/test";

test("the site defaults to Chinese and language switching retains page parameters", async ({
  page,
}) => {
  await page.goto("/site/demo.html?id=basic");
  await expect(page).toHaveTitle(/基础链路/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("button", { name: "English" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("button", { name: "English" }).click();
  await expect(page).toHaveURL(/id=basic&lang=en/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Simple warehouse pipeline")).toBeVisible();
});
