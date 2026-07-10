export function versionFromTag(tag: string): string;
export function validateVersionTag(tag: string, packageVersion: string): string;
export function resolveDistTag(version: string): "latest" | "alpha" | "beta" | "next";
export function extractChangelogEntry(markdown: string, version: string): string;
export function readPackageVersion(): string;
