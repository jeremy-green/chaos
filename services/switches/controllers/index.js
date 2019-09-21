const uuid = require('uuid/v4');

const switches = require('../models');

module.exports = io => io.on('connection', (socket) => {
  switches.forEach(s => s.on('toggle', state => socket.emit('toggle', { ...state, id: uuid(), ts: Date.now() })));
});
