export interface JsonParseSuccess {
  readonly ok: true;
  readonly value: unknown;
}
export interface JsonParseFailure {
  readonly ok: false;
  readonly message: string;
  readonly position?: number;
  readonly line?: number;
  readonly column?: number;
}
export type JsonParseResult = JsonParseSuccess | JsonParseFailure | null;

export function parseJson(text: string): JsonParseResult {
  if (!text.trim()) return null;
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    const match = /position (\d+)/i.exec(message);
    const position = match ? Number(match[1]) : undefined;
    if (position === undefined || !Number.isFinite(position)) return { ok: false, message };
    const lines = text.slice(0, Math.max(0, position)).split("\n");
    return {
      ok: false,
      message,
      position,
      line: lines.length,
      column: (lines.at(-1)?.length ?? 0) + 1,
    };
  }
}
