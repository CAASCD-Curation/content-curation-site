import { computed, ref } from 'vue'
import { getStudentProjects } from '../services/studentProjects.js'

export function useStudentProjects(year = 2026) {
  const projects = ref([])
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)
  const viewer = ref({ isTeacher: false })

  const publishedProjects = computed(() => projects.value.filter((project) => project.status === 'published'))
  const unpublishedProjects = computed(() => projects.value.filter((project) => project.status !== 'published'))

  const refresh = async () => {
    loading.value = true
    error.value = ''
    try {
      const payload = await getStudentProjects(year)
      projects.value = payload.projects || []
      viewer.value = payload.viewer || { isTeacher: false }
      loaded.value = true
      return payload
    } catch (cause) {
      projects.value = []
      loaded.value = true
      error.value = cause.message || '2026 项目暂时无法读取，请稍后重试。'
      throw cause
    } finally {
      loading.value = false
    }
  }

  return { projects, publishedProjects, unpublishedProjects, viewer, loading, error, loaded, refresh }
}
