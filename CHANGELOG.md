# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Changed
- none yet

### Fixed
- none yet

### Added
- `disabled` attribute for `<ButtonLink />` component

### Removed
- none yet

### Deprecated
- none yet

### Security
- none yet


## [v0.3.2]

### Fixed
- Bug when using BUILD_COMMIT


## [v0.3.1]

### Changed
- Use back the TRAVIS_COMMIT for dev versioning

### Added
- Hanlde BUILD_COMMIT from environment for dev versioning


## [v0.3.0]

### Added
- Add an automatic mode detection according to environment variables

### Changed
- Grab editor name directly from the manifest instead of the CLI option
- The dev version computing in Travis mode use the archive shasum instead of the TRAVIS_COMMIT

### Removed
- `--on-branch` option with git branch checking in travis mode
- Unused `--travis` option
- The `--editor` option since it's now using the manifest
- Pull request checking in travis mode


## [v0.2.0]

### Changed
- Now use the registry in production URL

### Added
- Handle registry spaces name through `--space` option


## [v0.1.1] First release

Deploy a Cozy application to Cozy Cloud registry


[Unreleased]: https://github.com/cozy/cozy-app-publish/compare/v0.3.2...HEAD
[v0.3.2]: https://github.com/cozy/cozy-app-publish/compare/v0.3.1...v0.3.2
[v0.3.1]: https://github.com/cozy/cozy-app-publish/compare/v0.3.0...v0.3.1
[v0.3.0]: https://github.com/cozy/cozy-app-publish/compare/v0.2.0...v0.3.0
[v0.2.0]: https://github.com/cozy/cozy-app-publish/compare/v0.1.1...v0.2.0
[v0.1.1]: https://github.com/cozy/cozy-app-publish/releases/tag/v0.1.1
