# mongodb backed implementation of uber-cache

See http://github.com/serby/uber-cache for more details

[![build status](https://secure.travis-ci.org/serby/uber-cache-mongodb.png)](http://travis-ci.org/serby/uber-cache-mongodb) [![Greenkeeper badge](https://badges.greenkeeper.io/serby/uber-cache-mongodb.svg)](https://greenkeeper.io/)

## Installation

      npm install uber-cache-mongodb

## Usage

```js

var Db = require('mongodb').Db
  , Server = require('mongodb').Server
  , server = new Server('localhost', 27017, { 'auto_reconnect': true })
  , db = new Db('uber-cache-db', server, { fsync: true, w: 1 })
  , UberCache = require('uber-cache-mongodb')

db.open(function(error, connection) {
  var cache = new UberCache(connection)
  cache.set('the key', 'the value', function() {
    cache.get('the key', function(error, value) {
      console.log(value)
      db.close()
    })
  })
})


```

## Credits
[Paul Serby](https://github.com/serby/) follow me on [twitter](http://twitter.com/serby)

## Licence
Licenced under the [New BSD License](http://opensource.org/licenses/bsd-license.php)
