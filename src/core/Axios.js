'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var validator = require('../helpers/validator');

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * 将request挂载到原型上
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    // 如果是一个字符串，如果第二个参数存在就变为config，不存在就重置为空对象
    config = arguments[1] || {};
    // 讲配置里的url改为当前字符串
    config.url = arguments[0];
  } else {
    // 如果不是一个字符串，赋值给config
    config = config || {};
  }
  // 将默认配置和传入的config合并
  config = mergeConfig(this.defaults, config);

  // 设置请求方法
  if (config.method) {
    // 如果传入的配置里有methos优先
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    // 默认配置第二
    config.method = this.defaults.method.toLowerCase();
  } else {
    // 最后默认是get
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(
      transitional,
      {
        silentJSONParsing: validators.transitional(validators.boolean, '1.0.0'),
        forcedJSONParsing: validators.transitional(validators.boolean, '1.0.0'),
        clarifyTimeoutError: validators.transitional(validators.boolean, '1.0.0')
      },
      false
    );
  }

  // filter out skipped interceptors
  // 创建一个空的请求拦截器数组
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    /*
    use(fulfilled, rejected, options)
    interceptor {
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
    }
    */
    // 循环request里的数组，如果有个runwhen且为函数，执行后为fasle，跳出当前位次循环，进入下一个
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }
    // synchronousRequestInterceptors置为interceptor里的synchronous值
    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
    // 将handler的fulfilled和rejected拿出来 放在头部
    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  // 和请求拦截器差不多
  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;
  // 如果为false
  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];
    // 给chain头部追加请求拦截器,并且执行
    // requestInterceptorChain = [fulfilled,reject,fulfilled,reject,fulfilled,reject,fulfilled,reject,....]
    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    // 合并响应拦截器
    chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      // 将第一个值和第二个值删除
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }
  // 将合并后的配置保存到newConfig
  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function (url, config) {
    return this.request(
      mergeConfig(config || {}, {
        method: method,
        url: url,
        data: (config || {}).data
      })
    );
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function (url, data, config) {
    return this.request(
      mergeConfig(config || {}, {
        method: method,
        url: url,
        data: data
      })
    );
  };
});

module.exports = Axios;
