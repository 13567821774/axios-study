const axios = require('./axios.js');

axios.get('https://cnodejs.org/api/v1/topics').then((res) => {
  console.log(res);
});
