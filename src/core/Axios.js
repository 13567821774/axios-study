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
 * @param {Object} config 传入一个配置项,用来合并默认配置
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
    // 如果传入的配置里有methods优先
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
  // 创建一个空的数组来存放请求拦截器数组
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
  // 和请求拦截器差不多,只不过是从尾部加入拦截器
  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });
  // 创建一个变量来存储当前promise状态
  var promise;
  // 如果请求拦截器传入的options里synchronous为false 或者不存在
  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];
    // 给chain头部追加请求拦截器
    // requestInterceptorChain = [fulfilled,reject,fulfilled,reject,fulfilled,reject,fulfilled,reject,....]
    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    // 合并响应拦截器
    chain.concat(responseInterceptorChain);
    // 存储当前config作为then的回调函数
    promise = Promise.resolve(config);
    // 循环chain 直到chain为空跳出循环
    while (chain.length) {
      // 将第一个值和第二个值删除，并执行
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
  // 合并配置
  config = mergeConfig(this.defaults, config);
  // 将地址中带？ 全部替换成''
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// 给axios原型上注册['delete', 'get', 'head', 'options'],实现axios.get可调用
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  Axios.prototype[method] = function (url, config) {
    // 其实axios.get类似 最终调用request方法,将method作为参数传入
    return this.request(
      mergeConfig(config || {}, {
        method: method,
        url: url,
        data: (config || {}).data
      })
    );
  };
});
// 给axios原型上注册['post', 'put', 'patch'],实现axios.post可调用
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
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
