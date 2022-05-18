const BigNumber = require('bignumber.js');

/**
 * Class for common validators.
 *
 * @class CommonValidator
 */
class CommonValidator {
  /**
   * Is var integer?
   *
   * @returns {boolean}
   */
  static validateInteger(variable) {
    try {
      const variableInBn = new BigNumber(String(variable));
      // Variable is integer and its length is less than 37 digits
      if (variableInBn.isInteger() && variableInBn.toString(10).length <= 37) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Is var float?
   *
   * @returns {boolean}
   */
  static validateFloat(variable) {
    try {
      const variableInBn = new BigNumber(String(variable));
      // Variable is float and its length is less than 37 digits
      if (!variableInBn.isNaN() && variableInBn.toString(10).length <= 37) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Is string valid ?
   *
   * @returns {boolean}
   */
  static validateString(variable) {
    return typeof variable === 'string';
  }


  /**
   * Is valid integer array?
   *
   * @param {array} array
   *
   * @returns {boolean}
   */
  static validateIntegerArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateInteger(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Validate API validateTransactionStatusArray
   *
   * @param {array<string>} array
   *
   * @returns {boolean}
   */
  static validateStringArray(array) {
    if (Array.isArray(array)) {
      for (let index = 0; index < array.length; index++) {
        if (!CommonValidator.validateString(array[index])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }
}

module.exports = CommonValidator;
