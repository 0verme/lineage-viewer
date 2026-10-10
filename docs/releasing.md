# Releasing lineage-viewer

This repository is prepared for releases but does not publish automatically from `main`. Confirm manually that the public npm name `lineage-viewer` is available to the intended publisher before the first release.

## One-time GitHub and npm setup

Configure npm trusted publishing on npmjs.com for GitHub owner `0verme`, repository `lineage-viewer`, workflow `.github/workflows/release.yml`, and the `npm` GitHub Environment. Trusted publishing supplies the workflow's OIDC identity; do not add an npm token to this repository.

In GitHub, create the `npm` Environment. It may require reviewers and restrict deployments to protected tags. Configure the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets for the Cloudflare deployment workflow. A custom domain is configured in Cloudflare rather than through a repository `CNAME` file.

## Trusted publishing prerequisites

npm Trusted Publishing requires Node `>=22.14.0` and npm CLI `>=11.5.1`; the release workflow
pins Node `22.14.0` and npm `11.5.1` in its verification and publish jobs. The publish job runs
on a GitHub-hosted runner with `id-token: write`, uses the `npm` GitHub Environment, and publishes
to `https://registry.npmjs.org` without a long-lived npm token.

For each of the three packages, configure an npm Trusted Publisher with these exact values:

- GitHub owner: `0verme`
- Repository: `lineage-viewer`
- Workflow filename: `release.yml` (filename only, not `.github/workflows/release.yml`)
- Environment: `npm`
- Permission: allow direct `npm publish` (or use staged publishing if a maintainer will approve each package)

The repository URL in `package.json` must continue to identify `0verme/lineage-viewer`. npm
Trusted Publisher configuration is per package, not per workspace, and the three package names
must each have publish permission.

### First publication of the scoped packages

The two `@lineage-viewer/*` packages do not exist on npm yet. npm's `npm trust` configuration
requires that a package already exist, so do not assume OIDC can bootstrap these names. First
verify that the npm account or organization owns the `lineage-viewer` scope and has 2FA enabled.
Then, in an isolated temporary checkout, publish one aligned, clearly labelled prerelease
bootstrap version for each missing scoped package with `--access public` and a non-`latest`
dist-tag, recording the exact tarball integrity and package URLs. Do not make that bootstrap
version the stable release or change this repository's version files.

After the package pages exist, configure and verify the Trusted Publisher independently for all
three packages. The maintainer can then create the `v1.1.0` tag and let the release workflow
publish the stable tarballs. The coordinator skips an already published tarball only when its
Registry integrity matches exactly. No bootstrap publish is performed by this repository change.

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
npm run release:publish -- vX.Y.Z --dry-run
```

The release workflow performs a fresh `npm ci`, validates that the tag and all three package versions match, and repeats the build/test/package checks. Before any publication it packs all three tarballs and compares every existing Registry version with the local SHA-512 integrity. A version is skipped only when the integrity is identical; a conflicting immutable version stops the workflow before any package is published. Missing packages are then published in the fixed order `lineage-viewer`, `@lineage-viewer/domain-adapter`, `@lineage-viewer/react` with `--provenance --access public`. This makes a retry safe after a transient failure between package publishes while refusing to hide a different artifact under an existing version.

## Demo site caching

The Cloudflare deployment runs the Worker before serving `site-dist/` and enables Workers Caching with version-isolated entries. Successful responses remain in Cloudflare's edge cache for one year. Vite's fingerprinted `/assets/*` files also use a one-year immutable browser cache, while HTML and other non-fingerprinted resources use `max-age=0, must-revalidate` in browsers.

Do not enable `cross_version_cache` without also adding an explicit purge step to the deployment workflow. With the current version-isolated policy, each deployment starts with a fresh cache namespace, so changed HTML and assets take effect immediately without a manual purge. After deployment, send two requests to the same page and fingerprinted asset and inspect `CF-Cache-Status`; the warmed request should report `HIT`.

## Verify and recover

After a successful tag workflow, verify the npm package, its provenance, the GitHub Release notes, and the Project Pages gallery at `https://0verme.github.io/lineage-viewer/` (including `demo.html?id=<id>` and `playground.html`). Pages assets use relative paths, so the Project Pages repository subpath is preserved.

npm versions are immutable: never attempt to overwrite one. If the release coordinator reports a different Registry integrity, stop and choose a new version rather than republishing. If a transient error occurs after one or more packages publish, rerun the same tag workflow; identical published tarballs are skipped and only missing packages are attempted. If npm publishes but GitHub Release creation fails, repair the Release separately from the already-published packages and retain the same tag/version relationship. If a tag, GitHub Release, and package version diverge, stop further publication and document the state.
