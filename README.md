# yarn-plugins

Yarn 4 plugins used across koble-ai repositories.

## codeartifact-connect

Authenticates Yarn against an AWS CodeArtifact npm registry with your AWS credentials. You don't need to run `aws codeartifact login`, and no token is stored in `.yarnrc.yml` or `~/.npmrc`. The plugin fetches a token with `aws codeartifact get-authorization-token` when Yarn needs one, and keeps it in Yarn's in-memory configuration for that run only.

### Requirements

- The AWS CLI on `PATH`, with credentials that can call `codeartifact:GetAuthorizationToken` (and `sts:GetServiceBearerToken`). For example, after `aws sso login`, or the CI job's own credentials.
- These environment variables, from the shell or a file Yarn loads through `injectEnvironmentFiles`:

  | Variable               | Meaning                                    |
  | ---------------------- | ------------------------------------------ |
  | `CODE_ARTIFACT_DOMAIN` | The CodeArtifact domain, e.g. `koble`      |
  | `AWS_ACCOUNT_ID`       | The account that owns the domain           |
  | `AWS_REGION`           | The region the domain lives in             |

  The plugin assumes the repository has the same name as the domain. The registry URL it matches is `https://<domain>-<account>.d.codeartifact.<region>.amazonaws.com/npm/<domain>`.

### Install

Import a tagged release, so the `spec` and `checksum` in `.yarnrc.yml` pin an exact version:

```sh
yarn plugin import https://raw.githubusercontent.com/koble-ai/yarn-plugins/<tag>/codeartifact-connect.js
```

`yarn plugin import` re-serialises the whole `.yarnrc.yml`, sorting its keys and normalising quotes. To keep a bump small, restore the file afterwards and change only the plugin's `spec` and `checksum` lines. Never hand-edit the copy in `.yarn/plugins/`: its checksum then stops matching.

Then point the scope (or a registry) at CodeArtifact, without a token:

```yaml
npmScopes:
  koble:
    npmAlwaysAuth: true
    npmRegistryServer: 'https://koble-<account>.d.codeartifact.<region>.amazonaws.com/npm/koble/'
    npmPublishRegistry: 'https://koble-<account>.d.codeartifact.<region>.amazonaws.com/npm/koble/'
```

The plugin only acts on a scope named after `CODE_ARTIFACT_DOMAIN`, or on an `npmRegistries` entry for the registry URL above, and only while that entry has no `npmAuthToken`.

### When it fetches a token

| Yarn hook                | Covers                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `validateProject`        | `yarn install` and other commands that load the project                                       |
| `beforeWorkspacePacking` | `yarn pack` and `yarn npm publish`                                                            |
| `wrapNetworkRequest`     | Any other request to the registry made without a token, such as `yarn npm info`               |

Each hook skips the fetch when a token is already set.

## Releasing

1. Add an entry to [CHANGELOG.md](CHANGELOG.md) in the same PR as the change.
2. Merge it to `main`.
3. Tag `main` with the next version (`git tag <x.y.z> && git push origin <x.y.z>`). The tag is the version: consumers import the file at `raw.githubusercontent.com/koble-ai/yarn-plugins/<tag>/…`.
4. Bump each consumer's `.yarnrc.yml` as described under [Install](#install).
