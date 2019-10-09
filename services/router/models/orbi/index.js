const EventEmitter = require('events');
const dns = require('dns');
const vm = require('vm');

const { promisify } = require('util');

const config = require('config');
const fetch = require('node-fetch');

const { Machine, interpret } = require('xstate');

const { insert } = require('../datastore');

const lookup = promisify(dns.lookup);

const eventEmitter = new EventEmitter();

const {
  routerMap, password, user, confidenceThreshold, sampleSize, interval,
} = config;

const floorMap = {
  [routerMap.UNKNOWN]: 'unknown',
  [routerMap.UPSTAIRS]: 'upstairs',
  [routerMap.DOWNSTAIRS]: 'downstairs',
  [routerMap.BASEMENT]: 'basement',
  undefined: 'off_network',
};

// https://stackoverflow.com/questions/17313268/idiomatically-find-the-number-of-occurrences-a-given-value-has-in-an-array
class Counter extends Map {
  constructor(iter, key = null) {
    super();
    this.key = key || (x => x);
    for (const x of iter) {
      this.add(x);
    }
  }

  add(x) {
    x = this.key(x);
    this.set(x, (this.get(x) || 0) + 1);
  }
}

async function getAddress(id) {
  try {
    const { address } = await lookup(id);
    return address;
  } catch {
    return null;
  }
}

function getDeviceStatusByAddress(devices, address) {
  return devices.reduce((acc, curr) => {
    if (curr.ip === address) {
      return { ...curr };
    }
    return acc;
  }, {});
}

class Orbi extends EventEmitter {
  static call() {
    const authorization = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
    const url = `http://orbilogin.com/DEV_device_info.htm?ts=${Date.now()}`;
    return fetch(url, { headers: { authorization } }).then(res => res.text());
  }

  static emit(name, data) {
    eventEmitter.emit(name, data);
  }

  constructor(id, name) {
    super();

    this.id = id;
    this.name = name;

    this.counter = new Counter([]);
    this.index = 0;

    this.service = interpret(
      new Machine({
        id: 'orbi',
        initial: 'unknown',
        context: { confidence: null },
        states: Object.values(floorMap).reduce((acc, curr, index, source) => {
          const excluded = source.filter(item => item !== curr);
          acc[curr] = {
            entry: (context, { router, confidence }) => this.emit('change', {
              name: this.name,
              location: floorMap[router],
              router,
              confidence,
            }),
            on: excluded.reduce((a, c) => {
              c === 'unknown'
                ? (a[c.toUpperCase()] = undefined)
                : (a[c.toUpperCase()] = { target: c });
              return { ...a };
            }, {}),
          };
          return { ...acc };
        }, {}),
      }),
    ).start();

    eventEmitter.on('delivery', devices => this.handleDelivery(devices));
  }

  async handleDelivery(devices) {
    const address = await getAddress(this.id);
    const { conn_orbi_name: router } = getDeviceStatusByAddress(devices, address);

    this.counter.add(router);
    this.index += 1;

    if (this.index === sampleSize) {
      // get the highest number of occurrences
      const [[highestInstance, highestCount]] = [...Array.from(this.counter.entries())].sort(
        (a, b) => b[1] - a[1],
      );
      const confidence = highestCount / sampleSize;

      this.counter = new Counter([]);
      this.index = 0;

      if (confidence >= confidenceThreshold) {
        this.service.send(floorMap[highestInstance].toUpperCase(), { confidence, router });
        console.log(`Current state: ${this.service.state.value} for ${this.name}`);
      }

      await insert({
        name: this.name,
        location: floorMap[router],
        confidence,
        router,
      });
    }
  }
}

module.exports = Orbi;
