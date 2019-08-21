const EventEmitter = require('events');

const stateMap = {
  0: 'off',
  1: 'on',
};

class Switch extends EventEmitter {
  constructor(name, state) {
    super();
    this.name = name;
    this.state = state;
    this.status = stateMap[this.state];
  }

  handler(state) {
    this.state = state;
    this.status = stateMap[this.state];

    const { status, name } = this;
    this.emit('change', { status, name, state });
  }

  statusHandler(callback) {
    // allows initial state to be updated via a different service
    callback(this.state);
  }
}

module.exports = Switch;
