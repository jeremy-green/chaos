const Influx = require('influx');

const { datastore } = require('config');

const influx = new Influx.InfluxDB({ ...datastore });

(() => influx.createDatabase('router'))();

function insert(currently) {
  const {
    name, router, location, confidence,
  } = currently;

  return influx.writePoints([
    {
      measurement: 'currently',
      tags: {
        service: 'orbi',
        name,
        location,
        router,
      },
      fields: { confidence },
    },
  ]);
}

module.exports = { insert };
