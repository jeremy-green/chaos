const Influx = require('influx');

const { datastore } = require('config');

const influx = new Influx.InfluxDB({ ...datastore });

(() => influx.createDatabase('weather'))();

function insert(currently) {
  const {
    time,
    nearestStormDistance = 0.0,
    nearestStormBearing = 0.0,
    precipIntensityError = 0.0,
    precipType = '',
    ...remainingProperties
  } = currently;

  return influx.writePoints([
    {
      measurement: 'currently',
      tags: { service: 'darksky' },
      fields: {
        nearestStormDistance,
        nearestStormBearing,
        precipIntensityError,
        precipType,
        ...remainingProperties,
      },
    },
  ]);
}

module.exports = { insert };
