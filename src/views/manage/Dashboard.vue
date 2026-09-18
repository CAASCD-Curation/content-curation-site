<template>
  <div class="admin-page home-page">
    <HomeSiteNav />
    <main class="admin-main home-main">
      <section class="home-section admin-section" aria-labelledby="admin-title">
        <div class="section-grid admin-heading">
          <div class="section-title-column">
            <p class="eyebrow">Teacher Access</p>
            <h1 id="admin-title">管理员<br />入口</h1>
          </div>
          <div class="section-copy-column">
            <p class="lead-copy">统一维护词条、空间归属与 16 个小组选词。公共页面只读，保存结果会立即同步到主页和课程详情。</p>
            <p class="micro-copy">教师可导入学生名单、安排小组并生成邀请码；学生账号由教师统一管理。</p>
          </div>
        </div>

        <form v-if="!authenticated" class="admin-login" @submit.prevent="login">
          <label>
            <span>教师管理口令</span>
            <input v-model="password" type="password" autocomplete="current-password" required />
          </label>
          <button type="submit" :disabled="busy">{{ busy ? '验证中……' : '进入管理' }}</button>
          <p v-if="authError" class="admin-message is-error" role="alert">{{ authError }}</p>
        </form>

        <template v-else>
          <div class="admin-toolbar">
            <span>已登录教师管理</span>
            <div>
              <router-link class="admin-toolbar-link" to="/manage/projects">成果管理 →</router-link>
              <router-link class="admin-toolbar-link" to="/manage/resources">资源管理 →</router-link>
              <router-link class="admin-toolbar-link" to="/manage/media">媒体库 →</router-link>
              <button type="button" @click="refreshData">刷新数据</button>
              <button type="button" @click="logout">退出</button>
            </div>
          </div>

          <AssignmentMap
            :orderedTopics="orderedTopics"
            :rosterGroups="rosterGroups"
            :rooms="rooms"
            :assignedTopicCount="assignedTopicCount"
          />

          <GroupAccess :adminGroups="adminGroups" />

          <StudentAccounts
            :students="students"
            :groups="groups"
            :rosterGroups="rosterGroups"
          />

          <p v-if="actionMessage" class="admin-message" role="status">{{ actionMessage }}</p>
          <p v-if="actionError" class="admin-message is-error" role="alert">{{ actionError }}</p>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, provide, ref } from 'vue'
import HomeSiteNav from '../../components/navigation/HomeSiteNav.vue'
import AssignmentMap from '../../components/admin/AssignmentMap.vue'
import GroupAccess from '../../components/admin/GroupAccess.vue'
import StudentAccounts from '../../components/admin/StudentAccounts.vue'
import { useAuthSession } from '../../composables/useAuthSession.js'
import { useCourseState } from '../../composables/useCourseState.js'
import {
  adminLogin,
  adminLogout,
  getAdminGroups,
  getAdminStudents,
} from '../../services/courseState.js'

const { rooms, topics, groups, refresh } = useCourseState({ immediate: false })
const {
  isTeacher: authenticated,
  initialize: initializeAuth,
  refresh: refreshAuth,
  clearTeacher,
} = useAuthSession()

const students = ref([])
const adminGroups = ref([])
const password = ref('')
const busy = ref(false)
const authError = ref('')
const actionError = ref('')
const actionMessage = ref('')

const rosterCollator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })

const orderedTopics = computed(() => [...topics.value].sort((first, second) => (
  Number(first.sortOrder) - Number(second.sortOrder)
  || rosterCollator.compare(first.label, second.label)
)))
const rosterGroups = computed(() => [...groups.value].sort((first, second) => (
  Number(first.sortOrder) - Number(second.sortOrder)
  || rosterCollator.compare(first.code, second.code)
)))
const assignedTopicCount = computed(() => orderedTopics.value.filter((topic) => topic.roomId).length)

