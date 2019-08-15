const client = require('socket.io-client');

const namespace = 'wink';
const socket = client(`http://localhost:82/${namespace}`);

module.exports = socket;
