const { Machine, interpret, assign } = require('xstate');

const Wink = require('../wink');

const stateMap = {
  ON: true,
  OFF: false,
};

class BinarySwitch extends Wink {
  #isReady = false;

  #service = null;

  constructor(name) {
    super();

    this.uuid = null;
    this.name = name;
    this.type = 'binary_switches';
    this.readyTimeout = 60000;
  }

  initializeDevice(data) {
    const deviceInfo = Wink.getDeviceInfo(data, this.name);
    const { uuid } = deviceInfo;

    this.uuid = uuid;
    this.#service = interpret(
      new Machine({
        id: 'binary-switch',
        initial: 'ready',
        context: {
          ref: this,
          deviceInfo,
        },
        states: {
          ready: {
            on: {
              OFF: 'loading',
              ON: 'loading',
            },
          },
          loading: {
            invoke: {
              src: ({ ref }, event) => Wink.updateDeviceState(ref.type, ref.uuid, {
                powered: stateMap[event.type],
              }),
            },
            onDone: {
              target: 'ready',
              actions: assign({ deviceInfo: (context, event) => event.data }),
            },
          },
        },
      }),
    ).start();
  }

  async turn(e) {
    this.#service.send(e.toUpperCase());
  }

  async ready() {
    if (this.#isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.once('ready', (data) => {
        this.#isReady = true;
        this.initializeDevice(data);
        resolve();
      });

      setTimeout(reject, this.readyTimeout);
    });
  }
}

module.exports = BinarySwitch;
