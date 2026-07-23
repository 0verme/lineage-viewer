import { describe, expect, it } from "vitest";
import type {
  LineageEdgeClickEventDetail,
  LineageField,
  LineageFieldLocation,
  LineageTransformType,
} from "../../src/index.js";

const field: LineageField = { id: "customer_id", dataType: "bigint" };
const transformType: LineageTransformType = "passthrough";
const location: LineageFieldLocation = {
  nodeId: "orders",
  fieldId: "customer_id",
  label: "Customer ID",
};
const edgeDetail: Pick<LineageEdgeClickEventDetail, "transformType" | "expression"> = {
  transformType: "transform",
  expression: "customer_id",
};

describe("package entry", () => {
  it("loads without changing the browser custom-element registry", async () => {
    const registryBeforeImport = Reflect.get(globalThis, "customElements");
    const entry = await import("../../src/index.js");

    expect(entry.packageVersion).toBe("1.0.0");
    expect(Reflect.get(globalThis, "customElements")).toBe(registryBeforeImport);
    expect(field.id).toBe("customer_id");
    expect(transformType).toBe("passthrough");
    expect(location.label).toBe("Customer ID");
    expect(edgeDetail.expression).toBe("customer_id");
  });
});
