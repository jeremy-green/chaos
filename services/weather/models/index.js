const config = require('config');

const {
  Machine,
  interpret,
  assign,
  actions: { log },
} = require('xstate');

const Weather = require('./weather');

const precipitationMap = { true: 'precipitation', false: 'no_precipitation' };

const {
  apiKey, latlng, maxCallsPerDay, precipProbabilityThreshold,
} = config;

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

module.exports = { Weather };
