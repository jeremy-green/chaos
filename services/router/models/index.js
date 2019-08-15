const config = require('config');

const { Orbi, floorMap } = require('./orbi')();

const { devices } = config;

(async () => {
  devices.forEach(({ id, name }) => {
    const device = new Orbi(id);
    device.on('routerchange', (e) => {
      console.log(`\n${name} (${id}) is ${floorMap[e]}`, new Date());
    });
  });
})();
