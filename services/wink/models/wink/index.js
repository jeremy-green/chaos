const EventEmitter = require('events');

const config = require('config');
const fetch = require('node-fetch');

const {
  client_id, client_secret, grant_type, refresh_token,
} = config;

const eventEmitter = new EventEmitter();

let accessToken;
let refreshToken;
async function init() {
  ({ access_token: accessToken, refresh_token: refreshToken } = await fetch(
    'https://api.wink.com/oauth2/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        grant_type,
        refresh_token,
      }),
    },
  ).then(r => r.json()));

  const { data, errors } = await fetch('https://api.wink.com/users/me/wink_devices', {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  }).then(response => response.json());
  eventEmitter.emit('data', [...data]);
}

class Wink extends EventEmitter {
  constructor() {
    super();

    eventEmitter.on('data', data => this.emit('ready', data));
  }

  static getDeviceInfo(data, deviceName) {
    const [deviceInfo] = data.filter(({ name }) => name === deviceName);
    return deviceInfo;
  }

  static updateDeviceState(deviceType, deviceId, desiredState) {
    return fetch(`https://api.wink.com/${deviceType}/${deviceId}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ desired_state: desiredState }),
    }).then(response => response.json());
  }
}

init();

module.exports = Wink;
