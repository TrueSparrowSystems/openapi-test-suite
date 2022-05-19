const PkgBase = require('@moxiedotxyz/base'),
  Logger = PkgBase.Logger;

/**
 * Class for custom console logger.
 *
 * @class LoggerExtended
 */
class LoggerExtended extends Logger {}

// Following is to ensure that INFO logs are printed when debug is off.
let loggerLevel;
const envVal = 'debug';
const strEnvVal = String(envVal).toUpperCase();

if (Object.prototype.hasOwnProperty.call(Logger.LOG_LEVELS, strEnvVal)) {
  loggerLevel = Logger.LOG_LEVELS[strEnvVal];
} else {
  loggerLevel = Logger.LOG_LEVELS.INFO;
}

module.exports = new LoggerExtended('eee-api', loggerLevel);
