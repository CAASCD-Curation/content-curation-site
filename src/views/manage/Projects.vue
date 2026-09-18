<template>
  <div class="project-manage-page home-page">
    <HomeSiteNav />
    <main class="project-manage-main home-main">
      <section class="project-manage-section" aria-labelledby="project-manage-title">
        <div class="section-grid project-manage-heading"><div class="section-title-column"><p class="eyebrow">2026 Project Archive</p><h1 id="project-manage-title">成果<br />管理</h1></div><div class="section-copy-column"><p class="lead-copy">补充学生项目档案，预览独立部署网站，并按小组逐项公开。</p><router-link class="project-manage-back" to="/manage">← 返回教师管理</router-link></div></div>
        <form v-if="!authenticated" class="project-manage-login" @submit.prevent="login"><label><span>教师管理口令</span><input v-model="password" type="password" autocomplete="current-password" required /></label><button type="submit" :disabled="busy">{{ busy ? '验证中……' : '进入成果管理' }}</button><p v-if="authError" class="project-manage-message is-error" role="alert">{{ authError }}</p></form>
        <template v-else>
          <div class="project-manage-toolbar"><span>已登录教师管理</span><div><router-link to="/works?year=2026">查看公开目录 →</router-link><button type="button" :disabled="busy" @click="loadProjects">刷新数据</button><button type="button" @click="logout">退出</button></div></div>
          <header class="project-list-heading"><div><p class="eyebrow">16 Groups / Archive Status</p><h2>项目档案</h2></div><div class="project-status-tabs" aria-label="项目发布状态"><button v-for="item in filters" :key="item.value" type="button" :class="{ 'is-active': filter === item.value }" @click="filter = item.value">{{ item.label }}（{{ countFor(item.value) }}）</button></div></header>
          <p v-if="loading" class="project-manage-empty" role="status">正在读取项目档案……</p>
          <p v-else-if="loadError" class="project-manage-message is-error" role="alert">{{ loadError }}</p>
          <div v-else-if="visibleProjects.length" class="project-list" role="list">
            <article v-for="project in visibleProjects" :key="project.id" class="project-row" role="listitem">
              <div class="project-summary"><span class="project-group">{{ project.groupCode }}</span><div><strong>{{ project.title || '项目标题待补' }}</strong><span>{{ memberNames(project) || '成员待补' }} · {{ project.topicLabel || '选题待补' }}</span></div><span class="project-state" :class="`is-${statusKey(project)}`">{{ statusLabel(project) }}</span><div class="project-actions"><router-link :to="{ name: 'StudentProjectViewer', params: { id: project.id } }">预览</router-link><button type="button" :disabled="busy" @click="toggleEdit(project)">{{ editingId === project.id ? '收起编辑' : '编辑' }}</button><button v-if="project.status === 'published'" type="button" :disabled="busy" @click="unpublish(project)">撤回</button><button v-else type="button" :disabled="busy || !project.canPublish" @click="publish(project)">发布</button></div></div>
              <p v-if="project.status !== 'published' && project.missingFields?.length" class="project-missing">发布前待补：{{ project.missingFields.join('、') }}</p>
              <form v-if="editingId === project.id" class="project-edit-form" @submit.prevent="save(project)">
                <label><span>项目标题</span><input v-model.trim="project.title" maxlength="120" required /></label>
                <label><span>小组</span><input :value="project.groupCode" disabled /></label>
                <label><span>选题</span><input :value="project.topicLabel || '资料待补'" disabled /></label>
                <label><span>成员</span><input :value="memberNames(project) || '资料待补'" disabled /></label>
                <label class="is-wide"><span>项目简介</span><textarea v-model.trim="project.description" rows="4" maxlength="600" required></textarea></label>
                <label class="is-wide"><span>GitHub 仓库</span><input :value="project.repositoryUrl" disabled /></label>
                <label class="is-wide"><span>线上地址</span><input v-model.trim="project.liveUrl" type="url" maxlength="2048" placeholder="https://" required /></label>
                <label class="is-wide"><span>封面地址 <small>可选</small></span><input v-model.trim="project.coverUrl" type="url" maxlength="2048" placeholder="https://" /></label>
                <div class="project-edit-actions"><button type="submit" :disabled="busy">{{ busy ? '保存中……' : '保存资料' }}</button><button type="button" :disabled="busy" @click="cancelEdit(project)">取消</button></div>
              </form>
            </article>
          </div>
          <p v-else class="project-manage-empty" role="status">当前状态下没有项目。</p>
          <p v-if="message" class="project-manage-message" role="status">{{ message }}</p><p v-if="actionError" class="project-manage-message is-error" role="alert">{{ actionError }}</p>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import HomeSiteNav from '../../components/navigation/HomeSiteNav.vue'
