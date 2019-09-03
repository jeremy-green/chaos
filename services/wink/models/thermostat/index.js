const {
  Machine, interpret, assign, actions, send,
} = require('xstate');

const Wink = require('../wink');

const eventMap = {
  ECO: 'eco',
  AUTO: 'auto',
};

function entry({ ref }, { type }) {
  const mode = eventMap[type];
  return Thermostat.updateDeviceState(ref.type, ref.uuid, { mode });
}

class Thermostat extends Wink {
  constructor(name) {
    super();

    this.name = name;
    this.type = 'thermostats';
    this.uuid = null;
    this.isReady = false;
    this.readyTimeout = 60000;
  }

  initializeDevice(data) {
    const deviceInfo = Wink.getDeviceInfo(data, this.name);
    const {
      uuid,
      desired_state: { mode },
    } = deviceInfo;

    this.uuid = uuid;

    this.machine = Machine({
      initial: 'ready',
      context: { ref: this, deviceInfo },
      states: {
        ready: {
          on: {
            ECO: {
              target: 'updating',
            },
            AUTO: {
              target: 'updating',
            },
          },
        },
        updating: {
          invoke: {
            src({ ref }, { type }) {
              const mode = eventMap[type];
              return Thermostat.updateDeviceState(ref.type, ref.uuid, { mode: eventMap[type] });
            },
            onDone: {
              target: 'ready',
              actions: [assign({ deviceInfo: (context, event) => event.data })],
            },
          },
        },
      },
    });

    this.service = interpret(this.machine).start();
    this.set(mode);
  }

  async set(e) {
    this.service.send(e.toUpperCase());
  }

  async ready() {
    if (this.isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.on('ready', (data) => {
        this.isReady = true;
        this.initializeDevice(data);
        resolve();
      });

      setTimeout(reject, this.readyTimeout);
    });
  }
}

module.exports = Thermostat;
