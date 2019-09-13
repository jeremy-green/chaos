const EventEmitter = require('events');

const config = require('config');
const fetch = require('node-fetch');
const { Machine, interpret, assign } = require('xstate');

const { insert } = require('../datastore');

const eventEmitter = new EventEmitter();

const {
  apiKey, latlng, maxCallsPerDay, precipProbabilityThreshold,
} = config;

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
          notify(context, { status, currently }) {
            Weather.emit('precipitation', { status, currently });
          },
          rejected(context, event) {
            console.log('rejected', context, event);
          },
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
        date: new Date().getDate(),
        index: maxCallsPerDay,
        status: null,
      },
      initial: 'idle',
      states: {
        idle: {
          after: {
            INTERVAL: 'loading',
          },
        },
        loading: {
          invoke: {
            async src({ date, index }) {
              const { currently } = await Weather.call(apiKey, latlng);
              const { precipProbability } = currently;

              const isPrecipitating = precipProbability > precipProbabilityThreshold;
              const status = isPrecipitating ? 'precipitation' : 'no_precipitation';

              const todaysDate = new Date().getDate();
              const indexDate = date !== todaysDate
                ? { index: maxCallsPerDay, date: todaysDate }
                : { index: index - 1, date };

              console.log(indexDate, currently, status);

              return { ...indexDate, status, currently };
            },
            onDone: {
              target: 'idle',
              actions: [
                assign({
                  index: (context, { data: { index } }) => index,
                  date: (context, { data: { date } }) => date,
                }),
                (context, { data: { status, currently } }) => Weather.update(status, { status, currently }),
                (context, { data: { currently } }) => Weather.save(currently),
              ],
            },
            onError: {
              target: 'idle',
              actions: () => console.log('error'),
            },
          },
        },
      },
    },
    {
      delays: {
        INTERVAL: Math.floor((24 * 60 * 60 * 1000) / maxCallsPerDay),
      },
    },
  ),
).start();

module.exports = Weather;
