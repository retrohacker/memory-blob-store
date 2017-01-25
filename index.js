const stream = require('stream');

function MemoryBlobStore() {
  if (!(this instanceof MemoryBlobStore)) {
    return new MemoryBlobStore();
  }
  this.store = {};
  this.writing = {};
  this.readers = {};
  return this;
}

function createWriteStream(opts, cb) {
  const self = this;
  let key = opts;
  if (typeof opts === 'object') {
    key = key.name || key.key;
  }

  if (typeof key !== 'string') {
    return setImmediate(cb, 'Must include a key as a string');
  }

  const ws = new stream.Writable();
  self.readers[key] = self.readers[key] || {};
  if (self.writing[key]) {
    self._closeReaders(key);
  }
  self.readers[key] = {};
  self.writing[key] = true;

  self.store[key] = Buffer(0);
  ws._write = function write(chunk, encoding, done) {
    if (!self.store[key]) {
      return setImmediate(done, new Error('Blob does not exist'));
    }
    const buffer = Buffer.from(chunk);
    self.store[key] = Buffer.concat([self.store[key], buffer]);
    self._writeToReaders(key, buffer);
    return setImmediate(done);
  };

  ws.on('finish', () => {
    delete self.writing[key];
    self._closeReaders(key);
    return setImmediate(cb, null, { key });
  });
  return ws;
}

MemoryBlobStore.prototype.createWriteStream = createWriteStream;

function _writeToReaders(key, buffer) {
  for (let i = 0; this.readers[key].length; i += 1) {
    this.readers[i].push(buffer);
  }
}
MemoryBlobStore.prototype._writeToReaders = _writeToReaders;

function _closeReaders(key) {
  for (let i = 0; this.readers[key].length; i += 1) {
    this.readers[key][i].push(null);
  }
  delete this.readers[key];
}
MemoryBlobStore.prototype._closeReaders = _closeReaders;

function remove(opts, cb) {
  let key = opts;
  if (typeof key === 'object') {
    key = key.key;
  }

  if (typeof key !== 'string') {
    return setImmediate(cb, 'Must include a key as a string');
  }

  delete this.store[key];
  return setImmediate(cb);
}
MemoryBlobStore.prototype.remove = remove;

function createReadStream(opts) {
  const self = this;
  let key = opts;
  if (typeof key === 'object') {
    key = key.key;
  }

  if (typeof key !== 'string') {
    return new Error('Must include a key as a string');
  }

  const rs = new stream.Readable();
  self.readers[key] = self.readers[key] || {};
  rs.push(self.store[key]);
  if (!self.writing[key]) {
    rs.push(null);
    delete self.readers[key];
  }
  if (!self.store[key]) {
    setImmediate(rs.emit.bind(rs), 'error', new Error('Blob does not exist.'));
  }
  rs._read = function noop() {};
  return rs;
}
MemoryBlobStore.prototype.createReadStream = createReadStream;

function exists(opts, cb) {
  let key = opts;
  if (typeof key === 'object') {
    key = key.key;
  }

  if (typeof key !== 'string') {
    return setImmediate(cb, new Error('key must be provided'));
  }

  return setImmediate(cb, null, this.store[key] !== undefined);
}
MemoryBlobStore.prototype.exists = exists;

module.exports = MemoryBlobStore;
