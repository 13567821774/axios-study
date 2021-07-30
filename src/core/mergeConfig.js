'use strict';
var utils = require('../utils');

/**
 * 合并config
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};
  // 传入的参数
  var valueFromConfig2Keys = ['url', 'method', 'data'];
  // 需要递归合并的参数
  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
  // axios默认的参数
  var defaultToConfig2Keys = [
    'baseURL',
    'transformRequest',
    'transformResponse',
    'paramsSerializer',
    'timeout',
    'timeoutMessage',
    'withCredentials',
    'adapter',
    'responseType',
    'xsrfCookieName',
    'xsrfHeaderName',
    'onUploadProgress',
    'onDownloadProgress',
    'decompress',
    'maxContentLength',
    'maxBodyLength',
    'maxRedirects',
    'transport',
    'httpAgent',
    'httpsAgent',
    'cancelToken',
    'socketPath',
    'responseEncoding'
  ];
  var directMergeKeys = ['validateStatus'];

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      // 如果是两个都是对象
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      // 如果只有source是对象
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      // 如果source是个数组
      return source.slice();
    }
    // 都不是代表是基础类型,直接返回source
    return source;
  }

  function mergeDeepProperties(prop) {
    // 如果传入配置 存在当前项
    if (!utils.isUndefined(config2[prop])) {
      // 两个配置合并
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      // 只有默认配置,将默认配置放置config
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  }
  // ['url', 'method', 'data']循环添加到config中
  utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      console.log(getMergedValue(undefined, config2[prop]));
      config[prop] = getMergedValue(undefined, config2[prop]);
    }
  });
  // 循环['headers', 'auth', 'proxy', 'params'] 传入配置和默认配置循环合并
  utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);
  // 将默认配置和传入的配置合并
  utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });
  // ['validateStatus'] 循环合并配置
  utils.forEach(directMergeKeys, function merge(prop) {
    if (prop in config2) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });
  // 将所有axios的默认配置组合成一个数组
  var axiosKeys = valueFromConfig2Keys
    .concat(mergeDeepPropertiesKeys)
    .concat(defaultToConfig2Keys)
    .concat(directMergeKeys);
  // 两个配置合并,返回axiosKeys里不存在的配置
  var otherKeys = Object.keys(config1)
    .concat(Object.keys(config2))
    .filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1;
    });
  // 配置循环 依次执行mergeDeepProperties,合并配置,将当前的otherKeys每一个项合并至config
  utils.forEach(otherKeys, mergeDeepProperties);
  return config;
};
