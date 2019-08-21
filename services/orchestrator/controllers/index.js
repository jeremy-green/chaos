const socketController = require('./socket-controller');

const weather = socketController('weather');
const wink = socketController('wink');
const switches = socketController('switches');
const vacuums = socketController('vacuums');
const router = socketController('router');

router
  .on('connect', () => console.log('router:connect'))
  // assign initial state of Alexa virtual switches
  .on('assigned', (data) => {
    const { name, id, location } = data;

    let state = 1;
    if (location === 'off network') {
      state = 0;
    }

    switches.emit('change', { name, id, state });
  })
  .on('change', d => console.log('change', d));

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
    const { id, currentStatus } = data;

    const devices = ['The Diplomat'];

    let state = 'on';
    if (currentStatus === 'precipitation') {
      devices.push('Patio');
      state = 'off';
    }

    wink.emit('power', { devices, state, id });
  });
