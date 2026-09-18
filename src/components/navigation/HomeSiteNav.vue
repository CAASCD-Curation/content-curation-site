<template>
  <nav class="site-nav" aria-label="网站导航">
    <router-link to="/" exact-active-class="is-current">
      <span class="site-nav-en">Home</span>
      <span class="site-nav-zh">首页</span>
    </router-link>
    <router-link
      to="/resources"
      :class="{ 'is-current': isResourceRoute }"
      @mouseenter="handlePrefetch('Resources')"
      @touchstart.passive="handlePrefetch('Resources')"
    >
      <span class="site-nav-en">Resource</span>
      <span class="site-nav-zh">课程资源</span>
    </router-link>
    <router-link
      to="/syllabus"
      exact-active-class="is-current"
      @mouseenter="handlePrefetch('Syllabus')"
      @touchstart.passive="handlePrefetch('Syllabus')"
    >
      <span class="site-nav-en site-nav-en-full">Course</span>
      <span class="site-nav-en site-nav-en-short" aria-hidden="true">Course</span>
      <span class="site-nav-zh">课程详细</span>
    </router-link>
    <router-link
      to="/works"
      :class="{ 'is-current': isWorksRoute }"
      @mouseenter="handlePrefetch('Works')"
      @touchstart.passive="handlePrefetch('Works')"
    >
      <span class="site-nav-en site-nav-en-full">Works</span>
      <span class="site-nav-en site-nav-en-short" aria-hidden="true">Works</span>
      <span class="site-nav-zh">成果展示</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { prefetchRoute } from '../../utils/prefetch.js'

const route = useRoute()
const isResourceRoute = computed(() => route.path === '/resources' || route.path.startsWith('/resources/'))
const isWorksRoute = computed(() => route.path === '/works' || route.path.startsWith('/works/'))

const handlePrefetch = (name) => {
  prefetchRoute(name)
}
</script>

<style scoped>
:global(.home-page .site-nav) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: clamp(1rem, 2.5vw, 2.5rem);
  row-gap: 0.4rem;
  align-items: center;
  min-height: 44px;
  padding: 0;
}

:global(.home-page .site-nav a) {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.18rem;
  min-height: 44px;
  padding: 0.45rem 0;
  color: var(--home-muted);
  font-family: var(--font-body);
  font-size: clamp(0.8rem, 1.1vw, 0.95rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: color 180ms ease, font-weight 180ms ease;
}

:global(.home-page .site-nav a:nth-child(1)) {
  justify-self: start;
}

:global(.home-page .site-nav a:nth-child(2)) {
  justify-self: center;
}

:global(.home-page .site-nav a:nth-child(3)) {
  justify-self: center;
}

:global(.home-page .site-nav a:nth-child(4)) {
  justify-self: end;
  align-items: flex-end;
  text-align: right;
}

:global(.home-page .site-nav-en),
:global(.home-page .site-nav-zh) {
  display: block;
}

:global(.home-page .site-nav-en) {
  color: var(--home-muted);
  font-size: 0.64rem;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

:global(.home-page .site-nav-en-short) {
  display: none;
}

:global(.home-page .site-nav-zh) {
  font-size: clamp(0.8rem, 1.1vw, 0.95rem);
  letter-spacing: 0.04em;
}

:global(.home-page .site-nav a:hover),
:global(.home-page .site-nav a:focus-visible),
:global(.home-page .site-nav a.is-current) {
  color: var(--home-ink);
  font-weight: 700;
}

@media (max-width: 767px) {
  :global(.home-page .site-nav) {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 0.75rem;
    width: auto;
  }

  :global(.home-page .site-nav a) {
    width: auto;
    flex: 0 0 auto;
    justify-self: auto;
    align-items: center;
    text-align: center;
  }

  :global(.home-page .site-nav a:nth-child(1)) {
    align-items: flex-start;
    text-align: left;
  }

  :global(.home-page .site-nav a:nth-child(2)) {
    align-items: center;
    text-align: center;
  }

  :global(.home-page .site-nav a:nth-child(3)) {
    align-items: center;
    text-align: center;
  }

  :global(.home-page .site-nav a:nth-child(4)) {
    align-items: flex-end;
    text-align: right;
  }

  :global(.home-page .site-nav-en-full) {
    display: none;
  }

  :global(.home-page .site-nav-en-short) {
    display: block;
  }
}
</style>
