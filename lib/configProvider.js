let _inMemoryConfig = {};

class ConfigProvider {
  constructor() {
  }

  getConfig(key) {
    return _inMemoryConfig[key];
  }

  setConfig(key, value){
    _inMemoryConfig[key] = value;
  }

  deleteConfig() {
    _inMemoryConfig = {};
  }
}

module.exports = new ConfigProvider();
