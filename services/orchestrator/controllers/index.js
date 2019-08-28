const SocketConnection = require('./socket');

const weather = SocketConnection('weather');
const wink = SocketConnection('wink');
const switches = SocketConnection('switches');
const vacuums = SocketConnection('vacuums');
const router = SocketConnection('router');
const database = SocketConnection('database');

router
  .on('connect', () => console.log('router:connect'))
  //   // assign initial state of Alexa virtual switches based on router lookup
  //   .on('assigned', (data) => {
  //     const { name, id, location } = data;
  //
  //     let state = 1;
  //     if (location === 'off network') {
  //       state = 0;
  //     }
  //
  //     switches.emit('change', { name, id, state });
  //   })
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
    const { id, status, currently } = data;

    const devices = ['The Diplomat'];

    let state = 'on';
    if (status === 'precipitation') {
      devices.push('Patio');
      state = 'off';
    }

    wink.emit('power', { devices, state, id });
  });
