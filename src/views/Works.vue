<template>
  <div id="top" class="works-page home-page">
    <a class="skip-link" href="#works-archive">跳转到成果目录</a>

    <main id="works-content" class="works-main">
      <HomeSiteNav />

      <header class="works-intro">
        <p class="works-eyebrow">Selected Works · Course Archive</p>
        <div class="works-intro-grid">
          <h1>成果<br />展示</h1>
          <div class="works-intro-copy">
            <p>以项目为单位归档课程成果。从物件研究、叙事结构到展示设计，查看每一次策展实践如何被组织与呈现。</p>
            <p class="works-intro-note">悬停条目展开简介与图纸预览；点击打开项目预览。</p>
          </div>
        </div>
      </header>

      <section id="works-archive" class="works-archive" aria-label="按年份浏览成果目录">
        <div class="year-tabs" role="tablist" aria-label="选择成果年份">
          <button
            v-for="year in workYears"
            :id="`year-tab-${year.id}`"
            :key="year.id"
            class="year-tab"
            :class="{ 'is-active': activeYear === year.id }"
            type="button"
            role="tab"
            :aria-selected="activeYear === year.id"
            :aria-controls="`year-panel-${year.id}`"
            @click="selectYear(year.id)"
          >
            <span>{{ year.label }}</span>
          </button>
        </div>

        <section
          :id="`year-panel-${activeYear}`"
          class="archive-panel-wrap"
          role="tabpanel"
          :aria-labelledby="`year-tab-${activeYear}`"
        >
          <p v-if="activeYear === '2026' && projectsLoading" class="archive-loading" role="status">正在读取 2026 项目档案……</p>
          <p v-else-if="activeYear === '2026' && projectsError" class="archive-error" role="alert">
            {{ projectsError }} <button type="button" @click="loadProjects">重新读取</button>
          </p>
          <div v-else-if="works.length" class="archive-catalog">
            <div class="archive-list" role="list" aria-label="各组项目目录">
              <article
                v-for="(work, index) in works"
                :key="`${activeYear}-${work.id}`"
                class="archive-row"
                :class="{ 'is-active': activeIndex === index }"
                :style="{ '--row-accent': work.themeColor || projectThemeColors[work.groupCode] || 'var(--works-accent)' }"
                role="listitem"
                @pointerenter="activateFromPointer(index, $event)"
              >
                <!-- 紧凑单行条目栏 -->
                <div
                  class="archive-row-header"
                  tabindex="0"
                  role="button"
                  :aria-expanded="activeIndex === index"
                  :aria-controls="`work-body-${work.id}`"
                  :aria-label="`${work.number} ${work.title}，${work.authors.join('、') || '成员待补'}，点击展开或收起简介`"
                  @click="toggleRow(index)"
                  @keydown.enter.prevent="toggleRow(index)"
                  @keydown.space.prevent="toggleRow(index)"
                  @focus="activate(index)"
                >
                  <div class="archive-row-index">
                    <span class="archive-row-num">{{ work.number }}</span>
                  </div>

                  <div class="archive-row-main">
                    <div class="archive-row-title-wrap">
                      <h3 class="archive-row-title">{{ work.title }}</h3>
                      <span v-if="work.titleEn" class="archive-row-title-en">{{ work.titleEn }}</span>
                    </div>
                  </div>

                  <div class="archive-row-meta">
                    <span class="archive-row-topic">{{ work.objectLabel || '物件待补' }}</span>
                  </div>

                  <div class="archive-row-authors">
                    <span>{{ work.authors.join(' / ') || '成员信息待补' }}</span>
                  </div>

                  <div class="archive-row-action">
                    <span v-if="activeYear === '2026' && work.status !== 'published'" class="archive-row-status">
                      {{ statusLabel(work) }}
                    </span>
                    <span class="archive-row-indicator" aria-hidden="true">{{ activeIndex === index ? '—' : '+' }}</span>
                  </div>
                </div>

                <!-- 悬停展开区域：行下面显示简介、属性清单与图集 -->
                <div
                  :id="`work-body-${work.id}`"
                  class="archive-row-body"
                  :aria-hidden="activeIndex !== index"
                >
                  <div class="archive-row-body-inner">
                    <div class="archive-row-content">
                      <!-- 左侧：档案图纸式属性与简介 -->
                      <div class="archive-row-details">
                        <dl class="archive-row-specs">
                          <div class="spec-item">
                            <dt>选取物件 / Object</dt>
                            <dd>{{ work.objectLabel || '待补' }}</dd>
                          </div>
                          <div class="spec-item">
                            <dt>创作团队 / Authors</dt>
                            <dd>{{ work.authors.join('、') || '待补' }}</dd>
                          </div>
                          <div v-if="work.keywords.length" class="spec-item spec-item--keywords">
                            <dt>关键词 / Keywords</dt>
                            <dd class="spec-keywords">
                              <span
                                v-for="keyword in work.keywords"
                                :key="`${work.id}-kw-${keyword}`"
                                class="archive-keyword"
                              >
                                {{ keyword }}
                              </span>
                            </dd>
                          </div>
                          <div v-if="activeYear === '2026' && work.status !== 'published'" class="spec-item">
                            <dt>项目状态 / Status</dt>
                            <dd>{{ statusLabel(work) }}</dd>
                          </div>
                        </dl>

                        <!-- 行下面显示简介 -->
                        <div class="archive-row-summary">
                          <p class="summary-label">项目简介 / Description</p>
                          <p class="summary-text">{{ work.summary }}</p>
                        </div>

                        <div class="archive-row-link-wrap">
                          <button
                            type="button"
                            class="archive-row-link"
                            @click.stop="openWork(work)"
                          >
                            <span>{{ activeYear === '2026' ? '预览网站' : '查看完整项目档案' }}</span>
                            <span class="arrow" aria-hidden="true">↗</span>
                          </button>
                        </div>
                      </div>

                      <!-- 右侧：参考图式横排图集 -->
                      <div
                        v-if="(work.gallery && work.gallery.length) || work.preview"
                        class="archive-row-gallery"
                        aria-label="作品图集预览"
                      >
                        <div
                          v-for="(imgUrl, imgIdx) in (work.gallery && work.gallery.length ? work.gallery : [work.preview])"
                          :key="`${work.id}-gallery-${imgIdx}`"
                          class="archive-row-thumb"
                          @click.stop="openWork(work)"
                        >
                          <div class="archive-row-thumb-media">
                            <img
                              :src="imgUrl"
                              :alt="`${work.title} 预览图 0${imgIdx + 1}`"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <span class="thumb-index" aria-hidden="true">fig. 0{{ imgIdx + 1 }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div v-else class="archive-empty-state">
            <p class="archive-empty-index">{{ activeYear }} / pending</p>
            <h3>成果归档中</h3>
            <p>{{ activeYear === '2026' && isTeacher ? '所有小组档案将在教师后台逐组补充、预览与发布。' : '本届学生作品将在课程后期发布，届时将以同一目录方式呈现。' }}</p>
            <button type="button" class="archive-empty-link" @click="selectYear('2025')">浏览 2025 项目 →</button>
          </div>
        </section>
      </section>
    </main>
  </div>

  <WorkDetailModal :work-id="activeWorkId" @close="activeWorkId = null" />
  <EmbeddedWebPreview
    :open="Boolean(activeWebsitePreview)"
    :preview="activeWebsitePreview"
    @close="activeWebsitePreview = null"
  />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HomeSiteNav from '../components/navigation/HomeSiteNav.vue'
import WorkDetailModal from '../components/works/WorkDetailModal.vue'
import EmbeddedWebPreview from '../components/common/EmbeddedWebPreview.vue'
import { getWorksForYear, projectThemeColors, workYears } from '../data/works/index.js'
import { useStudentProjects } from '../composables/useStudentProjects.js'

const route = useRoute()
const router = useRouter()
const activeYear = ref('2025')
const activeIndex = ref(0)
const activeWorkId = ref(null)
const activeWebsitePreview = ref(null)
const validYears = workYears.map((year) => year.id)
const {
  projects,
  viewer,
  loading: projectsLoading,
  error: projectsError,
  loaded: projectsLoaded,
  refresh: refreshProjects,
} = useStudentProjects(2026)

const isTeacher = computed(() => Boolean(viewer.value?.isTeacher))
const toArchiveWork = (project, index) => ({
  id: project.id,
  routeId: project.routeId,
  year: '2026',
  number: String(index + 1).padStart(2, '0'),
  title: project.title || project.groupCode || '项目资料待补',
  titleEn: project.titleEn || '',
  topic: project.topicLabel || '',
  objectLabel: project.topicLabel || '',
  keywords: (project.topicLabel || '').split(/[、,，/]/).map((keyword) => keyword.trim()).filter(Boolean),
  authors: (project.members || []).map((member) => typeof member === 'string' ? member : member.displayName).filter(Boolean),
  summary: project.description || '进行中，敬请期待…',
  preview: project.coverUrl || '',
  previewAlt: project.coverAlt || `${project.title || project.groupCode || '学生项目'}项目预览`,
  gallery: project.coverUrl ? [project.coverUrl] : [],
  liveUrl: project.liveUrl || '',
  repositoryUrl: project.repositoryUrl || '',
  marker: project.groupCode || '作',
  groupCode: project.groupCode || '',
  themeColor: projectThemeColors[project.groupCode] || 'var(--works-accent)',
  status: project.status || 'published',
  missingFields: project.missingFields || [],
})
const works = computed(() => activeYear.value === '2026'
  ? projects.value.map(toArchiveWork)
  : getWorksForYear(activeYear.value).map((work) => ({
    ...work,
    objectLabel: work.marker || '',
    keywords: work.keywords || [],
  })))

const activeWork = computed(() => works.value[activeIndex.value] || works.value[0] || null)

const normalizedYear = (value) => {
  const year = Array.isArray(value) ? value[0] : value
  return validYears.includes(year) ? year : '2025'
}

const selectYear = (year) => {
  const nextYear = normalizedYear(year)
  activeYear.value = nextYear
  activeIndex.value = 0

  router.replace({
    query: {
      ...route.query,
      year: nextYear,
    },
  })
}

const loadProjects = () => {
  if (projectsLoading.value) return Promise.resolve()
  return refreshProjects().catch(() => {})
}

const activate = (index) => {
  activeIndex.value = index
}

const toggleRow = (index) => {
  activeIndex.value = activeIndex.value === index ? -1 : index
}

const activateFromPointer = (index, event) => {
  if (event.pointerType === 'mouse') activate(index)
}

const openWork = (work) => {
  if (activeYear.value === '2026') {
    if (work.liveUrl) {
      activeWebsitePreview.value = {
        url: work.liveUrl,
        title: work.title,
        cover: work.preview,
        routeUrl: `/works/2026/${work.routeId}`,
        repositoryUrl: work.repositoryUrl,
      }
      return
    }
    if (work.routeId) router.push({ name: 'StudentProjectViewer', params: { id: work.routeId } })
    return
  }
  activeWorkId.value = work.id
}

const statusLabel = (work) => {
  if (work.status === 'published') return '已发布'
  if (work.missingFields?.length) return `待补：${work.missingFields.join('、')}`
  return '教师预览 · 未发布'
}

watch(
  () => route.query.year,
  (year) => {
    const normalized = normalizedYear(year)
    const changed = activeYear.value !== normalized

    activeYear.value = normalized
    if (changed) activeIndex.value = 0

    if (year !== normalized) {
      router.replace({
        query: {
          ...route.query,
          year: normalized,
        },
      })
    }
  },
  { immediate: true },
)

watch(activeYear, (year) => {
  if (year === '2026' && !projectsLoaded.value) loadProjects()
})

onMounted(() => {
  if (activeYear.value === '2026' && !projectsLoaded.value) loadProjects()
})
</script>


<style scoped>
.works-page {
  --works-ink: var(--ink);
  --works-rule: var(--rule);
  --works-accent: var(--accent-orange);
  min-height: 100vh;
  color: var(--works-ink);
  background: var(--paper);
}

.works-main {
  width: 100%;
  margin: 0;
  padding: clamp(1.5rem, 3vw, 2.75rem) clamp(3.5rem, 4vw, 4.5rem) clamp(4rem, 9vw, 8rem);
}

.works-main > .site-nav {
  margin-bottom: var(--page-nav-intro-gap);
}

.works-intro {
  padding-bottom: clamp(3rem, 7vw, 6rem);
}

.works-eyebrow,
.archive-meta,
.archive-empty-index {
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.works-eyebrow {
  color: var(--muted);
}

.works-intro-grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(15rem, 5fr);
  gap: clamp(2.5rem, 7vw, 8rem);
  align-items: end;
  margin-top: 1rem;
}

.works-intro h1 {
  max-width: 6em;
  color: var(--works-ink);
  font-size: var(--page-title-size);
  line-height: 1.02;
  letter-spacing: -0.07em;
  text-transform: none;
}

.works-intro-copy {
  max-width: 33rem;
  padding-bottom: 0.35rem;
}

.works-intro-copy p {
  margin: 0;
  font-size: clamp(1rem, 1.45vw, 1.18rem);
  line-height: 1.8;
}

.works-intro-copy .works-intro-note {
  margin-top: 1.25rem;
  color: var(--muted);
  font-size: 0.78rem;
  letter-spacing: 0.05em;
}

.works-archive {
  padding-top: clamp(1.5rem, 3vw, 2.75rem);
}

.year-tabs {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 2.25rem;
  margin-inline: auto;
  justify-content: space-between;
  gap: 0;
  margin-top: clamp(1rem, 2vw, 1.75rem);
}

.year-tab {
  display: inline-flex;
  width: 4.25rem;
  min-width: 4.25rem;
  min-height: 2rem;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-family: var(--font-body);
  text-align: center;
  transition: color 200ms ease, background-color 200ms ease;
}

.year-tab span {
  display: inline-block;
  min-width: 4.25rem;
  font-weight: 700;
  line-height: 1;
  font-size: clamp(1rem, 1.4vw, 1.2rem);
}

.year-tab:last-child {
  justify-content: flex-end;
  text-align: right;
}

.year-tab:hover,
.year-tab.is-active {
  color: var(--works-ink);
}

.year-tab.is-active {
  font-weight: 700;
}

.year-tab:focus-visible,
.archive-row-header:focus-visible,
.archive-row-link:focus-visible,
.archive-empty-link:focus-visible {
  position: relative;
  z-index: 2;
  outline: 3px solid var(--accent-blue);
  outline-offset: -3px;
}

.archive-panel-wrap {
  padding-top: clamp(0.75rem, 1.5vw, 1.25rem);
}

.archive-meta {
  color: var(--works-accent);
}

.archive-title-en {
  display: block;
  margin-top: 0.5rem;
  color: var(--muted);
  font-size: 0.63rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.archive-catalog {
  display: block;
  width: 100%;
}

.archive-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  border-top: 1px solid #c8c8c8;
  background: var(--paper-white);
}

.archive-row {
  width: 100%;
  border-bottom: 1px solid #c8c8c8;
  background: var(--paper-white);
}

.archive-row:last-child {
  border-bottom: 1px solid #c8c8c8;
}

.archive-row.is-active {
  background: var(--paper-white);
}

.archive-row-header {
  display: grid;
  grid-template-columns: 4rem minmax(11rem, 2fr) minmax(8rem, 1.2fr) minmax(8rem, 1.2fr) auto;
  gap: 1.5rem;
  align-items: baseline;
  padding: 1.15rem 1.25rem;
  border: 0;
  background: transparent;
  color: var(--works-ink);
  cursor: pointer;
  outline: none;
  touch-action: manipulation;
  transition: background-color 180ms ease, color 180ms ease;
}

.archive-row:hover .archive-row-header,
.archive-row.is-active .archive-row-header {
  background-color: transparent;
}

.archive-row-header:focus-visible {
  position: relative;
  z-index: 2;
  outline: 3px solid var(--accent-blue);
  outline-offset: -2px;
}

.archive-row-index {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  color: var(--row-accent, var(--works-accent));
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
}

.archive-row-marker {
  color: var(--muted);
  font-size: 0.65rem;
  font-weight: 400;
}

.archive-row-main {
  min-width: 0;
}

.archive-row-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.archive-row-title {
  margin: 0;
  color: var(--works-ink);
  font-size: clamp(1.15rem, 1.85vw, 1.6rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.035em;
  overflow-wrap: anywhere;
}

.archive-row-title-en {
  color: var(--muted);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.archive-row-meta {
  color: #4a4a46;
  font-size: 0.82rem;
  line-height: 1.4;
}

.archive-row-authors {
  overflow: hidden;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archive-row-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-left: auto;
}

.archive-row-status {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--row-accent, var(--works-rule));
  color: var(--row-accent, var(--muted));
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.archive-row-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--works-ink);
  font-size: 1.2rem;
  font-weight: 300;
  line-height: 1;
  transition: color 180ms ease, transform 180ms ease;
}

.archive-row.is-active .archive-row-indicator {
  color: var(--row-accent, var(--works-accent));
}

/* 展开抽屉 */
.archive-row-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 220ms ease;
}

