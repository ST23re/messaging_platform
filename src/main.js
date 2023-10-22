import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import request from "./utils/request";
import mavonEditor from "mavon-editor";
import "mavon-editor/dist/css/index.css";
import { Loading } from "element-ui"; // 按需引入组件

Vue.use(mavonEditor);
Vue.use(Loading.directive);

Vue.config.productionTip = false;
Vue.prototype.$request = request;
Vue.prototype.$loading = Loading.service;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
