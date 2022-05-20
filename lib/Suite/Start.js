const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  helper = require(rootPrefix + '/lib/helper'),
  StringParameterValue = require(rootPrefix + '/lib/ParameterValue/String'),
  IntegerParameterValue = require(rootPrefix + '/lib/ParameterValue/Integer'),
  SchemaValidator = require(rootPrefix + '/lib/schema/Validate'),
  configProvider = require(rootPrefix + '/lib/configProvider'),
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
    oThis.allPaths  = oThis.openapiObj.definition.paths;

    oThis.stringIncorrectValuesArray = StringParameterValue.incorrectValues();
    oThis.integerIncorrectValuesArray = IntegerParameterValue.incorrectValues();
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

        const stringCombinationsArray = oThis.stringIncorrectValuesArray.concat(StringParameterValue.correctValue()),
          integerCombinationsArray = oThis.integerIncorrectValuesArray.concat(IntegerParameterValue.correctValue());

        const methodData = currentPath[method],
          methodParams = methodData.parameters,
          dataSchema = methodData.responses['200'].content['application/json'].schema;

        const paramToTypeMap = {},
          paramTypeArray = [];

        for (const param of methodParams) {
          const paramType = param.schema.type,
            paramName = param.name;
          paramToTypeMap[paramName] = paramType;

          if(paramType == 'string') {
            paramTypeArray.push(stringCombinationsArray);
          } else if (paramType == 'number') {
            paramTypeArray.push(integerCombinationsArray);
          }
        }

        const combinationsArray = helper.cartesianProduct(paramTypeArray);

        for (let index = 0; index < combinationsArray.length; index++) {
          const paramsCombination = combinationsArray[index],
            apiParams = {};
          let params = {};
          //console.log('paramsCombination-=----->',paramsCombination);

          let paramIndex = 0,
            allParamsCorrect = true,
            incorrectParamsMap = {};
          for (const param in paramToTypeMap) {
            const paramValue = paramsCombination[paramIndex].value,
              paramDescription = paramsCombination[paramIndex].description;
            apiParams[param] = paramValue;


            if(paramToTypeMap[param] == 'string' && paramValue == StringParameterValue.correctValue().value && allParamsCorrect) {
              allParamsCorrect = true;
            } else if(paramToTypeMap[param] == 'number' && paramValue == IntegerParameterValue.correctValue().value && allParamsCorrect) {
              allParamsCorrect = true;
            } else {
              incorrectParamsMap[param] = paramDescription;
              allParamsCorrect = false;
            }

            // Correct case needs logic as well which cannot be done in automated case
            if(allParamsCorrect) {
              continue;
            }

            paramIndex++;
            params = {
              serverUrl: oThis.serverUrl,
              path: path,
              method: method,
              apiParameters: apiParams
            }
          }

          const responseData = await new HttpLibrary(params).perform();
          await helper.sleep(500);

          try{
            await oThis.validateResponse(responseData,allParamsCorrect,incorrectParamsMap,dataSchema);
          } catch(error) {
            logger.error('---------------------------');
            logger.error(method.toUpperCase(),path);
            logger.error('params:',apiParams);
            logger.error('Expected response success:',allParamsCorrect);
            logger.error('Incorrect Parameters:',incorrectParamsMap);
            logger.error('Response HTTP code:',responseData.data.httpCode);
            logger.error('API response:',responseData.data.apiResponse);
            logger.error('Response validation error:', error);
          }
        }
      }
    }
    console.log('--------------------------- ENDED TESTING APIS ---------------------------');

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
  async validateResponse(responseData,allParamsCorrect,incorrectParamsMap,dataSchema) {
    const oThis = this,
      apiResponse = responseData.data.apiResponse,
      incorrectParamsArray = Object.keys(incorrectParamsMap);

    if(allParamsCorrect) {
      if(apiResponse.success) {
        new SchemaValidator().validateObjectBySchema(apiResponse,dataSchema,'response');
      } else {
        throw {
          kind: 'errorRespForCorrectCase'
        };
      }
    } else {
      const errorData = apiResponse.err.error_data;
      for (const error of errorData) {
        const parameter = error.parameter;
        if(!incorrectParamsArray.includes(parameter)) {
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
