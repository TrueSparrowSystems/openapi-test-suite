const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

class IntegerParameterValue {

  correctValue() {
    return {
        //value: util.getRandomInt(10),
        value: 91,
        description: 'Correct random integer'
      };
  }

  incorrectValues() {
    return [
      {
        value: util.createRandomString(),
        description: "Value cannot be string"
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

module.exports = new IntegerParameterValue();
