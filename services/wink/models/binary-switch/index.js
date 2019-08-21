const { Machine, interpret } = require('xstate');

const Wink = require('../wink');

const { stateMap: binaryStateMap, machine: binaryMachine, getLoadingState } = require('./state');

class BinarySwitch extends Wink {
  constructor(name) {
    super();

    this.name = name;
    this.type = 'binary_switches';
    this.uuid = null;
    this.isReady = false;
    this.readyTimeout = 60000;
  }

  initializeDevice(data) {
    const deviceInfo = Wink.getDeviceInfo(data, this.name);
    // console.log(deviceInfo);
    const {
      uuid,
      desired_state: { powered },
    } = deviceInfo;

    this.uuid = uuid;

    const initial = powered === true ? 'up' : 'down';
    const context = { ref: this, deviceInfo };
    const src = (_context, event) => Wink.updateDeviceState(_context.ref.type, _context.ref.uuid, {
      powered: binaryStateMap[event.type],
    });
    const offLoading = getLoadingState('down', 'up', src);
    const onLoading = getLoadingState('up', 'down', src);
    binaryMachine.states = {
      ...binaryMachine.states,
      offLoading,
      onLoading,
    };

    this.machine = Machine({
      ...binaryMachine,
      initial,
      context,
    });

    this.service = interpret(this.machine).start();
  }

  async turn(e) {
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

module.exports = BinarySwitch;
