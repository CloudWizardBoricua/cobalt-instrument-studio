# Publication preparation

_Developed by Daren Diaz_

This project currently has no verified public deployment. Local preview URLs are development tools and cannot be shared as hosted deliverables.

## Intended endpoints

Netlify production is the primary shareable endpoint. A GitHub Pages project deployment is the independent backup. Both serve static assets and run the simulation inside the visitor's browser.

The prepared repository name is `cobalt-instrument-studio`. No remote repository, site, issue, commit, tag, or release was created during the local build.

## Review and authorization

Before publication, inspect the local app, reports, source, privacy checks, and validation evidence. Confirm the intended GitHub account, commit author attribution, Netlify team, repository visibility, and site name. Authentication is separate from authorization.

The next authorized publication step would:

1. Initialize a dedicated Git repository if needed, commit the reviewed files, create the new public repository, and push main.
2. Select GitHub Actions as the Pages publishing source and run the prepared Pages workflow.
3. Create a new Netlify production site with `npm run build`, `dist`, and a root base path. Use the stable production domain.
4. Verify CI plus both production sites anonymously over HTTPS, including assets, gauge updates, navigation, controls, and direct PDF/DOCX downloads.
5. Only after those checks pass, create and push an annotated `v0.1.0` tag. The release workflow verifies the package version and tests, then publishes exactly one release. Do not also create a manual release.

No publication action above has been executed. Do not change unrelated repositories, DNS, global Git identity, security settings, billing, or hosting plans. No project license has been selected; dependency licenses remain applicable.

## Build paths

`npm run build` creates Netlify-compatible root assets in `dist`. `npm run build:pages` creates project-relative assets in `dist-pages` with base `/cobalt-instrument-studio/`. Each build must contain `reports/Cobalt_Engineering_Report.pdf` and its DOCX counterpart. Navigation changes local view state, so no app routes or rewrites are required.

Set `VITE_SOURCE_URL` to the verified repository HTTPS URL before the final production build if an in-app Source link is desired. That optional link is suppressed until a correctly shaped GitHub repository URL is provided. Do not invent a source URL or deployment badge.

## Hosting limits

Provider availability, account permissions, quotas, and plan rules can change. Netlify usage or credit exhaustion can interrupt hosting; inspect the actual account's current limits during publication. Neither provider's future uptime is guaranteed. No 30-day availability measurement has been performed.

## Final manual cellular check

1. Open the verified Netlify production URL on a phone using cellular data, with Wi-Fi disabled.
2. Confirm six instruments and the simulated-data notice appear, then start and pause the engine.
3. Run coolant overheat and inspect its warning/critical transition in Diagnostics.
4. Run communication loss, confirm stale values, and wait for automatic recovery.
5. Download the PDF and DOCX; repeat basic access on the independent Pages URL.

## Workflow references

The Pages scaffold follows [GitHub's official custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Release creation uses an existing tag and a notes file as documented in the [GitHub CLI release manual](https://cli.github.com/manual/gh_release_create). Prepared workflow files have not been run on GitHub and do not establish a passing remote CI result.
