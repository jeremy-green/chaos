const { Machine, sendParent } = require('xstate');

const SocketConnection = require('../socket');

class Vacuums {
  static #connection = SocketConnection('vacuums');

  static machine = new Machine(
    {
      id: 'vacuums',
      initial: 'bootstrap',
      context: {
        DEPLOY: { state: 'on' },
        DOCK: { state: 'off' },
      },
      states: {
        bootstrap: {
          invoke: {
            src: () => new Promise(resolve => this.#connection.once('connect', () => resolve())).then(() => console.log('vacuums:connect')),
            onDone: { target: 'enabled' },
          },
        },
        enabled: {
          on: {
            DOCK: { actions: ['command'] },
            DEPLOY: { actions: ['command'] },
          },
          entry() {
            console.log('vacuums:enabled');
          },
        },
      },
    },
    {
      actions: {
        command: (context, { type, data }) => {
          const { state } = context[type];
          this.#connection.emit('command', { state });
        },
      },
    },
  );
}

module.exports = Vacuums;
