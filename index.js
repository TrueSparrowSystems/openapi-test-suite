const rootPrefix = '.',
  configProvider = require(rootPrefix + '/lib/configProvider'),
  StartSuite = require(rootPrefix + '/lib/Suite/Start'),
  StartSecurityTest = require(rootPrefix + '/lib/Suite/StartSecurityTest'),
  SchemaValidator = require(rootPrefix + '/lib/schema/Validate');

/**
 * Class exposed by this package
 *
 * @class ApiTestSuite
 */
class ApiTestSuite {
  constructor(openapiObj, serverIndex, securityInfo) {
    const oThis = this;

    oThis.openapiObj = openapiObj;
    oThis.serverIndex = serverIndex;
    oThis.securityInfo = securityInfo;

    // Saving the params in-memory via configProvider
    configProvider.setConfig('openapiObj', oThis.openapiObj);
    configProvider.setConfig('serverIndex', oThis.serverIndex);
    configProvider.setConfig('securityInfo', oThis.securityInfo);
  }

  /**
   * Start the suite to run test cases
   *
   * @return {Promise<void>}
   */
  runTest() {
    const oThis = this;

    new StartSuite().perform();
  }

  /**
   * Start the suite to run test for security params
   *
   * @return {Promise<void>}
   */
  runSecurityTest() {
    new StartSecurityTest().perform();
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
