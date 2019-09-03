const { Machine } = require('xstate');

const SocketConnection = require('../socket');

class Wink {
  static #connection = SocketConnection('wink');

  static machine = new Machine(
    {
      id: 'wink',
      initial: 'bootstrap',
      context: {
        POWER_ON: { state: 'on' },
        POWER_OFF: { state: 'off' },
        SET_AUTO: { state: 'auto' },
        SET_ECO: { state: 'eco' },
      },
      states: {
        bootstrap: {
          invoke: {
            src: () => new Promise(resolve => this.#connection.once('connect', () => resolve())).then(() => console.log('wink:connect')),
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
        power: (context, { type, data }) => {
          const { state } = context[type];
          this.#connection.emit('power', { state });
        },
        change: (context, { type }) => {
          const { state } = context[type];
          this.#connection.emit('update', { state });
        },
      },
    },
  );
}

module.exports = Wink;
