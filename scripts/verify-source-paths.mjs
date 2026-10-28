/**
 * Verify source navigation on a case-insensitive desktop before Linux deployment.
 * TypeScript parses static import/export and literal dynamic-import specifiers;
 * directory entries supply exact spelling instead of trusting Windows resolution.
 * This checks local files only, never installs packages or changes source/output.
 * It protects build portability, not telemetry correctness or industrial safety.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = [];
const failures = [];

// Restrict the walk to maintained code, excluding dependencies and generated trees.
async function inventory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await inventory(path);
    else if (entry.isFile()) files.push(path);
  }
}
for (const directory of ["src", "scripts", "tests"])
  await inventory(join(root, directory));
files.push(join(root, "vite.config.ts"), join(root, "playwright.config.ts"));

// Check every path segment, including parents: existsSync alone hides wrong case on Windows.
async function exactPath(path) {
  const parts = relative(root, path).split(sep);
  if (parts[0] === "..") return false;
  let current = root;
  for (const part of parts) {
    const names = await readdir(current).catch(() => []);
    if (!names.includes(part)) return false;
    current = join(current, part);
  }
  return true;
}

// A Linux checkout can represent names that collide on Windows; reject those too.
const folded = new Map();
for (const file of files) {
  const name = relative(root, file).split(sep).join("/");
  const key = name.toLowerCase();
  if (folded.has(key)) failures.push(`Case collision: ${folded.get(key)} / ${name}`);
  folded.set(key, name);
}

let checked = 0;
for (const file of files.filter((path) => /\.(?:[cm]?js|tsx?)$/.test(path))) {
  const source = ts.createSourceFile(file, await readFile(file, "utf8"), ts.ScriptTarget.Latest, true);
  const specifiers = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier))
      specifiers.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]))
      specifiers.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  for (const specifier of specifiers.filter((value) => value.startsWith("."))) {
    const target = resolve(dirname(file), specifier);
    const candidates = extname(target)
      ? [target]
      : [target, ...[".ts", ".tsx", ".mjs", ".js", ".json", ".css"].map((extension) => target + extension), join(target, "index.ts"), join(target, "index.tsx")];
    let found = false;
    for (const candidate of candidates) {
      if (await exactPath(candidate)) { found = true; break; }
    }
    if (!found) failures.push(`${relative(root, file)}: unresolved or incorrectly capitalized ${specifier}`);
    checked += 1;
  }
}
if (failures.length) throw new Error(failures.join("\n"));
console.log(`Exact-case source paths passed: ${checked} relative imports; ${files.length} maintained files checked for collisions.`);
