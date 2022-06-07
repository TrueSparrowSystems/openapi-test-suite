/**
 * Standard response formatter
 *
 * @module lib/formatter/response
 */
const Base = require('@plgworks/base'),
  responseHelper = new Base.responseHelper({
    module_name: 'openapi-test-suite'
  });

module.exports = responseHelper;
