import './assets/main.css'
import './assets/themes.css'
import adapter from 'webrtc-adapter'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './plugins/i18n'
import '@/api/interceptors'
import * as Sentry from '@sentry/vue'

// if (import.meta.env.MODE !== 'development') {
//   try {
//     setInterval(() => {
//       ;(function () {
//         return false
//       })
//         ['constructor']('debugger')
//         ['call']()
//     }, 50)
//   } catch (e) {
//     //
//   }
// }


console.log(adapter.browserDetails.browser)

const app = createApp(App)

Sentry.init({
  app,
  dsn: 'https://5479ba1faba383dcad6e5bc11988ca2d@o4507849415589888.ingest.us.sentry.io/4507849417424896',
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/vue/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  integrations: []
})

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
