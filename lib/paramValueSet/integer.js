const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for getting integer param value set
 *
 * @class IntegerParamValueSet
 */
class IntegerParamValueSet {
  /**
   * Correct values for param int
   *
   * @returns {{description: string, value: number}}
   */
  correctValue() {
    return {
      value: util.getRandomInt(10),
      description: 'Correct random integer'
    };
  }

  /**
   * Incorrect values for param int
   *
   * @returns {*[]}
   */
  incorrectValues() {
    return [
      {
        value: util.getRandomString(),
        description: 'Value cannot be string'
      },
      {
        value: null,
        description: 'Value cannot be null'
      },
      {
        // TODO - Ajinkya, if param is mandatory, then null or undefined are wrong values, otherwise not.
        // eslint-disable-next-line no-undefined
        value: undefined,
        description: 'Value cannot be undefined'
      }
    ];
  }
}

module.exports = new IntegerParamValueSet();
