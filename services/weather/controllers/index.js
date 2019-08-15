const uuid = require('uuid/v4');

const { Weather } = require('../models');

module.exports = io => io.on('connection', socket => Weather.on('precipitation', status => socket.emit('precipitation', { ...status, id: uuid() })));
