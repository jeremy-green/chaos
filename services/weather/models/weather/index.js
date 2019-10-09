const EventEmitter = require('events');

const fetch = require('node-fetch');

const {
  Machine,
  interpret,
  actions: { log },
} = require('xstate');

const { insert } = require('../datastore');

const eventEmitter = new EventEmitter();

class Weather {
  static #service = interpret(
    new Machine(
      {
        id: 'weather',
        initial: 'boot',
        states: {
          boot: {
            on: {
              PRECIPITATION: { target: 'precipitation', actions: ['notify'] },
              NO_PRECIPITATION: { target: 'no_precipitation', actions: ['notify'] },
              REJECTED: { target: 'boot', actions: ['rejected'] },
            },
          },
          no_precipitation: {
            on: {
              PRECIPITATION: { target: 'precipitation', actions: ['notify'] },
              REJECTED: { target: 'no_precipitation', actions: ['rejected'] },
            },
          },
          precipitation: {
            on: {
              NO_PRECIPITATION: { target: 'no_precipitation', actions: ['notify'] },
              REJECTED: { target: 'precipitation', actions: ['rejected'] },
            },
          },
        },
      },
      {
        actions: {
          notify: (context, { status, currently }) => Weather.emit('precipitation', { status, currently }),
          rejected: log((context, event) => ({ context, event })),
        },
      },
    ),
  ).start();

  static update(name, data) {
    this.#service.send(name.toUpperCase(), { ...data });
  }

  static save(data) {
    insert(data);
  }

  static on(...args) {
    eventEmitter.on(...args);
  }

  static emit(name, data) {
    eventEmitter.emit(name, { ...data });
  }

  static call(key, loc) {
    return fetch(`https://api.darksky.net/forecast/${key}/${loc}`).then(res => res.json());
  }
}

module.exports = Weather;
