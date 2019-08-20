const EventEmitter = require('events');
const dns = require('dns');
const vm = require('vm');

const { promisify } = require('util');

const config = require('config');
const fetch = require('node-fetch');

const lookup = promisify(dns.lookup);

const eventEmitter = new EventEmitter();

const {
  routerMap, password, user, confidenceThreshold, sampleSize, defaultInterval,
} = config;

const floorMap = {
  [routerMap.UNKNOWN]: 'unknown',
  [routerMap.UPSTAIRS]: 'upstairs',
  [routerMap.DOWNSTAIRS]: 'downstairs',
  [routerMap.BASEMENT]: 'basement',
  undefined: 'off network',
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
  } catch (e) {
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

async function handleDelivery(e) {
  this.address = await getAddress(this.id);
  this.status = getDeviceStatusByAddress(e, this.address);

  const { conn_orbi_name: router } = this.status;

  if (!this.router) {
    this.router = router;
  }

  this.counter.add(router);
  this.index += 1;

  if (this.index === sampleSize) {
    // get the highest number of occurrences
    const [[highestInstance, highestCount]] = [...Array.from(this.counter.entries())].sort(
      (a, b) => b[1] - a[1],
    );
    const confidence = highestCount / sampleSize;

    console.log(confidence, this.name, this.router, highestInstance);

    this.counter = new Counter([]);
    this.index = 0;

    // @todo ugly, refactor
    if (
      confidence >= confidenceThreshold
      && highestInstance !== this.router
      && highestInstance !== routerMap.UNKNOWN
    ) {
      this.router = highestInstance;
      this.emit('routerchange', {
        router: this.router,
        name: this.name,
        location: floorMap[this.router],
        confidence,
      });
    }
  }
}

function timer(interval) {
  setTimeout(async () => {
    try {
      const authorization = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
      const url = `http://orbilogin.com/DEV_device_info.htm?ts=${Date.now()}`;
      const txt = await fetch(url, {
        headers: { authorization },
      }).then(res => res.text());
      vm.runInThisContext(txt); // defines `device` array
      eventEmitter.emit('delivery', device);
    } catch (e) {
      // console.log(e);
    } finally {
      timer(interval);
    }
  }, interval);
}

class Orbi extends EventEmitter {
  constructor(id, name) {
    super();

    this.id = id;
    this.name = name;
    this.router = null;
    this.status = null;
    this.address = null;

    this.counter = new Counter([]);
    this.index = 0;

    eventEmitter.on('delivery', handleDelivery.bind(this));
  }
}

let init = false;
module.exports = (interval = defaultInterval) => {
  if (!init) {
    init = true;
    timer(interval);
  }

  return Orbi;
};
