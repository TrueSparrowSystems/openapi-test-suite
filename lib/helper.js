/**
 * Class for basic helper methods.
 *
 * @class BasicHelper
 */
class BasicHelper {
  /**
   * Compare two arrays.
   *
   * @param {array} firstArray
   * @param {array} secondArray
   *
   * @returns {boolean}
   */
  cartesianProduct(inputArray) {
    var r = [], max = inputArray.length-1;
    function helper(arr, i) {
      for (var j=0, l=inputArray[i].length; j<l; j++) {
        var a = arr.slice(0); // clone arr
        a.push(inputArray[i][j]);
        if (i==max)
          r.push(a);
        else
          helper(a, i+1);
      }
    }
    helper([], 0);
    return r;
  }

  /**
   * Sleep for particular time.
   *
   * @param {number} ms: time in ms
   *
   * @returns {Promise<any>}
   */
  sleep(ms) {
    // eslint-disable-next-line no-console
    //logger.log(`Sleeping for ${ms} ms.`);

    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }
}

module.exports = new BasicHelper();
