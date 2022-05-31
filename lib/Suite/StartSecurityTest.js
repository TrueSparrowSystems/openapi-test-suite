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

    oThis.serverUrl = oThis.openapiObj.definition.servers[oThis.serverIndex].url;
    oThis.allPaths = oThis.openapiObj.definition.paths;
    oThis.globalSecurity = oThis.openapiObj.definition.security;
    oThis.securitySchemes = oThis.openapiObj.definition.components.securitySchemes;

    oThis.securityInfo = params.securityInfo || null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.storeCookiesInConfig();

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

    const securityInfo = configProvider.getConfig('securityInfo'),
      globalReqHeaders = securityInfo.requestHeaders;

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
          for (const securityComponent in methodSecurity) {
            const securityScheme = oThis.securitySchemes[securityComponent];
            if (!securityScheme) {
              throw new Error('No security scheme found for - ' + securityComponent);
            }
            const authData = securityInfo[securityComponent] || null;

            if (!authData) {
              throw new Error('No security profile found for - ' + securityComponent);
            }

            // Checking test case where cookie is present with all params invalid.
            for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
              const paramsElement = incorrectCombinationsArray[combinationIndex];
              await oThis.sendAndValidateTestCases(paramsElement, path, method, globalReqHeaders, true, authData);
            }
          }
        } else {
          // Checking test case with all params invalid.
          for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
            const paramsElement = incorrectCombinationsArray[combinationIndex];
            await oThis.sendAndValidateTestCases(paramsElement, path, method, globalReqHeaders, true);
          }
        }
      }
      logger.log('--------------------------- ENDED TESTING APIS FOR SECURITY PARAMS ---------------------------');
    }
  }

  /**
   * Send and validate requests.
   *
   * @param {object} paramsElement
   * @param {string} path
   * @param {string} method
   * @param {object} globalReqHeaders
   * @param {object} securityScheme
   *
   * @returns {Promise<void>}
   */
  async sendAndValidateTestCases(
    paramsElement,
    path,
    method,
    globalReqHeaders,
    correctCookieValues,
    securityScheme = {}
  ) {
    const oThis = this;

    const reqHeaders = Object.assign(globalReqHeaders, securityScheme.headers || {});

    if (CommonValidator.validateNonEmptyObject(securityScheme)) {
      reqHeaders['Cookie'] = oThis.getCookieString(securityScheme.cookies);
    }

    const apiParams = paramsElement.apiParams;
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
   * Method to generate combination of api params.
   *
   * @param methodParams
   * @returns {Promise<void>}
   */
  async generateApiParamsCombination(methodParams) {
    const oThis = this;

    const paramNames = [],
      paramTypeArray = [],
      paramToCorrectValuesMap = {},
      incorrectApiParamsArray = [],
      correctApiParamsArray = [];

    if (!methodParams || methodParams.length == 0) {
      return { incorrectCombinations: incorrectApiParamsArray, correctCombinations: [{ apiParams: {} }] };
    }

    for (const param of methodParams) {
      const schema = param.schema,
        paramName = param.name;
      paramNames.push(paramName);

      const schemaTypeObj = new ParamValueSetFactory().getInstance(schema, param.required),
        paramCorrectValues = [schemaTypeObj.correctValues()[0]];

      paramToCorrectValuesMap[paramName] = paramCorrectValues;
      const paramCombinationsArray = paramCorrectValues;

      paramTypeArray.push(paramCombinationsArray);
    }

    const cartesianProductArray = helper.cartesianProduct(paramTypeArray);
    const securityParamValues = new securityParamValueSet().getValues();

    const combinationsArray = helper.prepareCombinationsOfArray(cartesianProductArray[0], securityParamValues);

    for (let index = 0; index < combinationsArray.length; index++) {
      const paramsCombination = combinationsArray[index],
        apiParams = {};

      let allParamsCorrect = true;
      const incorrectParamsMap = {};
      for (let paramIndex = 0; paramIndex < paramNames.length; paramIndex++) {
        const paramName = paramNames[paramIndex];
        const paramValue = paramsCombination[paramIndex].value,
          paramDescription = paramsCombination[paramIndex].description;
        apiParams[paramName] = paramValue;
        const correctValuesArray = paramToCorrectValuesMap[paramName];

        const checkValue = (obj) => obj.value === paramValue;

        if (!correctValuesArray.some(checkValue) || !allParamsCorrect) {
          incorrectParamsMap[paramName] = paramDescription;
          allParamsCorrect = false;
        }
      }

      if (allParamsCorrect) {
        correctApiParamsArray.push({
          apiParams: apiParams
        });
      } else {
        incorrectApiParamsArray.push({
          apiParams: apiParams,
          incorrectParamsMap: incorrectParamsMap
        });
      }
    }

    return { incorrectCombinations: incorrectApiParamsArray, correctCombinations: correctApiParamsArray };
  }

  /**
   * Stores cookies in config
   *
   * @returns {Promise<void>}
   */
  async storeCookiesInConfig() {
    const oThis = this;

    const securityInfo = {};
    for (const security in oThis.securityInfo) {
      if (security === 'requestHeaders') {
        securityInfo.requestHeaders = oThis.securityInfo.requestHeaders;
      } else {
        const authObj = oThis.securityInfo[security];
        const cookieArr = [];
        securityInfo[security] = {};

        const headers = authObj.headers || null;
        if (headers) {
          securityInfo[security].headers = headers;
        }

        for (const cookie in authObj.cookies) {
          const cookieObj = {};
          cookieObj.name = authObj.cookies[cookie].Name;
          cookieObj.value = authObj.cookies[cookie].Value;

          cookieArr.push(cookieObj);
        }

        securityInfo[security].cookies = cookieArr;
      }
    }

    configProvider.setConfig('securityInfo', securityInfo);
  }

  /**
   * Get cookie string for request headers.
   *
   * @param {array<string>} cookieArr
   *
   * @returns {object}
   */
  getCookieString(cookieArr) {
    const oThis = this;

    const cookieResponseArr = [];
    for (let index = 0; index < cookieArr.length; index++) {
      const cookieName = cookieArr[index].name;
      const cookieValue = cookieArr[index].value;
      const cookieString = cookieName + '=' + cookieValue;
      cookieResponseArr.push(cookieString);
    }

    return cookieResponseArr.join('; ');
  }
}

module.exports = StartSecurityTest;
