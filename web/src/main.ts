import './assets/main.css'
import './assets/themes.css'
import './assets/arco-theme.css'
import adapter from 'webrtc-adapter'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './plugins/i18n'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import '@/api/interceptors'

if (import.meta.env.MODE !== 'development') {
  try {
    setInterval(() => {
      ;(function () {
        return false
      })
        ['constructor']('debugger')
        ['call']()
    }, 50)
  } catch (e) {
    //
  }
}

// 监听主题变化并应用到Arco Design
const updateArcoTheme = () => {
  const isDark = document.documentElement.classList.contains('dark')
  if (isDark) {
    document.body.classList.add('arco-theme-dark')
    document.body.classList.remove('arco-theme-light')
  } else {
    document.body.classList.add('arco-theme-light')
    document.body.classList.remove('arco-theme-dark')
  }
}

// 初始设置主题
updateArcoTheme()

// 监听主题变化
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      updateArcoTheme()
    }
  })
})

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class']
})

console.log(adapter.browserDetails.browser)

const app = createApp(App)

app.use(createPinia())
app.use(ArcoVue)
app.use(router)
app.use(i18n)

app.mount('#app')
