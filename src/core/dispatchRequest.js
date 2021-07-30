'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');

/**
 * 请求取消.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * 将请求发送到服务端，chain数组中.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  // 判断是否请求取消
  throwIfCancellationRequested(config);

  // 默认配置 如果config的headers不存在重置为{}
  config.headers = config.headers || {};

  // 转换data，传入data，headers作为当前执行回调参数
  config.data = transformData.call(config, config.data, config.headers, config.transformRequest);
  // [config.headers.common,config.headers[config.method],config.headers] 循环合并
  // 底层是使用for循环 优先级从右到左
  config.headers = utils.merge(config.headers.common || {}, config.headers[config.method] || {}, config.headers);
  // 将config.header里的所有方法删除
  utils.forEach(['delete', 'get', 'head', 'post', 'put', 'patch', 'common'], function cleanHeaderConfig(method) {
    delete config.headers[method];
  });
  // 不存在适配，使用默认的adapter
  var adapter = config.adapter || defaults.adapter;
  // 返回一个adapter调用后的结果
  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      // Transform response data
      response.data = transformData.call(config, response.data, response.headers, config.transformResponse);

      return response;
    },
    function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            reason.response.data,
            reason.response.headers,
            config.transformResponse
          );
        }
      }

      return Promise.reject(reason);
    }
  );
};
