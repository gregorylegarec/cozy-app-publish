# Cozy App Publish
![https://npmjs.org/package/cozy-app-publish](https://img.shields.io/npm/v/cozy-app-publish.svg)
![https://github.com/cozy/cozy-app-publish/LICENSE](https://img.shields.io/npm/l/cozy-app-publish.svg)
![https://travis-ci.org/cozy/cozy-app-publish](https://img.shields.io/travis/cozy/cozy-app-publish.svg)
![https://npmjs.org/package/cozy-app-publish](https://img.shields.io/npm/dm/cozy-app-publish.svg)

### What's cozy-app-publish?

`cozy-app-publish` is a command line tool that publish a Cozy application to the Cozy registry according to some options.

#### Requirements

 - Node.js version 8 or higher;

### Install

```
yarn add --dev cozy-app-publish
```

### Registry documentation

You can find more information about the registry and how to prepare an application to be published in the [official registry documentation](https://github.com/cozy/cozy-stack/blob/master/docs/registry.md).

### Usage via Travis CI (recommended)

First of all, don't forget to build the application:
```
# build the application (in the ./build folder here)
yarn build
```

Then, just publish it using the Travis CI workflow:
```
# publish it, REGISTRY_TOKEN should be
# encrypted and provided via Travis CI environment
# BUILD_COMMIT is your last build commit hash (git rev-parse build)
yarn cozy-app-publish \
--token $REGISTRY_TOKEN \
--build-commit $BUILD_COMMIT
```

### Manual usage (not recommended)

First of all, don't forget to build the application:
```
# build the application (in the ./build folder here)
yarn build
```

Then, just publish it using:
```
yarn cozy-app-publish \
--token $REGISTRY_TOKEN \
--build-url https://github.com/cozy/cozy-collect/archive/042cef26d9d33ea604fe4364eaab569980b500c9.tar.gz \
--manual-version 1.0.2-dev.042cef26d9d33ea604fe4364eaab569980b500c9
```

### Options

#### `--token <editor-token>` (required)

The registry editor token. This token must match the editor name and is provided by Cozy Cloud (with the name) in order to use the registry.

#### `--build-dir <relative-path>`

The path to the build folder, relative to the current directory. Since the 'standard' Cozy application builds in the `build/` folder, `build` is the default value. This folder is mainly used to read the application manifest during publishing.

#### `--build-url <url>`

For now, the registry a build archive (.tar.gz file) from an external link to be used in the cozy-stack. In the travis script, this url is computed using the Github trick to get archives from a commit url (but it's overwritten if provided by this option). For the manual script, we have to provide it.

#### `--build-commit <commit-hash>`

Using the `travis` mode, the archive tarball URL is computed using github and the build commit hash. If you are not on your build branch to publish, you can specify the correct build commit hash using this parameter.

#### `--manual-version <version>` (required for manual usage only)

In the manual mode, we don't have a way to compute the version like in the Travis mode for example. So we have to provide it using this option.

#### `--prepublish <script_path>`

Specify custom prepublish hook to manage how the app archive is generated and uploaded. The script must export a asynchronous function wich has the following signature:
```js
module.exports = async ({
  appBuildUrl,
  appSlug,
  appType,
  appVersion,
  buildCommit,
  registryUrl,
  registryEditor,
  registryToken,
  spaceName
}) => {
 // ...
}
```

This function must return an object containing the same options given as parameter, which can have been updated. For example, you may specifiy a new appBuildUrl in the hook. Here's a description of the different options:

|Options|Description|
|-|-|
| `appBuildUrl` | The url where the build can be retrieved. For example, `http://github.com/cozy/cozy-foo/archives/cozy-foo.tar.gz`|
| `appSlug` | The slug of the application, as defined in the manifest. Should not be mutated |
| `appType` | `webapp` or `konnector` |
| `appVersion` | App version, as defined in the manifest. Should not be mutated. |
| `buildCommit` | sha of the commit, should not be mutated. |
| `registryUrl` | URL of the Cozy registry, should not be mutated. |
| `registryEditor` | Editor as it appears in the Cozy registry. |
| `registryToken` | Registry Token. See [registry documentation](https://docs.cozy.io/en/cozy-stack/registry-publish/). Should not be mutated. |
| `spaceName` | Space name in the Cozy registry. |


#### `--postpublish <script_path>`

Works exactly like the `prepublish` option, but will be executed after the publication.

#### Multiple hooks and built-in hooks

You can specify more than one hook by separating them with a `,`:

```
cozy-app-publish --prepublish <hook_name>,<other_hook_name>
```

Some hooks are shipped with cozy-app-publish and can be used by specifying their name:

```
cozy-app-publish --prepublish <builtin_hook_name>
```

##### Downcloud prepublish hook

```
cozy-app-publish --prepublish downcloud
```

This hook allows to upload the app to our downcloud server and sets the `appBuildUrl` accordingly.

##### Rundeck postpublish hook

```
cozy-app-publish --prepublish rundeck
```

Deploys the app on rundeck. This hook requires several variables to be set as environment variables:

- `RUNDECK_TOKEN`:  the token to use to interact with the Rundeck API
- `TARGETS_DEV`: a comma-separated list of instances to deploy the app on, on the `dev` channel.
- `TARGETS_BETA`: a comma-separated list of instances to deploy the app on, on the `beta` channel.
- `TARGETS_STABLE`: a comma-separated list of instances to deploy the app on, on the `stable` channel.

##### Mattermost postpublish hook

```
cozy-app-publish --prepublish rundeck
```

Sends a message to a mattermost channel to notify of the app's deployment. Requires the following options:

- `MATTERMOST_HOOK_URL`
- `MATTERMOST_CHANNEL`

#### `--registry-url <url>`

The url of the registry, by default it will be https://staging-apps-registry.cozycloud.cc.

#### `--space <space-name>`

Use this options to provide a specific space name of the registry to publish the application in. By default it will be published in the default space.

#### `--verbose`

To print more logs when using tool (useful for debug).

### Recommended workflow

#### Day to day

- Development is done on feature branches that are merged into `master`,  once they are complete.
- Every time someone commits on `master`, a new archive is created and uploaded on Downcloud and it is then deployed on a test instance with Rundeck.

#### Release workflow

- A new branch is created from the current state of `master`. Let's say we want to deploy version `1.0.0` of the app.
- The only type of commits allowed on this release branch are bug fixes.
- Every time one or more bugs are fixed and the version is considered for release, the latest commit is tagged with a prerelease version number, eg. `1.0.0-beta.1`, `1.0.0-beta.2`, etc…
- Each of these prereleases is automatically uploaded on downcloud and deployed on instances that are on the `beta` channel.
- Once the branch is deemed ready for release, the last commit is tagged with the final version — `1.0.0` in our example. It is then, again, uploaded on downcloud, published on the registry and deployed on specific instances as needed.
- The release branch is merged back into `master` so that all the bugfixes aren't lost.
