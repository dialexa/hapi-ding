'use strict';

const Lab = require('lab');
const Hapi = require('hapi');

const lab = exports.lab = Lab.script();
const beforeEach = lab.beforeEach;
const afterEach = lab.afterEach;
const describe = lab.experiment;
const it = lab.test;
const expect = require('code').expect;

describe('Registration', () => {
  let server;

  beforeEach(() => {
    server = Hapi.Server({ });
  });

  it('should register', async () => {
    await server.register({ plugin: require('../') });
    const table = server.table();
    expect(table).to.have.length(1);
  });

  it('should let you set the path', async () => {
    await server.register({ plugin: require('../'), options: { path: '/api/v1/new_ping' } });
    const table = server.table();
    const [route] = table;
    expect(route.path).to.equal('/api/v1/new_ping');
  });

  it('should let you set otherData', async () => {
    await server.register({ plugin: require('../'), options: { otherData: { foo: 'bar' } } });
    const table = server.table();
    const [route] = table;
    expect(route.path).to.equal('/ding');
  });

  it('should let you set config options', async () => {
    await server.register({ plugin: require('../'), options: { config: { description: 'Custom Hapi Ding' } } });
    const table = server.table();
    const [route] = table;
    expect(route.settings.description).to.equal('Custom Hapi Ding');
  });

  it('should not let you set unknown options', async () => {
    try {
      await server.register({ plugin: require('../'), options: { badName: { foo: 'bar' } } });
    } catch (err) {
      expect(err).to.be.an.object();
      expect(err.name).to.equal('ValidationError');
      expect(err.details[0].message).to.include('badName');
    }
  });

  describe('Default /ding response', () => {
    beforeEach(async () => {
      server = Hapi.Server({ });
      await server.register({ plugin: require('../') });
    });

    it('should reply with cpu', async () => {
      const { result, statusCode } = await server.inject('/ding');
      expect(result).to.be.an.object();
      expect(result.ding).to.be.an.object();
      expect(result.ding.cpu).to.be.an.array();
      expect(result.ding.cpu).to.have.length(3);
      expect(result.ding.cpu[0]).to.be.a.number();
      expect(statusCode).to.equal(200);
    });

    it('should reply with mem', async () => {
      const { result, statusCode } = await server.inject('/ding');
      expect(result.ding).to.be.an.object();
      expect(result.ding.mem).to.be.a.number();
      expect(statusCode).to.equal(200);
    });

    it('should reply with time', async () => {
      const { result, statusCode } = await server.inject('/ding');
      expect(result.ding).to.be.an.object();
      expect(result.ding.time).to.be.a.number();
      expect(statusCode).to.equal(200);
    });
  });

  describe('Hapi load reporting', () => {
    beforeEach(async () => {
      server = Hapi.Server({ load: { sampleInterval: 1000 } });
      await server.register({ plugin: require('../') });
      await server.start();
    });

    afterEach(async () => {
      await server.stop();
    });

    it('should reply with heapUsed', async () => {
      const fakeHeapUsed = 100000;
      server.settings.load.heapUsed = fakeHeapUsed;

      const { result } = await server.inject('/ding');
      expect(result.ding).to.be.an.object();
      expect(result.ding.heap).to.be.a.number();
      expect(result.ding.heap).to.equal(fakeHeapUsed);
    });

    it('should reply with eventLoopDelay', async () => {
      const fakeEventLoopDelay = 1.34;
      server.settings.load.eventLoopDelay = fakeEventLoopDelay;

      const { result } = await server.inject('/ding');
      expect(result.ding).to.be.an.object();
      expect(result.ding.loop).to.be.a.number();
      expect(result.ding.loop).to.equal(1.34);
    });

    it('should not reply with heap or loop if the server does not have the load settings', async () => {
      const { result } = await server.inject('/ding');
      expect(result.ding).to.be.an.object();
      expect(result.ding.loop).to.be.undefined();
      expect(result.ding.heap).to.be.undefined();
    });
  });

  describe('Custom /ding response', () => {
    beforeEach(() => {
      server = Hapi.Server({ });
    });

    it('should reply with given other data', async () => {
      await server.register({ plugin: require('../'), options: { otherData: { version: '1.2.3' } } });
      const { result } = await server.inject('/ding');
      expect(result.ding).to.be.an.object();
      expect(result.ding.version).to.be.an.string();
      expect(result.ding.version).to.equal('1.2.3');
    });

    it('should reply without objectName', async () => {
      await server.register({ plugin: require('../'), options: { objectName: false } });
      const { result } = await server.inject('/ding');
      expect(result).to.be.an.object();
      expect(result.ding).to.be.undefined();
      expect(result.mem).to.be.a.number();
    });
  });

  it('should reply with a specific objectName', async () => {
    await server.register({ plugin: require('../'), options: { objectName: 'foo' } });
    const { result } = await server.inject('/ding');
    expect(result).to.be.an.object();
    expect(result.ding).to.be.undefined();
    expect(result.foo).to.be.an.object();
    expect(result.foo.mem).to.be.a.number();
  });
});
