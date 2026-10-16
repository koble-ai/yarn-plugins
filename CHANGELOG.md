# Changelog

Each version is a git tag on `main`. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.1] - 2026-10-16

### Fixed

- `codeartifact-connect`: `yarn npm info` (and any other request reaching `wrapNetworkRequest` without headers) no longer throws `Cannot set properties of undefined (setting 'authorization')`. The token is now sent on that request.

## [1.1.0] - 2024-06-16

### Changed

- `codeartifact-connect`: fetch the token in `beforeWorkspacePacking` instead of `setupScriptEnvironment`, so `yarn pack` and `yarn npm publish` are authenticated without fetching a token before every script.

## [1.0.8] - 2024-06-15

### Fixed

- `codeartifact-connect`: if `exec` throws synchronously while starting `aws codeartifact get-authorization-token`, the token fetch now rejects instead of letting the exception escape.

## [1.0.7] - 2024-06-15

### Fixed

- `codeartifact-connect`: `wrapNetworkRequest` referenced an undefined `project`.
- `codeartifact-connect`: the registry URL is built only when it's needed.

## [1.0.6] - 2024-06-15

### Fixed

- `codeartifact-connect`: reinstate `wrapNetworkRequest`, which 1.0.5 dropped. Requests are authenticated again, and a fetch is skipped when a token is already set.

## [1.0.5] - 2024-06-14

### Added

- `codeartifact-connect`: also fetch a token when a script's environment is set up. A failure there is a warning, not an error.

### Changed

- `codeartifact-connect`: an `npmRegistries` entry is matched by the full CodeArtifact registry URL rather than by the domain name.

## [1.0.4] - 2024-06-14

### Fixed

- `codeartifact-connect`: `wrapNetworkRequest` returns the executor, so the request goes ahead.

## [1.0.3] - 2024-06-14

### Fixed

- `codeartifact-connect`: remove a leftover `throw` from `wrapNetworkRequest`.

## [1.0.2] - 2024-06-14

### Fixed

- `codeartifact-connect`: load `child_process` through the `require` Yarn passes to the plugin factory.

## [1.0.1] - 2024-06-14

### Added

- `codeartifact-connect`: `wrapNetworkRequest`, which fetches a token for a request to the CodeArtifact registry that has none.

### Changed

- `codeartifact-connect`: a failure to fetch the token in `validateProject` is reported without rejecting the hook.

## [1.0.0] - 2024-06-13

### Added

- `codeartifact-connect`: fetch a CodeArtifact token with the AWS CLI in `validateProject`, and set it on the matching `npmScopes` and `npmRegistries` entries.

[1.1.1]: https://github.com/koble-ai/yarn-plugins/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/koble-ai/yarn-plugins/compare/1.0.8...1.1.0
[1.0.8]: https://github.com/koble-ai/yarn-plugins/compare/1.0.7...1.0.8
[1.0.7]: https://github.com/koble-ai/yarn-plugins/compare/1.0.6...1.0.7
[1.0.6]: https://github.com/koble-ai/yarn-plugins/compare/1.0.5...1.0.6
[1.0.5]: https://github.com/koble-ai/yarn-plugins/compare/1.0.4...1.0.5
[1.0.4]: https://github.com/koble-ai/yarn-plugins/compare/1.0.3...1.0.4
[1.0.3]: https://github.com/koble-ai/yarn-plugins/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/koble-ai/yarn-plugins/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/koble-ai/yarn-plugins/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/koble-ai/yarn-plugins/tree/1.0.0
