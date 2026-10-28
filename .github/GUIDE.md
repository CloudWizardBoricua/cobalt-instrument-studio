# GitHub collaboration and automation

This file is named `GUIDE.md` because GitHub gives a README in `.github` priority over the repository's root README. The project showcase belongs at the root; this guide documents automation. See [GitHub's README selection rules](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes).

GitHub reads this directory for issue forms, PR guidance, dependency proposals and Actions workflows. Keep its conventional paths: moving them can silently disable platform behavior. [Repository home](../README.md) · [Current audit](../docs/REPOSITORY_AUDIT.md)

```mermaid
flowchart LR
  Forms[Issue forms and PR template] --> Review[Reviewable change]
  Updates[Dependabot proposals] --> Review
  Review --> CI[CI verification]
  CI --> Main[Approved main change]
  Main --> Pages[Verified Pages artifact]
```

```text
.github/
├── GUIDE.md                  # This navigation guide; keeps the root README on the homepage
├── ISSUE_TEMPLATE/           # Reproduction and proposal forms; see its README
├── dependabot.yml            # Weekly npm and GitHub Actions update proposals
├── pull_request_template.md  # Problem, actual validation and publication impact
└── workflows/                # CI, Pages and release automation; see its README
```

The [workflow guide](workflows/README.md) explains how [scripts](../scripts/README.md) and [tests](../tests/README.md) enforce publication boundaries. [Issue forms](ISSUE_TEMPLATE/README.md) ask for reproducible simulation conditions. Dependabot proposals remain separate reviews; an available update is not an instruction to merge it.

From the project root, run `npm run verify:workflows`, `npm test`, and `npm run verify:privacy`. Editing a Markdown guide does not require publishing or running a release helper.

Demo talking point: reproducibility includes scenario, seed, simulation time and browser context. The workflow protects delivery of a tested browser simulator; it does not qualify industrial equipment or provide a safety certification. A main merge also triggers Netlify's independent repository integration, which is configured outside this directory.
