const rootPrefix = '../..',
  IntegerParamValueSet = require(rootPrefix + '/lib/paramValueSet/Integer'),
  StringParamValueSet = require(rootPrefix + '/lib/paramValueSet/String');
/**
 * Class for Factory
 *
 * @class Factory
 */
class Factory {
  /**
   * Return instance of schema type
   *
   * @returns {*}
   */
  getInstance(schema, isMandatory) {
    const type = schema.type;
    switch (type) {
      case 'number':
        return new IntegerParamValueSet(schema, isMandatory);
      case 'string':
        return new StringParamValueSet(schema, isMandatory);
      default: {
        throw new Error('Unsupported Param type');
      }
    }
  }
}
