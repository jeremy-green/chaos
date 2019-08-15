const config = require('config');
const FauxMo = require('node-fauxmo');

const Switch = require('./switch');

const { basePort, switchNames } = config;

const switches = switchNames.reduce((acc, curr) => [...acc, new Switch(curr)], []);

const devices = switches.reduce((acc, curr, index) => {
  const { name, handler, state } = curr;
  const port = basePort + index;

  return [
    ...acc,
    {
      name,
      port,
      state,
      handler: handler.bind(curr),
      // statusHandler,
    },
  ];
}, []);

FauxMo({ devices });
module.exports = switches;
