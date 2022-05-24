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
  constructor() {
    const oThis = this;

    oThis.openapiObj = configProvider.getConfig('openapiObj');
    oThis.serverIndex = configProvider.getConfig('serverIndex');

    oThis.serverUrl = oThis.openapiObj.definition.servers[oThis.serverIndex].url;
    oThis.allPaths = oThis.openapiObj.definition.paths;
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
          dataSchema = methodData.responses['200'].content['application/json'].schema;

        const paramToTypeMap = {},
          paramTypeArray = [];
        let paramToCorrectValuesMap = {},
          paramCombinationsArray = [];

        for (const param of methodParams) {
          const schema = param.schema,
            paramType = schema.type,
            paramName = param.name;
          paramToTypeMap[paramName] = paramType;

          const schemaTypeObj = new ParamValueSetFactory().getInstance(schema, param.required),
            paramCorrectValues = schemaTypeObj.correctValues(),
            paramIncorrectValues = schemaTypeObj.incorrectValues();

          paramToCorrectValuesMap[paramName] = paramCorrectValues;
          paramCombinationsArray = paramCorrectValues.concat(paramIncorrectValues);

          paramTypeArray.push(paramCombinationsArray);
        }

        const combinationsArray = helper.cartesianProduct(paramTypeArray);

        for (let index = 0; index < combinationsArray.length; index++) {
          const paramsCombination = combinationsArray[index],
            apiParams = {};
          let params = {};

          let paramIndex = 0,
            allParamsCorrect = true,
            incorrectParamsMap = {};
          for (const paramName in paramToTypeMap) {
            const paramValue = paramsCombination[paramIndex].value,
              paramDescription = paramsCombination[paramIndex].description;
            apiParams[paramName] = paramValue;
            const correctValuesArray = paramToCorrectValuesMap[paramName];

            const checkValue = (obj) => obj.value === paramValue;

            if (correctValuesArray.some(checkValue) && allParamsCorrect) {
              allParamsCorrect = true;
            } else {
              incorrectParamsMap[paramName] = paramDescription;
              allParamsCorrect = false;
            }

            paramIndex++;

            params = { serverUrl: oThis.serverUrl, path: path, method: method, apiParameters: apiParams };
          }

          if (allParamsCorrect) {
            continue;
          }

          const responseData = await new HttpLibrary(params).perform();
          await helper.sleep(500);

          try {
            await oThis.validateResponse(responseData, allParamsCorrect, incorrectParamsMap, dataSchema);
          } catch (error) {
            logger.error('---------------------------');
            logger.error(method.toUpperCase(), path);
            logger.error('params:', apiParams);
            logger.error('Expected response success:', allParamsCorrect);
            logger.error('Incorrect Parameters:', incorrectParamsMap);
            logger.error('Response HTTP code:', responseData.data.httpCode);
            logger.error('API response:', responseData.data.apiResponse);
            logger.error('Response validation error:', error);
          }
        }
      }
    }
    logger.log('--------------------------- ENDED TESTING APIS ---------------------------');
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
}

module.exports = Start;
