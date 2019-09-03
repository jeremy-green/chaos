const {
  Machine, spawn, assign, send, interpret,
} = require('xstate');

const { machine: WinkMachine } = require('./wink');
const { machine: WeatherMachine } = require('./weather');
const { machine: SwitchesMachine } = require('./switches');
const { machine: RouterMachine } = require('./router');

const Supervisor = interpret(
  new Machine({
    id: 'supervisor',
    initial: 'active',
    context: {},
    states: {
      active: {
        entry: assign({
          wink: () => spawn(WinkMachine, 'wink'),
          weather: () => spawn(WeatherMachine, 'weather'),
          switches: () => spawn(SwitchesMachine, 'switches'),
          router: () => spawn(RouterMachine, 'router'),
        }),
        on: {
          NO_PRECIPITATION: {
            actions: [send('POWER_ON', { to: 'wink' })],
          },
          PRECIPITATION: {
            actions: [send('POWER_OFF', { to: 'wink' })],
          },
          TOGGLE_ON: {
            actions: [send('SET_AUTO', { to: 'wink' })],
          },
          TOGGLE_OFF: {
            actions: [send('SET_ECO', { to: 'wink' })],
          },
        },
      },
    },
  }),
).start();

module.exports = Supervisor;
