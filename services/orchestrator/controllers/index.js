const socketController = require('./socket-controller');

const weather = socketController('weather');
const wink = socketController('wink');
const switches = socketController('switches');
const vacuums = socketController('vacuums');
const router = socketController('router');

router
  .on('connect', () => console.log('router:connect'))
  .on('routerchange', d => console.log('routerchange', d));

vacuums
  .on('connect', () => console.log('vacuums:connect'))
  .on('hello', d => console.log('hello', d));

switches
  .on('connect', () => console.log('switches:connect'))
  .on('change', d => console.log('change', d));

wink.on('connect', () => console.log('wink:connect'));

weather
  .on('connect', () => console.log('weather:connect'))
  .on('precipitation', (data) => {
    const { id, metadata } = data;
    const { currentStatus } = metadata;

    if (currentStatus === 'precipitation') {
      wink.emit('power', { devices: ['The Diplomat', 'Patio'], state: 'off', id });
      return;
    }

    wink.emit('power', { devices: ['The Diplomat'], state: 'on', id });
  });
