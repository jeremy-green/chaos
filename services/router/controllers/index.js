const uuid = require('uuid/v4');

require('../models');

module.exports = io => io.on('connection', socket => socket.emit('whatup', { farts: 'butts', id: uuid() }));
