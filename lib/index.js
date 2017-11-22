'use strict';

const OS = require('os');
const Joi = require('joi');
const Hoek = require('hoek');
const name = 'hapi-ding';

const internals = {
  defaults: {
    path: '/ding',
    objectName: 'ding',
    config: { auth: false }
  },

  options: Joi.object({
    path: Joi.string().optional(),
    objectName: Joi.string().optional().allow(null, false),
    config: Joi.object().optional(),
    otherData: Joi.object().optional()
  })
};

const register = function (server, options) {
  const validateOptions = internals.options.validate(options);

  if (validateOptions.error) {
    throw validateOptions.error;
  }

  const settings = Hoek.clone(internals.defaults);

  Hoek.merge(settings, options);

  server.route({
    method: 'GET',
    path: settings.path,
    config: settings.config,
    handler (request, h) {
      const { otherData, objectName } = settings;
      const stats = {
        cpu: OS.loadavg(),
        mem: OS.freemem(),
        time: (new Date()).getTime()
      };

      const { server: { settings: { load } } } = request;
      const { sampleInterval, heapUsed, eventLoopDelay } = load;

      if (sampleInterval) {
        stats.heap = heapUsed;
        stats.loop = eventLoopDelay;
      }
      if (otherData) {
        Hoek.merge(stats, otherData, false);
      }

      if (objectName) {
        return h.response({ [objectName]: stats });
      }

      return h.response(stats);
    }
  });
};

exports.plugin = {
  register,
  name,
  pkg: require('../package.json'),
  version: process.env.npm_package_version
}
;
