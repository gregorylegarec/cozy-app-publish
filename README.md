# Cozy App Publish
![https://github.com/cozy/cozy-app-publish/LICENSE](https://img.shields.io/npm/l/cozy-app-publish.svg)
![https://travis-ci.org/cozy/cozy-app-publish](https://img.shields.io/travis/cozy/cozy-app-publish.svg)
![https://npmjs.org/package/cozy-app-publish](https://img.shields.io/npm/dm/cozy-app-publish.svg)

### What's cozy-app-publish?

`cozy-app-publish` is a command line tool that publish a Cozy application to the Cozy registry according to some options.

#### Requirements

 - Node.js version 6 or higher;

### Install

```
yarn add cozy-app-publish
```

### Usage via Travis CI

```
# build your application in your ./build folder
yarn build
# publish it, REGISTRY_TOKEN should be
# encrypted and provided via Travis CI environment
cozy-app-publish --editor myname --token $REGISTRY_TOKEN
```
