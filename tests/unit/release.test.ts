import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  extractChangelogEntry,
  resolveDistTag,
  validateVersionTag,
  versionFromTag,
} from "../../scripts/release/release-utils.mjs";

describe("release helpers", () => {
  it("publishes discoverable package metadata for the stable release", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    ) as {
      version: string;
      keywords: string[];
      engines: { node: string };
      files: string[];
    };
    expect(packageJson.version).toBe("1.0.0");
    expect(packageJson.keywords).toEqual([
      "data-lineage",
      "column-lineage",
      "metadata",
      "data-catalog",
      "web-component",
      "svg",
    ]);
    expect(packageJson.engines.node).toBe(">=22.13.0");
    expect(packageJson.files).toContain("docs/assets/column-lineage.png");
  });
  it("accepts a matching semantic-version tag", () => {
    expect(validateVersionTag("v1.2.3", "1.2.3")).toBe("1.2.3");
  });

  it("rejects mismatched and malformed tags", () => {
    expect(() => validateVersionTag("v1.2.4", "1.2.3")).toThrow(/does not match/u);
    expect(() => versionFromTag("latest")).toThrow(/v<semver>/u);
  });

  it("maps release channels without leaking prereleases to latest", () => {
    expect(resolveDistTag("1.2.3")).toBe("latest");
    expect(resolveDistTag("1.2.3-alpha.1")).toBe("alpha");
    expect(resolveDistTag("1.2.3-beta.1")).toBe("beta");
    expect(resolveDistTag("1.2.3-rc.1")).toBe("next");
    expect(() => resolveDistTag("1.2.3-preview.1")).toThrow(/Unsupported/u);
  });

  it("extracts only the requested changelog entry", () => {
    const changelog =
      "# Changelog\n\n## [1.2.3] - 2026-01-01\n\n### Added\n\n- Release notes.\n\n## [1.2.2]\n\n- Older notes.\n";
    expect(extractChangelogEntry(changelog, "1.2.3")).toContain("Release notes.");
    expect(extractChangelogEntry(changelog, "1.2.3")).not.toContain("Older notes.");
    expect(() => extractChangelogEntry(changelog, "1.2.4")).toThrow(/No CHANGELOG/u);
  });
});