.archive-row.is-active .archive-row-body {
  grid-template-rows: 1fr;
}

.archive-row-body-inner {
  overflow: hidden;
}

.archive-row-content {
  display: grid;
  grid-template-columns: minmax(18rem, 1fr) minmax(16rem, 1.2fr);
  gap: clamp(1.5rem, 3.5vw, 3.5rem);
  padding: 2rem 1.25rem 2rem 6.75rem;
  border-top: 1px solid var(--works-rule);
}

.archive-row-details {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.archive-row-specs {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 1.25rem;
  row-gap: 0.45rem;
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.5;
}

.archive-row-specs dt {
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.archive-row-specs dd {
  margin: 0;
  color: var(--works-ink);
}

.spec-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.archive-keyword {
  display: inline-flex;
  align-items: center;
  min-height: 1.35rem;
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--row-accent, var(--works-rule));
  color: var(--row-accent, var(--works-ink));
  font-size: 0.65rem;
  line-height: 1;
}

.archive-keyword--empty {
  color: var(--muted);
}

.archive-row-summary {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(17, 17, 17, 0.08);
}

.summary-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.63rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.summary-text {
  max-width: 40rem;
  margin: 0;
  color: #383838;
  font-size: 0.88rem;
  line-height: 1.75;
}

.archive-row-link-wrap {
  margin-top: 0.25rem;
}

.archive-row-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0.4rem 0.95rem;
  border: 1px solid var(--works-ink);
  background: var(--works-ink);
  color: var(--paper-white);
  cursor: pointer;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
}

