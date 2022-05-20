const rootPrefix = '.',
  configProvider = require(rootPrefix + '/lib/configProvider'),
  StartTest = require(rootPrefix + '/lib/Suite/Start'),
  SchemaValidator = require(rootPrefix + '/lib/schema/Validate');

/**
 * Class for api test suite.
 *
 * @class ApiTestSuite
 */
class ApiTestSuite {
  constructor(openapiObj,serverIndex) {
    const oThis = this;

    oThis.openapiObj = openapiObj;
    oThis.serverIndex = serverIndex;

    configProvider.setConfig('openapiObj', openapiObj);
    configProvider.setConfig('serverIndex', serverIndex);
  }

  /**
   * Start api testing.
   *
   * @return {Promise<void>}
   */
  runTest() {
    console.log('++++++++++++inside runTest');

    const responseData = new StartTest().perform();
  }

  /**
   * Cleanup config.
   *
   * @return {Promise<void>}
   */
  cleanup() {
    configProvider.deleteConfig();
  }

  get SchemaValidator() {
    return SchemaValidator;
  }
}

module.exports = ApiTestSuite;
