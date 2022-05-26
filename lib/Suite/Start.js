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
    oThis.globalSecurity = oThis.openapiObj.definition.security;
    oThis.securitySchemas = oThis.openapiObj.definition.components.securitySchemes;

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

    configProvider.setConfig(
      'adlc',
      's%3A1%3Aapp%3A100000%3Aphone%3A1653560950.076%3A720c6f85366001c736ea80d344e477617a53a752c8e88e46f157d146c0612639.RRESJXHIe5Q3XdOiAqYk60kStWoiRhQuGxxLFNYEcw0'
    );
    configProvider.setConfig('abcd', 's%3Aabc1325.Ur%2BCnUUZqGAGQhnaULPX9lyT6Ps%2F4d0uceJ8vxS1oS8');

    // const globalCookies = [];

    // for(const securityComponent in oThis.globalSecurity) {
    //   const securitySchema = oThis.securitySchemas[securityComponent];
    //   if(!securitySchema) {
    //     throw new Error('No security schema found for - ' + securityComponent);
    //   }
    //   const cookieData = configProvider.getConfig(securitySchema.name);
    //   if (cookieData){
    //     globalCookies.push(securitySchema.name + '=' + cookieData.value);
    //   }
    // }

    for (const path in oThis.allPaths) {
      const currentPath = oThis.allPaths[path];
      for (const method in currentPath) {
        const methodData = currentPath[method],
          methodParams = methodData.parameters,
          methodSecurity = methodData.security,
          dataSchema = methodData.responses['200'].content['application/json'].schema,
          reqHeaders = configProvider.getConfig(requestHeaders);

        let authData = {},
          cookie = '',
          header = {};

        for (const securityComponent in methodSecurity) {
          const securitySchema = oThis.securitySchemas[securityComponent];
          if (!securitySchema) {
            throw new Error('No security schema found for - ' + securityComponent);
          }
          authData = configProvider.getConfig(securityComponent);
          cookie = cookie + '; ' + authData.cookies;

          header = authData.headers;
        }

        for (const key in header) {
          reqHeaders[key] = header[key];
        }

        reqHeaders[Cookie] = cookie;

        console.log('methodParams-----', methodParams);
        console.log('reqHeaders--------', reqHeaders);

        const paramsArray = await oThis.generateApiParamsCombination(methodParams),
          incorrectCombinationsArray = paramsArray.incorrectCombinations,
          correctCombinationsArray = paramsArray.correctCombinations;

        for (let combinationIndex = 0; combinationIndex < incorrectCombinationsArray.length; combinationIndex++) {
          const paramsElement = incorrectCombinationsArray[combinationIndex];
          const apiParams = paramsElement.apiParams;
          const params = {
            serverUrl: oThis.serverUrl,
            path: path,
            method: method,
            apiParameters: apiParams,
            header: reqHeaders
          };

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
}

module.exports = Start;
