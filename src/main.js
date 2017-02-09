import Vue from 'vue'
import App from './App.vue'

Vue.use(require('vue-resource'));

new Vue({
  el: '#app',
  render: h => h(App)
})
