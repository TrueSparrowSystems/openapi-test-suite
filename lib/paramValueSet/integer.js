const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for getting integer param value set
 *
 * @class IntegerParamValueSet
 */
class IntegerParamValueSet {
  /**
   * Constructor
   *
   * @param {object} schema
   * @param {bool} isMandatory
   *
   * @constructor
   */
  constructor(schema, isMandatory) {
    const oThis = this;

    oThis.schema = schema;
    oThis.isMandatory = isMandatory;
  }

  /**
   * Correct values for param int
   *
   * @returns {*[]}
   */
  correctValues() {
    const oThis = this;

    const correctValuesArray = [];
    const minLength = oThis.schema.minLength,
      maxLength = oThis.schema.maxLength;
    let paramLength = 0;

    if (minLength && maxLength) {
      paramLength = Math.floor((minLength + maxLength) / 2);
    } else if (minLength) {
      paramLength = minLength;
    } else if (maxLength) {
      paramLength = maxLength;
    }

    const correctValueObj = {
      value: util.getRandomNumber(paramLength),
      description: 'Correct random integer'
    };
    correctValuesArray.push(correctValueObj);

    if (!oThis.isMandatory) {
      correctValuesArray.push(oThis.undefinedValueObj());
    }
    return correctValuesArray;
  }

  /**
   * Incorrect values for param int
   *
   * @returns {*[]}
   */
  incorrectValues() {
    const oThis = this;

    const incorrectValuesArray = [];
    const minLength = oThis.schema.minLength,
      maxLength = oThis.schema.maxLength;

    if (minLength) {
      incorrectValuesArray.push({
        value: util.getRandomNumber(minLength - 1),
        description: 'Value cannot be smaller than required length'
      });
    }
    if (maxLength) {
      incorrectValuesArray.push({
        value: util.getRandomNumber(maxLength + 1),
        description: 'Value cannot be greater than required length'
      });
    }
    if (oThis.isMandatory) {
      incorrectValuesArray.push(oThis.nullValueObj());
      incorrectValuesArray.push(oThis.undefinedValueObj());
    }

    incorrectValuesArray.push({
      value: util.getRandomString(5),
      description: 'Value cannot be string'
    });

    return incorrectValuesArray;
  }

  /**
   * Returns object for undefined value.
   *
   * @returns {*}
   */
  undefinedValueObj() {
    return {
      value: undefined,
      description: 'Value is not defined'
    };
  }

  /**
   * Returns object for null value.
   *
   * @returns {*}
   */
  nullValueObj() {
    return {
      value: null,
      description: 'Value cannot be null'
    };
  }
}

module.exports = IntegerParamValueSet;
