const fetch = require('node-fetch');

const mocha = require('mocha');
const nock = require('nock');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = require('chai').use(sinonChai);

const sandbox = sinon.createSandbox();
nock('https://api.wink.com')
  .post('/oauth2/token')
  // .delayConnection(1000)
  .reply(200, {
    access_token: 'random',
    refresh_token: 'random',
  });

nock('https://api.wink.com')
  .get('/users/me/wink_devices')
  // .delayConnection(1000)
  .reply(200, { data: [{}] });

const Wink = require('../models/wink');

describe('Wink', () => {
  describe('getDeviceInfo', () => {
    it('should return an object from `getDeviceInfo`', () => {
      const deviceInfo = Wink.getDeviceInfo(
        [
          {},
          {
            uuid: '888e3128-0a52-4c1d-8206-33d708394ffc',
            name: 'The Diplomat',
          },
          {},
        ],
        'The Diplomat',
      );
      expect(deviceInfo).to.be.an('object');
    });
  });

  describe('updateDeviceState', () => {
    it('successfully updates the device state', async () => {
      const fetchStub = sandbox.stub(fetch, 'Promise').returns(
        Promise.resolve({
          status: 204,
          json: () => undefined,
        }),
      );

      await Wink.updateDeviceState('binary_switches', '888e3128-0a52-4c1d-8206-33d708394ffc', {
        powered: true,
      });
      sinon.assert.calledOnce(fetchStub);
      sandbox.restore();
    });
  });
});
