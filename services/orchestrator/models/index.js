const {
  Machine, spawn, assign, send, interpret,
} = require('xstate');

const { machine: WinkMachine } = require('./wink');
const { machine: WeatherMachine } = require('./weather');
const { machine: SwitchesMachine } = require('./switches');
const { machine: RouterMachine } = require('./router');
const { machine: VacuumsMachine } = require('./vacuums');

const Supervisor = interpret(
  new Machine({
    id: 'supervisor',
    initial: 'inactive',
    context: {},
    states: {
      inactive: {
        on: {
          INIT: {
            target: 'active',
            actions: [() => console.log('🐉')],
          },
        },
      },
      active: {
        entry: assign({
          wink: () => spawn(WinkMachine, 'wink'),
          weather: () => spawn(WeatherMachine, 'weather'),
          switches: () => spawn(SwitchesMachine, 'switches'),
          router: () => spawn(RouterMachine, 'router'),
          vacuums: () => spawn(VacuumsMachine, 'vacuums'),
        }),
        on: {
          NO_PRECIPITATION: {
            actions: [send('POWER_ON', { to: 'wink' })],
          },
          PRECIPITATION: {
            actions: [send('POWER_OFF', { to: 'wink' })],
          },
          TOGGLE_ON: {
            actions: [send('SET_AUTO', { to: 'wink' }), send('DOCK', { to: 'vacuums' })],
          },
          TOGGLE_OFF: {
            actions: [send('SET_ECO', { to: 'wink' }), send('DEPLOY', { to: 'vacuums' })],
          },
        },
      },
    },
  }),
).start();

module.exports = Supervisor;
