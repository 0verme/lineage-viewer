import { describe, expect, it } from "vitest";

describe("package entry", () => {
  it("loads without changing the browser custom-element registry", async () => {
    const registryBeforeImport = Reflect.get(globalThis, "customElements");
    const entry = await import("../../src/index.js");

    expect(entry.packageVersion).toBe("0.1.0");
    expect(Reflect.get(globalThis, "customElements")).toBe(registryBeforeImport);
  });
});
