'use strict';
// 导入工具库
var utils = require('./utils');
// 导入bind函数，类似原生bind
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * 创建一个axios实例
 *
 * @param {Object} defaultConfig 默认配置
 * @return {Axios} 返回一个axios实例
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  // 返回一个this为Axios的方法
  var instance = bind(Axios.prototype.request, context);

  // 将Axios原型上的属性合并至 instance
  utils.extend(instance, Axios.prototype, context);

  // 将Axios实例化后的属性合并至instance
  utils.extend(instance, context);
  console.log(instance, 123);
  // 返回一个instance
  return instance;
}

// 创一个axios实例,传入默认配置
var axios = createInstance(defaults);

// 讲Axios赋值给实例里的axios
axios.Axios = Axios;

// 创建一个create属性方法来创建新的实例
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = require('./helpers/isAxiosError');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;
