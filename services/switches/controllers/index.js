const uuid = require('uuid/v4');

const switches = require('../models');

module.exports = io => io.on('connection', (socket) => {
  socket.on('toggle', (data) => {
    const { name, state } = data;
    const [device] = switches.filter(s => s.name === `${name} Home` /* 😒 */);
    device.handler(state);
  });

  switches.forEach(s => s.on('toggle', state => socket.emit('toggle', { ...state, id: uuid(), ts: Date.now() })));
});
