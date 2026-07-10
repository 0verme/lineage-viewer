import "lineage-viewer/define";

import { demos, cloneGraph } from "./demo-registry.js";
import { append, element, installStyles, link } from "./dom.js";
import { styles } from "./styles.js";
import type { LineageViewerElement } from "lineage-viewer";

installStyles(styles);
const app = document.querySelector("#app");
if (!app) throw new Error("Gallery root is missing.");
const shell = element("div");
shell.className = "shell";
const header = element("header");
append(header, link("./", "lineage-viewer", "brand"), link("#quick-start", "Quick start"));
const hero = element("section");
hero.className = "hero";
const eyebrow = element("span", "Alpha / active development");
eyebrow.className = "status";
const title = element("h1", "Lineage graphs, made easy to inspect.");
const lead = element("p", "A lightweight, framework-agnostic, embeddable lineage graph viewer.");
lead.className = "lead";
const actions = element("div");
actions.className = "actions";
append(
  actions,
  link("#demos", "Explore demos", "primary"),
  link("./playground.html", "Try your JSON"),
  link("#quick-start", "View quick start"),
);
const viewerCard = element("div");
viewerCard.className = "viewer-card";
const featuredDemo = demos[0];
if (!featuredDemo) throw new Error("Gallery requires a featured demo.");
const viewer = document.createElement("lineage-viewer") as LineageViewerElement;
viewer.data = cloneGraph(featuredDemo.graph);
viewerCard.append(viewer);
append(hero, eyebrow, title, lead, actions, viewerCard);
const capabilities = element("section");
append(
  capabilities,
  element("p", "Built with the current public API"),
  element("h2", "Practical, native graph interaction"),
);
const capabilityGrid = element("div");
capabilityGrid.className = "grid";
for (const [name, description] of [
  ["Native Web Component", "A framework-agnostic custom element."],
  ["Deterministic layered layout", "Stable graph placement in four directions."],
  ["Cycle-aware graphs", "SCC-aware layout and diagnostics."],
  ["Zoom, pan and fit", "Inspect graph detail without leaving the page."],
  ["Lineage highlights", "Connected, upstream and downstream context."],
  ["Strict or lenient validation", "Stable diagnostics for input problems."],
]) {
  const card = element("article");
  card.className = "card";
  append(card, element("h3", name), element("p", description));
  capabilityGrid.append(card);
}
capabilities.append(capabilityGrid);
const gallery = element("section");
gallery.id = "demos";
append(
  gallery,
  element("p", "Demo Gallery"),
  element("h2", "Explore representative lineage scenarios"),
);
const galleryGrid = element("div");
galleryGrid.className = "grid";
for (const demo of demos) {
  const card = element("article");
  card.className = "card";
  const tags = element("p");
  for (const tag of demo.tags) {
    const badge = element("span", tag);
    badge.className = "tag";
    tags.append(badge, document.createTextNode(" "));
  }
  const counts = element(
    "div",
    `${demo.graph.nodes.length} nodes · ${demo.graph.edges.length} edges`,
  );
  counts.className = "counts";
  append(
    card,
    element("h3", demo.title),
    element("p", demo.summary),
    counts,
    tags,
    link(`./demo.html?id=${encodeURIComponent(demo.id)}`, "Open demo", "primary"),
    link(`./playground.html?demo=${encodeURIComponent(demo.id)}`, "Open in Playground"),
  );
  galleryGrid.append(card);
}
gallery.append(galleryGrid);
const quickStart = element("section");
quickStart.id = "quick-start";
append(quickStart, element("p", "Quick Start"), element("h2", "Embed the viewer in any app"));
const install = element("pre");
const installCode = element("code", "npm install lineage-viewer");
install.append(installCode);
const usage = element("pre");
usage.append(
  element(
    "code",
    `import "lineage-viewer/define";\n\nconst viewer = document.querySelector("lineage-viewer");\n\nviewer.data = {\n  nodes: [...],\n  edges: [...]\n};`,
  ),
);
const css = element("pre");
css.append(
  element("code", `lineage-viewer {\n  display: block;\n  width: 100%;\n  height: 600px;\n}`),
);
append(quickStart, install, usage, css);
append(shell, header, hero, capabilities, gallery, quickStart);
app.append(shell);
