import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/home/HomePage.vue')
    },
    {
      path: '/meeting/:roomId',
      name: 'MeetingRoom',
      component: () => import('@/views/meeting/MeetingPage.vue'),
      props: true
    },
    {
      path: '/monitoring',
      name: 'Monitoring',
      component: () => import('@/views/monitoring/MonitoringPage.vue')
    },
    { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: '/' }
  ]
})

// Remove auth check for meeting app

export default router