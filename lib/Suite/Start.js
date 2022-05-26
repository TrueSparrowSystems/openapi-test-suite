const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  helper = require(rootPrefix + '/lib/helper'),
  SchemaValidator = require(rootPrefix + '/lib/schema/Validate'),
  configProvider = require(rootPrefix + '/lib/configProvider'),
  ParamValueSetFactory = require(rootPrefix + '/lib/paramValueSet/Factory'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

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
    oThis.securitySchemas = oThis.openapiObj.definition.components.securitySchemes;

    oThis.customPaths = params.customPaths || null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.testCustomApis();

    await oThis.testAllApis();
  }

  /**
   *
   * Test Custom Apis.
   *
   * @returns {Promise<void>}
   */
  async testCustomApis() {
    const oThis = this;

    if (!oThis.customPaths) {
      return;
    }

    logger.log('--------------------------- STARTED CUSTOM TESTING APIS --------------------------- ');

    const responseDataArray = [];

    for (let paramIndex = 0; paramIndex < oThis.customPaths.length; paramIndex++) {
      const currentPath = oThis.customPaths[paramIndex],
        route = currentPath.route,
        method = currentPath.method,
        dataSchema = oThis.allPaths[route][method].responses['200'].content['application/json'].schema;

      const apiParams = currentPath.params;

      for (const key in apiParams) {
        const value = apiParams[key];

        if (value.toString().search('\\$ref:') != -1) {
          apiParams[key] = oThis.getValueFromPreviousResponse(value.slice(5), responseDataArray);
        }
      }

      const params = { serverUrl: oThis.serverUrl, path: route, method: method, apiParameters: apiParams };

      const responseData = await new HttpLibrary(params).perform();
      responseDataArray.push(responseData);
      await helper.sleep(500);

      try {
        await oThis.validateResponse(responseData, true, {}, dataSchema);
      } catch (error) {
        logger.error('---------------------------');
        logger.error(method.toUpperCase(), route);
        logger.error('params:', apiParams);
        logger.error('Expected response success:', false);
        logger.error('Response HTTP code:', responseData.data.httpCode);
        logger.error('API response:', responseData.data.apiResponse);
        logger.error('Response validation error:', error);
      }
    }
    logger.log('--------------------------- ENDED CUSTOM TESTING APIS ---------------------------');
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
          methodSecurity = methodData.security,
          dataSchema = methodData.responses['200'].content['application/json'].schema,
          cookies = {};

        for(const securityComponent in methodSecurity) {
          const securitySchema = oThis.securitySchemas[securityComponent];
          if(!securitySchema) {
            continue;
          }
          cookies[securitySchema.name] = configProvider.getConfig(securitySchema.name);
        }

        const paramsArray = await oThis.generateApiParamsCombination(methodParams),
          incorrectCombinationsArray = paramsArray.incorrectCombinations,
          correctCombinationsArray = paramsArray.correctCombinations;

        for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
          const paramsElement = incorrectCombinationsArray[combinationIndex];
          const apiParams = paramsElement.apiParams;
          const params = { serverUrl: oThis.serverUrl, path: path, method: method, apiParameters: apiParams };

          const responseData = await new HttpLibrary(params).perform();
          await helper.sleep(500);

          try {
            await oThis.validateResponse(responseData, false, paramsElement.incorrectParamsMap, dataSchema);
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
   *
   * @returns {Promise<void>}
   */
  async validateResponse(responseData, allParamsCorrect, incorrectParamsMap, dataSchema) {
    const oThis = this,
      apiResponse = responseData.data.apiResponse,
      incorrectParamsArray = Object.keys(incorrectParamsMap);

    if (allParamsCorrect) {
      if (apiResponse.success) {
        new SchemaValidator().validateObjectBySchema(apiResponse, dataSchema, 'response');
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
   * Get param value from response for given reference.
   *
   * @param {string} reference
   * @param {array<object>} responseArray
   *
   * @returns {*}
   */
  getValueFromPreviousResponse(reference, responseArray) {
    const pathArray = reference.split('.');
    let response = responseArray;
    for (const path of pathArray) {
      if (path.search('\\$atIndex') != -1 && Array.isArray(response)) {
        const index = Number(path.slice(path.search('\\[') + 1, path.search('\\]')));
        response = response[index];
      } else if (typeof response == 'object' && response != null) {
        response = response[path];
      }
    }

    return response;
  }
}

module.exports = Start;
