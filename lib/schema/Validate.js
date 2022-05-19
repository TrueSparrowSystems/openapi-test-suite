const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  configProvider = require(rootPrefix + '/lib/configProvider');

/**
 * Class for schema validation
 */
class Validate {

  constructor(){
    const oThis = this;

    oThis.openapiObj = configProvider.getConfig('openapiObj');
  }
  /**
   * @param {object|array} dataToBeValidated
   * @param {object} dataSchema
   * @param {string} debugLevel
   *
   * @returns {Promise<void>}
   */
  validateObjectBySchema(dataToBeValidated,dataSchema,debugLevel) {
    const oThis = this

    if(dataSchema['$ref']){
      const reference = dataSchema['$ref'];
      const refArray = reference.split('/');
      const schemaName = refArray[refArray.length - 1];
      dataSchema = oThis.openapiObj.definition.components.schemas[schemaName];
    }

    if(dataSchema.type === 'integer'){
      if(!CommonValidators.validateInteger(dataToBeValidated)){
        throw new Error(
          `Type mismatch error. ${debugLevel} must be of type ${dataSchema.type}`
        );
      }
    }else if(dataSchema.type === 'string'){
      if(!CommonValidators.validateString(dataToBeValidated)){
        throw new Error(
          `Type mismatch error. ${debugLevel} must be of type ${dataSchema.type}`
        );
      }
    }else if(dataSchema.type === 'boolean'){
      if(!CommonValidators.validateBoolean(dataToBeValidated)){
        throw new Error(
          `Type mismatch error. ${debugLevel} must be of type ${dataSchema.type}`
        );
      }
    }else if(dataSchema.type === 'object'){
      if(!CommonValidators.validateObject(dataToBeValidated)){
        throw new Error(
          `Type mismatch error. ${debugLevel} must be of type ${dataSchema.type}`
        );
      }
      if(dataSchema.hasOwnProperty('additionalProperties')){

        for (const prop in dataToBeValidated) {
         oThis.validateObjectBySchema(dataToBeValidated[prop], dataSchema.additionalProperties, `VALUE(${debugLevel})`);
        }
      } else if(dataSchema.hasOwnProperty('properties')){
        for (const prop in dataToBeValidated) {
         oThis.validateObjectBySchema(dataToBeValidated[prop], dataSchema.properties[prop],`${debugLevel}.${prop}`);
        }
      }
    }else if(dataSchema.type === 'array'){
      if(!CommonValidators.validateArray(dataToBeValidated)){
        throw new Error(
          `Type mismatch error. ${debugLevel} must be of type ${dataSchema.type}`
        );
      }

      for(let index = 0; index < dataToBeValidated.length; index++ ){
        oThis.validateObjectBySchema(dataToBeValidated[index], dataSchema.items,`${debugLevel}.[${index}]`);
      }

    }
  }
}

module.exports =  Validate;
