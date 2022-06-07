const Crypto = require('crypto');

/**
 * Class for utility functions.
 *
 * @class Util
 */
class Util {
  /**
   * Get random string.
   *
   * @param {number} stringLength
   *
   * @returns {string}
   */
  getRandomString(stringLength) {
    const iv = new Buffer.from(crypto.randomBytes(stringLength));

    return iv.toString('hex').slice(0, stringLength);
  }

  /**
   * Get random number of given length.
   *
   * @param {number} length
   *
   * @returns {number}
   */
  getRandomNumber(length) {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
  }
}

module.exports = new Util();
