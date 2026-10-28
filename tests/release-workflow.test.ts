/**
 * Exercise versioned release packaging and publication using disposable build fixtures.
 * Minimal PDF/DOCX signatures and static assets test inventory/byte contracts, not
 * document layout. tar must be available for archive creation and extraction.
 * GitHub is always replaced by an injected in-memory HTTP transport; no real token,
 * release, tag or deployment is used. Checks protect demo provenance and recovery
 * from interrupted publication, not the safety of an industrial control installation.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// Deliberately artificial identity values are shared by all isolated release fixtures.
const sourceCommit = "1".repeat(40);
const tag = "v1.2.3";
const repository = "example/cobalt";
const temporaryBase = resolve(".local");
const fixturePaths: string[] = [];
let verifyRelease: any;
let packageRelease: any;
let verifyReleasePackage: any;
let recordBuildVerification: any;
let verifyBuildVerification: any;
let publishRelease: any;
let sha256: any;

// Load the production packaging/verifier/publisher modules without their CLI entry points.
beforeAll(async () => {
  const load = (name: string) =>
    import(
      /* @vite-ignore */ pathToFileURL(resolve("scripts", `${name}.mjs`)).href
    );
  ({ verifyRelease } = await load("verify-release"));
  ({ packageRelease, verifyReleasePackage, sha256 } =
    await load("package-release"));
  ({ recordBuildVerification } = await load("record-build-verification"));
  ({ verifyBuildVerification } = await load("verify-build-verification"));
  ({ publishRelease } = await load("publish-release"));
  mkdirSync(temporaryBase, { recursive: true });
});

// Resolve each cleanup target beneath the explicit .local fixture root before removal.
afterEach(() => {
  for (const directory of fixturePaths.splice(0)) {
    if (!resolve(directory).startsWith(`${temporaryBase}${sep}`))
      throw new Error("Unsafe test cleanup path.");
    rmSync(directory, { recursive: true, force: true });
  }
});

// Build the smallest realistic two-base artifact, including version evidence and report bytes.
function fixture(context = "github-actions") {
  const directory = mkdtempSync(join(temporaryBase, "release-test-"));
  fixturePaths.push(directory);
  const artifactRoot = join(directory, "tested");
  const outputDirectory = join(directory, "packaged");
  mkdirSync(join(artifactRoot, "docs"), { recursive: true });
  writeFileSync(
    join(artifactRoot, "package.json"),
    JSON.stringify({ version: "1.2.3" }),
  );
  writeFileSync(
    join(artifactRoot, "CHANGELOG.md"),
    "# Changelog\n\n## 1.2.3 — Fall 2026\n\nTested release fixture.\n",
  );
  writeFileSync(
    join(artifactRoot, "docs/RELEASE_NOTES.md"),
    "# Cobalt Instrument Studio 1.2.3\n\nTelemetry is simulated. Test fixture, no production publication.\n",
  );
  writeFileSync(
    join(artifactRoot, "docs/report-source.json"),
    JSON.stringify({ version: "1.2.3" }),
  );
  for (const build of ["dist", "dist-pages"]) {
    mkdirSync(join(artifactRoot, build, "assets"), { recursive: true });
    mkdirSync(join(artifactRoot, build, "reports"), { recursive: true });
    writeFileSync(
      join(artifactRoot, build, "index.html"),
      "<!doctype html><link rel=stylesheet href=assets/style.css><script src=assets/app.js></script>",
    );
    writeFileSync(
      join(artifactRoot, build, "assets/app.js"),
      "console.log('Simulated test fixture');",
    );
    writeFileSync(
      join(artifactRoot, build, "assets/style.css"),
      "body{color:white;background:#111}",
    );
    writeFileSync(
      join(artifactRoot, build, "reports/Cobalt_Engineering_Report.pdf"),
      Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(10000, 65)]),
    );
    writeFileSync(
      join(artifactRoot, build, "reports/Cobalt_Engineering_Report.docx"),
      Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.alloc(10000, 66)]),
    );
  }
  recordBuildVerification({
    root: artifactRoot,
    sourceCommit,
    executionContext: context,
  });
  return { artifactRoot, outputDirectory, tag, expectedCommit: sourceCommit };
}