import { useAuthSession } from '../../composables/useAuthSession.js'
import { getAdminProjects, publishAdminProject, unpublishAdminProject, updateAdminProject } from '../../services/studentProjects.js'

const { isTeacher: authenticated, initialize: initializeAuth, refresh: refreshAuth, clearTeacher } = useAuthSession()
const password = ref(''); const authError = ref(''); const actionError = ref(''); const loadError = ref(''); const message = ref(''); const busy = ref(false); const loading = ref(false); const projects = ref([]); const editingId = ref(''); const filter = ref('all')
const filters = [{ value: 'all', label: '全部' }, { value: 'published', label: '已发布' }, { value: 'ready', label: '可发布' }, { value: 'draft', label: '待补资料' }]
const normalize = (project) => ({ ...project, members: project.members || [], original: null })
const memberNames = (project) => (project.members || []).map((member) => typeof member === 'string' ? member : member.displayName).filter(Boolean).join('、')
const statusKey = (project) => project.status === 'published' ? 'published' : project.canPublish ? 'ready' : 'draft'
const statusLabel = (project) => statusKey(project) === 'published' ? '已发布' : statusKey(project) === 'ready' ? '可发布' : '待补资料'
const visibleProjects = computed(() => projects.value.filter((project) => filter.value === 'all' || statusKey(project) === filter.value))
const countFor = (value) => value === 'all' ? projects.value.length : projects.value.filter((project) => statusKey(project) === value).length
const loadProjects = async () => { loading.value = true; loadError.value = ''; try { const payload = await getAdminProjects(2026); projects.value = (payload.projects || []).map(normalize) } catch (cause) { loadError.value = cause.message || '项目档案暂时无法读取，请稍后重试。' } finally { loading.value = false } }
const login = async () => { busy.value = true; authError.value = ''; try { const { adminLogin } = await import('../../services/courseState.js'); await adminLogin(password.value); password.value = ''; await refreshAuth(); await loadProjects() } catch (cause) { authError.value = cause.message || '登录失败，请重试' } finally { busy.value = false } }
const logout = async () => { const { adminLogout } = await import('../../services/courseState.js'); await adminLogout().catch(() => {}); clearTeacher(); projects.value = []; editingId.value = '' }
const toggleEdit = (project) => { if (editingId.value === project.id) { cancelEdit(project); return }; project.original = JSON.stringify(project); editingId.value = project.id; actionError.value = ''; message.value = '' }
const cancelEdit = (project) => { if (project.original) Object.assign(project, JSON.parse(project.original)); project.original = null; editingId.value = '' }
const save = async (project) => { busy.value = true; actionError.value = ''; message.value = ''; try { const payload = await updateAdminProject(project.id, { title: project.title, description: project.description, liveUrl: project.liveUrl, coverUrl: project.coverUrl || '' }); Object.assign(project, normalize(payload.project || payload)); editingId.value = ''; message.value = `${project.groupCode} 档案已保存` } catch (cause) { actionError.value = cause.message || '保存失败，请重试' } finally { busy.value = false } }
const publish = async (project) => { busy.value = true; actionError.value = ''; message.value = ''; try { const payload = await publishAdminProject(project.id); Object.assign(project, normalize(payload.project || payload)); message.value = `${project.groupCode} 已公开发布` } catch (cause) { actionError.value = cause.message || '发布失败，请检查资料后重试' } finally { busy.value = false } }
const unpublish = async (project) => { busy.value = true; actionError.value = ''; message.value = ''; try { const payload = await unpublishAdminProject(project.id); Object.assign(project, normalize(payload.project || payload)); message.value = `${project.groupCode} 已撤回公开目录` } catch (cause) { actionError.value = cause.message || '撤回失败，请重试' } finally { busy.value = false } }
onMounted(async () => { await initializeAuth(); if (authenticated.value) await loadProjects() })
</script>

<style scoped>
.project-manage-page {
  min-height: 100vh;
  color: var(--home-ink);
  background: var(--home-paper);
}

.project-manage-page > .site-nav {
  margin-inline: clamp(3.5rem, 4vw, 4.5rem);
  padding-top: clamp(1.5rem, 4vh, 3rem);
}

.project-manage-main {
  padding: 2rem clamp(1rem, 4vw, 4rem) 5rem;
}

.project-manage-section {
  max-width: 1240px;
  margin: auto;
}

.project-manage-heading {
  margin-bottom: 3rem;
}

.project-manage-back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 1.5rem;
  font-size: .78rem;
  font-weight: 700;
}

