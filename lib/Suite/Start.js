const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  helper = require(rootPrefix + '/lib/helper'),
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
    oThis.globalSecurity = oThis.openapiObj.definition.security || {};
    oThis.securitySchemes = oThis.openapiObj.definition.components.securitySchemes;
    oThis.securityInfo = configProvider.getConfig('securityInfo');
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

    logger.log('--------------------------- STARTED TESTING APIS --------------------------- ');

    for (const path in oThis.allPaths) {
      const currentPath = oThis.allPaths[path];
      for (const method in currentPath) {
        const methodData = currentPath[method],
          methodParams = methodData.parameters,
          methodSecurity = methodData.security || oThis.globalSecurity;

        const paramsCombinations = await oThis.generateApiParamsCombination(methodParams),
          incorrectCombinations = paramsCombinations.incorrectCombinations,
          correctCombinations = paramsCombinations.correctCombinations;

        if (CommonValidator.validateNonEmptyObject(methodSecurity)) {
          // To test each security auth test cases with valid api params
          const sampleCorrectCombination = correctCombinations[0];

          for (const securityAuth in methodSecurity) {
            const securityScheme = oThis.securitySchemes[securityAuth];
            if (!securityScheme) {
              throw new Error('No security scheme found for - ' + securityAuth);
            }
            const securityAuthObj = oThis.securityInfo[securityAuth] || null;

            if (!securityAuthObj) {
              throw new Error('No security auth found for - ' + securityAuth);
            }

            // Test with cookie, headers and correct api param combination. Expected http code other than 401.
            await oThis.sendRequestAndValidateResponse(
              method,
              path,
              sampleCorrectCombination,
              {
                areAllParamsCorrect: true,
                areCookiesIncorrect: false
              },
              securityAuthObj.cookies,
              securityAuthObj.headers
            );

            // Test with cookie, headers and incorrect api param combinations. Expected http code other than 401 and proper param level error.
            for (let combinationIndex = 0; combinationIndex < incorrectCombinations.length; combinationIndex++) {
              const paramsElement = incorrectCombinations[combinationIndex];
              await oThis.sendRequestAndValidateResponse(
                method,
                path,
                paramsElement,
                {
                  areAllParamsCorrect: false,
                  areCookiesIncorrect: false
                },
                securityAuthObj.cookies,
                securityAuthObj.headers
              );
            }

            const invalidCookiesMap = oThis.generateInvalidCookieValues(securityAuthObj.cookies);

            // Test with invalid cookie values, headers and correct api param combination. Expected http code 401.
            await oThis.sendRequestAndValidateResponse(
              method,
              path,
              sampleCorrectCombination,
              {
                areAllParamsCorrect: true,
                areCookiesIncorrect: true
              },
              invalidCookiesMap,
              securityAuthObj.headers
            );
          }

          // Test with headers, correct api param combination and no cookies. Expected http code 401.
          await oThis.sendRequestAndValidateResponse(method, path, sampleCorrectCombination, {
            areAllParamsCorrect: true,
            areCookiesIncorrect: true
          });
        } else {
          // Test all incorrect api param combinations, expect proper param level error.
          for (let combinationIndex = 0; combinationIndex < incorrectCombinations.length; combinationIndex++) {
            const paramsElement = incorrectCombinations[combinationIndex];
            await oThis.sendRequestAndValidateResponse(method, path, paramsElement, {
              areAllParamsCorrect: false,
              areCookiesIncorrect: false
            });
          }
        }
      }
      logger.log('--------------------------- ENDED TESTING APIS ---------------------------');
    }
  }

  /**
   * Send request and validate response.
   *
   * @param {string} method
   * @param {string} path
   * @param {object} paramsCombination
   * @param {object} validationMeta
   * @param {object} [cookies]
   * @param {object} [headers]
   * @returns {Promise<void>}
   */
  async sendRequestAndValidateResponse(
    method,
    path,
    paramsCombination,
    validationMeta,
    cookies = null,
    headers = null
  ) {
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
    await helper.sleep(500);

    try {
      const dataSchema = oThis.allPaths[path][method].responses['200'].content['application/json'].schema;

      await oThis.validateResponse(
        responseData,
        validationMeta.areAllParamsCorrect,
        paramsCombination.incorrectParamsMap || {},
        dataSchema,
        validationMeta.areCookiesIncorrect
      );
    } catch (error) {
      logger.error('---------------------------');
      logger.error(method.toUpperCase(), path);
      logger.error('params:', apiParams);
      logger.error(
        'Expected response success:',
        validationMeta.areAllParamsCorrect && !validationMeta.areCookiesIncorrect
      );
      logger.error('Incorrect Parameters:', paramsCombination.incorrectParamsMap || {});
      logger.error('Response HTTP code:', responseData.data.httpCode);
      logger.error('API response:', responseData.data.apiResponse);
      logger.error('Response validation error:', error);
      logger.error('Request headers:', reqHeaders);
    }
  }

  /**
   * Validate response.
   *
   * @param {object} responseData
   * @param {boolean} areAllParamsCorrect
   * @param {object} incorrectParamsMap
   * @param {object} dataSchema
   * @param {boolean} areCookiesIncorrect
   *
   * @returns {Promise<void>}
   */
  async validateResponse(responseData, areAllParamsCorrect, incorrectParamsMap, dataSchema, areCookiesIncorrect) {
    const oThis = this,
      apiResponse = responseData.data.apiResponse,
      statusCode = responseData.data.httpCode;

    if (areAllParamsCorrect) {
      if (!areCookiesIncorrect && statusCode === 401) {
        throw {
          kind: 'unauthorizedApiRequestForValidCookie'
        };
      }

      if (areCookiesIncorrect && statusCode != 401) {
        throw {
          kind: 'mandatoryCookieValidationFailed'
        };
      }
    } else {
      if (!areCookiesIncorrect && statusCode == 401) {
        throw {
          kind: 'unauthorizedApiRequestForValidCookie'
        };
      }
      const errorData = apiResponse.err.error_data;
      for (const error of errorData) {
        const parameter = error.parameter;
        if (CommonValidator.isVarNullOrUndefined(incorrectParamsMap[parameter])) {
          throw {
            kind: 'parameterErrorNotObtained',
            parameter: parameter
          };
        }
      }
    }
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
        paramCorrectValues = schemaTypeObj.correctValues(),
        paramIncorrectValues = schemaTypeObj.incorrectValues();

      paramNameToValidValues[paramName] = paramCorrectValues;
      const possibleParamValues = paramCorrectValues.concat(paramIncorrectValues);

      allParamsPossibleValuesArray.push(possibleParamValues);
    }

    const allCombinations = helper.cartesianProduct(allParamsPossibleValuesArray);

    for (let index = 0; index < allCombinations.length; index++) {
      const paramsCombination = allCombinations[index],
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

  /**
   * Get invalid cookie values.
   *
   * @param {object} cookiesMap
   *
   * @returns {object}
   */
  generateInvalidCookieValues(cookiesMap) {
    const oThis = this;

    const cookieResponseMap = {};
    for (const cookieName in cookiesMap) {
      cookieResponseMap[cookieName] = util.getRandomString(cookiesMap[cookieName].length);
    }

    return cookieResponseMap;
  }
}

module.exports = Start;
