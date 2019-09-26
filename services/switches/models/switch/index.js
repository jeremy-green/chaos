const EventEmitter = require('events');

const { Machine, interpret } = require('xstate');

const { machineName } = require('@chaos/functions');

const stateMap = {
  0: 'off',
  1: 'on',
};

const statusMap = {
  [stateMap[0]]: 0,
  [stateMap[1]]: 1,
};

class Switch extends EventEmitter {
  constructor(name, state = 0) {
    super();

    this.name = name;
    this.machineName = machineName(name);

    this.service = interpret(
      new Machine({
        id: `switch-${this.machineName}`,
        initial: stateMap[state],
        context: {},
        states: {
          on: {
            on: {
              TOGGLE: 'off',
            },
          },
          off: {
            on: {
              TOGGLE: 'on',
            },
          },
        },
      }),
    ).start();

    const status = this.service.state.value;
    this.state = statusMap[status];
  }

  handler(state) {
    const { name, service } = this;
    service.send('TOGGLE');

    const status = service.state.value;
    this.state = statusMap[status];
    this.emit('toggle', { status, name, state });
  }

  statusHandler(callback) {
    // allows initial state to be updated via a different service
    callback(this.state);
  }
}

module.exports = Switch;
