const config = require('config');

const BinarySwitch = require('./binary-switch');
const Thermostat = require('./thermostat');

const { diplomat, familyRoom } = config.get('names');

const TheDiplomat = new BinarySwitch(diplomat);
const FamilyRoom = new Thermostat(familyRoom);

module.exports = { TheDiplomat, FamilyRoom };
