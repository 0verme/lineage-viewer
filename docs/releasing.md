# Releasing lineage-viewer

This repository is prepared for releases but does not publish automatically from `main`. Confirm manually that the public npm name `lineage-viewer` is available to the intended publisher before the first release.

## One-time GitHub and npm setup

Configure npm trusted publishing on npmjs.com for GitHub owner `0verme`, repository `lineage-viewer`, workflow `.github/workflows/release.yml`, and the `npm` GitHub Environment. Trusted publishing supplies the workflow's OIDC identity; do not add an npm token to this repository.

In GitHub, create the `npm` Environment. It may require reviewers and restrict deployments to protected tags. Configure the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets for the Cloudflare deployment workflow. A custom domain is configured in Cloudflare rather than through a repository `CNAME` file.

## Prepare a release

1. Start from a clean, up-to-date `main` branch and choose a SemVer version. Stay within `0.x` until a deliberate compatibility commitment justifies `1.0.0`.
2. Move the relevant `Unreleased` notes in `CHANGELOG.md` into a new `## [x.y.z] - YYYY-MM-DD` entry. A release cannot proceed without this exact version entry.
3. Update `package.json` and `package-lock.json` to the same version, then run the full local checks below.
4. Commit the release preparation. Create an annotated tag only after it is committed: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
5. Push the commit and then the tag. The tag triggers verification, npm publication, and finally the GitHub Release. Do not create a release manually first.

Use `vX.Y.Z` for `latest`, `vX.Y.Z-alpha.N` for `alpha`, `vX.Y.Z-beta.N` for `beta`, and `vX.Y.Z-rc.N` for `next`. Other prerelease identifiers fail safely rather than publishing to `latest`.

Run these checks locally before tagging:

```sh
npm run format
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run build:site
npm run test:package
npm run pack:check
npm run test:release
npm run test:workflows
npm pack --dry-run
npm publish --dry-run
```

The release workflow performs a fresh `npm ci`, validates that tag and package versions match, repeats build/test/package checks, runs `npm publish --dry-run`, and publishes with `--provenance --access public`. The explicit public access flag is required for the first trusted publication of this unscoped package; if the package becomes scoped, set the intended access explicitly before release.

## Verify and recover

After a successful tag workflow, verify the npm package, its provenance, the GitHub Release notes, and the Project Pages gallery at `https://0verme.github.io/lineage-viewer/` (including `demo.html?id=<id>` and `playground.html`). Pages assets use relative paths, so the Project Pages repository subpath is preserved.

npm versions are immutable: never attempt to overwrite one. If publication fails before npm publish, correct the release-preparation commit and create a new tag only after resolving the problem. If npm publishes but GitHub Release creation fails, repair the Release separately from the already-published package and retain the same tag/version relationship. If a tag, GitHub Release, and package version diverge, stop further publication, document the state, and choose a new version rather than republishing an existing npm version.
