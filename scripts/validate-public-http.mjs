import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const TIMEOUT_MS = 20_000;
const MAX_BYTES = 12 * 1024 * 1024;
const reportName = "docs/public-http-validation.json";
const usage =
  "Usage: node scripts/validate-public-http.mjs --primary https://<stable-name>.netlify.app/ --backup https://<owner>.github.io/cobalt-instrument-studio/ --repository https://github.com/<owner>/cobalt-instrument-studio";

function fail(message) {
  throw new Error(message);
}

function parseArguments(argv) {
  const inputs = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (
      !["--primary", "--backup", "--repository"].includes(key) ||
      inputs[key] ||
      !argv[index + 1] ||
      argv[index + 1].startsWith("--")
    ) {
      fail("Supply each supported URL argument exactly once.");
    }
    inputs[key] = argv[index + 1];
  }
  const urls = {};
  for (const key of ["primary", "backup", "repository"]) {
    if (!inputs[`--${key}`]) fail(`Missing --${key}.`);
    try {
      urls[key] = new URL(inputs[`--${key}`]);
    } catch {
      fail(`Invalid --${key} URL.`);
    }
    const url = urls[key];
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash
    ) {
      fail(`--${key} must be a plain public HTTPS URL.`);
    }
  }
  if (
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.netlify\.app$/.test(
      urls.primary.hostname,
    ) ||
    urls.primary.hostname.includes("--") ||
    urls.primary.pathname !== "/"
  ) {
    fail(
      "--primary must be a stable Netlify site root, without a deploy prefix.",
    );
  }
  if (
    urls.repository.hostname !== "github.com" ||
    !/^\/[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/cobalt-instrument-studio\/?$/.test(
      urls.repository.pathname,
    )
  ) {
    fail(
      "--repository must name a public GitHub cobalt-instrument-studio repository.",
    );
  }
  urls.repository.pathname = urls.repository.pathname.replace(/\/$/, "");
  const owner = urls.repository.pathname.split("/")[1];
  if (
    urls.backup.hostname !== `${owner.toLowerCase()}.github.io` ||
    urls.backup.pathname !== "/cobalt-instrument-studio/"
  ) {
    fail("--backup must be the matching owner's GitHub Pages project URL.");
  }
  return urls;
}

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function decodeAttribute(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function attributes(tag) {
  const values = {};
  for (const match of tag.matchAll(
    /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
  )) {
    values[match[1].toLowerCase()] = decodeAttribute(
      match[2] ?? match[3] ?? match[4],
    );
  }
  return values;
}

function linkedAssets(html) {
  const assets = [];
  for (const match of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const tag = match[1].toLowerCase();
    const rel = (attrs.rel ?? "").toLowerCase().split(/\s+/);
    if (tag === "script" && attrs.src) {
      assets.push({ kind: "javascript", reference: attrs.src });
    } else if (tag === "link" && attrs.href) {
      if (rel.includes("stylesheet")) {
        assets.push({ kind: "stylesheet", reference: attrs.href });
      } else if (rel.includes("modulepreload")) {
        assets.push({ kind: "javascript", reference: attrs.href });
      } else if (rel.includes("icon")) {
        assets.push({ kind: "favicon", reference: attrs.href });
      }
    }
  }
  return assets.filter(
    (asset, index) =>
      assets.findIndex((other) => other.reference === asset.reference) ===
      index,
  );
}

function publicAssetUrl(reference, site) {
  const url = new URL(reference, site);
  if (
    url.origin !== site.origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith(site.pathname) ||
    url.pathname === site.pathname
  ) {
    fail("A linked asset has an incorrect origin or hosting base path.");
  }
  return url;
}

async function get(url, expectedType, basePath) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), TIMEOUT_MS);
  let next = new URL(url);
  try {
    for (let redirect = 0; redirect <= 3; redirect += 1) {
      const response = await fetch(next, {
        method: "GET",
        credentials: "omit",
        redirect: "manual",
        signal: abort.signal,
        headers: { Accept: expectedType === "html" ? "text/html" : "*/*" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get("location");
        if (!location || redirect === 3)
          fail("Public endpoint redirect failed.");
        const target = new URL(location, next);
        if (
          target.protocol !== "https:" ||
          target.origin !== url.origin ||
          target.username ||
          target.password ||
          target.search ||
          target.hash ||
          (basePath && !target.pathname.startsWith(basePath))
        ) {
          fail(
            "Public endpoint redirected outside its expected HTTPS host or base.",
          );
        }
        next = target;
        continue;
      }
      if (response.status !== 200) {
        await response.body?.cancel();
        fail(`Public endpoint returned HTTP ${response.status}.`);
      }
      const contentType = response.headers.get("content-type") ?? "";
      const allowedTypes = {
        html: /text\/html/i,
        javascript:
          /(?:application|text)\/(?:javascript|x-javascript|ecmascript)/i,
        stylesheet: /text\/css/i,
        favicon: /image\/svg\+xml/i,
        pdf: /application\/pdf|application\/octet-stream/i,
        docx: /application\/(?:vnd\.openxmlformats-officedocument\.wordprocessingml\.document|octet-stream)/i,
      };
      if (!allowedTypes[expectedType].test(contentType)) {
        await response.body?.cancel();
        fail(`Public endpoint has an unexpected ${expectedType} content type.`);
      }
      const chunks = [];
      let length = 0;
      if (!response.body) fail("Public endpoint returned an empty body.");
      for await (const chunk of response.body) {
        length += chunk.length;
        if (length > MAX_BYTES) {
          abort.abort();
          fail("Public endpoint exceeds the validation size limit.");
        }
        chunks.push(chunk);
      }
      if (!length) fail("Public endpoint returned an empty body.");
      return {
        bytes: Buffer.concat(chunks),
        status: response.status,
        contentType,
        finalUrl: next.href,
      };
    }
    fail("Public endpoint redirect failed.");
  } catch (error) {
    if (abort.signal.aborted)
      fail("Public endpoint exceeded the time or size limit.");
    if (error instanceof TypeError)
      fail("Public endpoint could not be fetched anonymously.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function localBytes(path, label) {
  try {
    return await readFile(resolve(projectRoot, path));
  } catch {
    fail(
      `The current local ${label} is missing; deployment drift cannot be verified.`,
    );
  }
}

async function inspectSite(name, site, output, repository, reports) {
  const result = {
    name,
    url: site.href,
    status: "fail",
    checks: [],
    assets: [],
    downloads: [],
  };
  try {
    const index = await get(site, "html", site.pathname);
    const html = index.bytes.toString("utf8");
    if (!/<title>\s*Cobalt Instrument Studio\s*<\/title>/i.test(html)) {
      fail("The public index does not identify Cobalt Instrument Studio.");
    }
    result.index = { status: index.status, bytes: index.bytes.length };
    result.checks.push("HTTPS index returned 200 with the expected app title");
    const assets = linkedAssets(html);
    for (const kind of ["javascript", "stylesheet", "favicon"]) {
      if (!assets.some((asset) => asset.kind === kind)) {
        fail(`The public index has no linked ${kind} asset.`);
      }
    }
    let sourceReferenceFound = html.includes(repository.href);
    for (const asset of assets) {
      const observedUrl = new URL(asset.reference, site);
      if (
        name === "primary" &&
        asset.kind === "javascript" &&
        observedUrl.origin === site.origin &&
        observedUrl.pathname === "/.netlify/scripts/hud" &&
        observedUrl.search === "?variant=public" &&
        !observedUrl.hash
      ) {
        // Netlify injects this provider badge after the application build.
        const hostingAsset = await get(
          observedUrl,
          "javascript",
          "/.netlify/scripts/",
        );
        result.hostingAssets ??= [];
        result.hostingAssets.push({
          path: observedUrl.pathname + observedUrl.search,
          status: hostingAsset.status,
          bytes: hostingAsset.bytes.length,
          localBuildMatches: "Provider asset; no local build counterpart",
        });
        continue;
      }
      const url = publicAssetUrl(asset.reference, site);
      const response = await get(url, asset.kind, site.pathname);
      const relativePath = decodeURIComponent(
        url.pathname.slice(site.pathname.length),
      );
      const localPath = resolve(projectRoot, output, relativePath);
      const outputRoot = resolve(projectRoot, output);
      const rootPrefix = `${outputRoot}${sep}`;
      const insideBuild =
        process.platform === "win32"
          ? localPath.toLowerCase().startsWith(rootPrefix.toLowerCase())
          : localPath.startsWith(rootPrefix);
      if (!insideBuild) {
        fail("A linked asset has an invalid local comparison path.");
      }
      const local = await localBytes(
        `${output}/${relativePath}`,
        "production asset",
      );
      if (!response.bytes.equals(local)) {
        fail(
          "A deployed asset differs from the current local production build.",
        );
      }
      if (asset.kind === "javascript") {
        sourceReferenceFound ||= response.bytes
          .toString("utf8")
          .includes(repository.href);
      }
      result.assets.push({
        kind: asset.kind,
        path: url.pathname,
        status: response.status,
        bytes: response.bytes.length,
        sha256: hash(response.bytes),
        localBuildMatches: true,
      });
    }
    if (!sourceReferenceFound)
      fail(
        "The public build does not contain the configured source repository URL.",
      );
    result.checks.push(
      "Application JavaScript, CSS and favicon use the correct base and match the current local build",
    );
    result.checks.push(
      "The configured public source repository URL is present in the delivered app code",
    );
    for (const [extension, expected] of reports) {
      const url = new URL(
        `reports/Cobalt_Engineering_Report.${extension}`,
        site,
      );
      const download = await get(url, extension, site.pathname);
      if (download.bytes.length < 10_000 || !download.bytes.equals(expected)) {
        fail(
          `The public ${extension.toUpperCase()} does not match the current report artifact.`,
        );
      }
      result.downloads.push({
        extension,
        path: url.pathname,
        status: download.status,
        bytes: download.bytes.length,
        sha256: hash(download.bytes),
        currentReportMatches: true,
      });
    }
    result.checks.push(
      "Direct PDF and DOCX downloads match the current docs artifacts by SHA256",
    );
    result.status = "pass";
  } catch (error) {
    result.failure = error.message;
  }
  return result;
}

async function inspectRepository(repository) {
  const result = { url: repository.href, status: "fail" };
  try {
    const response = await get(repository, "html");
    const html = response.bytes.toString("utf8");
    const readmeLinks = [];
    for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
      const href = attributes(match[0]).href;
      if (!href) continue;
      let url;
      try {
        url = new URL(href, repository);
      } catch {
        continue;
      }
      if (
        url.origin === repository.origin &&
        url.pathname.startsWith(`${repository.pathname}/blob/`) &&
        url.pathname.endsWith("/README.md") &&
        !url.search &&
        !url.hash
      ) {
        readmeLinks.push(url);
      }
    }
    const readmeUrl = readmeLinks[0];
    if (!readmeUrl)
      fail(
        "The public repository response exposes no README file link; no branch URL was guessed.",
      );
    const readme = await get(readmeUrl, "html");
    result.repository = {
      status: response.status,
      bytes: response.bytes.length,
    };
    result.readme = {
      url: readmeUrl.href,
      status: readme.status,
      bytes: readme.bytes.length,
    };
    result.status = "pass";
  } catch (error) {
    result.failure = error.message;
  }
  return result;
}

let urls;
try {
  urls = parseArguments(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(usage);
  process.exitCode = 1;
}

if (urls) {
  const report = {
    date: "Fall 2026",
    verification:
      "Anonymous HTTP GET validation of the explicitly supplied public endpoints. No browser session or app interaction was performed by this script.",
    limitations: [
      "HTTP-only: rendering, interactive behavior, responsiveness, accessibility and JavaScript console errors require separate browser verification.",
      "The presence of a repository URL in app code does not prove the source control is visible or clickable in a browser.",
      "DOCX byte matching verifies artifact delivery and does not establish Word layout quality.",
      "No credentials, hosting mutations, CI checks or release checks are performed.",
    ],
    targets: {
      primary: urls.primary.href,
      backup: urls.backup.href,
      repository: urls.repository.href,
    },
    status: "fail",
    results: [],
  };
  try {
    const reports = await Promise.all(
      ["pdf", "docx"].map(async (extension) => {
        const bytes = await localBytes(
          `docs/Cobalt_Engineering_Report.${extension}`,
          "report artifact",
        );
        if (bytes.length < 10_000)
          fail(
            "A current local report is smaller than the required minimum size.",
          );
        return [extension, bytes];
      }),
    );
    report.results = await Promise.all([
      inspectSite("primary", urls.primary, "dist", urls.repository, reports),
      inspectSite(
        "backup",
        urls.backup,
        "dist-pages",
        urls.repository,
        reports,
      ),
      inspectRepository(urls.repository),
    ]);
    report.status = report.results.every((result) => result.status === "pass")
      ? "pass"
      : "fail";
  } catch (error) {
    report.failure = error.message;
  }
  await writeFile(
    resolve(projectRoot, reportName),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
