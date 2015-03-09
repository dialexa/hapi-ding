Ding Route Plugin for Hapi
==========================

[![NPM](https://nodei.co/npm/hapi-ding.png)](https://nodei.co/npm/hapi-ding/)

[![Build Status](https://travis-ci.org/dialexa/hapi-ding.svg)](https://travis-ci.org/dialexa/hapi-ding)

This Hapi plugin exposes a route at /ding (by default), which responds with useful server information.

This plugin works with Hapi 8 and above.

```javascript
var Hapi = require('hapi');

var server = new Hapi.Server({
  load: {
    sampleInterval: 1000
  }
});
server.connection({
  host: 'localhost',
  port: 8000
});

server.register({
  register: require('hapi-ding')
}, function(){
  server.start();
});
```

when you hit `/ding`, the route will reply with

```json
{
  "ding": {
    "cpu": [
      1.67236328125,
      1.828125,
      1.927734375
    ],
    "mem": 1429590016,
    "time": 1425933629427,
    "heap": 13402416,
    "loop": 4.86166600137949
  }
}
```

