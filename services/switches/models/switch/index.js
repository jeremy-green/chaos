const EventEmitter = require('events');

const stateMap = {
  0: 'off',
  1: 'on',
};

class Switch extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.state = 1;
    this.status = stateMap[this.state];
  }

  handler(action) {
    const status = stateMap[action];
    this.status = status;
    this.state = action;

    this.emit('change', { status, action, name: this.name });
  }

  // statusHandler(callback) {
  //   console.log(`${this.name}: ${this.status}`);
  //   callback();
  // }
}

module.exports = Switch;
