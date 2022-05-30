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
    const securityInfo = {
      requestHeaders: {},
      userAuth: {
        cookies: {
          aulc: {
            Name: 'aulc',
            Value:
              's%3A1%3Aapp%3A1%3Aphone%3A1653897346.477%3A11e495083f8a1bb338ce6e10d9f2eed39252521d84e75aa5bf254c97911d9550.962O00SLpO0mEmsypUGDglrN7wgoItB0EKhSxe6t0c8'
          }
        }
      }
    };

    new StartSuite({
      securityInfo
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
