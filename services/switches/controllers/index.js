const uuid = require('uuid/v4');

const switches = require('../models');

module.exports = io => io.on('connection', (socket) => {
  socket.on('change', (data) => {
    const { name, state } = data;
    const [device] = switches.filter(s => s.name === `${name} Home` /* 😒 */);
    device.handler(state);
  });

  switches.forEach(s => s.on('change', state => socket.emit('change', { ...state, id: uuid(), ts: Date.now() })));
});
