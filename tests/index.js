
var abstractBlobTests = require('abstract-blob-store/tests');
var test = require('tape');
var store = require('../');

var common = {
  setup: function(t, cb) {
    return cb(null, new store());
  },
  teardown: function(t, store, blob, cb) {
    if(blob) store.remove(blob, cb)
    else return cb();
  }
}

abstractBlobTests(test, common);
