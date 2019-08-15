const EventEmitter = require('events');
const dns = require('dns');
const vm = require('vm');

const { promisify } = require('util');

const config = require('config');
const fetch = require('node-fetch');

const lookup = promisify(dns.lookup);

const eventEmitter = new EventEmitter();

const { routerMap, password, user } = config;

const floorMap = {
  [routerMap.UNKNOWN]: 'unknown',
  [routerMap.UPSTAIRS]: 'upstairs',
  [routerMap.DOWNSTAIRS]: 'downstairs',
  [routerMap.BASEMENT]: 'basement',
  undefined: 'off network',
};

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

  if (router !== this.router && router !== routerMap.UNKNOWN) {
    this.router = router;
    this.emit('routerchange', this.router);
  }
}

function timer(interval) {
  setTimeout(async () => {
    try {
      const url = `http://${user}:${pass}@orbilogin.com/DEV_device_info.htm?ts=${Date.now()}`;
      const txt = await fetch(url).then(res => res.text());
      vm.runInThisContext(txt); // defines `device` array
      eventEmitter.emit('delivery', device);
    } catch (e) {
      /* noop */
    } finally {
      timer(interval);
    }
  }, interval);
}

class Orbi extends EventEmitter {
  constructor(id) {
    super();

    this.id = id;
    this.router = null;
    this.status = null;
    this.address = null;

    eventEmitter.on('delivery', handleDelivery.bind(this));
  }
}

let init = false;
module.exports = (interval = 5000) => {
  if (!init) {
    init = true;
    timer(interval);
  }

  return { Orbi, routerMap, floorMap };
};
