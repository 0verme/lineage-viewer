import { expect, test, type Page } from "@playwright/test";

const graph = {
  nodes: [
    { id: "a", label: "Source", fields: [{ id: "id" }, { id: "amount" }] },
    { id: "b", label: "Model", fields: [{ id: "id" }, { id: "amount" }] },
    { id: "c", label: "Mart", fields: [{ id: "id" }, { id: "amount" }] },
  ],
  edges: [
    { source: "a", target: "b", sourceField: "id", targetField: "id" },
    { source: "a", target: "b", sourceField: "amount", targetField: "amount" },
    { source: "b", target: "c", sourceField: "id", targetField: "id" },
  ],
};

type FlowTestWindow = Window & {
  __lineageFlowTestGraph?: unknown;
  __lineagePendingRaf?: number;
  __lineageRafCancels?: number;
};

async function installGraph(page: Page): Promise<void> {
  await page.addInitScript((data) => {
    Object.defineProperty(window, "__lineageFlowTestGraph", { value: data });
  }, graph);
}

async function trackAnimationFrames(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const pending = new Set<number>();
    let cancels = 0;
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      let id = 0;
      id = request((time) => {
        pending.delete(id);
        callback(time);
      });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      cancels += 1;
      pending.delete(id);
      cancel(id);
    };
    Object.defineProperty(window, "__lineagePendingRaf", { get: () => pending.size });
    Object.defineProperty(window, "__lineageRafCancels", { get: () => cancels });
  });
}

test.beforeEach(async ({ page }) => installGraph(page));