.archive-row-link:hover {
  background: var(--row-accent, var(--works-accent));
  border-color: var(--row-accent, var(--works-accent));
  color: var(--paper-white);
}

.archive-row-link .arrow {
  font-size: 1rem;
  line-height: 1;
}

.archive-row-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
  gap: 0.85rem;
  align-items: start;
}

.archive-row-thumb {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  cursor: pointer;
}

.archive-row-thumb-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid var(--works-rule);
  background: #f0f0ed;
}

.archive-row-thumb-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms ease;
}

.archive-row-thumb:hover .archive-row-thumb-media img {
  transform: scale(1.03);
}

.thumb-index {
  color: var(--muted);
  font-size: 0.62rem;
  font-family: var(--font-mono, monospace);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.archive-empty-state {
  display: grid;
  min-height: clamp(22rem, 50dvh, 34rem);
  place-content: center;
  justify-items: start;
  padding: clamp(2rem, 7vw, 6rem);
  border: 1px solid var(--works-ink);
  background: repeating-linear-gradient(135deg, transparent 0, transparent 10px, rgba(17, 17, 17, 0.025) 10px, rgba(17, 17, 17, 0.025) 11px);
}

.archive-empty-index {
  color: var(--works-accent);
}

.archive-empty-state h3 {
  margin-top: 0.75rem;
  font-size: clamp(2rem, 5vw, 4.5rem);
  line-height: 1;
  text-transform: none;
}

.archive-empty-state p:not(.archive-empty-index) {
  max-width: 28rem;
  margin: 1.25rem 0 0;
  color: #424242;
  line-height: 1.75;
}

.archive-empty-link {
  min-height: 44px;
  margin-top: 1.75rem;
  padding: 0.65rem 0;
  border: 0;
  border-bottom: 1px solid var(--works-ink);
  background: transparent;
  color: var(--works-ink);
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.archive-empty-link:hover {
  color: var(--works-accent);
  border-bottom-color: var(--works-accent);
}

.archive-loading,
.archive-error {
  min-height: clamp(22rem, 50dvh, 34rem);
  margin: 0;
  display: grid;
  place-content: center start;
  gap: 0.8rem;
  padding: clamp(2rem, 7vw, 6rem);
  border: 1px solid var(--works-ink);
  color: var(--muted);
}

.archive-error { color: var(--works-ink); }
.archive-error button {
  width: fit-content;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--works-ink);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.archive-status {
  display: block;
  width: fit-content;
  margin-top: 0.75rem;
  padding: 0.2rem 0.35rem;
  border: 1px solid var(--works-rule);
  color: var(--muted);
  font-size: 0.63rem;
  letter-spacing: 0.05em;
}

@media (max-width: 1023px) {
  .works-main {
    width: 100%;
    padding-inline: clamp(3.5rem, 4vw, 4.5rem);
  }

  .works-intro-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .works-intro h1 {
    font-size: var(--page-title-size);
  }

  .archive-row-header {
    grid-template-columns: 3.5rem minmax(9rem, 1.8fr) minmax(6rem, 1.2fr) auto;
    gap: 1rem;
    padding: 1rem;
  }

  .archive-row-authors {
    display: none;
  }

  .archive-row-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0.75rem 1rem 1.75rem;
  }
}

@media (max-width: 767px) {
  .works-main {
    width: 100%;
    padding: 2.5rem 1rem clamp(4rem, 9vw, 8rem);
  }

  .works-main > .site-nav {
    margin-bottom: var(--page-nav-intro-gap);
  }

  .works-intro h1 {
    font-size: var(--page-title-size);
  }

  .year-tab {
    min-width: 0;
    flex: 1;
    padding-inline: 0.75rem;
  }

  .year-tab small {
    white-space: nowrap;
  }

  .archive-row-header {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
    padding: 0.9rem 0.75rem;
  }

  .archive-row-title-wrap {
    gap: 0.1rem;
  }

  .archive-row-title {
    font-size: 1.15rem;
  }

  .archive-row-meta {
    font-size: 0.76rem;
  }

  .archive-row-authors {
    display: block;
    font-size: 0.74rem;
  }

  .archive-row-action {
    width: 100%;
    justify-content: space-between;
    margin-top: 0.25rem;
    padding-top: 0.35rem;
    border-top: 1px dotted var(--works-rule);
  }

  .archive-row-content {
    padding: 1.25rem 0.75rem;
  }

  .archive-row-specs {
    grid-template-columns: 1fr;
    row-gap: 0.35rem;
  }

  .archive-row-gallery {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.45rem;
  }

  .archive-empty-state {
    min-height: 25rem;
    padding: 2rem 1.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .archive-row,
  .archive-row-header,
  .archive-row-body,
  .archive-row-indicator,
  .archive-row-link,
  .archive-row-thumb-media img,
  .year-tab {
    transition: none;
  }
}
</style>
