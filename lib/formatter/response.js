/**
 * Standard response formatter
 *
 * @module lib/formatter/response
 */
const Base = require('@truesparrow/base'),
  responseHelper = new Base.responseHelper({
    module_name: 'openapi-test-suite'
  });

module.exports = responseHelper;
