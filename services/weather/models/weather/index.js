const EventEmitter = require('events');

const config = require('config');
const fetch = require('node-fetch');
const { Machine, interpret, assign } = require('xstate');

const { states, actions } = require('./state');

const { insert } = require('../datastore');

const eventEmitter = new EventEmitter();

const {
  apiKey, latlng, maxCallsPerDay, precipProbabilityThreshold,
} = config;

const milliseconds = 1000;
const seconds = 60;
const minutes = 60;
const hours = 24;
const interval = Math.floor((hours * minutes * seconds * milliseconds) / maxCallsPerDay);

class Weather {
  // @todo I don't love this...                              👇
  static #machine = interpret(new Machine({ ...states }, { ...actions(Weather.emit) })).start();

  static update(name, data) {
    this.#machine.send(name.toUpperCase(), { ...data });
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
  new Machine({
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
          [interval]: 'loading',
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
  }),
).start();

module.exports = Weather;
