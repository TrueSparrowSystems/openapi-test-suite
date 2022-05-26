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
      requestHeaders: {
        'Content-Security-Policy':
          "default-src 'self';base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"
      },
      adminAuth: {
        cookies: {
          aulc: {
            Name: 'aulc',
            Value:
              's%3A1%3Aapp%3A1%3Aphone%3A1653568774.691%3A7f8ebcc918c4b0ab377713e0a6a278992424500f1dfd673bdfc023e4e04236f8.moH51HKpGOeyCKEWanY8oU2BxU81GfDvogA9XCcC1uQ'
          },
          culc: {
            Name: 'aclc',
            Value:
              's%3A1%3Aapp%3A1%3Aphone%3A1653568774.691%3A7f8ebcc918c4b0ab377713e0a6a278992424500f1dfd673bdfc023e4e04236f8.moH51HKpGOeyCKEWanY8oU2BxU81GfDvogA9XCcC1uQ'
          }
        },
        headers: {
          'X-Frame-Options': 'SAMEORIGIN'
        }
      },
      adminAuth2: {
        cookies: {}
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