// Inject transport explicitly; tests must never fall through to live GitHub fetch.
function publicationOptions(
  value: ReturnType<typeof fixture>,
  fetchImpl: typeof fetch,
) {
  return {
    directory: value.outputDirectory,
    artifactRoot: value.artifactRoot,
    repository,
    token: "mock-token-used-only-by-injected-transport",
    tag,
    expectedCommit: sourceCommit,
    runUrl: `https://github.com/${repository}/actions/runs/123`,
    fetchImpl,
  };
}

// Reject drift before packaging and prove an archive round-trip preserves the tested inputs.
describe("release and deployment artifact validation", () => {
  it("requires exact stable tag, changelog, notes and report version agreement", () => {
    const value = fixture();
    expect(verifyRelease({ root: value.artifactRoot, tag }).version).toBe(
      "1.2.3",
    );
    expect(() =>
      verifyRelease({ root: value.artifactRoot, tag: "v1.2.4" }),
    ).toThrow(/tag must match/);
    writeFileSync(
      join(value.artifactRoot, "package.json"),
      JSON.stringify({ version: "01.2.3" }),
    );
    expect(() =>
      verifyRelease({ root: value.artifactRoot, tag: "v01.2.3" }),
    ).toThrow(/leading zeros/);
  });

  it.each(["CHANGELOG.md", "docs/RELEASE_NOTES.md", "docs/report-source.json"])(
    "refuses missing or mismatched version evidence in %s",
    (name) => {
      const value = fixture();
      writeFileSync(
        join(value.artifactRoot, name),
        name.endsWith(".json")
          ? '{"version":"1.2.2"}'
          : "Previous version only",
      );
      expect(() => verifyRelease({ root: value.artifactRoot, tag })).toThrow();
    },
  );

  it("refuses lightweight tags and annotated tags that resolve to a different commit", () => {
    const value = fixture();
    const options = {
      root: value.artifactRoot,
      tag,
      annotatedTag: true,
      expectedCommit: sourceCommit,
    };
    expect(() =>
      verifyRelease({ ...options, gitRunner: () => "commit\n" }),
    ).toThrow(/annotated tags/);
    expect(() =>
      verifyRelease({
        ...options,
        gitRunner: (_command: string, args: string[]) =>
          args[0] === "cat-file" ? "tag\n" : `${"2".repeat(40)}\n`,
      }),
    ).toThrow(/commit being verified/);
    expect(
      verifyRelease({
        ...options,
        gitRunner: (_command: string, args: string[]) =>
          args[0] === "cat-file" ? "tag\n" : `${sourceCommit}\n`,
      }).tag,
    ).toBe(tag);
  });

  it("refuses an artifact with a different commit or a missing required check", () => {
    const value = fixture();
    expect(() =>
      verifyBuildVerification({
        root: value.artifactRoot,
        expectedCommit: "2".repeat(40),
      }),
    ).toThrow(/expected source commit/);
    const metadata = JSON.parse(
      readFileSync(join(value.artifactRoot, "build-verification.json"), "utf8"),
    );
    metadata.checks = metadata.checks.filter(
      (name: string) => name !== "browser",
    );
    writeFileSync(
      join(value.artifactRoot, "build-verification.json"),
      JSON.stringify(metadata),
    );
    expect(() => packageRelease(value)).toThrow(/all required CI checks/);
  });

  it("rejects modified tested assets before creating an archive", () => {
    const value = fixture();
    writeFileSync(join(value.artifactRoot, "dist/assets/app.js"), "corrupt");
    expect(() => packageRelease(value)).toThrow(
      /differs from the SHA-256 inventory/,
    );
  });

  it("rejects changed release notes, extra hidden files and unequal embedded reports", () => {
    const changed = fixture();
    writeFileSync(
      join(changed.artifactRoot, "docs/RELEASE_NOTES.md"),
      "# Cobalt Instrument Studio 1.2.3\nTelemetry is simulated. Changed after CI.",
    );
    expect(() => packageRelease(changed)).toThrow(
      /differs from the SHA-256 inventory/,
    );
    const hidden = fixture();
    writeFileSync(
      join(hidden.artifactRoot, "dist/.env"),
      "PRIVATE_TEST_FIXTURE=value",
    );
    expect(() => packageRelease(hidden)).toThrow(/hidden file/);
    const unequal = fixture();
    writeFileSync(
      join(
        unequal.artifactRoot,
        "dist-pages/reports/Cobalt_Engineering_Report.pdf",
      ),
      Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(10000, 67)]),
    );
    recordBuildVerification({
      root: unequal.artifactRoot,
      sourceCommit,
      executionContext: "github-actions",
    });
    expect(() => packageRelease(unequal)).toThrow(
      /identical, complete reports/,
    );
  });

  it("round-trips both static builds and covers exactly five uploaded assets", () => {
    const value = fixture();
    packageRelease(value);
    const verified = verifyReleasePackage(value.outputDirectory);
    expect(verified.assets.map((asset: any) => asset.name)).toEqual([
      "Cobalt_Engineering_Report.pdf",
      "Cobalt_Engineering_Report.docx",
      "Cobalt_Static_Build_v1.2.3.tar.gz",
      "release-manifest.json",
      "SHA256SUMS.txt",
    ]);
    const entries = execFileSync(
      "tar",
      [
        "-tzf",
        join(value.outputDirectory, "Cobalt_Static_Build_v1.2.3.tar.gz"),
      ],
      { encoding: "utf8" },
    );
    expect(entries).toContain("dist/assets/app.js");
    expect(entries).toContain(
      "dist-pages/reports/Cobalt_Engineering_Report.docx",
    );
    expect(entries).not.toContain("package.json");
    expect(entries).not.toContain("node_modules");
    writeFileSync(
      join(value.outputDirectory, "Cobalt_Engineering_Report.pdf"),
      "corrupt after packaging",
    );
    expect(() => verifyReleasePackage(value.outputDirectory)).toThrow(
      /checksum mismatch/,
    );
  });

  it("distinguishes a local dry run from an artifact eligible for deployment/publication", async () => {
    const value = fixture("local");
    expect(() =>
      verifyBuildVerification({
        root: value.artifactRoot,
        expectedCommit: sourceCommit,
      }),
    ).toThrow(/GitHub CI/);
    packageRelease(value);
    const transport = async () => {
      throw new Error("Network must not be called");
    };
    await expect(
      publishRelease(publicationOptions(value, transport)),
    ).rejects.toThrow(/verified tag and source commit/);
  });
});

