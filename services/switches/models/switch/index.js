const EventEmitter = require('events');

const { Machine, interpret } = require('xstate');

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
    // https://gist.github.com/thevangelist/8ff91bac947018c9f3bfaad6487fa149#gistcomment-2986430
    this.machineName = this.name
      .match(/[A-Z]{2,}(?=[A-Z][a-z0-9]*|\b)|[A-Z]?[a-z0-9]*|[A-Z]|[0-9]+/g)
      .filter(Boolean)
      .map(x => x.toLowerCase())
      .join('-');

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
