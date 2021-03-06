const {
  Machine, interpret, assign, actions, send,
} = require('xstate');

const Wink = require('../wink');

const eventMap = {
  ECO: 'eco',
  AUTO: 'auto',
};

class Thermostat extends Wink {
  #isReady = false;

  #service = null;

  constructor(name) {
    super();

    this.uuid = null;
    this.name = name;
    this.type = 'thermostats';
    this.readyTimeout = 60000;
  }

  initializeDevice(data) {
    const { uuid } = Wink.getDeviceInfo(data, this.name);

    this.uuid = uuid;
    this.#service = interpret(
      new Machine({
        initial: 'ready',
        context: { ref: this },
        states: {
          ready: {
            on: {
              ECO: 'updating',
              AUTO: 'updating',
            },
          },
          updating: {
            invoke: {
              src: ({ ref: { type, uuid } }, { type: eventType }) => Thermostat.updateDeviceState(type, uuid, { mode: eventMap[eventType] }),
              onDone: { target: 'ready' },
            },
          },
        },
      }),
    ).start();
  }

  async set(e) {
    this.#service.send(e.toUpperCase());
  }

  async ready() {
    if (this.#isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.on('ready', (data) => {
        this.#isReady = true;
        this.initializeDevice(data);
        resolve();
      });

      setTimeout(reject, this.readyTimeout);
    });
  }
}

module.exports = Thermostat;
