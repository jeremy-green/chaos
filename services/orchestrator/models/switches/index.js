const { Machine, sendParent } = require('xstate');

const SocketConnection = require('../socket');

class Switches {
  static #connection = SocketConnection('switches');

  static machine = new Machine({
    id: 'switches',
    initial: 'bootstrap',
    context: {},
    states: {
      bootstrap: {
        invoke: {
          src: () => new Promise(resolve => this.#connection.once('connect', resolve)).then(() => console.log('switches:connect')),
          onDone: { target: 'enabled' },
        },
      },
      enabled: {
        invoke: {
          src: () => new Promise(resolve => this.#connection.once('toggle', ({ status }) => resolve(`TOGGLE_${status.toUpperCase()}`))),
          onDone: {
            target: 'enabled',
            actions: [sendParent((context, { data }) => data)],
          },
          onError: {
            target: 'enabled',
            actions: [() => console.log('switches:onError')],
          },
        },
        entry(context, event) {
          console.log('switches:enabled');
        },
      },
    },
  });
}

module.exports = Switches;
