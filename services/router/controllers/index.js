const uuid = require('uuid/v4');

const devices = require('../models');

module.exports = io => io.on('connection', socket => devices.forEach(device => device.on('change', info => socket.emit('change', { ...info, id: uuid(), ts: Date.now() }))));
