'use strict';

var utils = require('./../utils');
// 拦截器类
function InterceptorManager() {
  this.handlers = [];
}

/**
 * 添加一个新的拦截器
 *
 * @param {Function} fulfilled 解决状态
 * @param {Function} rejected 拒绝状态
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  // 向数组中添加一个对象
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  // 返回当前下标
  return this.handlers.length - 1;
};

/**
 * 删除数组中的拦截器
 *
 * @param {Number} id 需要删除的下标
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * 循环所有拦截器
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    // 循环handlers,将当前handler作为参数执行fn
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;
