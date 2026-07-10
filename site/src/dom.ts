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

export function installStyles(css: string): void {
  const style = element("style");
  style.textContent = css;
  document.head.append(style);
}
