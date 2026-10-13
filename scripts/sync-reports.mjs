import { mkdir, copyFile, stat } from "node:fs/promises";
await mkdir("public/reports", { recursive: true });
for (const name of [
  "Cobalt_Engineering_Report.pdf",
  "Cobalt_Engineering_Report.docx",
]) {
  const info = await stat(`docs/${name}`);
  if (info.size < 10000)
    throw new Error(`Missing or incomplete engineering report: ${name}`);
  await copyFile(`docs/${name}`, `public/reports/${name}`);
}