// Model reruns, existing drafts, API errors and corrupt uploads before allowing mock publication.
describe("release publication with mocked GitHub transport only", () => {
  it("leaves an existing public release and all assets unchanged", async () => {
    const value = fixture();
    packageRelease(value);
    const calls: string[] = [];
    const transport: typeof fetch = async (url, options) => {
      calls.push(`${options?.method} ${url}`);
      return Response.json({
        draft: false,
        html_url: `https://github.com/${repository}/releases/tag/${tag}`,
      });
    };
    expect(
      (await publishRelease(publicationOptions(value, transport))).status,
    ).toBe("existing-unchanged");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatch(/^GET /);
  });

  it("discovers a hidden existing draft and refuses to overwrite it", async () => {
    const value = fixture();
    packageRelease(value);
    const transport: typeof fetch = async (url, options) => {
      expect(options?.method).toBe("GET");
      return String(url).includes("/releases/tags/")
        ? new Response(null, { status: 404 })
        : Response.json([{ tag_name: tag, draft: true }]);
    };
    await expect(
      publishRelease(publicationOptions(value, transport)),
    ).rejects.toThrow(/draft release already exists/);
  });

  it.each([403, 500])(
    "does not treat GitHub HTTP %s as a missing release",
    async (status) => {
      const value = fixture();
      packageRelease(value);
      let calls = 0;
      const transport: typeof fetch = async () => {
        calls += 1;
        return new Response(null, { status });
      };
      await expect(
        publishRelease(publicationOptions(value, transport)),
      ).rejects.toThrow(`HTTP ${status}`);
      expect(calls).toBe(1);
    },
  );

  it("creates one draft, verifies all uploaded bytes, then publishes once", async () => {
    const value = fixture();
    packageRelease(value);
    const uploaded: any[] = [];
    const bytes = new Map<number, Buffer>();
    let posts = 0;
    let patches = 0;
    let releaseBody = "";
    const transport: typeof fetch = async (input, options) => {
      const url = new URL(String(input));
      const path = url.pathname;
      const method = options?.method || "GET";
      if (path.endsWith(`/releases/tags/${tag}`))
        return patches
          ? Response.json({
              id: 1,
              tag_name: tag,
              draft: false,
              body: releaseBody,
              assets: uploaded,
              html_url: `https://github.com/${repository}/releases/tag/${tag}`,
            })
          : new Response(null, { status: 404 });
      if (path.endsWith("/releases") && method === "GET")
        return Response.json([]);
      if (path.includes("/git/ref/tags/"))
        return Response.json({ object: { type: "tag", sha: "3".repeat(40) } });
      if (path.includes("/git/tags/"))
        return Response.json({ object: { type: "commit", sha: sourceCommit } });
      if (path.endsWith("/releases") && method === "POST") {
        posts += 1;
        const body = JSON.parse(String(options?.body));
        expect(body.draft).toBe(true);
        expect(body.tag_name).toBe(tag);
        releaseBody = body.body;
        return Response.json({
          id: 1,
          draft: true,
          upload_url: `https://uploads.github.com/repos/${repository}/releases/1/assets{?name,label}`,
        });
      }
      if (url.origin === "https://uploads.github.com") {
        const data = Buffer.from(options?.body as Buffer);
        const asset = {
          id: uploaded.length + 10,
          name: url.searchParams.get("name"),
          size: data.length,
          state: "uploaded",
          digest: `sha256:${sha256(data)}`,
        };
        uploaded.push(asset);
        bytes.set(asset.id, data);
        return Response.json(asset);
      }
      if (path.includes("/releases/assets/"))
        return new Response(
          Uint8Array.from(
            bytes.get(Number(path.split("/").at(-1))) || Buffer.alloc(0),
          ).buffer,
        );
      if (path.endsWith("/releases/1/assets")) return Response.json(uploaded);
      if (path.endsWith("/releases/1") && method === "PATCH") {
        patches += 1;
        expect(uploaded).toHaveLength(5);
        expect(JSON.parse(String(options?.body))).toEqual({ draft: false });
        return Response.json({
          id: 1,
          tag_name: tag,
          draft: false,
          body: releaseBody,
        });
      }
      throw new Error(`Unexpected mock request: ${method} ${url}`);
    };
    const result = await publishRelease(publicationOptions(value, transport));
    expect(result.status).toBe("published-verified");
    expect(posts).toBe(1);
    expect(patches).toBe(1);
    expect(releaseBody).toContain("Actions run");
    expect(releaseBody).toContain("SHA256SUMS.txt");
  });

  it("keeps the draft unpublished if the server returns a corrupt asset download", async () => {
    const value = fixture();
    packageRelease(value);
    let patches = 0;
    const transport: typeof fetch = async (input, options) => {
      const url = new URL(String(input));
      if (options?.method === "PATCH") patches += 1;
      if (url.pathname.includes("/releases/tags/"))
        return new Response(null, { status: 404 });
      if (url.pathname.endsWith("/releases") && options?.method === "GET")
        return Response.json([]);
      if (url.pathname.includes("/git/ref/"))
        return Response.json({ object: { type: "tag", sha: "3".repeat(40) } });
      if (url.pathname.includes("/git/tags/"))
        return Response.json({ object: { type: "commit", sha: sourceCommit } });
      if (url.pathname.endsWith("/releases"))
        return Response.json({
          id: 1,
          draft: true,
          upload_url: `https://uploads.github.com/repos/${repository}/releases/1/assets{?name,label}`,
        });
      if (url.origin === "https://uploads.github.com")
        return Response.json({
          id: 10,
          name: url.searchParams.get("name"),
          size: Buffer.from(options?.body as Buffer).length,
          state: "uploaded",
        });
      return new Response("corrupt uploaded bytes");
    };
    await expect(
      publishRelease(publicationOptions(value, transport)),
    ).rejects.toThrow(/download checksum mismatch/);
    expect(patches).toBe(0);
  });
});
