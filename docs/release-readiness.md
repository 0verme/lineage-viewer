# Release readiness

Before publishing a release, run this checklist from a clean working tree. Phase 8 establishes this process only; it does not publish, push, create a release, or deploy Pages.

- [ ] Confirm the intended version and update `CHANGELOG.md`.
- [ ] Confirm `README.md` install examples and [public API](public-api.md) match the package entry points.
- [ ] Run `npm run format` and inspect the intended formatting changes.
- [ ] Run `npm run lint`, `npm run typecheck`, and `npm test`.
- [ ] Install Playwright Chromium when needed, then run `npm run test:e2e`.
- [ ] Run `npm run build` and `npm run build:site`.
- [ ] Run `npm run test:package` to build, pack, install, typecheck, build, and browser-smoke-test temporary consumers.
- [ ] Run `npm run pack:check` and `npm pack --dry-run`; confirm JavaScript, declarations, `README.md`, `LICENSE`, `NOTICE`, and `package.json` are included, and private/reference/test/report/cache/site artifacts are excluded.
- [ ] Manually inspect the tarball file list and verify package files contain no absolute or repository-external paths.
- [ ] Run `git diff --check` and `git status --short`; remove generated tarballs, consumer `node_modules`, and temporary artifacts.
- [ ] Run the Pages/site build check appropriate to the repository workflow before enabling or publishing Pages.
