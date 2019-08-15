const BinarySwitch = require('./binary-switch');
const Thermostat = require('./thermostat');

const TheDiplomat = new BinarySwitch('The Diplomat');
const Nest = new Thermostat('Fort Drive Family Room Thermostat');

module.exports = { TheDiplomat, Nest };
