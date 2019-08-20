const EventEmitter = require('events');

const config = require('config');
const fetch = require('node-fetch');

const eventEmitter = new EventEmitter();

const {
  apiKey, latlng, maxCallsPerDay, precipProbabilityThreshold,
} = config;

const milliseconds = 1000;
const seconds = 60;
const minutes = 60;
const hours = 24;
const interval = Math.floor((hours * minutes * seconds * milliseconds) / maxCallsPerDay);

let today = new Date();
let index = maxCallsPerDay;
let currently;
let status;
let forecast;

class Weather {
  static on(...args) {
    eventEmitter.on(...args);
  }

  static call(key, loc) {
    return fetch(`https://api.darksky.net/forecast/${key}/${loc}`).then(res => res.json());
  }

  static getStatus() {
    return status;
  }

  static getForecast() {
    return forecast;
  }

  static getCurrent(prop) {
    return currently[prop];
  }

  static getCurrently() {
    return currently;
  }
}

setInterval(async () => {
  // reset maxCallsPerDay after midnight
  const time = new Date();
  if (time.getDate() !== today.getDate()) {
    index = maxCallsPerDay;
    today = time;
  }

  forecast = await Weather.call(apiKey, latlng);
  ({ currently } = forecast);

  // console.log(index);
  // console.log(currently);

  const { precipProbability } = currently;
  let currentStatus = 'no_precipitation';
  let statusVal = false;

  if (precipProbability > precipProbabilityThreshold) {
    currentStatus = 'precipitation';
    statusVal = true;
  }

  if (currentStatus !== status) {
    status = currentStatus;
    eventEmitter.emit('precipitation', {
      metadata: { currentStatus, statusVal },
      ...currently,
    });
  }

  index -= 1;
}, interval);

module.exports = Weather;
