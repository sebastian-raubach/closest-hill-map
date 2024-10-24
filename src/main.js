import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

import {
  ButtonGroupPlugin,
  ButtonPlugin,
  FormGroupPlugin,
  FormInputPlugin,
  FormPlugin,
  FormRadioPlugin,
  FormTextareaPlugin,
  ImagePlugin,
  InputGroupPlugin,
  JumbotronPlugin,
  LayoutPlugin,
  ModalPlugin,
  NavbarPlugin
} from 'bootstrap-vue'

Vue.use(ButtonPlugin)
Vue.use(ButtonGroupPlugin)
Vue.use(FormPlugin)
Vue.use(FormGroupPlugin)
Vue.use(FormInputPlugin)
Vue.use(FormRadioPlugin)
Vue.use(FormTextareaPlugin)
Vue.use(ImagePlugin)
Vue.use(InputGroupPlugin)
Vue.use(JumbotronPlugin)
Vue.use(LayoutPlugin)
Vue.use(ModalPlugin)
Vue.use(NavbarPlugin)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
