const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  helper = require(rootPrefix + '/lib/helper'),
  configProvider = require(rootPrefix + '/lib/configProvider'),
  ParamValueSetFactory = require(rootPrefix + '/lib/paramValueSet/Factory'),
  securityParamValueSet = require(rootPrefix + '/lib/paramValueSet/securityParamValueSet'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common');

/**
 * Class for start security test
 *
 * @class StartSecurityTest
 */
class StartSecurityTest {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.openapiObj = configProvider.getConfig('openapiObj');
    oThis.serverIndex = configProvider.getConfig('serverIndex');
    oThis.securityInfo = configProvider.getConfig('securityInfo') || {};

    oThis.serverUrl = oThis.openapiObj.definition.servers[oThis.serverIndex].url;
    oThis.allPaths = oThis.openapiObj.definition.paths;
    oThis.globalSecurity = oThis.openapiObj.definition.security;
    oThis.securitySchemes = oThis.openapiObj.definition.components.securitySchemes;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.testAllApis();
  }

  /**
   * Test all apis
   *
   * @returns {Promise<void>}
   */
  async testAllApis() {
    const oThis = this;

    logger.log('--------------------------- STARTED TESTING APIS FOR SECURITY PARAMS --------------------------- ');

    for (const path in oThis.allPaths) {
      const currentPath = oThis.allPaths[path];
      for (const method in currentPath) {
        const methodData = currentPath[method],
          methodParams = methodData.parameters,
          methodSecurity = methodData.security || oThis.globalSecurity || {};

        if (methodParams.length == 0) {
          logger.info('No parameters for the path --', method.toUpperCase(), path);
          continue;
        }

        const paramsArray = await oThis.generateApiParamsCombination(methodParams),
          incorrectCombinationsArray = paramsArray.incorrectCombinations;

        if (CommonValidator.validateNonEmptyObject(methodSecurity)) {
          for (const securityAuth in methodSecurity) {
            const securityScheme = oThis.securitySchemes[securityAuth];
            if (!securityScheme) {
              throw new Error('No security scheme found for - ' + securityAuth);
            }
            const securityAuthObj = oThis.securityInfo[securityAuth] || null;

            if (!securityAuthObj) {
              throw new Error('No security auth found for - ' + securityAuth);
            }

            // Test with cookie, headers and incorrect api param combinations. Expected http code other than 401 and proper param level error.
            for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
              const paramsElement = incorrectCombinationsArray[combinationIndex];
              await oThis.sendRequest(method, path, paramsElement, securityAuthObj.cookies, securityAuthObj.headers);
            }
          }
        } else {
          // Test with invalid cookie values, headers and correct api param combination. Expected http code 401.
          for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
            const paramsElement = incorrectCombinationsArray[combinationIndex];
            await oThis.sendRequest(method, path, paramsElement);
          }
        }
      }
      logger.log('--------------------------- ENDED TESTING APIS FOR SECURITY PARAMS ---------------------------');
    }
  }

  /**
   * Send request and validate response.
   *
   * @param {string} method
   * @param {string} path
   * @param {object} paramsCombination
   * @param {object} cookies
   * @param {object} headers
   * @returns {Promise<void>}
   */
  async sendRequest(method, path, paramsCombination, cookies = null, headers = null) {
    const oThis = this;
    const reqHeaders = Object.assign({}, headers);

    if (CommonValidator.validateNonEmptyObject(cookies)) {
      reqHeaders['Cookie'] = oThis.getCookieString(cookies);
    }

    const apiParams = paramsCombination.apiParams;
    const params = {
      serverUrl: oThis.serverUrl,
      path: path,
      method: method,
      apiParameters: apiParams,
      header: CommonValidator.validateNonEmptyObject(reqHeaders) ? reqHeaders : null
    };

    const responseData = await new HttpLibrary(params).perform();

    logger.info('---------------------------');
    logger.info(method.toUpperCase(), path);
    logger.info('Request headers:', reqHeaders);
    logger.info('params:', apiParams);
    logger.info('API response:', responseData.data.apiResponse);

    await helper.sleep(500);
  }

  /**
   * Method to generate combinations of api params.
   *
   * @param {array} params
   * @returns {Promise<void>}
   */
  async generateApiParamsCombination(params) {
    const oThis = this;

    const paramNames = [],
      allParamsPossibleValuesArray = [],
      paramNameToValidValues = {},
      incorrectApiParamsCombinations = [],
      correctApiParamsCombinations = [];

    if (!params || params.length == 0) {
      return { incorrectCombinations: incorrectApiParamsCombinations, correctCombinations: [{ apiParams: {} }] };
    }

    for (const paramObj of params) {
      const schema = paramObj.schema,
        paramName = paramObj.name;
      paramNames.push(paramName);

      const schemaTypeObj = new ParamValueSetFactory().getInstance(schema, paramObj.required),
        paramCorrectValues = [schemaTypeObj.correctValues()[0]];

      paramNameToValidValues[paramName] = paramCorrectValues;
      const possibleParamValues = paramCorrectValues;

      allParamsPossibleValuesArray.push(possibleParamValues);
    }

    const allCombinations = helper.cartesianProduct(allParamsPossibleValuesArray);

    const securityParamValues = new securityParamValueSet().getValues();

    const combinationsArray = helper.prepareCombinationsOfArray(allCombinations[0], securityParamValues);

    for (let index = 0; index < combinationsArray.length; index++) {
      const paramsCombination = combinationsArray[index],
        apiParams = {};

      let areAllParamsCorrect = true;
      const incorrectParamsMap = {};
      for (let paramIndex = 0; paramIndex < paramNames.length; paramIndex++) {
        const paramName = paramNames[paramIndex];
        const paramValue = paramsCombination[paramIndex].value,
          paramDescription = paramsCombination[paramIndex].description;
        apiParams[paramName] = paramValue;
        const correctValuesArray = paramNameToValidValues[paramName];

        const checkValue = (obj) => obj.value === paramValue;

        if (!correctValuesArray.some(checkValue)) {
          incorrectParamsMap[paramName] = paramDescription;
          areAllParamsCorrect = false;
        }
      }

      if (areAllParamsCorrect) {
        correctApiParamsCombinations.push({
          apiParams: apiParams
        });
      } else {
        incorrectApiParamsCombinations.push({
          apiParams: apiParams,
          incorrectParamsMap: incorrectParamsMap
        });
      }
    }

    return { incorrectCombinations: incorrectApiParamsCombinations, correctCombinations: correctApiParamsCombinations };
  }

  /**
   * Get cookie string for request headers.
   *
   * @param {object} cookiesMap
   *
   * @returns {string}
   */
  getCookieString(cookiesMap) {
    const oThis = this;

    const cookieResponseArr = [];

    for (const cookieName in cookiesMap) {
      const cookieValue = cookiesMap[cookieName];
      const cookieString = cookieName + '=' + cookieValue;
      cookieResponseArr.push(cookieString);
    }

    return cookieResponseArr.join('; ');
  }
}

module.exports = StartSecurityTest;
