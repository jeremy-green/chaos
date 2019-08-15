const client = require('socket.io-client');

const namespace = 'switches';
const socket = client(`http://localhost:83/${namespace}`);

module.exports = socket;
