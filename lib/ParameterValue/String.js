const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

class StringParameterValue {

  correctValue() {
    return {
        //value: util.createRandomString(),
        value: '9876543233',
        description: 'Correct random string'
      };
  }

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
