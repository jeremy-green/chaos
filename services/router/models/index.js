const config = require('config');

const Orbi = require('./orbi');

const { devices } = config;

module.exports = devices.map(({ id, name }) => new Orbi(id, name));
