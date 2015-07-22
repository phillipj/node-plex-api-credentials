# plex-api-credentials

[plex-api](https://www.npmjs.com/package/plex-api) authenticator module which provides PlexHome credentials authentication.

## Usage

```js
var PlexAPI = require('plex-api');
var credentials = require('plex-api-credentials');

var userAndPass = credentials({
    username: 'foo',
    password: 'bar'
});

var client = new PlexAPI({
    hostname: '192.168.0.1',
    authenticator: userAndPass
});

// use PlexAPI client as usual
client.find('/library/sections', ...);
```

## Events

### `token`

Emitted whenever a token has been retrieved from plex.tv.

### Usage

```js
userAndPass.on('token', function(token){
    // possibly cache retrieved token here?
});
```