const backoff = require('backoff');
const config = require('config');
const nodeMachineId = require('node-machine-id');
const sucks = require('sucks');

const Reattempt = require('reattempt').default;

const { EcoVacsAPI, VacBot } = sucks;

const {
  continent, country, email, password, nickname, times, delay, batterTolerance,
} = config;

const device_id = EcoVacsAPI.md5(nodeMachineId.machineIdSync());
const api = new EcoVacsAPI(device_id, country, continent);

const accountId = email;
const passwordHash = EcoVacsAPI.md5(password);

const exponentialBackoff = backoff.exponential({ initialDelay: 60000, maxDelay: 60 * 60000 });
exponentialBackoff.failAfter(times);

let batteryRemaining;
(async () => {
  try {
    await Reattempt.run(
      { times: Infinity, delay },
      async () => await api.connect(accountId, passwordHash),
    );

    const devices = await api.devices();

    console.log('devices', devices);

    const [vacuum] = devices.filter(({ nick }) => nick === nickname);
    const vacbot = new VacBot(
      api.uid,
      EcoVacsAPI.REALM,
      api.resource,
      api.user_access_token,
      vacuum,
      continent,
    );

    const handleError = (e) => {
      console.log('handleError', e);

      const { errno } = e;
      if (errno === '109') {
        vacbot.removeListener('error', handleError);
        handleVac(vacbot);
      }
    };

    vacbot.on('error', handleError);

    vacbot.on('ready', (e) => {
      console.log('ready', e);
    });

    vacbot.on('CleanReport', e => console.log(e));

    // vacbot.on('stanza', e => {
    //   console.log('stanza', JSON.stringify(e, null, 4));
    // });

    vacbot.on('BatteryInfo', (battery) => {
      batteryRemaining = Math.round(battery * 100);
      console.log('Battery level: %d%', batteryRemaining);
    });

    vacbot.on('closed', () => {
      console.log('closed');
      vacbot.connect_and_wait_until_ready();
    });

    vacbot.connect_and_wait_until_ready();
  } catch (e) {
    console.log(e);
  }
})();

async function handleVac(vacbot) {
  console.log('handleVac');

  try {
    await Reattempt.run({ times }, () => {
      console.log('Reattempt...');

      return new Promise((resolve, reject) => {
        const handleCharging = (e) => {
          console.log('ChargeState', e);

          if (e === 'charging') {
            exponentialBackoff.reset();
            resolve(e);
          }
        };

        vacbot.removeListener('ChargeState', handleCharging).on('ChargeState', handleCharging);

        const handleError = (e) => {
          console.log('reattempt:error', e);

          const { errno } = e;
          if (errno === '109') {
            vacbot.removeListener('error', handleError);
            reject(e);
          }
        };

        vacbot.on('error', handleError);
        setTimeout(() => {
          let state = 'clean';

          // TODO: needs more thinking through...
          if (batteryRemaining <= batterTolerance) {
            console.log(`low battery: ${batteryRemaining}...`);
            state = 'charge';
          }

          vacbot.run(state);
        }, 2000);
      });
    });
  } catch (e) {
    console.log('exponentialBackoff:error', e);

    exponentialBackoff.once('ready', () => {
      console.log('exponentialBackoff:ready');

      handleVac(vacbot);
    });

    exponentialBackoff.once('fail', () => {
      console.log('exponentialBackoff:fail');
    });

    exponentialBackoff.once('backoff', () => {
      console.log('exponentialBackoff:backoff');
    });

    exponentialBackoff.backoff();
  }
}
