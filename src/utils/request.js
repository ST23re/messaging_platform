import axios from "axios";
import store from "../store";
import router from "../router";

const service = axios.create({
  baseURL: "https://qnhd.twt.edu.cn/api/v1/f", //配置公用地址
  withCredentials: false,
  timeout: 5000, //响应延迟时间
});
var is_refresh;
//设置请求拦截器
service.interceptors.request.use(
  (config) => {
    if (!is_refresh)
      if (config.method === "get" || config.method === "post")
        config.params = {
          ...config.params,
          token: store.state.token.length
            ? store.state.token
            : router.app._route.query.token,
        };
    return config;
  },
  (err) => {
    console.log(err);
  }
);
//设置响应拦截器
service.interceptors.response.use(
  ({ data: res }) => {
    // console.log(res);
    if (res.code === 200) return res;
    else if (res.code === 20001) {
      is_refresh = true;
      return res;
    } else {
      console.log(res);
      return Promise.reject("网络请求异常，请稍后重试");
    }
  },
  (err) => {
    console.log(err);
  }
);

function request(options) {
  options.method = options.method || "get";
  if (options.method.toLowerCase() === "get") options.params = options.data;
  return service(options);
}
["get", "post", "put", "delete", "patch"].forEach((item) => {
  request[item] = (url, data, options) => {
    return request({
      url,
      method: item,
      data,
      ...options,
    });
  };
});

export default request;
