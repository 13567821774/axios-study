const axios = require('./axios.js');

const instance = axios.create({
  baseURL: 'https://cnodejs.org/api/v1',
  timeout: 1000,
  headers: { 'X-Custom-Header': 'foobar' }
});
instance
  .post('/topic/2/replies', {
    accesstoken: '123213123',
    content: '我是说明'
  })
  .then((res) => {
    console.log(res);
  });
