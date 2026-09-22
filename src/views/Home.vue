<template>
  <div id="top" class="home-page">
    <a class="skip-link" href="#overview">跳转到主要内容</a>

    <div class="home-shell">
      <HomeEdgeNav
        :items="homeNavItems"
        :active-section="activeSection"
        @navigate="navigateTo"
      />

      <div id="main-content" class="home-main">
        <OverviewSection :team="teachingTeam" :meta="overviewMeta" />
        <RetrospectiveSection @open-work="openWork" />
        <TopicSection
          :rooms="rooms"
          :visible-topic-labels="visibleTopicLabels"
          :topic-colors="topicColors"
          :loading="loading"
          :state-error="error"
          @retry="refresh"
        />
        <RulesSection />
        <CalendarSection
          :events="courseEvents"
          :start-date="startDate"
          :course-start-date="courseStartDate"
          :cycle="courseCycle"
        />
      </div>
    </div>
  </div>

  <WorkDetailModal
    :work-id="activeWorkId"
    @close="closeWork"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  courseCycle,
  homeNavItems,
  overviewMeta,
  teachingTeam,
} from '../data/course/overview.js'
import { useHomeSections } from '../composables/useHomeSections.js'
import { useCourseState } from '../composables/useCourseState.js'
import { buildCourseEvents } from '../utils/buildCourseEvents.js'
import { prefetchCoreRoutes } from '../utils/prefetch.js'
import HomeEdgeNav from '../components/navigation/HomeEdgeNav.vue'
import OverviewSection from '../components/home/OverviewSection.vue'
import RetrospectiveSection from '../components/home/RetrospectiveSection.vue'
import TopicSection from '../components/home/TopicSection.vue'
import RulesSection from '../components/home/RulesSection.vue'
import CalendarSection from '../components/home/CalendarSection.vue'
import WorkDetailModal from '../components/works/WorkDetailModal.vue'

const sectionIds = homeNavItems.map((item) => item.id)
const { activeSection, navigateTo } = useHomeSections(sectionIds)
const { rooms, groups, topicColors, loading, error, refresh } = useCourseState()

const visibleTopicLabels = computed(() => (
  groups.value
    .map((group) => group.topicLabel)
    .filter(Boolean)
))

const activeWorkId = ref(null)
const openWork = (id) => { activeWorkId.value = id }
const closeWork = () => { activeWorkId.value = null }

const startDate = new Date(2026, 8, 7)
const courseStartDate = '2026/09/07'
const courseEvents = computed(() => buildCourseEvents(2026))

onMounted(() => {
  prefetchCoreRoutes()
})
</script>

<style>
.home-page .full-span {
  grid-column: 1 / -1;
}
</style>
