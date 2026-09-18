<template>
  <Teleport to="body">
    <Transition name="embedded-web-preview">
      <div
        v-if="open && preview?.url"
        class="embedded-web-preview"
        role="dialog"
        aria-modal="true"
        :aria-label="`${preview.title || '项目'}网站预览`"
        tabindex="0"
        @click.self="emit('close')"
        @keydown.esc="emit('close')"
      >
        <div class="embedded-web-preview-frame" @click.stop>
          <div class="embedded-web-preview-actions">
            <a
              class="embedded-web-preview-action"
              :href="preview.routeUrl || preview.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="preview.routeUrl ? '打开项目页面' : '在新窗口打开原网页'"
              @click.stop
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 4h6v6M20 4l-9 9" />
                <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
              </svg>
            </a>
            <a
              v-if="preview.repositoryUrl"
              class="embedded-web-preview-action embedded-web-preview-github"
              :href="preview.repositoryUrl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="打开 GitHub 仓库"
              @click.stop
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.25a9.75 9.75 0 0 0-3.08 19c.49.09.67-.21.67-.47v-1.66c-2.72.59-3.29-1.16-3.29-1.16-.45-1.13-1.09-1.43-1.09-1.43-.89-.61.06-.6.06-.6.98.07 1.49 1.01 1.49 1.01.87 1.49 2.28 1.06 2.84.81.09-.63.34-1.06.62-1.3-2.18-.25-4.46-1.09-4.46-4.86 0-1.08.38-1.96 1.01-2.65-.1-.25-.44-1.25.1-2.61 0 0 .82-.26 2.69 1.01a9.36 9.36 0 0 1 4.88 0c1.87-1.27 2.69-1.01 2.69-1.01.54 1.36.2 2.36.1 2.61.63.69 1.01 1.57 1.01 2.65 0 3.78-2.29 4.61-4.47 4.86.35.3.66.9.66 1.81v2.69c0 .26.18.56.68.46A9.75 9.75 0 0 0 12 2.25Z" />
              </svg>
            </a>
          </div>
          <iframe
            :src="preview.url"
            :title="`${preview.title || '项目'}网站预览`"
            @load="isLoading = false"
          ></iframe>
          <div v-if="isLoading" class="embedded-web-preview-loading" role="status" aria-label="网页正在加载" aria-live="polite">
            <img v-if="preview.cover" :src="preview.cover" :alt="`${preview.title || '项目'}网站封面`" draggable="false" />
            <span class="embedded-web-preview-progress" aria-hidden="true"><span></span></span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  preview: { type: Object, default: null },
})

const emit = defineEmits(['close'])
const isLoading = ref(false)

const setScrollLock = (locked) => {
  document.documentElement.classList.toggle('preview-is-open', locked)
}

watch(() => props.open, (open) => {
  isLoading.value = Boolean(open && props.preview?.url)
  setScrollLock(open)
}, { immediate: true })

watch(() => props.preview?.url, (url) => {
  if (props.open) isLoading.value = Boolean(url)
})

onBeforeUnmount(() => setScrollLock(false))
</script>

<style scoped>
.embedded-web-preview {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(2rem, 6vw, 6rem);
  pointer-events: auto;
  background: rgb(255 255 255 / 82%);
  backdrop-filter: blur(2px);
}

.embedded-web-preview-frame {
  position: relative;
  width: min(78vw, 72rem);
  height: min(78vh, 48rem);
  border: 1px solid var(--ink, #111);
  background: #fff;
  box-shadow: 0 1.5rem 3.5rem rgb(0 0 0 / 16%);
}

.embedded-web-preview-actions {
  position: absolute;
  z-index: 2;
  top: -1px;
  right: -2.25rem;
  display: grid;
  gap: 0;
}

.embedded-web-preview-action {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border: 1px solid var(--ink, #111);
  color: var(--ink, #111);
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 0.25rem 0.7rem rgb(0 0 0 / 12%);
}

.embedded-web-preview-action:hover,
.embedded-web-preview-action:focus-visible {
  color: #fff;
  background: var(--ink, #111);
}

.embedded-web-preview-action svg {
  width: 1.05rem;
  height: 1.05rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.embedded-web-preview-github {
  margin-top: -1px;
  text-decoration: none;
}

.embedded-web-preview-github svg {
  width: 1.2rem;
  height: 1.2rem;
  fill: currentColor;
  overflow: visible;
}

.embedded-web-preview-frame iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.embedded-web-preview-loading {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #fff;
}

.embedded-web-preview-loading img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.embedded-web-preview-progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: block;
  height: 2px;
  overflow: hidden;
  background: rgb(17 17 17 / 12%);
}

.embedded-web-preview-progress span {
  display: block;
  width: 32%;
  height: 100%;
  background: var(--ink, #111);
  animation: embedded-web-preview-progress 1.35s ease-in-out infinite;
}

@keyframes embedded-web-preview-progress {
  0% { transform: translateX(-110%); }
  55% { transform: translateX(210%); }
  100% { transform: translateX(310%); }
}

.embedded-web-preview-enter-active,
.embedded-web-preview-leave-active {
  transition: background-color 220ms ease;
}

@media (max-width: 767px) {
  .embedded-web-preview {
    padding: 1.25rem;
  }

  .embedded-web-preview-frame {
    width: 90vw;
    height: 76vh;
  }

  .embedded-web-preview-actions {
    right: 0;
    top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .embedded-web-preview,
  .embedded-web-preview-progress span {
    transition: none !important;
    animation: none !important;
  }
}
</style>
