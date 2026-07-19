import { describe, expect, it, vi } from "vitest";

import worker from "../../src/worker.js";

const longTermCacheControl = "public, max-age=31536000, immutable";
const revalidateCacheControl = "public, max-age=0, must-revalidate";

describe("Cloudflare Worker caching", () => {
  it("revalidates HTML in browsers while caching it at the edge", async () => {
    const assetResponse = new Response("<!doctype html>", {
      headers: {
        "Content-Type": "text/html",
        ETag: '"index-hash"',
      },
    });
    const { env, fetchAsset } = createAssetEnv(assetResponse);
    const request = new Request("https://lineage.overme.cn/");

    const response = await worker.fetch(request, env);

    expect(fetchAsset).toHaveBeenCalledWith(request);
    expect(response.headers.get("Cache-Control")).toBe(revalidateCacheControl);
    expect(response.headers.get("Cloudflare-CDN-Cache-Control")).toBe(longTermCacheControl);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(response.headers.get("ETag")).toBe('"index-hash"');
    await expect(response.text()).resolves.toBe("<!doctype html>");
  });

  it("caches fingerprinted assets in browsers and at the edge", async () => {
    const { env } = createAssetEnv(
      new Response("export {};", {
        headers: { "Content-Type": "application/javascript" },
      }),
    );

    const response = await worker.fetch(
      new Request("https://lineage.overme.cn/assets/index-oydPo-1i.js"),
      env,
    );

    expect(response.headers.get("Cache-Control")).toBe(longTermCacheControl);
    expect(response.headers.get("Cloudflare-CDN-Cache-Control")).toBe(longTermCacheControl);
  });

  it.each([
    ["missing assets", new Request("https://lineage.overme.cn/missing"), 404],
    ["unsupported methods", new Request("https://lineage.overme.cn/", { method: "POST" }), 405],
  ])("does not cache %s", async (_scenario, request, status) => {
    const { env } = createAssetEnv(
      new Response(null, {
        status,
        headers: {
          "Cache-Control": revalidateCacheControl,
          "Cloudflare-CDN-Cache-Control": longTermCacheControl,
        },
      }),
    );

    const response = await worker.fetch(request, env);

    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.has("Cloudflare-CDN-Cache-Control")).toBe(false);
  });
});

function createAssetEnv(response: Response) {
  const fetchAsset = vi.fn(() => Promise.resolve(response));

  return {
    env: { ASSETS: { fetch: fetchAsset } },
    fetchAsset,
  };
}
