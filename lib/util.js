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
   * @returns {string}
   */
  getRandomString() {
    return Crypto.randomBytes(3).toString('hex');
  }

  /**
   * Get random integer.
   *
   * @param max
   *
   * @returns {number}
   */
  getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
}

module.exports = new Util();
