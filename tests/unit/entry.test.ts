import { describe, expect, it } from "vitest";
import type { LineageField, LineageTransformType } from "../../src/index.js";

const field: LineageField = { id: "customer_id", dataType: "bigint" };
const transformType: LineageTransformType = "passthrough";

describe("package entry", () => {
  it("loads without changing the browser custom-element registry", async () => {
    const registryBeforeImport = Reflect.get(globalThis, "customElements");
    const entry = await import("../../src/index.js");

    expect(entry.packageVersion).toBe("0.1.0-alpha.2");
    expect(Reflect.get(globalThis, "customElements")).toBe(registryBeforeImport);
    expect(field.id).toBe("customer_id");
    expect(transformType).toBe("passthrough");
  });
});
