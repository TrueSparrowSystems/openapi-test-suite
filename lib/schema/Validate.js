const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common');


/**
 * Class for schema validation
 */
class Validate {

  /**
   * @param {object|array} dataToBeValidated
   * @param {object} dataSchema
   * @param {string} name
   *
   * @returns {Promise<void>}
   */
  validateObjectBySchema(dataToBeValidated,dataSchema,name) {
    const oThis = this;

    if(dataSchema.type === 'integer'){
      if(!CommonValidators.validateInteger(dataToBeValidated)){
        console.log('dataToBeValidated: ',dataToBeValidated,'dataSchema: ',dataSchema);
      }
      return;
    }else if(dataSchema.type === 'string'){
      if(!CommonValidators.validateString(dataToBeValidated)){
        console.log('dataToBeValidated: ',dataToBeValidated,'dataSchema: ',dataSchema);
      }
      return;
    }else if(dataSchema.type === 'object'){
      if(dataSchema.hasOwnProperty('additionalProperties')){
        for (const prop in dataToBeValidated) {
          oThis.validateObjectBySchema(dataToBeValidated[prop], dataSchema.additionalProperties);
        }
      } else{
        for (const prop in dataToBeValidated) {
          oThis.validateObjectBySchema(dataToBeValidated[prop], dataSchema.properties[prop]);
        }
      }
    }else if(dataSchema.type === 'array'){
      if(dataSchema.items.type === 'integer'){
        if(!CommonValidators.validateIntegerArray(dataToBeValidated)){
          console.log('dataToBeValidated: ',dataToBeValidated,'dataSchema: ',dataSchema);
        }
      }else if(dataSchema.items.type === 'string'){
        if(!CommonValidators.validateStringArray(dataToBeValidated)){
          console.log('dataToBeValidated: ',dataToBeValidated,'dataSchema: ',dataSchema);
        }
      }else if(dataSchema.items.type === 'object'){
        for(let index = 0;index < dataToBeValidated.length;index++){
          const dataToBeValidatedObj = dataToBeValidated[index];
          if(dataSchema.hasOwnProperty('additionalProperties')){
            for (const prop in dataToBeValidatedObj) {
              oThis.validateObjectBySchema(dataToBeValidatedObj[prop], dataSchema.additionalProperties);
            }
          } else{
            for (const prop in dataToBeValidated) {
              oThis.validateObjectBySchema(dataToBeValidatedObj[prop], dataSchema.properties[prop]);
            }
          }
        }
      }
    }else{
      console.log('');
    }
  }

}

module.exports = new Validate();