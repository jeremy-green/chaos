const SocketConnection = require('./socket');

const Supervisor = require('../models');

const vacuums = SocketConnection('vacuums');
// const router = SocketConnection('router');

// router
//   .on('connect', () => console.log('router:connect'))
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
// .on('change', d => console.log('change', d));

vacuums
  .on('connect', () => console.log('vacuums:connect'))
  .on('hello', d => console.log('hello', d));
