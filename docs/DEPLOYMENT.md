# Verified hosting and release process

_Developed by Daren Diaz_

Fall 2026

Version 0.1.0 is publicly hosted at two independent HTTPS endpoints. Both serve static assets and run the simulation inside the visitor's browser; the development computer does not need to remain powered on.

## Verified endpoints

| Endpoint          | URL                                                                                                                     | Role                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Netlify           | [cobalt-instrument-studio.netlify.app](https://cobalt-instrument-studio.netlify.app/)                                   | Primary shareable demo               |
| GitHub Pages      | [cloudwizardboricua.github.io/cobalt-instrument-studio](https://cloudwizardboricua.github.io/cobalt-instrument-studio/) | Independent backup                   |
| GitHub repository | [CloudWizardBoricua/cobalt-instrument-studio](https://github.com/CloudWizardBoricua/cobalt-instrument-studio)           | Public source; default branch `main` |

Anonymous HTTPS checks passed for each site's HTML entry, referenced assets, repository link, observed README, and direct PDF/DOCX downloads. Downloaded report bytes matched the local artifacts. Both origins passed live checks for six changing instruments, mode and speed/load controls, Start/Pause/Reset, normal replay, overheat acknowledgment, and communication timeout/recovery. Dashboard, Diagnostics, and Settings each fit a 390 px viewport without horizontal overflow; observed error-level console logs were empty. [Public browser validation](public-browser-validation.json) and [public HTTP validation](public-http-validation.json) record the results. These checks establish observed access and behavior, not future availability.

The [CI run for the final report commit](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331306537) passed 32 unit tests and 7 Chromium browser tests on Linux. The corresponding [Pages deployment run](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331306485) also passed, and the Netlify deployment was ready. The separately verified local browser baseline used Microsoft Edge on Windows.

## Build and deployment paths

`npm run build` creates Netlify-compatible root assets in `dist`. Netlify builds `main` with that command and publishes `dist`. `npm run build:pages` creates project-relative assets in `dist-pages` with base `/cobalt-instrument-studio/`; the Pages workflow builds and deploys that output. Each build includes `reports/Cobalt_Engineering_Report.pdf` and its DOCX counterpart. Navigation changes local view state, so no app routes or rewrites are required.

`VITE_SOURCE_URL` is set to the verified repository HTTPS URL for production builds. The interface's Source link therefore points to the public repository. The Netlify badge displayed on the primary site is provider-injected UI and was inspected separately; it has no source/build counterpart.

The Netlify site uses a repository-scoped, read-only deploy key and a push webhook. Anonymous access was enabled on the new site after its initial protected response. Global Git identity, team defaults, billing, and the Free plan were not changed; automatic top-up remains disabled.

## Published release

The [v0.1.0 GitHub Release](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/releases/tag/v0.1.0) was created by the [tag-triggered workflow](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/actions/runs/38331500958) after the production checks passed. The annotated tag points to commit `3b556c6d509b39301549af2e0ee2ade69d4495c5`; the [tagged source tree](https://github.com/CloudWizardBoricua/cobalt-instrument-studio/tree/v0.1.0) provides that reviewed version.

The release workflow passed 32 unit tests and 7 browser tests, verified the package/tag version, and created exactly one release with two report attachments. Reviewed notes matched the published notes. Anonymous PDF/DOCX attachment downloads matched the local report bytes. [Release validation](release-validation.json) records the result; no duplicate manual release was created.

For future versions, review production and CI results before pushing the annotated version tag, let the workflow create the release, and verify its notes and downloads. Repository-local commits use the approved developer attribution and a GitHub noreply address; global Git identity remains unchanged. No project license has been selected; dependency licenses remain applicable.

## Hosting limits

Provider permissions, quotas, and plan rules can change. Netlify usage or credit exhaustion can interrupt hosting; review the account's actual limits during future changes. Neither provider's future uptime is guaranteed. No 30-day availability measurement has been performed.

## Final manual cellular check

1. Open the [Netlify production URL](https://cobalt-instrument-studio.netlify.app/) on a phone using cellular data, with Wi-Fi disabled.
2. Confirm six instruments, the developer credit, and the simulated-data notice appear, then start and pause the engine.
3. Run coolant overheat and inspect its warning/critical transition in Diagnostics.
4. Run communication loss, confirm stale values, and wait for automatic recovery.
5. Download the PDF and DOCX; repeat basic access on the [Pages backup](https://cloudwizardboricua.github.io/cobalt-instrument-studio/).

This physical cellular-network check remains a manual follow-up; browser viewport tests do not establish cellular reception.

## Workflow references

The Pages workflow follows [GitHub's official custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Release creation uses an existing tag and a notes file as documented in the [GitHub CLI release manual](https://cli.github.com/manual/gh_release_create). Actual remote run links above provide the observed CI and Pages results.