.project-manage-login {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: .8rem;
  max-width: 32rem;
  padding: 1.25rem 0;
  border-block: 1px solid var(--home-rule);
}

.project-manage-login label,
.project-edit-form label {
  display: grid;
  gap: .35rem;
  color: var(--home-muted);
  font-size: .72rem;
}

.project-manage-login input,
.project-edit-form input,
.project-edit-form textarea {
  width: 100%;
  min-height: 44px;
  padding: .45rem .6rem;
  border: 1px solid var(--home-ink);
  border-radius: 0;
  color: var(--home-ink);
  background: var(--home-paper);
  font: inherit;
}

.project-manage-login button,
.project-manage-toolbar button,
.project-manage-toolbar a,
.project-actions button,
.project-actions a,
.project-edit-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: .4rem .7rem;
  border: 1px solid var(--home-ink);
  border-radius: 0;
  color: var(--home-ink);
  background: transparent;
  font: inherit;
  font-size: .74rem;
  text-decoration: none;
  cursor: pointer;
}

.project-manage-login > button,
.project-edit-actions button:first-child {
  color: var(--home-paper);
  background: var(--home-ink);
}

.project-manage-toolbar,
.project-list-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.project-manage-toolbar {
  padding: .8rem 0;
  border-block: 1px solid var(--home-rule);
  font-size: .8rem;
}

.project-manage-toolbar div,
.project-status-tabs,
.project-actions,
.project-edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
}

.project-list-heading {
  margin: 3rem 0 1rem;
}

.project-list-heading h2 {
  margin-top: .35rem;
  font-size: clamp(1.4rem, 2.5vw, 2rem);
}

.project-status-tabs button {
  min-height: 36px;
  padding: .3rem .55rem;
  border: 1px solid var(--home-rule);
  background: transparent;
  font: inherit;
  font-size: .7rem;
  cursor: pointer;
}

.project-status-tabs button.is-active,
.project-status-tabs button:hover {
  border-color: var(--home-ink);
  color: var(--home-paper);
  background: var(--home-ink);
}

.project-list {
  border-top: 1px solid var(--home-rule);
}

.project-row {
  padding: .8rem 0;
  border-bottom: 1px solid var(--home-rule);
}

.project-summary {
  display: grid;
  grid-template-columns: 4rem minmax(13rem, 1fr) 5rem auto;
  align-items: center;
  gap: .8rem;
}

.project-group {
  font-weight: 700;
  letter-spacing: .08em;
}

.project-summary > div:nth-child(2) {
  display: grid;
  gap: .25rem;
  min-width: 0;
}

.project-summary strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-summary span:not(.project-group):not(.project-state) {
  color: var(--home-muted);
  font-size: .7rem;
}

.project-state {
  width: fit-content;
  padding: .18rem .35rem;
  border: 1px solid var(--home-rule);
  font-size: .65rem;
  white-space: nowrap;
}

.project-state.is-published {
  border-color: var(--home-green);
  color: var(--home-green);
}

.project-missing {
  margin: .65rem 0 0 4.8rem;
  color: var(--home-muted);
  font-size: .7rem;
}

.project-edit-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .75rem;
  margin: 1rem 0 0 4.8rem;
  padding: 1rem 0;
  border-top: 1px dashed var(--home-rule);
}

.project-edit-form .is-wide,
.project-edit-actions {
  grid-column: 1 / -1;
}

.project-edit-form textarea {
  resize: vertical;
}

.project-manage-empty {
  padding: 2rem 0;
  border-top: 1px solid var(--home-rule);
  color: var(--home-muted);
  font-size: .82rem;
}

.project-manage-message {
  margin-top: 1rem;
  color: var(--home-muted);
  font-size: .78rem;
}

.project-manage-message.is-error {
  color: #a32f22;
}

@media (max-width: 767px) {
  .project-manage-page > .site-nav {
    width: auto;
    margin-inline: 1rem;
    padding-top: 2.5rem;
  }

  .project-manage-main {
    padding-inline: 1rem;
  }

  .project-manage-toolbar,
  .project-list-heading {
    align-items: start;
    flex-direction: column;
  }

  .project-status-tabs {
    width: 100%;
  }

  .project-summary {
    grid-template-columns: 3.5rem minmax(0, 1fr);
    align-items: start;
  }

  .project-state {
    grid-column: 2;
  }

  .project-actions {
    grid-column: 1 / -1;
  }

  .project-missing,
  .project-edit-form {
    margin-left: 0;
  }

  .project-edit-form {
    grid-template-columns: 1fr;
  }

  .project-edit-form .is-wide,
  .project-edit-actions {
    grid-column: auto;
  }
}
</style>
