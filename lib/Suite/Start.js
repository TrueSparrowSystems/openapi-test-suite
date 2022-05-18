const rootPrefix = '../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  helper = require(rootPrefix + '/lib/helper'),
  StringParameterValue = require(rootPrefix + '/lib/ParameterValue/String'),
  IntegerParameterValue = require(rootPrefix + '/lib/ParameterValue/Integer'),
  configProvider = require(rootPrefix + '/lib/configProvider');


class Start {
  /**
   * Constructor
   *
   */
  constructor() {
    const oThis = this;

    oThis.openapiObj = configProvider.getConfig('openapiObj');
    oThis.serverIndex = configProvider.getConfig('serverIndex');

    oThis.serverUrl = oThis.openapiObj.definition.servers[oThis.serverIndex].url;
    oThis.allPaths  = oThis.openapiObj.definition.paths;
  }

  /**
   * Perform
   */
  async perform() {
    const oThis = this;

    await oThis.testAllApis();
  }

  async testAllApis() {
    const oThis = this,
      stringIncorrectValuesArray = StringParameterValue.incorrectValues(),
      integerIncorrectValuesArray = IntegerParameterValue.incorrectValues();

    console.log('stringIncorrectValuesArray-=----->',stringIncorrectValuesArray);


    const stringCombinationsArray = stringIncorrectValuesArray.concat(StringParameterValue.correctValue()),
      integerCombinationsArray = integerIncorrectValuesArray.concat(IntegerParameterValue.correctValue());



    console.log('oThis.allPaths-=----->',oThis.allPaths);

    for (const path in oThis.allPaths) {
      const currentPath = oThis.allPaths[path];
      for (const method in currentPath) {
        const methodData = currentPath[method],
          methodParams = methodData.parameters;
        console.log('methodParams-=----->',methodParams);
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

        console.log('currentPath,method-=----->',currentPath,method);
        console.log('paramTypeArray-=----->',paramTypeArray);
        const combinationsArray = helper.cartesianProduct(paramTypeArray);
        console.log('combinationsArray-=----->',combinationsArray);
        console.log('paramToTypeMap-=----->',paramToTypeMap);

        for (let index = 0; index < combinationsArray.length; index++) {
          const paramsCombination = combinationsArray[index],
            apiParams = {};
          let params = {};
          console.log('paramsCombination-=----->',paramsCombination);

          let paramIndex = 0;
          for (const param in paramToTypeMap) {
            apiParams[param] = paramsCombination[paramIndex].value;

            paramIndex++;
            params = {
              serverUrl: oThis.serverUrl,
              path: path,
              method: method,
              apiParameters: apiParams
            }
          }
          console.log('apiParams[param]-=----->',apiParams);

          const responseData = await new HttpLibrary(params).perform();
          console.log('responseData-=----->',responseData);
        }

      }

    }
  }
}

module.exports = Start;
