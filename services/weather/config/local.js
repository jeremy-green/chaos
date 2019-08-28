const Influx = require('influx');

module.exports = {
  maxCallsPerDay: 999,
  apiKey: '5a9574c1a2b7e1d742198fe42a741a92',
  latlng: '38.790218,-77.079434',
  precipProbabilityThreshold: 0.95,
  datastore: {
    host: '192.168.1.8',
    database: 'weather',
    schema: [
      {
        measurement: 'currently',
        fields: {
          summary: Influx.FieldType.STRING,
          icon: Influx.FieldType.STRING,
          nearestStormDistance: Influx.FieldType.FLOAT,
          nearestStormBearing: Influx.FieldType.FLOAT,
          precipIntensity: Influx.FieldType.FLOAT,
          precipProbability: Influx.FieldType.FLOAT,
          precipIntensityError: Influx.FieldType.FLOAT,
          precipType: Influx.FieldType.STRING,
          temperature: Influx.FieldType.FLOAT,
          apparentTemperature: Influx.FieldType.FLOAT,
          dewPoint: Influx.FieldType.FLOAT,
          humidity: Influx.FieldType.FLOAT,
          pressure: Influx.FieldType.FLOAT,
          windSpeed: Influx.FieldType.FLOAT,
          windGust: Influx.FieldType.FLOAT,
          windBearing: Influx.FieldType.FLOAT,
          cloudCover: Influx.FieldType.FLOAT,
          uvIndex: Influx.FieldType.INTEGER,
          visibility: Influx.FieldType.FLOAT,
          ozone: Influx.FieldType.FLOAT,
        },
        tags: ['service'],
      },
    ],
  },
};
