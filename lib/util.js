const Crypto = require('crypto');

/**
 * Class for utility functions.
 *
 * @class Util
 */
class Util {
  /**
   * Create random string.
   *
   * @returns {string}
   */
  createRandomString() {
    return Crypto.randomBytes(3).toString('hex');
  }

  /**
   * Create random integer.
   *
   * @returns {int}
   */
  /**
   * Create random integer.
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
