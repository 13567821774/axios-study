'use strict';

/**
 * 合并baseurl和relativeURL
 *
 * @param {string} baseURL 基础url
 * @param {string} relativeURL 后面的拼接url
 * @returns {string} 返回新的url
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  // 如果存在relativeURL，合并baseURL后面的所有// 和relativeURL前面的所有// 合并后成为一个/
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    // 不存在 返回baseURL
    : baseURL;
};
