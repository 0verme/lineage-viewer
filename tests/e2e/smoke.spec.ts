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

test("selects a field and highlights its complete column lineage", async ({ page }) => {
  await page.goto("/examples/vanilla/");
  const viewer = page.locator("lineage-viewer");
  await viewer.evaluate((element) => {
    (element as HTMLElement).style.height = "480px";
    (
      element as unknown as {
        setData(data: unknown): void;
        setOptions(options: unknown): void;
      }
    ).setOptions({ highlightMode: "both" });
    (
      element as unknown as {
        setData(data: unknown): void;
      }
    ).setData({
      nodes: [
        { id: "a", label: "A", fields: [{ id: "id" }, { id: "other" }] },
        { id: "b", label: "B", fields: [{ id: "id" }] },
        { id: "c", label: "C", fields: [{ id: "id" }] },
        { id: "d", label: "D", fields: [{ id: "id" }] },
      ],
      edges: [
        {
          source: "a",
          target: "b",
          sourceField: "id",
          targetField: "id",
          transformType: "aggregate",
          expression: "SUM(id)",
        },
        { source: "b", target: "c", sourceField: "id", targetField: "id" },
        { source: "c", target: "a", sourceField: "id", targetField: "id" },
        { source: "d", target: "c" },
      ],
    });
  });
  await expect(viewer).toBeVisible();

  const selection = viewer.evaluate((element) => {
    return new Promise<unknown>((resolve) => {
      element.addEventListener("lineage-selection-change", (event) => {
        resolve((event as CustomEvent).detail);
      });
    });
  });
  const fieldClick = viewer.evaluate((element) => {
    return new Promise<unknown>((resolve) => {
      element.addEventListener("lineage-field-click", (event) => {
        resolve((event as CustomEvent).detail);
      });
    });
  });
  await viewer.locator('.node[data-node-id="b"] .field-row[data-field-id="id"]').click();
  await expect(
    viewer.locator('.node[data-node-id="b"] .field-row[data-field-id="id"]'),
  ).toHaveAttribute("data-selected", "");
  await expect(viewer.locator(".column-edge[data-highlighted]")).toHaveCount(3);
  await expect(viewer.locator(".table-edge")).toHaveAttribute("data-dimmed", "");
  await expect(viewer.locator('.node[data-node-id="d"]')).toHaveAttribute("data-dimmed", "");
  await expect(
    viewer.locator('.node[data-node-id="a"] .field-row[data-field-id="other"]'),
  ).toHaveAttribute("data-dimmed", "");
  await expect(selection).resolves.toMatchObject({
    selectedNodeId: null,
    selectedField: { nodeId: "b", fieldId: "id" },
    field: { id: "id" },
    source: "pointer",
  });
  await expect(fieldClick).resolves.toMatchObject({
    nodeId: "b",
    fieldId: "id",
    field: { id: "id" },
  });
  expect(
    await viewer.evaluate(
      (element) =>
        (
          element as unknown as {
            selectedField: { nodeId: string; fieldId: string } | null;
          }
        ).selectedField,
    ),
  ).toEqual({ nodeId: "b", fieldId: "id" });

  const edgeClick = viewer.evaluate((element) => {
    return new Promise<unknown>((resolve) => {
      element.addEventListener("lineage-edge-click", (event) => {
        resolve((event as CustomEvent).detail);
      });
    });
  });
  await viewer
    .locator(".edge-hit-area")
    .first()
    .evaluate((edge) =>
      edge.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true })),
    );
  await expect(edgeClick).resolves.toMatchObject({
    source: { nodeId: "a", fieldId: "id", label: "a.id" },
    target: { nodeId: "b", fieldId: "id", label: "b.id" },
    transformType: "aggregate",
    expression: "SUM(id)",
  });
});

test("switches between mixed, table, and column view modes", async ({ page }) => {
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
        { id: "a", label: "A", fields: [{ id: "id" }, { id: "name" }] },
        { id: "b", label: "B", fields: [{ id: "id" }, { id: "name" }] },
      ],
      edges: [
        { source: "a", target: "b", sourceField: "id", targetField: "id" },
        { source: "a", target: "b", sourceField: "name", targetField: "name" },
        { source: "a", target: "b", label: "table dependency" },
      ],
    });
  });
  await expect(viewer.locator("svg")).toHaveAttribute("data-view-mode", "mixed");
  await expect(viewer.locator(".field-row")).toHaveCount(4);
  await expect(viewer.locator(".column-edge")).toHaveCount(2);
  await expect(viewer.locator(".table-edge")).toHaveCount(1);

  await viewer.evaluate((element) => {
    (
      element as unknown as {
        selectField(nodeId: string, fieldId: string): void;
        setOptions(options: unknown): void;
      }
    ).selectField("a", "id");
  });
  await expect(viewer.locator('.field-row[data-field-id="id"][data-selected]')).toHaveCount(1);
  await viewer.evaluate((element) => {
    (
      element as unknown as {
        setOptions(options: unknown): void;
      }
    ).setOptions({ viewMode: "table" });
  });
  await expect(viewer.locator("svg")).toHaveAttribute("data-view-mode", "table");
  await expect(viewer.locator(".field-row")).toHaveCount(0);
  await expect(viewer.locator(".column-edge")).toHaveCount(0);
  await expect(viewer.locator(".table-edge")).toHaveCount(1);
  await expect(viewer.locator(".node-surface").first()).toHaveAttribute("height", "72");
  expect(
    await viewer.evaluate(
      (element) =>
        (
          element as unknown as {
            selectedField: unknown;
          }
        ).selectedField,
    ),
  ).toBeNull();

  await viewer.evaluate((element) => {
    (
      element as unknown as {
        setOptions(options: unknown): void;
      }
    ).setOptions({ viewMode: "column" });
  });
  await expect(viewer.locator("svg")).toHaveAttribute("data-view-mode", "column");
  await expect(viewer.locator(".field-row")).toHaveCount(4);
  await expect(viewer.locator(".column-edge")).toHaveCount(2);
  await expect(viewer.locator(".table-edge")).toHaveCount(0);
});

