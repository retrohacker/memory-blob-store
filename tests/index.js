const abstractBlobTests = require('abstract-blob-store/tests');
const test = require('tape');
const Store = require('../');

function setup(t, cb) {
  return cb(null, new Store());
}

function teardown(t, store, blob, cb) {
  if (blob) {
    return Store.remove(blob, cb);
  }
  return cb();
}

const common = { setup, teardown };

abstractBlobTests(test, common);
