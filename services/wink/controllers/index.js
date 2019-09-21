const { powerDevices, updateDevices } = require('../models');

module.exports = (io) => {
  io.on('connection', async (socket) => {
    socket
      .on('power', (settings) => {
        const { state, id } = settings;
        const devices = powerDevices[state];
        console.log('power', devices.map(({ name }) => name).join(','), state, id);
        devices.forEach(device => device.turn(state));
      })
      .on('update', (settings) => {
        const { state, id } = settings;
        const devices = updateDevices[state];
        console.log('update', devices.map(({ name }) => name).join(','), state, id);
        // devices.forEach(device => device.set(state));
      });
  });
};
