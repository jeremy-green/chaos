const config = require('config');
const client = require('socket.io-client');

module.exports = (namespace) => {
  const { port } = config.get(namespace);
  return client(`http://localhost:${port}/${namespace}`);
};
