export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const value = document.createElement(tag);
  if (text !== undefined) value.textContent = text;
  return value;
}

export function append(parent: Node, ...children: Array<Node | string | null | undefined>): void {
  for (const child of children)
    parent.appendChild(child instanceof Node ? child : document.createTextNode(child ?? ""));
}

export function link(href: string, text: string, className?: string): HTMLAnchorElement {
  const value = element("a", text);
  value.href = href;
  if (className) value.className = className;
  return value;
}

const GITHUB_REPOSITORY = "https://github.com/0verme/lineage-viewer";

export function siteNavigation(languageSwitcher: HTMLElement): HTMLElement {
  const value = element("div");
  value.className = "site-navigation";
  append(value, languageSwitcher, githubLink("github-link"));
  return value;
}

export function siteFooter(): HTMLElement {
  const value = element("footer");
  value.className = "site-footer";
  append(value, element("span", "lineage-viewer · Apache-2.0 · "), githubLink());
  return value;
}

function githubLink(className?: string): HTMLAnchorElement {
  const value = document.createElement("a");
  value.href = GITHUB_REPOSITORY;
  value.target = "_blank";
  value.rel = "noopener noreferrer";
  value.setAttribute("aria-label", "GitHub");
  value.title = "GitHub";
  if (className) value.className = className;

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 4.8c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 8 0Z",
  );
  icon.append(path);
  const label = element("span", "GitHub");
  label.className = "github-label";
  append(value, icon, label);
  return value;
}

export function installStyles(css: string): void {
  const style = element("style");
  style.textContent = css;
  document.head.append(style);
}
