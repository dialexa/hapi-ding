'use strict';

const Lab = require('lab');
const Hapi = require('hapi');

const lab = exports.lab = Lab.script();
const beforeEach = lab.beforeEach;
const describe = lab.experiment;
const it = lab.test;
const expect = require('code').expect;

describe('Registration', () => {
  let server;

  beforeEach(() => {
    server = Hapi.Server({ host: 'test' });
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
      expect(err.ValidationError).to.include('badName');
    }
  });

  describe('Default /ding response', () => {
    beforeEach(async () => {
      server = Hapi.Server({ host: 'test' });
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

  describe.only('Hapi load reporting', () => {
    it('should reply with heap', async () => {
      server = Hapi.Server({ load: { sampleInterval: 1000 }, host: 'test' });

      await server.register({ plugin: require('../') });
      console.log(server);
      server.load.heapUsed = 100000;
      // server.connections[0]._load.check = function () { return false; };

      const { result } = await server.inject('/ding');
      expect(result.ding).to.be.an.object();
      expect(result.ding.heap).to.be.a.number();
      expect(result.ding.heap).to.equal(100000);
    });

    it('should reply with heap', async () => {
      server = Hapi.Server({ load: { sampleInterval: 1000 }, host: 'test' });

      await server.register({ plugin: require('../') });

      server.connections[0]._load._process.load.eventLoopDelay = 1.34;
      server.connections[0]._load.check = function () { return false; };

      const { result } = await server.inject('/ding');
      expect(result.ding).to.be.an.object();
      expect(result.ding.loop).to.be.a.number();
      expect(result.ding.loop).to.equal(1.34);
    });

    // it('should not reply with heap or loop if the server does not have the load settings', (done) => {
    //   const server = new Hapi.Server().connection({ host: 'test' });

    //   server.register({ register: require('../') }, () => {
    //     server.connections[0]._load._process.load.eventLoopDelay = 1.34;
    //     server.connections[0]._load.check = function () { return false; };
    //     server.inject('/ding', (res) => {
    //       expect(res.result.ding).to.be.an.object();
    //       expect(res.result.ding.loop).to.be.undefined();
    //       expect(res.result.ding.heap).to.be.undefined();
    //       done();
    //     });
    //   });
    // });
  });

// describe('Custom /ding response', function () {
//   it('should reply with given other data', function (done) {
//     var server = new Hapi.Server().connection({ host: 'test' });

//     server.register({ register: require('../'), options: { otherData: { version: '1.2.3' } } }, function () {
//       server.inject('/ding', function (res) {
//         expect(res.result.ding).to.be.an.object();
//         expect(res.result.ding.version).to.be.an.string();
//         expect(res.result.ding.version).to.equal('1.2.3');
//         done();
//       });
//     });
//   });

//   it('should reply without objectName', function (done) {
//     var server = new Hapi.Server().connection({ host: 'test' });

//     server.register({ register: require('../'), options: { objectName: false } }, function () {
//       server.inject('/ding', function (res) {
//         expect(res.result).to.be.an.object();
//         expect(res.result.ding).to.be.undefined();
//         expect(res.result.mem).to.be.a.number();
//         done();
//       });
//     });
//   });

//   it('should reply with a specific objectName', function (done) {
//     var server = new Hapi.Server().connection({ host: 'test' });

//     server.register({ register: require('../'), options: { objectName: 'foo' } }, function () {
//       server.inject('/ding', function (res) {
//         expect(res.result).to.be.an.object();
//         expect(res.result.ding).to.be.undefined();
//         expect(res.result.foo).to.be.an.object();
//         expect(res.result.foo.mem).to.be.a.number();
//         done();
//       });
//     });
//   });
});
