import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    token: "",
    type: "default" || "department",
  },
  mutations: {
    setToken(state, payload) {
      state.token = payload;
    },
    setType(state, payload) {
      state.type = payload;
      console.log(state.type);
    },
  },
  actions: {},
  modules: {},
});
