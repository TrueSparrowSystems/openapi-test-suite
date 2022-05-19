const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for string parameter value
 *
 * @class StringParameterValue
 */
class StringParameterValue {

  /**
   * Correct values for param string
   *
   * @returns {{description: string, value: string}}
   */
  correctValue() {
    return {
        //value: util.createRandomString(),
        value: '9876543233',
        description: 'Correct random string'
      };
  }

  /**
   * Incorrect values for param string
   *
   * @returns {*[]}
   */
  incorrectValues() {
    return [
      {
        value: 1,
        description: "Value cannot be integer"
      },
      {
        value: null,
        description: "Value cannot be null"
      },
      {
        value: undefined,
        description: "Value cannot be undefined"
      }
    ];
  }
}
module.exports = new StringParameterValue();
