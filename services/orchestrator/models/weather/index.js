const { Machine, sendParent } = require('xstate');

const SocketConnection = require('../socket');

class Weather {
  static #connection = SocketConnection('weather');

  static machine = new Machine({
    id: 'weather',
    initial: 'bootstrap',
    context: {},
    states: {
      bootstrap: {
        invoke: {
          src: () => new Promise(resolve => this.#connection.once('connect', resolve)).then(() => console.log('weather:connect')),
          onDone: { target: 'enabled' },
        },
      },
      enabled: {
        invoke: {
          src: () => new Promise(resolve => this.#connection.once('precipitation', ({ status }) => resolve(status.toUpperCase()))),
          onDone: {
            target: 'enabled',
            actions: [sendParent((context, { data }) => data)],
          },
          onError: {
            target: 'enabled',
            actions: [() => console.log('weather:onError')],
          },
        },
        entry(context, event) {
          console.log('weather:enabled');
        },
      },
    },
  });
}

module.exports = Weather;
