<template>
  <!-- Whole wiki page as an overlay instead of a new tab; animated out of the button like the other dialogs -->
  <SidebarModal :open="open" :framed="true" @close="$emit('close')">
    <DialogFrame :title="title" :width="760" class="wiki-overlay" @close="$emit('close')">
      <template #icon>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/></svg>
      </template>
      <div v-if="html !== undefined" ref="content" class="wiki-overlay-content" v-html="html" @click="followAnchor"></div>
      <p v-else-if="failed" v-i18n>The info could not be loaded.</p>
      <p v-else>…</p>
      <template #footer>
        <a class="btn btn-tone-quiet wiki-overlay-github" :href="href" target="_blank" rel="noopener noreferrer">
          <span v-i18n>Open on GitHub</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>
        </a>
        <button type="button" class="btn btn-primary" @click="$emit('close')" v-i18n>Ok</button>
      </template>
    </DialogFrame>
  </SidebarModal>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import SidebarModal from '@/client/components/SidebarModal.vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import {fetchWikiPage, renderWikiPage, WikiTarget} from './wikiContent';

// Wait for the open animation (dialogZoomAnimation.ts) before scrolling to the section
const SCROLL_DELAY_MS = 320;

export default defineComponent({
  name: 'WikiOverlay',
  components: {SidebarModal, DialogFrame},
  emits: ['close'],
  props: {
    open: {type: Boolean, required: true},
    href: {type: String, required: true},
    target: {type: Object as PropType<WikiTarget>, required: true},
  },
  data() {
    return {
      html: undefined as string | undefined,
      title: '',
      failed: false,
    };
  },
  watch: {
    async open(open: boolean) {
      if (!open) {
        return;
      }
      try {
        const markdown = await fetchWikiPage(this.target.page);
        const page = renderWikiPage(markdown);
        this.title = page.title ?? this.target.page.replace(/-/g, ' ');
        this.html = page.html;
        setTimeout(() => this.scrollTo(this.target.anchor), SCROLL_DELAY_MS);
      } catch (error) {
        console.error(error);
        this.failed = true;
      }
    },
  },
  methods: {
    scrollTo(anchor: string | undefined) {
      if (anchor === undefined) {
        return;
      }
      const content = this.$refs.content as HTMLElement | undefined;
      content?.querySelector('#wiki-' + CSS.escape(anchor.toLowerCase()))?.scrollIntoView({block: 'start', behavior: 'smooth'});
    },
    // Links inside the page must not change the address: its hash carries the settings of the form
    followAnchor(event: MouseEvent) {
      const link = (event.target as HTMLElement).closest('a');
      const href = link?.getAttribute('href') ?? '';
      if (href.startsWith('#wiki-')) {
        event.preventDefault();
        this.scrollTo(href.slice('#wiki-'.length));
      }
    },
  },
});
</script>
