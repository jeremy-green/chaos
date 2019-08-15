const uuid = require('uuid/v4');

require('../models');

module.exports = io => io.on('connection', socket => socket.emit('hello', { butts: 'farts', id: uuid() }));
