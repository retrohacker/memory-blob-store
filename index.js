const stream = require('stream');
const timers = require('timers');

function MemoryBlobStore() {
  if (!(this instanceof MemoryBlobStore)) {
    return new MemoryBlobStore();
  }
  this.autoIndex = 0;
  this.store = Object.create(null);
  this.writing = {};
  this.readers = {};
  return this;
}

function createWriteStream(opts, cb) {
  const self = this;
  cb = cb || function noop() {};

  let key = opts;
  if (typeof opts === 'object') {
    key = key.name || key.key;
  }

  if (typeof key !== 'string') {
    while (this.autoIndex in this.store) {
      this.autoIndex++;
    }
    key = this.autoIndex.toString();
  }

  const ws = new stream.Writable();

  if (self.writing[key]) {
    self._closeReaders(key);
  }

  self.readers[key] = [];
  self.writing[key] = true;

  self.store[key] = Buffer.alloc(0);
  ws._write = function write(chunk, encoding, done) {
    if (!self.store[key]) {
      return timers.setImmediate(done, new Error('Blob does not exist'));
    }
    const buffer = Buffer.from(chunk);
    self.store[key] = Buffer.concat([self.store[key], buffer]);
    self._writeToReaders(key, buffer);
    return timers.setImmediate(done);
  };

  ws.on('finish', () => {
    delete self.writing[key];
    self._closeReaders(key);
    return timers.setImmediate(cb, null, { key });
  });
  return ws;
}

MemoryBlobStore.prototype.createWriteStream = createWriteStream;

function _writeToReaders(key, buffer) {
  if(!this.readers[key]) {
    return null;
  }

  for (let i = 0; i < this.readers[key].length; i += 1) {
    this.readers[key][i].push(buffer);
  }
}
MemoryBlobStore.prototype._writeToReaders = _writeToReaders;

function _closeReaders(key) {
  if(!this.readers[key]) {
    return null;
  }

  for (let i = 0; i < this.readers[key].length; i += 1) {
    this.readers[key][i].push(null);
  }
  delete this.readers[key];
}
MemoryBlobStore.prototype._closeReaders = _closeReaders;

function remove(opts, cb) {
  cb = cb || function noop() {};
  let key = opts;
  if (typeof key === 'object') {
    key = key.key;
  }

  if (typeof key !== 'string') {
    return timers.setImmediate(cb, 'Must include a key as a string');
  }

  delete this.store[key];
  return timers.setImmediate(cb);
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
  rs.push(self.store[key]);

  if (!self.writing[key]) {
    rs.push(null);
    delete self.readers[key];
  } else {
    self.readers[key].push(rs);
  }

  if (!self.store[key]) {
    timers.setImmediate(rs.emit.bind(rs), 'error', new Error('Blob does not exist.'));
  }

  rs._read = function noop() {};
  return rs;
}
MemoryBlobStore.prototype.createReadStream = createReadStream;

function exists(opts, cb) {
  cb = cb || function noop() {};
  let key = opts;

  if (typeof key === 'object') {
    key = key.key;
  }

  if (typeof key !== 'string') {
    return timers.setImmediate(cb, new Error('key must be provided'));
  }

  return timers.setImmediate(cb, null, this.store[key] !== undefined);
}
MemoryBlobStore.prototype.exists = exists;

module.exports = MemoryBlobStore;
