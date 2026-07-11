import { defineLineageViewer } from "lineage-viewer";
import type { LineageViewerElement } from "lineage-viewer";
import { cloneGraph, getLocalizedDemoData } from "./demo-registry.js";
import { append, element, installStyles, link, siteFooter, siteNavigation } from "./dom.js";
import { buildLocalizedUrl, getLanguage, languageSwitcher, localizeDocument, t } from "./i18n.js";
import { styles } from "./styles.js";

defineLineageViewer();
installStyles(styles);
localizeDocument("Gallery");
const app = document.querySelector("#app");
if (!app) throw new Error("Gallery root is missing.");
const demos = getLocalizedDemoData(getLanguage());
const shell = element("div");
shell.className = "shell";
const header = element("header");
append(
  header,
  link(buildLocalizedUrl("./"), "lineage-viewer", "brand"),
  link("#quick-start", t("quickStart")),
  siteNavigation(languageSwitcher()),
);
const hero = element("section");
hero.className = "hero";
const eyebrow = element("span", t("status"));
eyebrow.className = "status";
const title = element("h1", t("homeTitle"));
const lead = element("p", t("homeLead"));
lead.className = "lead";
const actions = element("div");
actions.className = "actions";
append(
  actions,
  link("#demos", t("explore"), "primary"),
  link(buildLocalizedUrl("./playground.html"), t("tryJson")),
  link("#quick-start", t("quickStart")),
);
const viewerCard = element("div");
viewerCard.className = "viewer-card";
const viewer = document.createElement("lineage-viewer") as LineageViewerElement;
viewer.data = cloneGraph(demos[0]!.graph);
viewerCard.append(viewer);
append(hero, eyebrow, title, lead, actions, viewerCard);
const gallery = element("section");
gallery.id = "demos";
append(gallery, element("p", t("gallery")), element("h2", t("galleryHeading")));
const grid = element("div");
grid.className = "grid";
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
    `${demo.graph.nodes.length} ${t("nodes")} · ${demo.graph.edges.length} ${t("edges")}`,
  );
  counts.className = "counts";
  append(
    card,
    element("h3", demo.title),
    element("p", demo.summary),
    counts,
    tags,
    link(
      buildLocalizedUrl(`./demo.html?id=${encodeURIComponent(demo.id)}`),
      t("openDemo"),
      "primary",
    ),
    link(
      buildLocalizedUrl(`./playground.html?demo=${encodeURIComponent(demo.id)}`),
      t("openPlayground"),
    ),
  );
  grid.append(card);
}
gallery.append(grid);
const quick = element("section");
quick.id = "quick-start";
append(quick, element("p", t("quickStartHeading")), element("h2", "Embed the viewer in any app"));
const pre = element("pre");
pre.append(element("code", "npm install lineage-viewer"));
quick.append(pre);
append(shell, header, hero, gallery, quick, siteFooter());
app.append(shell);
