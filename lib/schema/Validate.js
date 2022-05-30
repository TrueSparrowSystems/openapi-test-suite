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
  constructor() {
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
  validateObjectBySchema(dataToBeValidated, dataSchema, debugLevel) {
    const oThis = this;

    // If schema is referring to components section, fetch the actual schema.
    if (dataSchema.$ref) {
      const reference = dataSchema.$ref;
      const refArray = reference.split('/');
      const schemaName = refArray[refArray.length - 1];
      dataSchema = oThis.openapiObj.definition.components.schemas[schemaName];
    }

    if (dataSchema.type === 'integer') {
      // Recursion base case 1: if type is integer.
      if (!CommonValidators.validateInteger(dataToBeValidated)) {
        // eslint-disable-next-line no-throw-literal
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }
    } else if (dataSchema.type === 'string') {
      // Recursion base case 2: if type is string.
      if (!CommonValidators.validateString(dataToBeValidated)) {
        // eslint-disable-next-line no-throw-literal
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }
    } else if (dataSchema.type === 'boolean') {
      // Recursion base case 3: if type is boolean.
      if (!CommonValidators.validateBoolean(dataToBeValidated)) {
        // eslint-disable-next-line no-throw-literal
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }
    } else if (dataSchema.type === 'object') {
      // If type is object, then check schema for keys and values as well.
      if (!CommonValidators.validateObject(dataToBeValidated)) {
        // eslint-disable-next-line no-throw-literal
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }
      const requiredPropertiesArr = dataSchema.required || [];
      const requiredPropertiesMap = {};
      for (const prop of requiredPropertiesArr) {
        requiredPropertiesMap[prop] = 1;
      }

      if (dataSchema.hasOwnProperty('additionalProperties')) {
        for (const prop in dataToBeValidated) {
          if (CommonValidators.isVarNullOrUndefined(dataToBeValidated[prop]) && !requiredPropertiesMap[prop]) {
            continue;
          }
          oThis.validateObjectBySchema(
            dataToBeValidated[prop],
            dataSchema.additionalProperties,
            `VALUE(${debugLevel})`
          );
        }
      } else if (dataSchema.hasOwnProperty('properties')) {
        for (const prop in dataToBeValidated) {
          if (CommonValidators.isVarNullOrUndefined(dataToBeValidated[prop]) && !requiredPropertiesMap[prop]) {
            continue;
          }
          oThis.validateObjectBySchema(dataToBeValidated[prop], dataSchema.properties[prop], `${debugLevel}.${prop}`);
        }
      }
    } else if (dataSchema.type === 'array') {
      // If type is array, then check schema for each element.
      if (!CommonValidators.validateArray(dataToBeValidated)) {
        // eslint-disable-next-line no-throw-literal
        throw {
          kind: 'respEntityTypeMismatch',
          debugLevel: debugLevel,
          schemaType: dataSchema.type
        };
      }

      for (let index = 0; index < dataToBeValidated.length; index++) {
        oThis.validateObjectBySchema(dataToBeValidated[index], dataSchema.items, `${debugLevel}.[${index}]`);
      }
    }
  }
}

module.exports = Validate;
