# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-07-23

### Added

- Independent SQLGlot Adapter package and CLI for SELECT, JOIN, alias, scalar transform, and
  aggregate column lineage.
- Runnable SQL-to-lineage browser example backed by generated Adapter JSON.
- Dependency-free OpenLineage Adapter package and CLI for RunEvent jobs, datasets, schema fields,
  and column lineage facets.
- Runnable OpenLineage-event browser example backed by generated Adapter JSON.

### Changed

- Declared the public viewer API stable under Semantic Versioning.
- Added contributor guidance, private security reporting instructions, and GitHub issue templates.

## [0.1.0-alpha.2] - 2026-07-19

### Added

- Product-focused table, column, and transformation showcases on the demo homepage.
- Field-level demo screenshots and richer field transformation details.
- npm discovery keywords and verified package-consumer installation.

### Changed

- Reworked the English and Chinese README introductions around the framework-free,
  embeddable Web Component positioning.

## [0.1.0-alpha.1] - 2026-07-11

### Added

- GitHub Actions CI, npm trusted-publishing release preparation, and GitHub Pages deployment workflows.
- Release validation helpers for version tags, npm dist-tags, changelog extraction, and workflow configuration.
- Release and deployment documentation.
