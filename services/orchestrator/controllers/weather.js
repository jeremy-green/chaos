const client = require('socket.io-client');

const namespace = 'weather';
const socket = client(`http://localhost:81/${namespace}`);

module.exports = socket;
