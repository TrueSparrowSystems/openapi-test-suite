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
   * Is valid Boolean?
   *
   * @returns {boolean}
   */
  static validateBoolean(str) {
    const oThis = this;

    if (oThis.isVarNullOrUndefined(str)) {
      return false;
    }

    return str === 'true' || str === 'false' || str === true || str === false;
  }

  /**
   * Is var null or undefined?
   *
   * @param {object/string/integer/boolean} variable
   *
   * @returns {boolean}
   */
  static isVarNullOrUndefined(variable) {
    return typeof variable === 'undefined' || variable == null;
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
   *  Is valid array?
   *
   *  @param {array} array
   *
   *  @returns {boolean}
   */
  static validateArray(array) {
    return Array.isArray(array);
  }

  /**
   * Validate object.
   *
   * @param {object} variable
   *
   * @returns {boolean}
   */
  static validateObject(variable) {
    return !(CommonValidator.isVarNullOrUndefined(variable) || typeof variable !== 'object');
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
