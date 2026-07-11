import { describe, expect, test } from "vitest";
import { validateLineageGraphData } from "../../src/schema/index.js";
import {
  buildLocalizedUrl,
  resolveLanguage,
  setLanguage,
  translate,
  type Language,
} from "../../site/src/i18n.js";
import { getLocalizedDemoData } from "../../site/src/demo-registry.js";

function storage(value: string | null): Storage {
  return { getItem: () => value } as unknown as Storage;
}

describe("demo site i18n", () => {
  test("defaults to Chinese and honors URL before storage", () => {
    expect(resolveLanguage("", storage(null))).toBe("zh-CN");
    expect(resolveLanguage("?lang=en", storage("zh-CN"))).toBe("en");
    expect(resolveLanguage("", storage("en"))).toBe("en");
    expect(resolveLanguage("?lang=fr", storage(null))).toBe("zh-CN");
  });
  test("keeps other query parameters when building localized URLs", () => {
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: new URL("https://example.test/demo.html?id=basic&x=1"),
    });
    expect(buildLocalizedUrl("demo.html?id=basic&x=1", "en")).toBe(
      "demo.html?id=basic&x=1&lang=en",
    );
  });
  test("has resolvable translations and matching localized demo IDs", () => {
    const languages: Language[] = ["zh-CN", "en"];
    for (const language of languages) {
      const title = translateFor(language, "homeTitle");
      expect(title).not.toBe("homeTitle");
      for (const demo of getLocalizedDemoData(language))
        expect(validateLineageGraphData(demo.graph)).toEqual([]);
    }
    expect(getLocalizedDemoData("zh-CN").map((demo) => demo.id)).toEqual(
      getLocalizedDemoData("en").map((demo) => demo.id),
    );
  });
});

function translateFor(language: Language, key: Parameters<typeof translate>[0]): string {
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: new URL(`https://example.test/?lang=${language}`),
  });
  setLanguage(language);
  return translate(key);
}
