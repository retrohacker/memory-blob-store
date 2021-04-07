const abstractBlobTests = require('abstract-blob-store/tests');
const test = require('tape');
const Store = require('../');

function setup(t, cb) {
  return cb(null, new Store());
}

function teardown(t, store, blob, cb) {
  if (blob) {
    return store.remove(blob, cb);
  }
  return cb();
}

const common = { setup, teardown };

abstractBlobTests(test, common);

test('handles multiple readers during write stream', function(t) {
  var key = 'foobar';
  var data = ['x', 'y', 'z'];
  var index = 0;
  t.plan(data.length * 2);
  setup(null, function (e, store) {
    var ws = store.createWriteStream(key);
    var rs1 = store.createReadStream(key);
    var rs2 = store.createReadStream(key);
    rs1.on('data', function(d) {
      t.equal(d.toString(), data[index | 0], 'Received data during write');
      index += .5;
    });
    rs2.on('data', function(d) {
      t.equal(d.toString(), data[index | 0], 'Received data during write');
      index += .5;
    });
    for(var i = 0; i < data.length; i++) {
      ws.write(data[i]);
    }
  });
});

test('autogenerates a key when not provided', function(t) {
  setup(null, function (e, store) {
    t.plan(2);

    store.createWriteStream({}, function (e, opts) {
      t.equal(opts.key, '0');

      store.createWriteStream({}, function (e, opts) {
        t.equal(opts.key, '1');
      }).end();
    }).end();
  });
})
