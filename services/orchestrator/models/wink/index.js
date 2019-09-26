const { Machine } = require('xstate');

const SocketConnection = require('../socket');

class Wink {
  static #connection = SocketConnection('wink');

  static machine = new Machine(
    {
      id: 'wink',
      initial: 'bootstrap',
      context: {
        POWER_ON: 'on',
        POWER_OFF: 'off',
        SET_AUTO: 'auto',
        SET_ECO: 'eco',
      },
      states: {
        bootstrap: {
          invoke: {
            src: () => new Promise(resolve => this.#connection.once('connect', resolve)).then(() => console.log('wink:connect')),
            onDone: {
              target: 'enabled',
            },
          },
        },
        enabled: {
          on: {
            POWER_ON: { actions: ['power'] },
            POWER_OFF: { actions: ['power'] },
            SET_AUTO: { actions: ['change'] },
            SET_ECO: { actions: ['change'] },
          },
          entry() {
            console.log('wink:enabled');
          },
        },
      },
    },
    {
      actions: {
        power: (context, { type }) => this.#connection.emit('power', { state: context[type] }),
        change: (context, { type }) => this.#connection.emit('update', { state: context[type] }),
      },
    },
  );
}

module.exports = Wink;
