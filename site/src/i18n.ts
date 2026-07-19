export type Language = "zh-CN" | "en";

export const LANGUAGE_STORAGE_KEY = "lineage-viewer-demo-language";

const locales = {
  en: {
    languageSwitcher: "Language: Chinese | English",
    status: "Alpha / active development",
    homeTitle: "Lineage graphs, made easy to inspect.",
    homeLead:
      "A lightweight, framework-free Web Component for interactive table-level and column-level data lineage visualization.",
    showcase: "Product showcase",
    showcaseHint: "Switch between table, column, and transformation lineage.",
    explore: "Explore demos",
    tryJson: "Try your JSON",
    quickStart: "View quick start",
    quickStartHeading: "Quick start",
    gallery: "Demo Gallery",
    galleryHeading: "Explore representative lineage scenarios",
    openDemo: "Open demo",
    openPlayground: "Open in Playground",
    nodes: "nodes",
    edges: "edges",
    backGallery: "Back to gallery",
    editJson: "Edit this JSON in Playground",
    interactiveDemo: "Interactive demo",
    direction: "Direction",
    viewMode: "View mode",
    highlight: "Highlight",
    showEdgeLabels: "Show edge labels",
    showSelfLoops: "Show self-loops",
    fitView: "Fit view",
    resetView: "Reset view",
    clearSelection: "Clear selection",
    selected: "Selected: {value}",
    diagnostics: "Diagnostics: {count}",
    selectedNode: "Selection details",
    selectedField: "Selected field",
    dataType: "Data type",
    description: "Description",
    transforms: "Related transformations",
    noTransforms: "No field transformations.",
    source: "Source",
    target: "Target",
    transformType: "Transform type",
    expression: "Expression",
    noSelectedNode: "No node selected.",
    events: "Recent events",
    noEvents: "No events yet.",
    clearEvents: "Clear events",
    noDiagnostics: "No diagnostics",
    readOnlyJson: "Read-only JSON",
    copyJson: "Copy JSON",
    copied: "JSON copied to clipboard.",
    copyFailed: "Could not copy JSON. Clipboard access is unavailable.",
    demoNotFound: "Demo not found",
    demoNotFoundLead: "That demo is not in the gallery.",
    demoNotFoundHint: "Choose one of the registered, stable demo URLs instead.",
    playground: "JSON Playground",
    playgroundTitle: "Try your lineage JSON locally",
    playgroundLead:
      "Parse JSON in the browser, then preview it with the same viewer used by the gallery.",
    localOnly: "Local-only: JSON stays in your browser.",
    jsonEditor: "JSON editor",
    editorAria: "Lineage JSON editor",
    sampleAria: "Demo sample",
    run: "Render",
    autoRender: "Auto-render",
    format: "Format",
    minify: "Minify",
    copy: "Copy",
    download: "Download JSON",
    import: "Import JSON",
    clear: "Clear",
    restore: "Reset to sample",
    preview: "Interactive preview",
    previewCurrent: "Preview is current.",
    lastSuccess: "Preview is showing the last successfully parsed JSON.",
    noPreview: "No preview yet.",
    unapplied: "The editor contains unapplied changes.",
    strict: "Strict mode",
    lenient: "Lenient mode",
    ready: "Ready.",
    inputHint: "Enter or load lineage JSON to update the preview.",
    parsed: "JSON parsed successfully.",
    parseError: "JSON parse error: {message}",
    fileError: "Could not read the selected file.",
    importedTooLarge: "Import rejected: files must be 2 MB or smaller.",
    downloaded: "Downloaded current editor contents.",
    viewerDiagnostics: "No viewer diagnostics.",
    metadata: "Metadata",
    label: "Label",
    type: "Type",
    layer: "Layer",
    subtitle: "Subtitle",
    id: "ID",
    unknownDemo: "Unknown demo ID: loaded the default sample instead.",
    titleGallery: "lineage-viewer — Demo Gallery",
    titleDemo: "lineage-viewer demo",
    titlePlayground: "lineage-viewer JSON Playground",
    descriptionGallery: "Interactive examples for lineage-viewer.",
    descriptionDemo: "Interactive lineage-viewer demo.",
    descriptionPlayground: "Local JSON playground for lineage-viewer.",
  },
  "zh-CN": {
    languageSwitcher: "语言：中文 | English",
    status: "Alpha / 积极开发中",
    homeTitle: "让数据血缘更容易理解",
    homeLead: "轻量、无框架依赖、可嵌入的 Web Component，支持交互式表级与字段级数据血缘。",
    showcase: "产品展示",
    showcaseHint: "切换查看表级、字段级和转换血缘。",
    explore: "查看演示",
    tryJson: "试用 JSON",
    quickStart: "快速开始",
    quickStartHeading: "快速开始",
    gallery: "演示画廊",
    galleryHeading: "探索典型的数据血缘场景",
    openDemo: "查看详情",
    openPlayground: "在 Playground 中打开",
    nodes: "个节点",
    edges: "条边",
    backGallery: "返回 Gallery",
    editJson: "在 Playground 中编辑 JSON",
    interactiveDemo: "交互式演示",
    direction: "方向",
    viewMode: "视图模式",
    highlight: "高亮方式",
    showEdgeLabels: "显示边标签",
    showSelfLoops: "显示自环",
    fitView: "适应画布",
    resetView: "重置视图",
    clearSelection: "清除选择",
    selected: "当前选中节点：{value}",
    diagnostics: "诊断：{count} 条",
    selectedNode: "选择详情",
    selectedField: "当前选中字段",
    dataType: "数据类型",
    description: "说明",
    transforms: "相关字段转换",
    noTransforms: "没有关联的字段转换。",
    source: "来源",
    target: "目标",
    transformType: "转换类型",
    expression: "表达式",
    noSelectedNode: "无选中节点",
    events: "事件",
    noEvents: "暂无事件",
    clearEvents: "清空事件",
    noDiagnostics: "暂无诊断",
    readOnlyJson: "JSON 数据",
    copyJson: "复制",
    copied: "已复制",
    copyFailed: "复制失败：剪贴板不可用。",
    demoNotFound: "未找到演示",
    demoNotFoundLead: "该演示不在 Gallery 中。",
    demoNotFoundHint: "请从已注册的稳定演示 URL 中选择。",
    playground: "JSON Playground",
    playgroundTitle: "在本地试用你的血缘 JSON",
    playgroundLead: "在浏览器中解析 JSON，并用与 Gallery 相同的查看器预览。",
    localOnly: "仅本地运行：JSON 始终保留在浏览器中。",
    jsonEditor: "JSON 编辑器",
    editorAria: "血缘 JSON 编辑器",
    sampleAria: "演示示例",
    run: "渲染",
    autoRender: "自动渲染",
    format: "格式化",
    minify: "压缩",
    copy: "复制",
    download: "下载 JSON",
    import: "导入 JSON",
    clear: "清空",
    restore: "恢复示例",
    preview: "交互式预览",
    previewCurrent: "预览已更新。",
    lastSuccess: "预览正在显示最近一次成功结果。",
    noPreview: "暂无预览。",
    unapplied: "编辑器包含尚未渲染的更改。",
    strict: "严格模式",
    lenient: "宽松模式",
    ready: "就绪。",
    inputHint: "输入或加载血缘 JSON 以更新预览。",
    parsed: "JSON 校验成功。",
    parseError: "JSON 解析失败：{message}",
    fileError: "文件读取失败。",
    importedTooLarge: "导入失败：文件不能超过 2 MB。",
    downloaded: "已下载当前编辑器内容。",
    viewerDiagnostics: "暂无查看器诊断信息。",
    metadata: "元数据",
    label: "名称",
    type: "类型",
    layer: "分层",
    subtitle: "说明",
    id: "ID",
    unknownDemo: "未知 Demo ID：已加载默认示例。",
    titleGallery: "lineage-viewer — 演示画廊",
    titleDemo: "lineage-viewer 演示",
    titlePlayground: "lineage-viewer JSON Playground",
    descriptionGallery: "lineage-viewer 的交互式示例。",
    descriptionDemo: "交互式 lineage-viewer 演示。",
    descriptionPlayground: "lineage-viewer 本地 JSON Playground。",
  },
} as const;

