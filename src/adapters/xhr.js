'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');
// xhr
module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    // 将配置中的data headers responseType存到变量中
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;
    // 如果请求需要的data为formdata
    if (utils.isFormData(requestData)) {
      // 把Content-Type删除，让浏览器自动添加头部
      delete requestHeaders['Content-Type'];
    }
    // 创建一个XMLHttpRequest对象
    var request = new XMLHttpRequest();

    // 身份验证
    if (config.auth) {
      // username如果不存在默认为空字符串
      var username = config.auth.username || '';
      // 如果密码存在，用特殊的UTF-8替换无用代码 如空格，不存在为空
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      // Authorization的值变为Basic + 字符串拼接 ==> Basic 'username':'password'
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }
    // 合并基础url和接口url
    var fullPath = buildFullPath(config.baseURL, config.url);
    // 初始化请求，请求方法转成大写
    // 传递的参数url
    // 异步
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // 设置最大等待时间
    request.timeout = config.timeout;
    // 请求结束产生的回调
    function onloadend() {
      // 如果request不存在
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData =
        !responseType || responseType === 'text' || responseType === 'json' ? request.responseText : request.response;
      // 将请求处理后数据返回
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };
      // 通过status判断promise时fulfilled状态还是reject状态
      settle(resolve, reject, response);

      // 清除请求
      request = null;
    }
    // 判断当前对象是否存在onloadend
    if ('onloadend' in request) {
      // 如果onloadend存在
      request.onloadend = onloadend;
    } else {
      // 不存在
      // 模拟onloadend
      // 通过监听当前ajax的onreadystatechange
      request.onreadystatechange = function handleLoad() {
        // 如果request不存在或者readyState 不是4，表示操作未完成，return
        if (!request || request.readyState !== 4) {
          return;
        }

        // 请求出错
        // 出现错误，判断是否是文件，因为文件也是返回0
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // 当请求被终止的回调
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // 清空request
      request = null;
    };

    // 报错回调
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // 超时回调
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(
        createError(
          timeoutErrorMessage,
          config,
          config.transitional && config.transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
          request
        )
      );

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // 判断是否是浏览器环境或者react-native环境
    if (utils.isStandardBrowserEnv()) {
      // 获取xsrfCookieName
      var xsrfValue =
        // 如果使用token或者是同源，xsrfCookieName存在
        (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName
          ? cookies.read(config.xsrfCookieName)
          : undefined;
      // 如果存在
      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // 设置用户请求头
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // 如果data不存在,且当前的key为content-type,清除content-type
          delete requestHeaders[key];
        } else {
          // 使用request的setrequestHeader设置请求头
          request.setRequestHeader(key, val);
        }
      });
    }

    // 设置cookie凭证是否允许
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // 设置返回的格式
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // 设置下载监听，支持就监听进度条
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // 浏览器是否支持上传监听，支持就监听进度条
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (!requestData) {
      // 如果没有传参,置为null
      requestData = null;
    }
    // Send the request
    request.send(requestData);
  });
};
