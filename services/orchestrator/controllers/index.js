const socketController = require('./socket-controller');

const weather = socketController('weather');
const wink = socketController('wink');
const switches = socketController('switches');
const vacuums = socketController('vacuums');
const router = socketController('router');

router.on('connect', () => {
  console.log('router:connect');
  router.on('whatup', d => console.log('whatup', d));
});

vacuums.on('connect', () => {
  console.log('vacuums:connect');
  vacuums.on('hello', d => console.log('hello', d));
});

switches.on('connect', () => {
  console.log('switches:connect');
  switches.on('change', d => console.log('change', d));
});

wink.on('connect', () => {
  console.log('weather:connect');
  weather.on('precipitation', (data) => {
    const { id, metadata } = data;
    const { currentStatus } = metadata;

    if (currentStatus === 'precipitation') {
      wink.emit('power', { devices: ['The Diplomat'], state: 'off', id });
      return;
    }

    wink.emit('power', { devices: ['The Diplomat'], state: 'on', id });
  });
});
