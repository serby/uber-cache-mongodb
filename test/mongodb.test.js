var Db = require('mongodb').Db
  , Server = require('mongodb').Server
  , serverData
  , UberCacheMongoDb = require('..')

describe('uber-cache-mongodb', function() {

  serverData = new Server('localhost', 27017
    , { 'auto_reconnect': true })

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

  beforeEach(function () {
    engine = new UberCacheMongoDb(conn, { collectionName: 'uc' + i++ })
  })

  afterEach(function (done) {
    engine.clear(done)
  })

  require('uber-cache/test/conformance-test')('uber-cache-mongodb', function() {
    return engine
  })

  after(db.dropDatabase.bind(db))

})
