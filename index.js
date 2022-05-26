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
    const customPaths = [
      {
        route: '/api/admin/web/login/phone/otp',
        method: 'get',
        params: { raw_phone_number: '$ref:$atIndex[0].res.obtainedToken', country_code: 91 }
      },
      {
        route: '/api/otp/verify',
        method: 'post',
        params: { some_token: '$ref:$responseData[0].res.obtainedToken' }
      }
    ];
    new StartSuite({
      customPaths
    }).perform();
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
