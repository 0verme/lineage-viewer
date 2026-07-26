export function versionFromTag(tag: string): string;
export function validateVersionTag(tag: string, packageVersion: string): string;
export function resolveDistTag(version: string): "latest" | "alpha" | "beta" | "next";
export function extractChangelogEntry(markdown: string, version: string): string;
export function readPackageVersion(): string;
export function readWorkspacePackageVersions(): Record<string, string>;
export function validateWorkspaceVersions(versions: Record<string, string>): string;
