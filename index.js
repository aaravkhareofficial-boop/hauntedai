// Proxy entry: delegate to the real bot implementation in src/
// This keeps the repository runnable via `node index.js` while the
// implementation lives in `src/index.js`.

module.exports = require('./src/index.js');
