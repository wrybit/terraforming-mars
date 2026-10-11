<template>
  <div class="card-help-icon" v-show="hovering" @click.stop="open"><a>?</a></div>
  <Teleport to="body">
    <PopupPanel v-if="showPopup" @close="close">
      <template #header>
        <h2>{{ $t(name) }}</h2>
      </template>
      <div class="card-help-text" v-html="renderedHelpText"></div>
    </PopupPanel>
  </Teleport>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {CardName} from '@/common/cards/CardName';
import PopupPanel from '@/client/components/common/PopupPanel.vue';
import {renderMarkdown} from '@/client/markdown/markdown';
import {translateText} from '@/client/directives/i18n';

export default defineComponent({
  name: 'CardHelp',
  components: {
    PopupPanel,
  },
  props: {
    name: {
      type: String as () => CardName,
      required: true,
    },
    helpText: {
      type: String,
      required: true,
    },
    hovering: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      showPopup: false,
    };
  },
  computed: {
    renderedHelpText(): string {
      // Help notes are English source texts like card texts. Translated line by line, because the
      // line breaks carry the Markdown structure (paragraphs, quotes, lists) and the lookup drops them.
      const lines = this.helpText.split('\n').map((line) => (line.trim() === '' ? line : translateText(line)));
      return renderMarkdown(lines.join('\n'));
    },
  },
  methods: {
    open() {
      this.showPopup = true;
    },
    close() {
      this.showPopup = false;
    },
  },
});

</script>
