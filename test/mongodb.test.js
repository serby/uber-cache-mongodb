var Db = require('mongodb').Db
  , Server = require('mongodb').Server
  , serverData

describe('uber-cache-mongodb', function() {

  serverData = new Server('localhost', 27017,
    { 'auto_reconnect': true })

  var db = new Db('uber-cache-test', serverData, { fsync: true, w: 1 })
    , engine
    , conn
    , i = 0

  before(function (done) {
    db.open(function(error, connection) {
      conn = connection
      done()
    })
  })

  beforeEach(function (done) {
    engine = require('..')(conn, { collection: 'uc' + i++ })
    engine.clear(function() {
      done()
    })
  })

  require('uber-cache/test/engine')('mongodb-engine', function() {
    return engine
  })

})