const rootPrefix = '.',
  configProvider = require(rootPrefix + '/lib/configProvider');

class ApiTestSuite {
  constructor(openapiObj,serverIndex) {
    const oThis = this;

    oThis.openapiObj = openapiObj;
    oThis.serverIndex = serverIndex;
    configProvider.setConfig('openapiObj', openapiObj);
    configProvider.setConfig('serverIndex', serverIndex);
  }

  runTest() {
    console.log('inside runTest');
  }
}

module.exports = ApiTestSuite;
