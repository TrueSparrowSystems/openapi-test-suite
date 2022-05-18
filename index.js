const rootPrefix = '.',
  configProvider = require(rootPrefix + '/lib/configProvider'),
  StartTest = require(rootPrefix + '/lib/Suite/Start');

class ApiTestSuite {
  constructor(openapiObj,serverIndex) {
    const oThis = this;

    oThis.openapiObj = openapiObj;
    oThis.serverIndex = serverIndex;

    configProvider.setConfig('openapiObj', openapiObj);
    configProvider.setConfig('serverIndex', serverIndex);
  }

  runTest() {
    console.log('++++++++++++inside runTest');

    const responseData = new StartTest().perform();
  }

  cleanup() {
  }
}

module.exports = ApiTestSuite;
