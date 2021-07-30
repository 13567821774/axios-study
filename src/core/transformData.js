'use strict';

var utils = require('./../utils');
var defaults = require('./../defaults');

/**
 * 转换请求或者回复中的data
 *
 * @param {Object|String} data 需要转换的data
 * @param {Array} headers 请求或者响应头
 * @param {Array|Function} fns 可以是一个函数或者多个函数
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  var context = this || defaults;
  // 依次执行fns里的所有函数
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers);
  });

  return data;
};
