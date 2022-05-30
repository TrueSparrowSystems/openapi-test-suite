const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  helper = require(rootPrefix + '/lib/helper'),
  SchemaValidator = require(rootPrefix + '/lib/schema/Validate'),
  configProvider = require(rootPrefix + '/lib/configProvider'),
  ParamValueSetFactory = require(rootPrefix + '/lib/paramValueSet/Factory'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  util = require(rootPrefix + '/lib/util');

/**
 * Class for starting openapi-test-suite
 *
 * @class Start
 */
class Start {
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

    logger.log('--------------------------- STARTED TESTING APIS --------------------------- ');

    const securityInfo = configProvider.getConfig('securityInfo'),
      globalReqHeaders = securityInfo.requestHeaders;

    for (const path in oThis.allPaths) {
      const currentPath = oThis.allPaths[path];
      for (const method in currentPath) {
        const methodData = currentPath[method],
          methodParams = methodData.parameters,
          methodSecurity = methodData.security || oThis.globalSecurity || {},
          dataSchema = methodData.responses['200'].content['application/json'].schema;

        const paramsArray = await oThis.generateApiParamsCombination(methodParams),
          incorrectCombinationsArray = paramsArray.incorrectCombinations,
          correctCombinationsArray = paramsArray.correctCombinations;

        if (CommonValidator.validateNonEmptyObject(methodSecurity)) {
          const sampleCorrectCombination = correctCombinationsArray[0];

          for (const securityComponent in methodSecurity) {
            const securityScheme = oThis.securitySchemes[securityComponent];
            if (!securityScheme) {
              throw new Error('No security scheme found for - ' + securityComponent);
            }
            const authData = securityInfo[securityComponent] || null;

            if (!authData) {
              throw new Error('No security profile found for - ' + securityComponent);
            }

            // Checking test case where cookie is present with all params valid.
            await oThis.sendAndValidateTestCases(
              sampleCorrectCombination,
              path,
              method,
              globalReqHeaders,
              dataSchema,
              true,
              true,
              authData
            );

            // Checking test case where cookie is present with all params invalid.
            for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
              const paramsElement = incorrectCombinationsArray[combinationIndex];
              await oThis.sendAndValidateTestCases(
                paramsElement,
                path,
                method,
                globalReqHeaders,
                dataSchema,
                false,
                true,
                authData
              );
            }

            const invalidCookieArr = oThis.generateInvalidCookieValues(authData.cookies);

            // Checking test case where invalid cookie values are present with all params valid.
            await oThis.sendAndValidateTestCases(
              sampleCorrectCombination,
              path,
              method,
              globalReqHeaders,
              dataSchema,
              true,
              false,
              {
                cookies: invalidCookieArr,
                headers: authData.headers
              }
            );
          }

          // Checking test case where no cookies and all valid params.
          await oThis.sendAndValidateTestCases(
            sampleCorrectCombination,
            path,
            method,
            globalReqHeaders,
            dataSchema,
            true,
            false
          );
        } else {
          // Checking test case with all params invalid.
          for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
            const paramsElement = incorrectCombinationsArray[combinationIndex];
            await oThis.sendAndValidateTestCases(
              paramsElement,
              path,
              method,
              globalReqHeaders,
              dataSchema,
              false,
              true
            );
          }
        }
      }
      logger.log('--------------------------- ENDED TESTING APIS ---------------------------');
    }
  }

  /**
   * Send and validate requests.
   *
   * @param {object} paramsElement
   * @param {string} path
   * @param {string} method
   * @param {object} globalReqHeaders
   * @param {object} dataSchema
   * @param {object} securityScheme
   *
   * @returns {Promise<void>}
   */
  async sendAndValidateTestCases(
    paramsElement,
    path,
    method,
    globalReqHeaders,
    dataSchema,
    allParamsCorrect,
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
    await helper.sleep(500);

    try {
      await oThis.validateResponse(
        responseData,
        allParamsCorrect,
        paramsElement.incorrectParamsMap || {},
        dataSchema,
        correctCookieValues
      );
    } catch (error) {
      logger.error('---------------------------');
      logger.error(method.toUpperCase(), path);
      logger.error('params:', apiParams);
      logger.error('Expected response success:', allParamsCorrect && correctCookieValues);
      logger.error('Incorrect Parameters:', paramsElement.incorrectParamsMap);
      logger.error('Response HTTP code:', responseData.data.httpCode);
      logger.error('API response:', responseData.data.apiResponse);
      logger.error('Response validation error:', error);
      logger.error('Request headers:', reqHeaders);
    }
  }

  /**
   *
   * @param {object} responseData
   * @param {boolean} allParamsCorrect
   * @param {object} incorrectParamsMap
   * @param {object} dataSchema
   * @param {boolean} correctCookieValues
   *
   * @returns {Promise<void>}
   */
  async validateResponse(responseData, allParamsCorrect, incorrectParamsMap, dataSchema, correctCookieValues) {
    const oThis = this,
      apiResponse = responseData.data.apiResponse,
      statusCode = responseData.data.httpCode,
      incorrectParamsArray = Object.keys(incorrectParamsMap);

    if (allParamsCorrect) {
      if (apiResponse.success) {
        new SchemaValidator().validateObjectBySchema(apiResponse, dataSchema, 'response');
      } else if (correctCookieValues && statusCode === 401) {
        throw {
          kind: 'mandatoryCookieValidationFailed' // Todo: do we need to have a different error code.
        };
      } else if (!correctCookieValues && statusCode === 401) {
        return;
      } else {
        throw {
          kind: 'errorRespForCorrectCase'
        };
      }
    } else {
      const errorData = apiResponse.err.error_data;
      for (const error of errorData) {
        const parameter = error.parameter;
        if (!incorrectParamsArray.includes(parameter)) {
          throw {
            kind: 'parameterErrorNotObtained',
            parameter: parameter
          };
        }
      }
    }
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
        paramCorrectValues = schemaTypeObj.correctValues(),
        paramIncorrectValues = schemaTypeObj.incorrectValues();

      paramToCorrectValuesMap[paramName] = paramCorrectValues;
      const paramCombinationsArray = paramCorrectValues.concat(paramIncorrectValues);

      paramTypeArray.push(paramCombinationsArray);
    }

    const combinationsArray = helper.cartesianProduct(paramTypeArray);

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

  /**
   * Get invalid cookie values.
   *
   * @param {array<string>} cookieArr
   *
   * @returns {object}
   */
  async generateInvalidCookieValues(cookieArr) {
    const oThis = this;

    const cookieResponseArr = [];
    for (let index = 0; index < cookieArr.length; index++) {
      const cookie = {};
      cookie.name = cookieArr[index].Name;
      cookie.Value = util.getRandomString(15); // Todo: to verify.
      cookieResponseArr.push(cookie);
    }

    return cookieResponseArr;
  }
}

module.exports = Start;
