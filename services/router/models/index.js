const vm = require('vm');

const config = require('config');

const { Machine, interpret } = require('xstate');

const Orbi = require('./orbi');

const { devices, interval } = config;

interpret(
  new Machine({
    initial: 'waiting',
    states: {
      waiting: {
        after: {
          [interval]: 'loading',
        },
      },
      loading: {
        invoke: {
          async src(context, event) {
            const txt = await Orbi.call();
            vm.runInThisContext(txt); // defines `device` array
            // eslint-disable-next-line no-undef
            Orbi.emit('delivery', device);
          },
          onDone: { target: 'waiting' },
          onError: { target: 'waiting', actions: (context, event) => console.log(event) },
        },
      },
    },
  }),
).start();

module.exports = devices.map(({ id, name }) => new Orbi(id, name));
