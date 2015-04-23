module.exports = UberCacheMongoDb

var EventEmitter = require('events').EventEmitter
  , through = require('through')
  , extend = require('lodash.assign')
  , noop = function () {}

function UberCacheMongoDb(db, options) {
  this.options = extend(
      { collectionName: 'ubercache'
      , size: 5000
      }
    , options)

  this.collection = db.collection(this.options.collectionName)
}

UberCacheMongoDb.prototype = Object.create(EventEmitter.prototype)

function setCache(key, value, ttl, callback) {
  if (ttl) ttl += Date.now()
  this.collection.update({ _id: key }
    , { _id: key, ttl: ttl, data: value, updated: new Date() }
    , { upsert: true }, function(err) {
      if (typeof callback === 'function') {
        callback(err, value)
      }
    })
}

UberCacheMongoDb.prototype.gc = function() {
  this.collection.remove({ ttl: { $lt: Date.now() } }, function(err) {
    if (err) return false // Log error somehow
      this.collection.count({}, function(err, count) {
        if (count > this.options.size) {
          this.collection.find({}, { key: 1}, { sort: { updated: -1 }, limit: 1, skip: this.options.size }
            , function(err, results) {
              this.collection.remove({ updated: { $lt: results[0].updated } }, function() {

              })
            })
        }
      })
  })
}

UberCacheMongoDb.prototype.set = function(key, value, ttl, callback) {

  var stream
  // If no TTL is defined then last as long as possible
  if (typeof ttl === 'function') {
    callback = ttl
    ttl = undefined
  }

  // Don't handle undefined cache keys
  if (typeof key === 'undefined') {
    return callback(new Error('Invalid key undefined'))
  }

  // Check for cyclic reference
  try {
    JSON.stringify(value)
  } catch (e) {
    return callback(e)
  }

  if ((value === undefined) && (callback === undefined)) {
    value = []
    return stream = through(function write(data) {
        value.push(data)
        this.queue(data)
      }
      ).on('end', (function () {
        // Check for cyclic reference
        try {
          JSON.stringify(value)
        } catch (e) {
          return stream.emit('error', e)
        }
        setCache.call(this, key, value, ttl, function(err) {
          if (err) return this.emit('error', err)
        })
      }).bind(this))
  }
  setCache.call(this, key, value, ttl, callback)
}

UberCacheMongoDb.prototype.get = function(key, callback) {
  this.collection.findOne({ _id: key }, (function (error, cachePacket) {
    var value
    if (error) return callback(error)

    if (!cachePacket) {
      this.emit('miss', key)
      return callback(null, null)
    }

    value = cachePacket.data
    // If ttl has expired, delete
    if (cachePacket.ttl && cachePacket.ttl < Date.now()) {
      this.delete(key)
      this.emit('miss', key)
      this.emit('stale', key, value, cachePacket.ttl)
      value = undefined
    }

    callback(null, value)
  }).bind(this))
}

UberCacheMongoDb.prototype.delete = function(key, callback) {

  if (typeof callback !== 'function') callback = noop
  this.collection.remove({ _id: key }, (function(err) {
    if (err) return callback(err)
    this.emit('delete', key)
    callback(null)
  }).bind(this))
}

UberCacheMongoDb.prototype.clear = function(callback) {
  if (typeof callback !== 'function') callback = noop
  this.collection.remove({}, (function(err) {
    if (err) return callback(err)
    this.emit('clear')
    callback()
  }).bind(this))
}

UberCacheMongoDb.prototype.size = function(callback) {
  this.collection.count({}, callback)
}

UberCacheMongoDb.prototype.dump = function(callback) {
  this.collection.find({}, callback)
}
