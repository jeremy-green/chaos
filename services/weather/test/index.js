const fetch = require('node-fetch');

const mocha = require('mocha');
const nock = require('nock');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = require('chai').use(sinonChai);

// needs to be overriden before the internal times are instantiated
const clock = sinon.useFakeTimers({
  toFake: ['setInterval'],
});

const { Weather: WeatherModel } = require('../models');

const sandbox = sinon.createSandbox();

const currently = {
  metadata: { currentStatus: 'precipitation', statusVal: true },
  time: Date.now() / 1000,
  summary: 'Clear',
  icon: 'clear-day',
  nearestStormDistance: 95,
  nearestStormBearing: 288,
  precipIntensity: 0,
  precipProbability: 0,
  temperature: 82.94,
  apparentTemperature: 84.51,
  dewPoint: 64.42,
  humidity: 0.54,
  pressure: 1010.63,
  windSpeed: 5.46,
  windGust: 5.46,
  windBearing: 318,
  cloudCover: 0.02,
  uvIndex: 4,
  visibility: 10,
  ozone: 318.6,
};

describe('Weather', () => {
  describe('getters', () => {
    before(() => {
      const callStub = sandbox.stub(WeatherModel, 'call').resolves({ currently });
      clock.next();
    });

    afterEach(() => {
      clock.restore();
    });

    after(() => {
      sandbox.restore();
    });

    describe('getStatus', () => {
      it('should return the current status', async () => {
        const status = WeatherModel.getStatus();
        expect(status).to.be.a('string');
      });
    });

    describe('getForecast', () => {
      it('should return the most recent forecast', async () => {
        const forecast = WeatherModel.getForecast();
        expect(forecast).to.be.an('object');
      });
    });

    describe('getCurrently', () => {
      it('should return the most recent `currently` object', async () => {
        const current = WeatherModel.getCurrently();
        expect(current).to.be.an('object');
        expect(current).to.deep.equal(currently);
      });
    });

    describe('getCurrent', () => {
      it('should return a desired property from `currently` object', async () => {
        const apparentTemperature = WeatherModel.getCurrent('apparentTemperature');
        expect(apparentTemperature).to.equal(currently.apparentTemperature);
      });
    });
  });

  describe('on', () => {
    it('should *not* emit an event when the status does not change', async () => {
      const precipProbability = 1;
      const callStub = sandbox.stub(WeatherModel, 'call').resolves({ currently });

      const spy = sinon.spy();
      WeatherModel.on('precipitation', spy);
      clock.next();

      await new Promise(r => setTimeout(r, 500));

      expect(spy).to.have.not.been.called;

      clock.restore();
      sandbox.restore();
    });

    it('should emit an event when the status changes', async () => {
      const precipProbability = 1;
      const callStub = sandbox.stub(WeatherModel, 'call').resolves({
        currently: { ...currently, precipProbability },
      });

      const spy = sinon.spy();
      WeatherModel.on('precipitation', spy);
      clock.next();

      await new Promise(r => setTimeout(r, 500));

      expect(spy).to.have.been.calledWith({ ...currently, precipProbability });

      clock.restore();
      sandbox.restore();
    });
  });

  describe('call', () => {
    it('successfully return JSON from the weather API', async () => {
      const fetchStub = sandbox.stub(fetch, 'Promise').returns(
        Promise.resolve({
          status: 200,
          json: () => ({ currently }),
        }),
      );
      const response = await WeatherModel.call();
      sinon.assert.calledOnce(fetchStub);
      expect(response).to.deep.equal({ currently });
      sandbox.restore();
    });

    it('should be called from within the internal interval', () => {
      const callStub = sandbox.stub(WeatherModel, 'call').resolves({ currently });
      clock.next();
      sinon.assert.calledOnce(callStub);
      clock.restore();
      sandbox.restore();
    });
  });
});
