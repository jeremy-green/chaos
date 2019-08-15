const uuid = require('uuid/v4');

const { TheDiplomat, FamilyRoom } = require('../models');

const deviceMap = {
  'The Diplomat': TheDiplomat,
};

module.exports = (io) => {
  io.on('connection', async (socket) => {
    console.log('trying...');

    await Promise.all([TheDiplomat.ready(), FamilyRoom.ready()]);

    console.log('ready!!!');

    socket.on('power', (settings) => {
      const { devices, state, id } = settings;
      console.log('power', devices, state, id);
      devices.forEach((device) => {
        deviceMap[device].turn(state);
      });
    });
  });
};