export type TranslationKey = keyof (typeof locales)["en"];
let language: Language | undefined;

function validLanguage(value: string | null): value is Language {
  return value === "zh-CN" || value === "en";
}
export function resolveLanguage(
  search = location.search,
  storage: Storage | null = safeStorage(),
): Language {
  const fromUrl = new URLSearchParams(search).get("lang");
  return validLanguage(fromUrl)
    ? fromUrl
    : validLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY) ?? null)
      ? (storage!.getItem(LANGUAGE_STORAGE_KEY) as Language)
      : "zh-CN";
}
function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
export function getLanguage(): Language {
  return language ?? (language = resolveLanguage());
}
export function setLanguage(value: Language): void {
  language = value;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  } catch {
    /* storage is optional */
  }
}
export function translate(
  key: TranslationKey,
  params: Record<string, string | number> = {},
): string {
  return (locales[getLanguage()][key] ?? locales.en[key] ?? key).replace(
    /\{(\w+)\}/g,
    (_match: string, name: string) => String(params[name] ?? `{${name}}`),
  );
}
export const t = translate;
export function buildLocalizedUrl(href: string, next = getLanguage()): string {
  const url = new URL(href, location.href);
  url.searchParams.set("lang", next);
  return `${url.pathname.split("/").pop() || "./"}${url.search}${url.hash}`;
}
export function localizeDocument(page: "Gallery" | "Demo" | "Playground"): void {
  document.documentElement.lang = getLanguage();
  document.title = t(`title${page}`);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", t(`description${page}`));
}
export function languageSwitcher(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "language-switcher";
  wrapper.setAttribute("aria-label", t("languageSwitcher"));
  for (const [code, label] of [
    ["zh-CN", "中文"],
    ["en", "English"],
  ] as const) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = code === getLanguage() ? "active" : "";
    button.setAttribute("aria-pressed", String(code === getLanguage()));
    button.addEventListener("click", () => {
      setLanguage(code);
      location.href = buildLocalizedUrl(location.href, code);
    });
    wrapper.append(button);
  }
  return wrapper;
}
