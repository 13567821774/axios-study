'use strict';

module.exports = function bind(fn, thisArg) {
  // 返回一个函数
  return function wrap() {
    // 创建一个长度为不定参的数组
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    // this绑定
    return fn.apply(thisArg, args);
  };
};
