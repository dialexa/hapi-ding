'use strict';

var OS = require('os');
var Joi = require('joi');
var Hoek = require('hoek');

var internals = {
  defaults: {
    path: '/ding',
    objectName: 'ding'
  },
  options: Joi.object({
    path: Joi.string().optional(),
    objectName: Joi.string().optional().allow(null, false),
    otherData: Joi.object().optional()
  })
};

exports.register = function(plugin, options, next){
  var validateOptions = internals.options.validate(options);
  if (validateOptions.error) {
    return next(validateOptions.error);
  }

  var settings = Hoek.clone(internals.defaults);
  Hoek.merge(settings, options);

  plugin.route({
    method: 'GET',
    path: settings.path,
    config: { auth: false },
    handler: function(req, reply) {
      var res = {
        cpu: OS.loadavg(),
        mem: OS.freemem(),
        time: (new Date()).getTime()
      };

      if(req.server.settings.load.sampleInterval) {
        res.heap = req.server.load.heapUsed;
        res.loop = req.server.load.eventLoopDelay;
      }

      if(settings.otherData) {
        Hoek.merge(res, settings.otherData, false);
      }

      if(settings.objectName) {
        var res2 = {};
        res2[settings.objectName] = res;
        res = res2;
      }

      reply(res);
    }
  });

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};