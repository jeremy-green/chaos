const uuid = require('uuid/v4');

const switches = require('../models');

module.exports = io => io.on('connection', socket => switches.forEach(s => s.on('change', state => socket.emit('change', { ...state, id: uuid(), ts: Date.now() }))));
