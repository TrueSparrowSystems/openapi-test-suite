const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  helper = require(rootPrefix + '/lib/helper'),
  SchemaValidator = require(rootPrefix + '/lib/schema/Validate'),
  configProvider = require(rootPrefix + '/lib/configProvider'),
  ParamValueSetFactory = require(rootPrefix + '/lib/paramValueSet/Factory'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common');

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

    const securityInfo = configProvider.getConfig('securityInfo');

    for (const path in oThis.allPaths) {
      const currentPath = oThis.allPaths[path];
      for (const method in currentPath) {
        const methodData = currentPath[method],
          methodParams = methodData.parameters,
          methodSecurity = methodData.security,
          dataSchema = methodData.responses['200'].content['application/json'].schema,
          reqHeaders = securityInfo.requestHeaders;

        let authData = {},
          cookies = [],
          header = {};

        for (const securityComponent in methodSecurity) {
          const securityScheme = oThis.securitySchemes[securityComponent];
          if (!securityScheme) {
            throw new Error('No security schema found for - ' + securityComponent);
          }
          authData = securityInfo[securityComponent] || null;

          if (!authData) {
            throw new Error('No security schema found for - ' + securityComponent);
          }
          cookies.push(authData.cookies);

          header = Object.assign(header, authData.headers);
        }

        for (const key in header) {
          reqHeaders[key] = header[key];
        }

        let incorrectCombinationsArray = [],
          correctCombinationsArray = [];
        if (methodParams.length === 0) {
          correctCombinationsArray.push({
            apiParams: {}
          });
        } else {
          const paramsArray = await oThis.generateApiParamsCombination(methodParams);
          incorrectCombinationsArray = paramsArray.incorrectCombinations;
          correctCombinationsArray = paramsArray.correctCombinations;
        }

        if (cookies.length > 0) {
          const cookieCombination = await oThis.generateCookieCombination(cookies),
            correctCookiesCombinationArr = cookieCombination.correctCookieCombinationArr,
            incorrectCookiesCombinationArr = cookieCombination.incorrectCookieCombinationArr;

          const correctCombinationElement = correctCombinationsArray[0];

          for (const incorrectCookiesCombination of incorrectCookiesCombinationArr) {
            reqHeaders['Cookie'] = incorrectCookiesCombination;

            const apiParams = correctCombinationElement.apiParams;
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
              await oThis.validateResponse(responseData, true, {}, dataSchema, true);
            } catch (error) {
              logger.error('---------------------------');
              logger.error(method.toUpperCase(), path);
              logger.error('params:', apiParams);
              logger.error('Expected response success:', false);
              logger.error('Incorrect Parameters:', {});
              logger.error('Incorrect Cookie Combination:', {});
              logger.error('Response HTTP code:', responseData.data.httpCode);
              logger.error('API response:', responseData.data.apiResponse);
              logger.error('Response validation error:', error);
            }
          }

          // for (let combinationIndex = 0; combinationIndex < correctCombinationsArray.length; combinationIndex++) {
          //   const paramsElement = correctCombinationsArray[combinationIndex];
          //   const apiParams = paramsElement.apiParams;
          //
          //   const params = {
          //     serverUrl: oThis.serverUrl,
          //     path: path,
          //     method: method,
          //     apiParameters: apiParams,
          //     header: CommonValidator.validateNonEmptyObject(reqHeaders) ? reqHeaders : null
          //   };
          //
          //   const responseData = await new HttpLibrary(params).perform();
          //   await helper.sleep(500);
          //
          //   try {
          //     await oThis.validateResponse(responseData, false, paramsElement.incorrectParamsMap, dataSchema);
          //   } catch (error) {
          //     logger.error('---------------------------');
          //     logger.error(method.toUpperCase(), path);
          //     logger.error('params:', apiParams);
          //     logger.error('Expected response success:', false);
          //     logger.error('Incorrect Parameters:', paramsElement.incorrectParamsMap);
          //     logger.error('Response HTTP code:', responseData.data.httpCode);
          //     logger.error('API response:', responseData.data.apiResponse);
          //     logger.error('Response validation error:', error);
          //   }
          // }

          reqHeaders['Cookie'] = correctCookiesCombinationArr[0] || '';
        }

        for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
          const paramsElement = incorrectCombinationsArray[combinationIndex];
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
            await oThis.validateResponse(responseData, false, paramsElement.incorrectParamsMap, dataSchema, false);
          } catch (error) {
            logger.error('---------------------------');
            logger.error(method.toUpperCase(), path);
            logger.error('params:', apiParams);
            logger.error('Expected response success:', false);
            logger.error('Incorrect Parameters:', paramsElement.incorrectParamsMap);
            logger.error('Response HTTP code:', responseData.data.httpCode);
            logger.error('API response:', responseData.data.apiResponse);
            logger.error('Response validation error:', error);
          }
        }
      }
      logger.log('--------------------------- ENDED TESTING APIS ---------------------------');
    }
  }

  /**
   *
   * @param {object} responseData
   * @param {boolean} allParamsCorrect
   * @param {object} incorrectParamsMap
   * @param {object} dataSchema
   * @param {boolean} incorrectCookieCombination
   *
   * @returns {Promise<void>}
   */
  async validateResponse(responseData, allParamsCorrect, incorrectParamsMap, dataSchema, incorrectCookieCombination) {
    const oThis = this,
      apiResponse = responseData.data.apiResponse,
      statusCode = responseData.data.httpCode,
      incorrectParamsArray = Object.keys(incorrectParamsMap);

    if (allParamsCorrect) {
      if (apiResponse.success) {
        new SchemaValidator().validateObjectBySchema(apiResponse, dataSchema, 'response');
      } else if (incorrectCookieCombination && statusCode === 401) {
        return;
      } else if (incorrectCookieCombination && statusCode != 401) {
        throw {
          kind: 'mandatoryCookieValidationFailed'
        };
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
      return { incorrectCombinations: incorrectApiParamsArray, correctCombinations: correctApiParamsArray };
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
          const cookieName = authObj.cookies[cookie].Name;
          const cookieValue = authObj.cookies[cookie].Value;
          const cookieString = cookieName + '=' + cookieValue;

          cookieArr.push(cookieString);
        }

        securityInfo[security].cookies = cookieArr.join('; ');
      }
    }

    configProvider.setConfig('securityInfo', securityInfo);
  }

  /**
   * Generate combination for cookies.
   *
   * @param {array<string>} cookie
   *
   * @returns {object}
   */
  async generateCookieCombination(cookie) {
    const oThis = this;

    const correctCookieCombination = cookie.join('; '),
      incorrectCookieCombination = [];

    for (let index = 0; index < cookie.length; index++) {
      let tempArray = [];
      tempArray = tempArray.concat(cookie.slice(0, index));
      tempArray = tempArray.concat(cookie.slice(index + 1));
      incorrectCookieCombination.push(tempArray.join('; '));
    }

    return {
      correctCookieCombinationArr: correctCookieCombination,
      incorrectCookieCombinationArr: incorrectCookieCombination
    };
  }
}

module.exports = Start;
