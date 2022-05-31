const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for getting security param value set
 *
 * @class SecurityParamValueSet
 */
class SecurityParamValueSet {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    //oThis.schema = schema;
  }

  /**
   * Get values for param int
   *
   * @returns {*[]}
   */
  getValues() {
    const oThis = this;

    const valuesArray = [];

    const securityValues = oThis.securityValuesArray();

    for (let index = 0; index < securityValues.length; index++) {
      const securityVal = securityValues[index];

      valuesArray.push({
        value: securityVal,
        description: ''
      });
    }

    return valuesArray;
  }

  /**
   * Returns security param values array
   *
   * @returns {string[]}
   */
  securityValuesArray() {
    return [
      'OR 1=1#',
      // "OR 1=0#",
      // "AND 1=1 AND '%'='",
      // "AS INJECTX WHERE 1=1 AND 1=0#",
      // "ORDER BY 2-- ",
      // "UNION ALL SELECT 1",
      // "or true--",
      // ";rm -rf /",
      'ls -alt'
      // "echo $cmd"
    ];
  }
}

module.exports = SecurityParamValueSet;
