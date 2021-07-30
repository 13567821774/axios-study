'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    // 循环传入的headers，如果有一项不相等但是全部转换成大写后相等
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      // 重新增加转换成大写的值
      headers[normalizedName] = value;
      // 删除小写的
      delete headers[name];
    }
  });
};
