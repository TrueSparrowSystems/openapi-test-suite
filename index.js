const rootPrefix = '.',
  configProvider = require(rootPrefix + '/lib/configProvider'),
  StartSuite = require(rootPrefix + '/lib/Suite/Start'),
  SchemaValidator = require(rootPrefix + '/lib/schema/Validate');

/**
 * Class exposed by this package
 *
 * @class ApiTestSuite
 */
class ApiTestSuite {
  constructor(openapiObj, serverIndex) {
    const oThis = this;

    oThis.openapiObj = openapiObj;
    oThis.serverIndex = serverIndex;

    // Saving the params in-memory via configProvider
    configProvider.setConfig('openapiObj', openapiObj);
    configProvider.setConfig('serverIndex', serverIndex);
  }

  /**
   * Start the suite to run test cases
   *
   * @return {Promise<void>}
   */
  runTest() {
    new StartSuite().perform();
  }

  /**
   * Cleanup the in-memory saved config
   *
   * @return {Promise<void>}
   */
  cleanup() {
    configProvider.deleteConfig();
  }

  /**
   * Schema Validator to validate data vs dataSchema
   *
   * @returns {*}
   * @constructor
   */
  get SchemaValidator() {
    return SchemaValidator;
  }
}

module.exports = ApiTestSuite;
