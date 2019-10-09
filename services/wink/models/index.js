const config = require('config');

const { Machine, interpret } = require('xstate');

const BinarySwitch = require('./binary-switch');
const Thermostat = require('./thermostat');

const { diplomat, thermostat: thermostatName, patio: patioName } = config.get('names');

const theDiplomat = new BinarySwitch(diplomat);
const patio = new BinarySwitch(patioName);
const thermostat = new Thermostat(thermostatName);

const powerDevices = {
  on: [theDiplomat],
  off: [theDiplomat, patio],
};

const updateDevices = {
  auto: [thermostat],
  eco: [thermostat],
};

interpret(
  new Machine({
    id: 'initializer',
    initial: 'bootstrap',
    states: {
      bootstrap: {
        invoke: {
          src: () => Promise.all([theDiplomat.ready(), thermostat.ready(), patio.ready()]),
          onDone: {
            target: 'ready',
            actions: [() => console.log('ready!!!')],
          },
        },
      },
      ready: {
        type: 'final',
      },
    },
  }),
).start();

module.exports = { powerDevices, updateDevices };
