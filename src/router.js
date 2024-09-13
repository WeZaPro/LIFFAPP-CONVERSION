import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Congratulations from '@/views/Congratulations.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/Congratulations',
      component: Congratulations,
    },
  ],
})
