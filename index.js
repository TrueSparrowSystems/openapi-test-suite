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
      adminAuth: {
        cookies: {
          aulc: {
            Name: 'aulc',
            Value:
              's%3A1%3Aapp%3A1%3Aphone%3A1653632387.725%3Aed9038b099555d46f9a0ed3ac0eb4bd682cd2f0b3c0197edb47c7030e5a23892.4rcUaIpwNVioQchnYdmh2aqovrFgEnOff0%2BWfNI5BK8'
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
