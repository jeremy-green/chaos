const uuid = require('uuid/v4');

const switches = require('../models');

module.exports = io => io.on('connection', socket => switches.forEach(s => s.on('change', status => socket.emit('change', { ...status, id: uuid(), ts: Date.now() }))));
