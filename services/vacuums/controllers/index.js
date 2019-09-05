const uuid = require('uuid/v4');

require('../models');

module.exports = io => io.on('connection', (socket) => {
  socket.on('command', data => console.log('HERE', data));
});
