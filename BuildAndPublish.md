# Build and Publish
Steps to build and publish the npm package.

## Update information in package.json

As a minimum, update the version number in package.json

## Commands
Open a command prompt in the project root directory and enter the following commands:

Build the package
```console
npm run build:prod
```

Pack the package
```console
npm pack
```

Login to npm
```console
npm login
```
Obviously you must be registered with npm :smiley:.  
This command will open a browser window.

Publish the package
```console
npm publish --access public
```

Check that it has been published
```console
npm info @philjollans/fretboard.js
```

Alternatively visit:  
https://www.npmjs.com/package/@philjollans/fretboard.js
