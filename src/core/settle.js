'use strict';

var createError = require('./createError');

/**
 * 通过status判断promise回调时失败还是成功.
 *
 * @param {Function} resolve 期约resolve回调.
 * @param {Function} reject 期约拒绝回调.
 * @param {object} response 需要处理返回的数据.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};
