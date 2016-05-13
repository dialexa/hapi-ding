var Lab = require('lab');
var Hapi = require('hapi');

var lab = exports.lab = Lab.script();
var before = lab.before;
var beforeEach = lab.beforeEach;
var describe = lab.experiment;
var it = lab.test;
var expect = require('code').expect;

describe('Registration', function(){
  var server;

  beforeEach(function(done){
    server = new Hapi.Server().connection({ host: 'test' });
    done();
  });

  it('should register', function(done) {
    server.register(require('../'), function() {
      var routes = server.table();
      expect(routes).to.have.length(1);
      expect(routes[0].table).to.have.length(1);
      done();
    });
  });

  it('should let you set the path', function(done){
    server.register({register: require('../'), options: {path: '/api/v1/new_ping'}}, function() {
      var routes = server.table();
      expect(routes[0].table[0].path).to.equal('/api/v1/new_ping');
      done();
    });
  });

  it('should let you set otherData', function(done){
    server.register({register: require('../'), options: {otherData: {foo: 'bar'}}}, function() {
      var routes = server.table();
      expect(routes[0].table[0].path).to.equal('/ding');
      done();
    });
  });

  it('should let you set config options', function(done){
    server.register({register: require('../'), options: {config: {description: 'Custom Hapi Ding'}}}, function() {
      var routes = server.table();
      expect(routes[0].table[0].settings.description).to.equal('Custom Hapi Ding');
      done();
    });
  });

  it('should not let you set unknown options', function(done){
    server.register({register: require('../'), options: {badName: {foo: 'bar'}}}, function(err) {
      expect(err).to.not.be.null();
      done();
    });
  });
});

describe('Default /ding response', function(){
  var server;

  beforeEach(function(done) {
    server = new Hapi.Server().connection({ host: 'test' });
    server.register(require('../'), function() {
      done();
    });
  });

  it('should reply with cpu', function(done){
    server.inject('/ding', function(res){
      expect(res.result).to.be.an.object();
      expect(res.result.ding).to.be.an.object();
      expect(res.result.ding.cpu).to.be.an.array();
      expect(res.result.ding.cpu).to.have.length(3);
      expect(res.result.ding.cpu[0]).to.be.a.number();
      done();
    });
  });

  it('should reply with mem', function(done){
    server.inject('/ding', function(res){
      expect(res.result.ding).to.be.an.object();
      expect(res.result.ding.mem).to.be.a.number();
      done();
    });
  });

  it('should reply with time', function(done){
    server.inject('/ding', function(res){
      expect(res.result.ding).to.be.an.object();
      expect(res.result.ding.time).to.be.a.number();
      done();
    });
  });
});

describe('Hapi load reporting', function(){
  it('should reply with heap', function(done){
    var server = new Hapi.Server({load: { sampleInterval: 1000 }}).connection({ host: 'test' });

    server.register({register: require('../')}, function() {
      server.connections[0]._load._process.load.heapUsed = 100000;
      server.connections[0]._load.check = function(){ return false; };
      server.inject('/ding', function(res){
        expect(res.result.ding).to.be.an.object();
        expect(res.result.ding.heap).to.be.a.number();
        expect(res.result.ding.heap).to.equal(100000);
        done();
      });
    });
  });

  it('should reply with heap', function(done){
    var server = new Hapi.Server({load: { sampleInterval: 1000 }}).connection({ host: 'test' });

    server.register({register: require('../')}, function() {
      server.connections[0]._load._process.load.eventLoopDelay = 1.34;
      server.connections[0]._load.check = function(){ return false; };
      server.inject('/ding', function(res){
        expect(res.result.ding).to.be.an.object();
        expect(res.result.ding.loop).to.be.a.number();
        expect(res.result.ding.loop).to.equal(1.34);
        done();
      });
    });
  });

  it('should not reply with heap or loop if the server does not have the load settings', function(done){
    var server = new Hapi.Server().connection({ host: 'test' });

    server.register({register: require('../')}, function() {
      server.connections[0]._load._process.load.eventLoopDelay = 1.34;
      server.connections[0]._load.check = function(){ return false; };
      server.inject('/ding', function(res){
        expect(res.result.ding).to.be.an.object();
        expect(res.result.ding.loop).to.be.undefined();
        expect(res.result.ding.heap).to.be.undefined();
        done();
      });
    });
  });
});

describe('Custom /ding response', function(){
  it('should reply with given other data', function(done){
    var server = new Hapi.Server().connection({ host: 'test' });

    server.register({register: require('../'), options: {otherData: {version: '1.2.3'}}}, function() {
      server.inject('/ding', function(res){
        expect(res.result.ding).to.be.an.object();
        expect(res.result.ding.version).to.be.an.string();
        expect(res.result.ding.version).to.equal('1.2.3');
        done();
      });
    });
  });

  it('should reply without objectName', function(done){
    var server = new Hapi.Server().connection({ host: 'test' });

    server.register({register: require('../'), options: {objectName: false}}, function() {
      server.inject('/ding', function(res){
        expect(res.result).to.be.an.object();
        expect(res.result.ding).to.be.undefined();
        expect(res.result.mem).to.be.a.number();
        done();
      });
    });
  });

  it('should reply with a specific objectName', function(done){
    var server = new Hapi.Server().connection({ host: 'test' });

    server.register({register: require('../'), options: {objectName: 'foo'}}, function() {
      server.inject('/ding', function(res){
        expect(res.result).to.be.an.object();
        expect(res.result.ding).to.be.undefined();
        expect(res.result.foo).to.be.an.object();
        expect(res.result.foo.mem).to.be.a.number();
        done();
      });
    });
  });
});