test("motion is off by default, then animates API and pointer selection using existing paths", async ({
  page,
}) => {
  await page.goto("/examples/vanilla/");
  const viewer = page.locator("lineage-viewer");
  await viewer.evaluate((element) => {
    const api = element as unknown as {
      setData(data: unknown): void;
      setOptions(options: unknown): void;
      clearSelection(): void;
      selectNode(id: string): void;
    };
    (element as HTMLElement).style.height = "520px";
    api.setOptions({ highlightMode: "downstream" });
    api.setData((window as FlowTestWindow).__lineageFlowTestGraph);
  });

  await viewer.locator('.node[data-node-id="a"] .node-title').click();
  await expect(viewer.locator('.node[data-node-id="a"]')).toHaveAttribute("data-selected", "");
  await expect(viewer.locator(".edge[data-highlighted]")).toHaveCount(3);
  await expect(viewer.locator(".flow-particle")).toHaveCount(0);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(0);

  await viewer.evaluate((element) => {
    (element as unknown as { setOptions(options: unknown): void }).setOptions({
      flowAnimation: "selection",
    });
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(3);
  await viewer.evaluate((element) => {
    (element as unknown as { setOptions(options: unknown): void }).setOptions({
      highlightMode: "upstream",
    });
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(0);
  await viewer.evaluate((element) => {
    (element as unknown as { setOptions(options: unknown): void }).setOptions({
      highlightMode: "downstream",
    });
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(3);
  await viewer.evaluate((element) => {
    const api = element as unknown as {
      clearSelection(): void;
      selectNode(id: string): void;
    };
    api.clearSelection();
    api.selectNode("a");
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(3);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(3);
  await expect(viewer.locator('.flow-particle[data-flow-direction="forward"]')).toHaveCount(3);

  const particle = viewer.locator(".flow-particle").first();
  await expect.poll(async () => particle.getAttribute("cx")).not.toBeNull();
  const initialPosition = await particle.evaluate((circle) => [
    circle.getAttribute("cx"),
    circle.getAttribute("cy"),
  ]);
  await expect
    .poll(async () =>
      particle.evaluate((circle) =>
        JSON.stringify([circle.getAttribute("cx"), circle.getAttribute("cy")]),
      ),
    )
    .not.toBe(JSON.stringify(initialPosition));

  await viewer.locator('.node[data-node-id="b"] .field-row[data-field-id="id"]').click();
  await expect(
    viewer.locator('.node[data-node-id="b"] .field-row[data-field-id="id"]'),
  ).toHaveAttribute("data-selected", "");
  await expect(viewer.locator(".flow-particle")).toHaveCount(1);
  await expect(viewer.locator('.flow-particle[data-flow-direction="forward"]')).toHaveCount(1);
  await expect(viewer.locator(".flow-particle")).toHaveCount(0, { timeout: 5_000 });
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(0);
});

test("upstream field motion reverses edge travel and all layout directions animate", async ({
  page,
}) => {
  await page.goto("/examples/vanilla/");
  const viewer = page.locator("lineage-viewer");
  await viewer.evaluate((element) => {
    const api = element as unknown as {
      setData(data: unknown): void;
      setOptions(options: unknown): void;
      clearSelection(): void;
      selectNode(id: string): void;
      selectField(nodeId: string, fieldId: string): void;
    };
    (element as HTMLElement).style.height = "520px";
    api.setData((window as FlowTestWindow).__lineageFlowTestGraph);
    api.setOptions({ flowAnimation: "selection", highlightMode: "upstream" });
  });

  await viewer.evaluate((element) => {
    (element as unknown as { selectNode(id: string): void }).selectNode("b");
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(2);
  await expect(viewer.locator('.flow-particle[data-flow-direction="reverse"]')).toHaveCount(2);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(2);

  await viewer.evaluate((element) => {
    const api = element as unknown as {
      clearSelection(): void;
      selectField(nodeId: string, fieldId: string): void;
    };
    api.clearSelection();
    api.selectField("b", "id");
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(1);
  await expect(viewer.locator('.flow-particle[data-flow-direction="reverse"]')).toHaveCount(1);

  for (const direction of ["LR", "RL", "TB", "BT"] as const) {
    await viewer.evaluate((element, nextDirection) => {
      const api = element as unknown as {
        clearSelection(): void;
        setOptions(options: unknown): void;
        selectNode(id: string): void;
      };
      api.clearSelection();
      api.setOptions({ direction: nextDirection, highlightMode: "downstream" });
      api.selectNode("b");
    }, direction);
    const particle = viewer.locator('.flow-particle[data-flow-direction="forward"]').first();
    await expect(particle).toHaveCount(1);
    const path = viewer.locator('.edge[data-edge-source="b"][data-edge-target="c"]');
    await expect(path).toHaveAttribute("data-flowing", "");
    await expect.poll(async () => particle.getAttribute("cx")).not.toBeNull();
    const initialPosition = await particle.evaluate((circle) => [
      circle.getAttribute("cx"),
      circle.getAttribute("cy"),
    ]);
    await expect
      .poll(async () =>
        particle.evaluate((circle) =>
          JSON.stringify([circle.getAttribute("cx"), circle.getAttribute("cy")]),
        ),
      )
      .not.toBe(JSON.stringify(initialPosition));
  }
});

test("selection changes and lifecycle events stop motion without leaving rAF or SVG resources", async ({
  page,
}) => {
  await trackAnimationFrames(page);
  await page.goto("/examples/vanilla/");
  const viewer = page.locator("lineage-viewer");
  await viewer.evaluate((element) => {
    const api = element as unknown as {
      setData(data: unknown): void;
      setOptions(options: unknown): void;
      selectNode(id: string): void;
      zoomBy(factor: number): void;
    };
    (element as HTMLElement).style.height = "520px";
    api.setOptions({ flowAnimation: "selection", highlightMode: "downstream" });
    api.setData((window as FlowTestWindow).__lineageFlowTestGraph);
    api.selectNode("a");
    api.zoomBy(1.15);
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(3);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(3);
  const cancelsBeforeRepeat = await page.evaluate(
    () => (window as FlowTestWindow).__lineageRafCancels,
  );
  await viewer.evaluate((element) => {
    (element as unknown as { selectNode(id: string): void }).selectNode("a");
  });
  expect(await page.evaluate(() => (window as FlowTestWindow).__lineageRafCancels)).toBe(
    cancelsBeforeRepeat,
  );

  await viewer.evaluate((element) => {
    (element as unknown as { setOptions(options: unknown): void }).setOptions({ direction: "BT" });
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(0);
  expect(await page.evaluate(() => (window as FlowTestWindow).__lineagePendingRaf)).toBe(0);
  await viewer.evaluate((element) => {
    const api = element as unknown as {
      clearSelection(): void;
      selectNode(id: string): void;
    };
    api.clearSelection();
    api.selectNode("a");
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(3);

  await viewer.evaluate((element) => {
    (element as unknown as { setOptions(options: unknown): void }).setOptions({
      flowAnimation: "off",
    });
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(0);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(0);
  expect(await page.evaluate(() => (window as FlowTestWindow).__lineagePendingRaf)).toBe(0);

  await viewer.evaluate((element) => {
    const api = element as unknown as {
      setOptions(options: unknown): void;
      clearSelection(): void;
      selectNode(id: string): void;
    };
    api.setOptions({ flowAnimation: "selection" });
    api.clearSelection();
    api.selectNode("a");
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(3);
  await viewer.evaluate((element) => {
    const api = element as unknown as { setData(data: unknown): void };
    const data = (window as FlowTestWindow).__lineageFlowTestGraph as typeof graph;
    api.setData({ nodes: [...data.nodes, { id: "d", label: "New" }], edges: data.edges });
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(0);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(0);

  await viewer.evaluate((element) => {
    const api = element as unknown as {
      clearSelection(): void;
      selectNode(id: string): void;
    };
    api.clearSelection();
    api.selectNode("a");
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(3);
  await viewer.evaluate((element) => {
    element.remove();
    document.body.append(element);
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(0);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(0);

  await viewer.evaluate((element) => {
    (element as unknown as { destroy(): void }).destroy();
  });
  await expect(viewer.locator("svg")).toHaveCount(0);
  expect(await page.evaluate(() => (window as FlowTestWindow).__lineagePendingRaf)).toBe(0);
});

test("reduced motion and hidden documents retain static highlighting only", async ({ page }) => {
  await trackAnimationFrames(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/examples/vanilla/");
  const viewer = page.locator("lineage-viewer");
  await viewer.evaluate((element) => {
    const api = element as unknown as {
      setData(data: unknown): void;
      setOptions(options: unknown): void;
      selectNode(id: string): void;
    };
    api.setOptions({ flowAnimation: "selection", highlightMode: "downstream" });
    api.setData((window as FlowTestWindow).__lineageFlowTestGraph);
    api.selectNode("a");
  });
  await expect(viewer.locator(".edge[data-highlighted]")).toHaveCount(3);
  await expect(viewer.locator(".flow-particle")).toHaveCount(0);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await viewer.evaluate((element) => {
    const api = element as unknown as {
      clearSelection(): void;
      selectNode(id: string): void;
    };
    api.clearSelection();
    api.selectNode("a");
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(3);
  await viewer.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(viewer.locator(".flow-particle")).toHaveCount(0);
  await expect(viewer.locator(".edge[data-flowing]")).toHaveCount(0);
  await expect(viewer.locator(".edge[data-highlighted]")).toHaveCount(3);
  expect(await page.evaluate(() => (window as FlowTestWindow).__lineagePendingRaf)).toBe(0);
});

test("Lineage Flow demo exposes both directions and works at mobile width", async ({
  page,
}, testInfo) => {
  await page.goto("/site/demo.html?id=lineage-flow&lang=en");
  await expect(page.getByLabel("Animate selected lineage paths")).toBeChecked();
  const viewer = page.locator(".demo-viewer lineage-viewer");
  await page.getByLabel("Highlight").selectOption("upstream");
  await viewer
    .locator('.node[data-node-id="fact_sales"] .field-row[data-field-id="revenue"]')
    .click();
  await expect(viewer.locator(".flow-particle")).toHaveCount(2);
  await expect(viewer.locator('.flow-particle[data-flow-direction="reverse"]')).toHaveCount(2);
  await expect
    .poll(async () =>
      Number(await viewer.locator(".flow-particle").first().getAttribute("opacity")),
    )
    .toBeGreaterThan(0.1);
  await expect
    .poll(async () =>
      viewer
        .locator(".flow-particle")
        .first()
        .evaluate((circle) => {
          const x = Number(circle.getAttribute("cx"));
          const y = Number(circle.getAttribute("cy"));
          const root = circle.getRootNode() as ShadowRoot;
          return [...root.querySelectorAll<SVGGraphicsElement>(".node-surface")].every(
            (surface) => {
              const bounds = surface.getBBox();
              return (
                x < bounds.x ||
                x > bounds.x + bounds.width ||
                y < bounds.y ||
                y > bounds.y + bounds.height
              );
            },
          );
        }),
    )
    .toBe(true);
  await page
    .locator(".demo-viewer")
    .screenshot({ path: testInfo.outputPath("lineage-flow-motion.png") });

  await page.getByRole("button", { name: "Clear selection" }).click();
  await page.getByLabel("Highlight").selectOption("downstream");
  await viewer
    .locator('.node[data-node-id="stg_orders"] .field-row[data-field-id="net_amount"]')
    .click();
  await expect(viewer.locator('.flow-particle[data-flow-direction="forward"]')).toHaveCount(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(viewer).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.goto("/site/demo.html?id=lineage-flow&lang=zh-CN");
  await expect(page.getByLabel("动态追踪选中血缘")).toBeChecked();
  await expect(
    page.locator('.demo-viewer lineage-viewer .node[data-node-id="raw_orders"] .node-title'),
  ).toHaveText("RAW_订单");
});
