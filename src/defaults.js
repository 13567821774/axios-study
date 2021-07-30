'use strict';
var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');
var enhanceError = require('./core/enhanceError');
// 默认content-type 为
var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};
// 设置content-type,如果当前headers的Content-Type不存在 赋值
function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}
// 获取默认适配器,可以运行在node和浏览器端
function getDefaultAdapter() {
  // 获取实例
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // 如果是浏览器环境
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // 如果是一个node环境,引入http模块
    adapter = require('./adapters/http');
  }
  return adapter;
}
// 创建默认配置
var defaults = {
  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  },
  // 适配器,通过判断不同环境
  adapter: getDefaultAdapter(),
  // 请求之前data转换策略
  transformRequest: [
    function transformRequest(data, headers) {
      // 如果存在且不相等，但是转换大小写后相等
      // 同一变成大写
      normalizeHeaderName(headers, 'Accept');
      normalizeHeaderName(headers, 'Content-Type');
      // 如果其中为formdata或者二进制文件流
      // 返回data，不做处理
      if (
        utils.isFormData(data) ||
        utils.isArrayBuffer(data) ||
        utils.isBuffer(data) ||
        utils.isStream(data) ||
        utils.isFile(data) ||
        utils.isBlob(data)
      ) {
        return data;
      }
      // 如果是二进制缓存组，返回buffer
      if (utils.isArrayBufferView(data)) {
        return data.buffer;
      }
      // 如果是查询字符串实例
      if (utils.isURLSearchParams(data)) {
        // 设置请求头为application/x-www-form-urlencoded;charset=utf-8
        setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
        // 将data转换成string
        return data.toString();
      }
      if (utils.isObject(data) || (headers && headers['Content-Type'] === 'application/json')) {
        // 如果是一个对象，且请求头为json格式
        setContentTypeIfUnset(headers, 'application/json');
        // 转换成json格式
        return JSON.stringify(data);
      }
      return data;
    }
  ],
  // 响应回调，处理返回的值
  transformResponse: [
    function transformResponse(data) {
      var transitional = this.transitional;
      var silentJSONParsing = transitional && transitional.silentJSONParsing;
      var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
      var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

      if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
        // 如果是一个json 将其解析成js对象 返回
        try {
          return JSON.parse(data);
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === 'SyntaxError') {
              throw enhanceError(e, this, 'E_JSON_PARSE');
            }
            throw e;
          }
        }
      }
      // 返回不做任何处理
      return data;
    }
  ],

  /**
   * 请求最大延迟
   * 默认为0
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) {
    // 是否是2XX状态码
    return status >= 200 && status < 300;
  }
};
// 默认头部请求为application/json, text/plain
defaults.headers = {
  common: {
    Accept: 'application/json, text/plain, */*'
  }
};
// 初始化get delete head请求方式
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});
// 初始化['post', 'put', 'patch'],默认请求'Content-Type': 'application/x-www-form-urlencoded'
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});
// 导出一个初始化配置
module.exports = defaults;
