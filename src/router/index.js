import { createRouter, createWebHistory } from 'vue-router'

const legacyResourceRoutes = {
  article: 'ResourceArticles',
  video: 'ResourceVideos',
  image: 'ResourceWebsites',
  tool: 'ResourceTools',
}

const firstQueryValue = (value) => (Array.isArray(value) ? value[0] : value)

const cleanLegacyResourceQuery = (query) => {
  const nextQuery = { ...query }
  delete nextQuery.category
  return nextQuery
}

const redirectLegacyResourceQuery = (to) => {
  const category = firstQueryValue(to.query.category)
  const targetName = typeof category === 'string' ? legacyResourceRoutes[category] : undefined

  if (targetName) {
    return {
      name: targetName,
      query: cleanLegacyResourceQuery(to.query),
      replace: true,
    }
  }

  if ('category' in to.query) {
    return {
      name: 'Resources',
      query: cleanLegacyResourceQuery(to.query),
      replace: true,
    }
  }

  return true
}

// 旧网页资源书签只做兼容跳转，不再挂载旧的 images 页面。
const redirectLegacyWebsitePath = (to) => ({
  name: 'ResourceWebsites',
  query: to.query,
  hash: to.hash,
})

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '内容与策展 · 2026 课程网站' },
  },
  {
    path: '/syllabus',
    name: 'Syllabus',
    component: () => import('../views/Syllabus.vue'),
    meta: { title: '教学大纲 · 内容与策展 2026' },
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/Resources.vue'),
    beforeEnter: redirectLegacyResourceQuery,
    meta: { title: '课程资源 · 内容与策展 2026' },
  },
  {
    path: '/resources/articles',
    name: 'ResourceArticles',
    component: () => import('../views/resources/ResourceArticles.vue'),
    meta: { title: '文章资源 · 内容与策展 2026' },
  },
  {
    path: '/resources/articles/:id',
    name: 'ResourceArticleDetail',
    component: () => import('../views/resources/ArticleDetail.vue'),
    props: true,
    meta: { title: '文献阅读 · 内容与策展 2026' },
  },
  {
    path: '/resources/websites',
    name: 'ResourceWebsites',
    component: () => import('../views/resources/ResourceWebsites.vue'),
    meta: { title: '网页 · 内容与策展 2026' },
  },
  {
    path: '/resources/images',
    redirect: redirectLegacyWebsitePath,
  },
  {
    path: '/resources/website',
    redirect: redirectLegacyWebsitePath,
  },
  {
    path: '/resources/videos',
    name: 'ResourceVideos',
    component: () => import('../views/resources/ResourceVideos.vue'),
    meta: { title: '视频资源 · 内容与策展 2026' },
  },
  {
    path: '/resources/tools',
    name: 'ResourceTools',
    component: () => import('../views/resources/ResourceTools.vue'),
    meta: { title: '工具资源 · 内容与策展 2026' },
  },
  {
    path: '/references',
    redirect: { name: 'Resources' },
  },
  {
    path: '/works',
    name: 'Works',
    component: () => import('../views/Works.vue'),
    meta: { title: '学生作品 · 内容与策展 2026' },
  },
  {
    path: '/works/2026/:id',
    name: 'StudentProjectViewer',
    component: () => import('../views/works/StudentProjectViewer.vue'),
    meta: { title: '学生项目 · 内容与策展 2026' },
  },
  {
    path: '/manage',
    name: 'Admin',
    component: () => import('../views/manage/Dashboard.vue'),
    meta: { title: '管理员入口 · 内容与策展 2026' },
  },
  {
    path: '/manage/resources',
    name: 'ManageResources',
    component: () => import('../views/manage/Resources.vue'),
    meta: { title: '资源管理 · 内容与策展 2026' },
  },
  {
    path: '/manage/projects',
    name: 'ManageProjects',
    component: () => import('../views/manage/Projects.vue'),
    meta: { title: '成果管理 · 内容与策展 2026' },
  },
  {
    path: '/manage/media',
    name: 'ManageResourceMedia',
    component: () => import('../views/manage/ResourceMedia.vue'),
    meta: { title: '资源媒体库 · 内容与策展 2026' },
  },
  {
    path: '/student',
    name: 'Student',
    component: () => import('../views/student/Portal.vue'),
    meta: { title: '学生入口 · 内容与策展 2026' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // 课程页会在挂载后展开课次并按锚点定位，避免路由默认滚动抢先覆盖它。
    if (to.hash) return false
    return { top: 0 }
  },
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
})

// 处理部署发版后旧动态 chunk 丢失（Failed to fetch dynamically imported module）导致的路由跳转卡住
router.onError((error, to) => {
  const message = error?.message || ''
  const isChunkLoadFailed =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Unable to preload CSS') ||
    error?.name === 'ChunkLoadError'

  if (isChunkLoadFailed) {
    const targetPath = to?.fullPath || window.location.pathname
    const reloadKey = `chunk_reload_${targetPath}`
    const lastReload = sessionStorage.getItem(reloadKey)
    const now = Date.now()

    // 10 秒内只允许一次自动重载，避免完全离线时陷入死循环
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(reloadKey, String(now))
      window.location.assign(targetPath)
      return
    }
  }

  console.error('Router navigation error:', error)
})

export default router
