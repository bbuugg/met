import './assets/main.css'
import './assets/themes.css'
import adapter from 'webrtc-adapter'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './plugins/i18n'

// if (import.meta.env.MODE !== 'development') {
//   try {
//     setInterval(() => {
//       ;(function () {
//         return false
//       })
//         ['constructor']('debugger')
//         ['call']()
//     }, 50)
//   } catch (e) {}
// }

console.log(adapter.browserDetails.browser)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')