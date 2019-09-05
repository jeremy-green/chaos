const EventEmitter = require('events');
const dns = require('dns');
const vm = require('vm');

const {
  Machine, interpret, assign, spawn, send,
} = require('xstate');

const { promisify } = require('util');

const config = require('config');
const fetch = require('node-fetch');

const { insert } = require('../datastore');

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
    this.emit('assigned', {
      router: this.router,
      name: this.name,
      location: floorMap[this.router],
      confidence: 1,
    });
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
      this.emit('change', {
        router: this.router,
        name: this.name,
        location: floorMap[this.router],
        confidence,
      });
    }

    await this.save({
      confidence,
      name: this.name,
      router: this.router,
      location: floorMap[this.router],
    });
  }
}

class Orbi extends EventEmitter {
  static async call() {
    const authorization = `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
    const url = `http://orbilogin.com/DEV_device_info.htm?ts=${Date.now()}`;
    return fetch(url, { headers: { authorization } }).then(res => res.text());
  }

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

  save(currently) {
    return insert(currently);
  }
}

const timerService = new Machine(
  {
    id: 'timer-service',
    context: { interval: defaultInterval },
    initial: 'inactive',
    states: {
      inactive: {
        on: {
          ACTIVATE: {
            target: 'waiting',
          },
        },
      },
      waiting: {
        after: {
          INTERVAL: 'loading',
        },
      },
      loading: {
        invoke: {
          async src(context, event) {
            const txt = await Orbi.call();
            vm.runInThisContext(txt); // defines `device` array
            // eslint-disable-next-line no-undef
            eventEmitter.emit('delivery', device);
          },
          onDone: { target: 'waiting' },
          onError: { target: 'waiting' },
        },
      },
    },
  },
  {
    delays: {
      INTERVAL: (context, { payload: interval }) => interval,
    },
  },
);

const initializer = interpret(
  new Machine({
    initial: 'idle',
    context: {},
    states: {
      idle: {
        on: {
          INIT: {
            target: 'ready',
          },
        },
      },
      ready: {
        entry: assign({
          interval: (context, { payload: { interval } }) => interval,
          timer: () => spawn(timerService, 'timer'),
        }),
        type: 'final',
      },
    },
    onDone: {
      actions: [send(({ interval }) => ({ type: 'ACTIVATE', payload: interval }), { to: 'timer' })],
    },
  }),
).start();

module.exports = (interval = defaultInterval) => {
  initializer.send({ type: 'INIT', payload: { interval } });
  return Orbi;
};
