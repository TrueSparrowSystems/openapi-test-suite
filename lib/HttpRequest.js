const queryString = require('qs'),
  https = require('https'),
  http = require('http'),
  url = require('url');

 const rootPrefix = '..',
//   logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
   responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for HTTP request.
 *
 * @class HttpRequest
 */
class HttpRequest {
  /**
   * Constructor for HTTP request.
   *
   * @param {object} params
   * @param {string} params.serverUrl
   * @param {string} params.path
   * @param {string} params.method
   * @param {object} params.apiParameters
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.serverUrl = params.serverUrl;
    oThis.path = params.path;
    oThis.method = params.method;
    oThis.apiParameteres = params.apiParameters;

    oThis.isJsonResp = false;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;

    return oThis._setRequestType();
  }

  /**
   * Set request type
   *
   * @sets oThis.requestType
   *
   */
  async _setRequestType(){
    const oThis = this;

    if(oThis.method == 'get'){
      return oThis._send('GET', oThis.apiParameteres);
    } else if (oThis.method == 'post'){
      return oThis._send('POST', oThis.apiParameteres);
    }
  }

  /**
   * Get parsed URL
   *
   * @param {string} serverUrl: API server Url
   *
   * @return {object} - parsed url object
   * @private
   */
  _parseURL(serverUrl) {
    return url.parse(serverUrl);
  }

  /**
   * Send request.
   *
   * @param {string} requestType: API request type
   * @param {object} queryParams: resource query parameters
   *
   * @returns {Promise<*>}
   * @private
   */
  async _send(requestType, queryParams) {
    const oThis = this;

    const parsedURL = oThis._parseURL(oThis.serverUrl + oThis.path),
      requestData = oThis.formatQueryParams(queryParams);

    const options = {
      host: parsedURL.hostname,
      port: parsedURL.port,
      path: parsedURL.path,
      method: requestType,
      timeout: 300000,
      headersTimeout: 300000,
      keepAliveTimeout: 300000
    };

    if (requestType === 'GET' && requestData) {
      options.path = options.path + '?' + requestData;
    } else if (requestType === 'POST' && requestData) {
      options.headers['Content-Length'] = Buffer.byteLength(requestData);
    }

    if (parsedURL.auth) {
      options.auth = parsedURL.auth;
    }

    return new Promise(function(onResolve, onReject) {
      let chunkedResponseData = '';

      const request = (parsedURL.protocol === 'https:' ? https : http).request(options, function(response) {
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
          chunkedResponseData += chunk;
        });

        response.on('end', function() {
          const apiResp = JSON.parse(chunkedResponseData);

          if (typeof apiResp === 'object' && apiResp !== null) {
            oThis.isJsonResp = true;
          }

          onResolve(
              responseHelper.successWithData({
                respHeaders: response.headers,
                httpCode: response.statusCode,
                apiResponse: apiResp,
                isJsonResp: oThis.isJsonResp
              })
          );
        });
      });

      request.on('error', function(err) {
        onReject(
          responseHelper.error({
            internal_error_identifier: 'l_hr_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: { error: err }
          })
        );
      });

      // Write data to server
      if (requestType === 'POST') {
        request.write(requestData);
      }

      request.end();
    });
  }

  /**
   * Format query params.
   *
   * @param {object/string} queryParams: query params
   *
   * @returns {void | string | never}
   */
  formatQueryParams(queryParams) {
    const oThis = this;

    return queryString.stringify(queryParams).replace(/%20/g, '+');
  }
}

module.exports = HttpRequest;
