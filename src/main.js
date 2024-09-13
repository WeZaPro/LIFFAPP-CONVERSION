import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createGtm } from '@gtm-support/vue-gtm'

createApp(App)
  .use(
    createGtm({
      id: 'GTM-W4TS2Z4Q', // GTM ID
    })
  )
  .use(router)
  .mount('#app')
