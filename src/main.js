import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

import {
  ButtonGroupPlugin,
  ButtonPlugin,
  JumbotronPlugin,
  LayoutPlugin,
  NavbarPlugin
} from 'bootstrap-vue'

Vue.use(ButtonPlugin)
Vue.use(ButtonGroupPlugin)
Vue.use(JumbotronPlugin)
Vue.use(LayoutPlugin)
Vue.use(NavbarPlugin)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
