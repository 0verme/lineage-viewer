import { expect, test } from "@playwright/test";

test("the Phase 5 vanilla preview renders interactive lineage", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/examples/vanilla/");

  await expect(page).toHaveTitle("lineage-viewer Phase 5 preview");
  const viewer = page.locator("lineage-viewer");
  await viewer.evaluate((element) => {
    (element as HTMLElement).style.height = "480px";
  });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("svg")).toHaveCount(1);
  await expect(viewer.locator(".node")).toHaveCount(4);
  await expect(viewer.locator(".edge")).toHaveCount(3);
  await expect(viewer.locator(".node-title").first()).toHaveText("DWD_ORDER");
  const odsOrderLayer = await viewer
    .locator('.node[data-node-id="ods_order"]')
    .getAttribute("data-node-layer");
  const odsItemLayer = await viewer
    .locator('.node[data-node-id="ods_item"]')
    .getAttribute("data-node-layer");
  const dwdOrderLayer = await viewer
    .locator('.node[data-node-id="dwd_order"]')
    .getAttribute("data-node-layer");
  expect(odsOrderLayer).toBe(odsItemLayer);
  expect(Number(dwdOrderLayer)).toBeGreaterThan(Number(odsOrderLayer));
  expect(
    await viewer
      .locator(".edge")
      .evaluateAll((edges) => edges.every((edge) => !edge.getAttribute("d")?.includes("NaN"))),
  ).toBe(true);
  expect(errors).toEqual([]);
  const initial = await viewer.locator(".viewport").getAttribute("transform");
  await viewer.locator("svg").dispatchEvent("wheel", { deltaY: -100, clientX: 300, clientY: 200 });
  await expect(viewer.locator(".viewport")).not.toHaveAttribute("transform", initial ?? "");
  await viewer.locator('.node[data-node-id="dwd_order"]').click();
  await expect(viewer.locator('.node[data-node-id="dwd_order"]')).toHaveAttribute(
    "data-selected",
    "",
  );
  await expect(viewer.locator('.node[data-node-id="ods_order"]')).toHaveAttribute(
    "data-highlighted",
    "",
  );
});

test("renders field names and data types inside dynamically sized table nodes", async ({
  page,
}) => {
  await page.goto("/examples/vanilla/");
  const viewer = page.locator("lineage-viewer");
  await viewer.evaluate((element) => {
    (element as HTMLElement).style.height = "480px";
    (
      element as unknown as {
        setData(data: unknown): void;
      }
    ).setData({
      nodes: [
        {
          id: "orders",
          label: "Orders",
          fields: [
            { id: "order_id", label: "Order ID", dataType: "bigint" },
            { id: "created_at", dataType: "timestamp" },
          ],
        },
        {
          id: "warehouse",
          label: "Warehouse orders",
          fields: [
            { id: "order_id", dataType: "bigint" },
            { id: "created_at", dataType: "timestamp" },
          ],
        },
        { id: "customers", label: "Customers", fields: [] },
        { id: "legacy", label: "Legacy table" },
      ],
      edges: [
        {
          source: "orders",
          target: "warehouse",
          sourceField: "order_id",
          targetField: "order_id",
        },
        {
          source: "orders",
          target: "warehouse",
          sourceField: "order_id",
          targetField: "created_at",
        },
        {
          source: "orders",
          target: "warehouse",
          sourceField: "created_at",
          targetField: "created_at",
        },
      ],
    });
  });
  await expect(viewer).toBeVisible();

  const orders = viewer.locator('.node[data-node-id="orders"]');
  await expect(orders.locator(".field-row")).toHaveCount(2);
  await expect(orders.locator(".field-name")).toHaveText(["Order ID", "created_at"]);
  await expect(orders.locator(".field-data-type")).toHaveText(["bigint", "timestamp"]);
  await expect(orders.locator(".field-anchor")).toHaveCount(4);
  await expect(orders.locator('.field-anchor[data-port-side="left"]')).toHaveCount(2);
  await expect(orders.locator('.field-anchor[data-port-side="right"]')).toHaveCount(2);
  await expect(orders.locator(".node-surface")).toHaveAttribute("height", "104");
  await expect(viewer.locator(".column-edge")).toHaveCount(3);
  await expect(viewer.locator(".table-edge")).toHaveCount(0);
  await expect(viewer.locator('.column-edge[data-edge-source-field="order_id"]')).toHaveCount(2);
  await expect(viewer.locator('.column-edge[data-edge-target-field="created_at"]')).toHaveCount(2);
  expect(
    await viewer
      .locator(".column-edge")
      .evaluateAll((edges) =>
        edges.every((edge) => !/NaN|Infinity/.test(edge.getAttribute("d") ?? "")),
      ),
  ).toBe(true);
  await expect(viewer.locator('.node[data-node-id="customers"] .node-surface')).toHaveAttribute(
    "height",
    "72",
  );
  await expect(viewer.locator('.node[data-node-id="legacy"] .node-surface')).toHaveAttribute(
    "height",
    "72",
  );
  await expect(viewer.locator('.node[data-node-id="customers"] .fields')).toHaveCount(0);
  await expect(viewer.locator('.node[data-node-id="legacy"] .fields')).toHaveCount(0);
});
