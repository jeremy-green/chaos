const { Machine } = require('xstate');

const SocketConnection = require('../socket');

class Router {
  static #connection = SocketConnection('router');

  static machine = new Machine({
    id: 'router',
    initial: 'bootstrap',
    context: {},
    states: {
      bootstrap: {
        invoke: {
          src: () => new Promise(resolve => this.#connection.once('connect', resolve)).then(() => console.log('router:connect')),
          onDone: { target: 'enabled' },
        },
      },
      enabled: {
        invoke: {
          src: () => new Promise(resolve => this.#connection.once('change', resolve)),
          onDone: {
            target: 'enabled',
            actions: [(context, event) => console.log(context, event)],
          },
          onError: {
            target: 'enabled',
            actions: [() => console.log('router:onError')],
          },
        },
        entry(context, event) {
          console.log('router:enabled');
        },
      },
    },
  });
}

module.exports = Router;
