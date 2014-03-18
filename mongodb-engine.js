var EventEmitter = require('events').EventEmitter
  , _ = require('lodash')
  , noop = function () {}

module.exports = function(client, options) {
  var collection
    , self = new EventEmitter()

  self.uberCacheVersion = '1'

  options = _.extend(
    { size: 1000
    , collection: 'ubercache'
    }, options)

  client.collection(options.collection, function(error, cacheCollection) {
    collection = cacheCollection
  })

  self.set = function set(key, value, ttl, callback) {
    // If no TTL is defined then last as long as possible
    if (typeof ttl === 'function') {
      callback = ttl
      ttl = undefined
    }

    if (typeof callback !== 'function') callback = noop

    // Don't handle undefined cache keys
    if (typeof key === 'undefined') {
      return callback(new Error('Invalid key undefined'))
    }

    // This is only to detect circular references
    try {
      JSON.stringify(value)
    } catch (err) {
      return callback(err)
    }

    if ((typeof(ttl) === 'number') && (parseInt(ttl, 10) === ttl)) {
      ttl += Date.now()
    } else {
      ttl = Infinity
    }

    collection.update({ _id: key }, { _id: key, ttl: ttl, data: value }, { upsert: true }, callback)
  }
  self.get = function get(key, callback) {
    collection.findOne({ _id: key }, function (error, cachePacket) {
      var value

      if (error) return callback(error)

      if (!cachePacket) {
        self.emit('miss', key)
        return callback(null, null)
      }

      value = cachePacket.data

      // If ttl has expired, delete
      if (cachePacket.ttl < Date.now()) {
        self.del(key)
        self.emit('miss', key)
        self.emit('stale', key, value, cachePacket.ttl)
        value = undefined
      }

      callback(null, value)
    })
  }

  self.del = function del(key, callback) {
    if (typeof callback !== 'function') callback = noop
    collection.remove({ _id: key }, callback)
  }

  self.clear = function clear(callback) {
    if (typeof callback !== 'function') callback = noop
    collection.drop(callback)
  }

  self.size = function(callback) {
    collection.count({}, callback)
  }

  self.dump = function dump(callback) {
    collection.find({}, callback)
  }

  self.close = function close(callback) {
    client.close(callback)
  }

  return self
}