memory-blob-store
=================

![memory-blob-store](./static/blobstore.png)

[![badge](./static/badge.png)](https://github.com/maxogden/abstract-blob-store)

An in-memory blob store implementing abstract-blob-store.

```javascript
var MemoryBlobStore = require('memory-blob-store');

// There are no configuration options
var store = new MemoryBlobStore();

var ws = store.createWriteStream({}, function(e, options) {
	console.log('Stored blob with key ' + options.key);
});

process.stdin.pipe(ws);
```

See the [abstract-blob-store](https://github.com/maxogden/abstract-blob-store) documentation for details on how to use.
