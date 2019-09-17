const EventEmitter = require('events');

const config = require('config');
const fetch = require('node-fetch');

const { Machine, interpret } = require('xstate');

const credentials = config.get('credentials');

const eventEmitter = new EventEmitter();

class Wink extends EventEmitter {
  static accessToken;

  constructor() {
    super();

    eventEmitter.on('data', data => this.emit('ready', data));
  }

  static setAccessToken(accessToken) {
    Wink.accessToken = accessToken;
  }

  static getDeviceInfo(data, deviceName) {
    const [deviceInfo] = data.filter(({ name }) => name === deviceName);
    return deviceInfo;
  }

  static updateDeviceState(deviceType, deviceId, desiredState) {
    return fetch(`https://api.wink.com/${deviceType}/${deviceId}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${Wink.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ desired_state: desiredState }),
    }).then(response => response.json());
  }
}

interpret(
  new Machine({
    id: 'initializer',
    initial: 'getToken',
    context: { ...credentials },
    states: {
      getToken: {
        invoke: {
          src: ({
            clientId, clientSecret, grantType, refreshToken,
          }) => fetch('https://api.wink.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: grantType,
              refresh_token: refreshToken,
            }),
          }).then(r => r.json()),
          onDone: {
            target: 'getDevices',
            actions: [
              (context, { data: { access_token: accessToken } }) => Wink.setAccessToken(accessToken),
            ],
          },
          onError: { target: 'getToken' },
        },
      },
      getDevices: {
        invoke: {
          src: (context, { data: { access_token: accessToken } }) => fetch('https://api.wink.com/users/me/wink_devices', {
            headers: { authorization: `Bearer ${accessToken}` },
          }).then(response => response.json()),
          onDone: { target: 'ready' },
          onError: { target: 'getDevices' },
        },
      },
      ready: {
        entry: [(context, { data: { data } }) => eventEmitter.emit('data', [...data])],
        type: 'final',
      },
    },
  }),
).start();

module.exports = Wink;
