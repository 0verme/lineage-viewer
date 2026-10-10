export const publicPackages: readonly {
  name: string;
  workspace: string | null;
}[];

export function integrityForBytes(bytes: Uint8Array): string;

export function classifyPublishedVersion(input: {
  name: string;
  version: string;
  expectedIntegrity: string;
  metadata: { versions?: Record<string, { dist?: { integrity?: string } }> } | null;
}): {
  name: string;
  version: string;
  action: "publish" | "skip";
  integrity?: string;
};

export function createPublishPlan(
  packages: readonly { name: string; integrity: string }[],
  metadataByName: Record<
    string,
    { versions?: Record<string, { dist?: { integrity?: string } }> } | null
  >,
  version: string,
): {
  name: string;
  version: string;
  action: "publish" | "skip";
  integrity?: string;
}[];
