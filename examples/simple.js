var Db = require('mongodb').Db
  , Server = require('mongodb').Server
  , server = new Server('localhost', 27017, { 'auto_reconnect': true })
  , db = new Db('uber-cache-db', server, { fsync: true, w: 1 })
  , mongodbEngine = require('..')
  , uberCache = require('uber-cache')
  , cache

db.open(function(error, connection) {
  var engine = mongodbEngine(connection)
  cache = uberCache({ engine: engine })
  cache.set('the key', 'the value', function() {
    cache.get('the key', function(error, value) {
      console.log(value)
      engine.close()
    })
  })
})
