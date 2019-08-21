const config = require('config');
const FauxMo = require('node-fauxmo');

const Switch = require('./switch');

const { basePort, switchNames } = config;

const switches = switchNames.reduce(
  (acc, { name, state }) => [...acc, new Switch(name, state)],
  [],
);

const devices = switches.reduce((acc, curr, index) => {
  const {
    name, handler, state, statusHandler,
  } = curr;
  const port = basePort + index;

  return [
    ...acc,
    {
      name,
      port,
      state,
      handler: handler.bind(curr),
      statusHandler: statusHandler.bind(curr),
    },
  ];
}, []);

FauxMo({ devices });
module.exports = switches;
