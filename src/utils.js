'use strict';

var bind = require('./helpers/bind');

// axios工具库

var toString = Object.prototype.toString;

/**
 * 判断是否是数组
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * 判断一个值是否是undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * 判断一个值是否为buffer类型
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  /*
  1.判断是否是null
  2.判断是否是undefined
  3.判断他的constructor 是否为null
  4.判断他的构造函数是否undefined
  5.判断他的构造函数的isbuffer是不是函数
  6.通过isbuffer来判断val是否是buffer
  */
  return (
    val !== null &&
    !isUndefined(val) &&
    val.constructor !== null &&
    !isUndefined(val.constructor) &&
    typeof val.constructor.isBuffer === 'function' &&
    val.constructor.isBuffer(val)
  );
}

/**
 * 判断是否是一个二进制缓存数组
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * 判断这个值是否是formdata
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return typeof FormData !== 'undefined' && val instanceof FormData;
}

/**
 * 判断是否是arrayBuffer的视图实例
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  // 首先判断arrayBuffer是否存在,且拥有isview方法
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    // 如果没有 判断val是否存在,且是否有buffer属性,在判断buffer是否是arrayBuffer实例
    result = val && val.buffer && val.buffer instanceof ArrayBuffer;
  }
  return result;
}

/**
 * 判断是否是字符串
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * 判断是否是数字
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * 判断是否是Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * 判断是否是一个普通对象
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (toString.call(val) !== '[object Object]') {
    return false;
  }
  // 获取当前原型链
  var prototype = Object.getPrototypeOf(val);
  // 通过原型判断 是null就是顶层object 是object的原型链上
  // 就返回true
  return prototype === null || prototype === Object.prototype;
}

/**
 * 判断是否是Date类型
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * 判断是否是一个file类型
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * 判断是否是Blob类型
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * 判断是否是函数
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * 判断是否是流
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  // 是否是对象,判断里的pipe是否是函数
  return isObject(val) && isFunction(val.pipe);
}

/**
 * 是否是URLSearchParams的实例
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * 去掉首位空格
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * 判断是否是浏览器
 *
 * axios可以运行在react-native和web中.
 * globels不存在.
 *
 * 判断是否是浏览器方式:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * 判断是否是react应用:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (
    typeof navigator !== 'undefined' &&
    (navigator.product === 'ReactNative' || navigator.product === 'NativeScript' || navigator.product === 'NS')
  ) {
    return false;
  }
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // 如果是一个空 就返回
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // 如果不是一个object,把他转换成数组
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // 如果是一个数组
    for (var i = 0, l = obj.length; i < l; i++) {
      // 调用传入的函数，并且把数组里的每一项的值 和下标 数组作为参数调用
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // 如果是一个对象，
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // 循环对象，如果当前的key存在当前对象里，传入当前对象第一项的值和属性，当前对象作为参数调用传入的fn，
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 * 合并相同的值 类似Object.assign,但是他是深拷贝
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    // val 传入对象的每一个值
    // 判断result的key是否对象
    // result里key存在值且为对象，val 也为一个对象
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val); // 递归合并
    } else if (isPlainObject(val)) { // 只有val是一个对象
      result[key] = merge({}, val); // 递归合并
    } else if (isArray(val)) {
      // 将数组浅拷贝后赋值
      result[key] = val.slice();
    } else {
      // 原始类型直接赋值
      result[key] = val;
    }
  }
  // 循环argument
  for (var i = 0, l = arguments.length; i < l; i++) {
    // 取出每一个arguments[i]，执行assignValue
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 * 通过对象b的属性来扩展对象a
 *
 * @param {Object} a 要被扩展的对象a
 * @param {Object} b 被拷贝的对象b
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  // 循环对象b
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      // 如果val是一个函数，将他的this绑定改变
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  return content;
}
// 导出所有工具方法
module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM
};
