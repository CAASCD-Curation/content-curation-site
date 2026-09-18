<template>
  <main class="project-viewer" :class="{ 'is-loading': loading }">
    <a class="skip-link" href="#project-frame">跳转到项目网站</a>

    <section v-if="loading" class="project-viewer-message" role="status">正在打开学生项目……</section>
    <section v-else-if="error" class="project-viewer-message is-error" role="alert">
      <p>{{ error }}</p><router-link to="/works?year=2026">返回成果目录</router-link>
    </section>
    <template v-else-if="project">
      <iframe
        id="project-frame"
        class="project-viewer-frame"
        :src="project.liveUrl"
        :title="`${project.title} 学生项目网站`"
        allow="fullscreen"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </template>
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStudentProject } from '../../services/studentProjects.js'

const route = useRoute()
const router = useRouter()
const project = ref(null)
const loading = ref(true)
const error = ref('')
let previousOverflow = ''

const projectId = () => Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
const loadProject = async () => {
  loading.value = true
  error.value = ''
  project.value = null
  try {
    const payload = await getStudentProject(2026, projectId())
    const item = payload.project || payload
    if (!item?.liveUrl) throw new Error('该项目尚未提供可访问的网站地址。')
    project.value = item
  } catch (cause) {
    error.value = cause.status === 404 ? '未找到已发布的项目。' : (cause.message || '项目暂时无法读取，请稍后重试。')
  } finally {
    loading.value = false
  }
}

const closeViewer = () => router.push({ path: '/works', query: { year: '2026' } })
const onKeydown = (event) => {
  if (event.key === 'Escape') closeViewer()
}

watch(() => route.params.id, loadProject)
onMounted(() => {
  previousOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
  loadProject()
})
onBeforeUnmount(() => {
  document.documentElement.style.overflow = previousOverflow
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.project-viewer {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  height: 100dvh;
  overflow: hidden;
  color: var(--ink);
  background: var(--paper);
}

.project-viewer-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
}

.project-viewer-message {
  display: grid;
  place-content: center;
  height: 100%;
  padding: 2rem;
  color: var(--muted);
}

.project-viewer-message.is-error {
  gap: 1rem;
  color: var(--ink);
}

.project-viewer-message a {
  width: fit-content;
  min-height: 44px;
  padding: .6rem .75rem;
  border: 1px solid var(--ink);
  font-size: .8rem;
  text-decoration: none;
}

@media (prefers-reduced-motion: reduce) {
  .project-viewer * {
    scroll-behavior: auto !important;
  }
}
</style>
