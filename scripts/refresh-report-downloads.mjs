// Refresh report assets after editorial changes without repeating app tests.
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const record = JSON.parse(
  await readFile("docs/hosting-build-validation.json", "utf8"),
);
for (const [name, output, base] of [
  ["root", "dist", "/"],
  ["project", "dist-pages", "/cobalt-instrument-studio/"],
]) {
  const result = record.results.find((item) => item.name === name);
  if (result?.browser !== "pass")
    throw new Error("Prior production browser validation is required.");
  const files = new Map();
  for (const extension of ["pdf", "docx"]) {
    const filename = `Cobalt_Engineering_Report.${extension}`;
    const bytes = await readFile(`docs/${filename}`);
    if (bytes.length < 10000)
      throw new Error("A report is missing or incomplete.");
    for (const folder of ["public/reports", `${output}/reports`]) {
      await mkdir(folder, { recursive: true });
      await copyFile(`docs/${filename}`, `${folder}/${filename}`);
    }
    files.set(`${base}reports/${filename}`, {
      extension,
      filename,
      expected: bytes,
    });
  }
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    const file = files.get(pathname);
    if (!file) return response.writeHead(404).end();
    try {
      const bytes = await readFile(resolve(output, "reports", file.filename));
      response
        .writeHead(200, {
          "Content-Type":
            file.extension === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
        .end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const downloads = [];
  try {
    for (const [path, file] of files) {
      const response = await fetch(
        `http://127.0.0.1:${server.address().port}${path}`,
      );
      const bytes = Buffer.from(await response.arrayBuffer());
      if (response.status !== 200 || !bytes.equals(file.expected))
        throw new Error("Report HTTP download differs from the final source.");
      downloads.push({
        extension: file.extension,
        status: response.status,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
    result.downloads = downloads;
  } finally {
    await new Promise((done) => server.close(done));
  }
}
record.date = "Fall 2026";
record.reportRefresh =
  "Final reports resynchronized; direct HTTP downloads rechecked on both local build paths. Previously recorded application browser checks and build timings retained.";
await writeFile(
  "docs/hosting-build-validation.json",
  JSON.stringify(record, null, 2) + "\n",
);
console.log(
  "Final reports match HTTP downloads on both local production paths.",
);
