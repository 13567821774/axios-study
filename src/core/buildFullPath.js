'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  // 判断是否requestedURL为一个http：//开始的值
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    // 不是根路径
    return combineURLs(baseURL, requestedURL);
  }
  // 根路径 替换baseurl发送requestedURL
  return requestedURL;
};
