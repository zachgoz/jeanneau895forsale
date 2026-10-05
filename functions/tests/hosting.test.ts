import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = JSON.parse(
  readFileSync(resolve(__dirname, "../../firebase.json"), "utf8"),
);

describe("Firebase deployment configuration", () => {
  it("serves the actual Next static export with clean URLs", () => {
    expect(config.hosting.public).toBe("out");
    expect(config.hosting.cleanUrls).toBe(true);
  });

  it("rewrites only the contact endpoint and has no blanket SPA fallback", () => {
    expect(config.hosting.rewrites).toEqual([
      {
        source: "/api/contact",
        function: { functionId: "contact", region: "us-central1" },
      },
    ]);
  });

  it("uses Node 22 and builds the contact codebase before deployment", () => {
    expect(config.functions[0].runtime).toBe("nodejs22");
    expect(config.functions[0].source).toBe("functions");
    expect(config.functions[0].predeploy).toContain(
      'npm --prefix "$RESOURCE_DIR" run build',
    );
  });

  it("keeps HTML revalidated, caches hashed bundles immutably, and forbids API caching", () => {
    const headers = new Map<string, { key: string; value: string }[]>(
      config.hosting.headers.map(
        (rule: {
          source: string;
          headers: { key: string; value: string }[];
        }) => [rule.source, rule.headers],
      ),
    );
    expect(headers.get("**")).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=0, must-revalidate",
    });
    expect(headers.get("/_next/static/**")).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    });
    expect(headers.get("/api/**")).toContainEqual({
      key: "Cache-Control",
      value: "no-store",
    });
  });
});