const refreshState = async () => {
  await refresh()
  const [studentsPayload, groupsPayload] = await Promise.all([getAdminStudents(), getAdminGroups()])
  students.value = studentsPayload.students || []
  adminGroups.value = groupsPayload.groups || []
  await nextTick()
}

const runAction = async (action, defaultMessage, useReturnedMessage = false) => {
  busy.value = true
  actionError.value = ''
  actionMessage.value = ''
  try {
    const resultMessage = await action()
    await refreshState()
    actionMessage.value = useReturnedMessage ? resultMessage : (resultMessage || defaultMessage)
  } catch (cause) {
    actionError.value = cause.message || '操作失败，请重试'
  } finally {
    busy.value = false
  }
}

const showMessage = (msg) => { actionMessage.value = msg; actionError.value = '' }
const showError = (err) => { actionError.value = err; actionMessage.value = '' }

provide('adminContext', {
  busy,
  runAction,
  showMessage,
  showError,
})

const login = async () => {
  busy.value = true
  authError.value = ''
  try {
    await adminLogin(password.value)
    await refreshAuth()
    password.value = ''
    await refreshState()
  } catch (cause) {
    authError.value = cause.message || '登录失败，请重试'
  } finally {
    busy.value = false
  }
}

const logout = async () => {
  await adminLogout().catch(() => {})
  clearTeacher()
}

const refreshData = () => runAction(refreshState, '数据已刷新')

onMounted(async () => {
  await initializeAuth()
  if (authenticated.value) await refreshState()
})
</script>

<style scoped>
.admin-page { min-height: 100vh; color: var(--home-ink); background: var(--home-paper); }
.admin-page > .site-nav { margin-inline: clamp(3.5rem, 4vw, 4.5rem); padding-top: clamp(1.5rem, 4vh, 3rem); }
.admin-main { padding: 2rem clamp(1rem, 4vw, 4rem) 5rem; }
.admin-section { max-width: 1240px; margin: 0 auto; }
.admin-heading { margin-bottom: 3rem; }
.admin-login { display: flex; flex-wrap: wrap; align-items: end; gap: 0.8rem; max-width: 32rem; padding: 1.25rem 0; border-top: 1px solid var(--home-rule); border-bottom: 1px solid var(--home-rule); }
.admin-login label { display: grid; gap: 0.35rem; flex: 1 1 15rem; font-size: 0.78rem; color: var(--home-muted); }
.admin-login input { min-height: 2.45rem; border: 1px solid var(--home-ink); border-radius: 0; background: var(--home-paper); padding: 0.4rem 0.6rem; font: inherit; }
.admin-login button, .admin-toolbar button { min-height: 2.45rem; border: 1px solid var(--home-ink); border-radius: 0; background: var(--home-ink); color: var(--home-paper); padding: 0.4rem 0.8rem; cursor: pointer; font: inherit; }
.admin-login button:disabled { opacity: 0.5; cursor: wait; }
.admin-toolbar { display: flex; align-items: end; justify-content: space-between; gap: 1rem; padding: 0.8rem 0; border-top: 1px solid var(--home-rule); border-bottom: 1px solid var(--home-rule); font-size: 0.8rem; }
.admin-toolbar div { display: flex; gap: 0.4rem; }
.admin-toolbar-link {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  color: var(--home-ink);
  font-size: 0.75rem;
  font-weight: 700;
  text-decoration: none;
}
.admin-toolbar-link:hover,
.admin-toolbar-link:focus-visible {
  color: var(--accent-orange);
}
.admin-toolbar button { min-height: 2rem; background: transparent; color: var(--home-ink); }
.admin-message { margin-top: 1rem; color: var(--home-muted); font-size: 0.78rem; }
.admin-message.is-error { color: var(--home-ink); }

@media (max-width: 767px) {
  .admin-page > .site-nav {
    width: auto;
    margin-inline: 1rem;
    padding-top: 2.5rem;
  }
  .admin-main {
    padding-inline: 1rem;
  }
  .admin-toolbar {
    align-items: start;
    flex-direction: column;
  }
}
</style>
