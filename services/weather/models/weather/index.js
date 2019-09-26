const EventEmitter = require('events');

const config = require('config');
const fetch = require('node-fetch');

const {
  Machine, interpret, assign, actions,
} = require('xstate');

const { insert } = require('../datastore');

const { log } = actions;

const precipitationMap = { true: 'precipitation', false: 'no_precipitation' };

const {
  apiKey, latlng, maxCallsPerDay, precipProbabilityThreshold,
} = config;

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

interpret(
  new Machine(
    {
      id: 'service',
      context: {
        status: null,
      },
      initial: 'wait',
      states: {
        wait: {
          after: {
            INTERVAL: 'load',
          },
        },
        load: {
          invoke: {
            src: () => Weather.call(apiKey, latlng),
            onDone: { target: 'update', actions: ['updateStatus', 'logResponse'] },
            onError: { target: 'wait', actions: ['logError'] },
          },
        },
        update: {
          on: {
            '': {
              target: 'wait',
              actions: ['sendStatusUpdate', 'saveResponse'],
            },
          },
        },
      },
    },
    {
      actions: {
        sendStatusUpdate: ({ status }, { data: { currently } }) => Weather.update(status, { status, currently }),
        saveResponse: (context, { data: { currently } }) => Weather.save(currently),
        logResponse: log(({ status }, { data: { currently } }) => ({ status, currently })),
        logError: log((context, event) => ({ context, event })),
        updateStatus: assign({
          status: (
            context,
            {
              data: {
                currently: { precipProbability },
              },
            },
          ) => precipitationMap[precipProbability >= precipProbabilityThreshold],
        }),
      },
      delays: {
        INTERVAL: Math.floor((24 * 60 * 60 * 1000) / maxCallsPerDay),
      },
    },
  ),
).start();

module.exports = Weather;