test("searches table and field names and filters by data type", async ({ page }) => {
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
            { id: "customer_id", label: "Customer ID", dataType: "bigint" },
            { id: "created_at", dataType: "timestamp" },
          ],
        },
        {
          id: "warehouse",
          label: "Warehouse",
          fields: [{ id: "customer_id", dataType: "BIGINT" }],
        },
        {
          id: "audit",
          label: "Audit Records",
          fields: [{ id: "payload", dataType: "json" }],
        },
      ],
      edges: [
        {
          source: "orders",
          target: "warehouse",
          sourceField: "customer_id",
          targetField: "customer_id",
        },
        { source: "warehouse", target: "audit" },
      ],
    });
  });
  await expect(viewer).toBeVisible();

  const typeResults = await viewer.evaluate((element) =>
    (
      element as unknown as {
        search(query: string, filter: { dataType: string }): unknown;
      }
    ).search("", { dataType: "bigint" }),
  );
  expect(typeResults).toEqual([
    { kind: "field", nodeId: "orders", fieldId: "customer_id" },
    { kind: "field", nodeId: "warehouse", fieldId: "customer_id" },
  ]);
  await expect(viewer.locator(".field-row[data-search-match]")).toHaveCount(2);
  await expect(viewer.locator('.node[data-node-id="audit"]')).toHaveAttribute(
    "data-search-dimmed",
    "",
  );
  await expect(viewer.locator(".edge[data-search-dimmed]")).toHaveCount(1);

  const fieldLocations = await viewer.evaluate((element) =>
    (
      element as unknown as {
        searchFields(keyword: string): unknown;
      }
    ).searchFields("JSON"),
  );
  expect(fieldLocations).toEqual([{ nodeId: "audit", fieldId: "payload", label: "payload" }]);
  await expect(
    viewer.locator('.node[data-node-id="audit"] .field-row[data-field-id="payload"]'),
  ).toHaveAttribute("data-search-match", "");

  await viewer.evaluate((element) => {
    (
      element as unknown as {
        search(query: string): unknown;
      }
    ).search("Audit Records");
  });
  await expect(viewer.locator('.node[data-node-id="audit"]')).toHaveAttribute(
    "data-search-match",
    "",
  );
  await expect(viewer.locator(".field-row[data-search-dimmed]")).toHaveCount(0);

  await viewer.evaluate((element) => {
    (
      element as unknown as {
        setOptions(options: unknown): void;
        search(query: string, filter: { dataType: string }): unknown;
      }
    ).setOptions({ viewMode: "table" });
    (
      element as unknown as {
        search(query: string, filter: { dataType: string }): unknown;
      }
    ).search("", { dataType: "bigint" });
  });
  await expect(viewer.locator(".field-row")).toHaveCount(0);
  await expect(viewer.locator(".node[data-search-match]")).toHaveCount(2);

  await viewer.evaluate((element) => {
    (
      element as unknown as {
        clearSearch(): void;
      }
    ).clearSearch();
  });
  await expect(viewer.locator("[data-search-match]")).toHaveCount(0);
  await expect(viewer.locator("[data-search-dimmed]")).toHaveCount(0);
});

test("reuses SVG elements for label toggles and unchanged graph items", async ({ page }) => {
  await page.goto("/examples/vanilla/");
  const viewer = page.locator("lineage-viewer");
  const reuse = await viewer.evaluate((element) => {
    const api = element as unknown as {
      setData(data: unknown): void;
      setOptions(options: unknown): void;
      shadowRoot: ShadowRoot;
    };
    const graph = (sourceLabel: string) => ({
      nodes: [
        {
          id: "source",
          label: sourceLabel,
          fields: [{ id: "id", dataType: "bigint" }],
        },
        {
          id: "target",
          label: "Target",
          fields: [{ id: "id", dataType: "bigint" }],
        },
      ],
      edges: [
        {
          source: "source",
          target: "target",
          sourceField: "id",
          targetField: "id",
          label: "copies",
        },
      ],
    });
    api.setData(graph("Source"));
    const source = api.shadowRoot.querySelector('.node[data-node-id="source"]');
    const target = api.shadowRoot.querySelector('.node[data-node-id="target"]');
    const edge = api.shadowRoot.querySelector(".edge");
    api.setOptions({ showEdgeLabels: true });
    const labelToggle = {
      source: source === api.shadowRoot.querySelector('.node[data-node-id="source"]'),
      target: target === api.shadowRoot.querySelector('.node[data-node-id="target"]'),
      edge: edge === api.shadowRoot.querySelector(".edge"),
      labels: api.shadowRoot.querySelectorAll(".edge-label").length,
    };
    api.setData(graph("Renamed source"));
    return {
      labelToggle,
      changedSource: source !== api.shadowRoot.querySelector('.node[data-node-id="source"]'),
      unchangedTarget: target === api.shadowRoot.querySelector('.node[data-node-id="target"]'),
      unchangedEdge: edge === api.shadowRoot.querySelector(".edge"),
    };
  });

  expect(reuse).toEqual({
    labelToggle: { source: true, target: true, edge: true, labels: 1 },
    changedSource: true,
    unchangedTarget: true,
    unchangedEdge: true,
  });
});
