import Vue from 'vue'
import App from './components/App.vue'

Vue.use(require('vue-resource'));


new Vue({
  el: '#app',
  render: h => h(App)
})
