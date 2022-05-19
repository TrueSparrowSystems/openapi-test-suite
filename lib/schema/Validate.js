const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  configProvider = require(rootPrefix + '/lib/configProvider');

/**
 * Class for schema validation
 *
 * @class Validate
 */
class Validate {

  /**
   * Constructor
   *
   * @constructor
   */
  constructor(){
    const oThis = this;

    oThis.openapiObj = configProvider.getConfig('openapiObj');
  }
  /**
   * Validate object by schema
   *
   * @param {object|array} dataToBeValidated
   * @param {object} dataSchema
   * @param {string} debugLevel
   *
   * @returns {Promise<void>}
   */
  validateObjectBySchema(dataToBeValidated,dataSchema,debugLevel) {
    const oThis = this;

    if(dataSchema['$ref']){
      const reference = dataSchema['$ref'];
      const refArray = reference.split('/');
      const schemaName = refArray[refArray.length - 1];
      dataSchema = oThis.openapiObj.definition.components.schemas[schemaName];
    }

    if(dataSchema.type === 'integer'){
      if(!CommonValidators.validateInteger(dataToBeValidated)){
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }
    }else if(dataSchema.type === 'string'){
      if(!CommonValidators.validateString(dataToBeValidated)){
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }
    }else if(dataSchema.type === 'boolean'){
      if(!CommonValidators.validateBoolean(dataToBeValidated)){
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }
    }else if(dataSchema.type === 'object'){
      if(!CommonValidators.validateObject(dataToBeValidated)){
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
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
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }

      for(let index = 0; index < dataToBeValidated.length; index++ ){
        oThis.validateObjectBySchema(dataToBeValidated[index], dataSchema.items,`${debugLevel}.[${index}]`);
      }

    }
  }
}

module.exports =  Validate;
