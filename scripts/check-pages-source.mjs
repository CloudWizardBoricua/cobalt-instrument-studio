import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function isCurrentPagesSource({
  repository,
  expectedCommit,
  token,
  request = fetch,
}) {
  if (
    !/^[\w.-]+\/[\w.-]+$/.test(repository || "") ||
    !/^[a-f0-9]{40}$/.test(expectedCommit || "")
  ) {
    throw new Error("A repository and exact CI source commit are required.");
  }
  const response = await request(
    `https://api.github.com/repos/${repository}/git/ref/heads/main`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  if (!response.ok)
    throw new Error(
      `Current main revision could not be verified (HTTP ${response.status}).`,
    );
  const data = await response.json();
  if (
    data.ref !== "refs/heads/main" ||
    !/^[a-f0-9]{40}$/.test(data.object?.sha || "")
  ) {
    throw new Error("Current main lookup returned an invalid reference.");
  }
  return data.object.sha === expectedCommit;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const current = await isCurrentPagesSource({
    repository: process.env.GH_REPO,
    expectedCommit: process.env.EXPECTED_COMMIT,
    token: process.env.GH_TOKEN,
  });
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `current=${current}\n`);
  console.log(
    current
      ? "Successful CI revision is still main; Pages may use its verified artifact."
      : "Skipping this older CI revision because main has advanced.",
  );
}
