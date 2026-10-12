<template>
  <dialog ref="dialog" class="bug-dialog">
    <p class="center"><span v-i18n>Copy the text below and then paste it in</span><br>
        <a href="https://github.com/terraforming-mars/terraforming-mars/issues/new?template=from-heroku.md" target="_blank"  v-i18n>a GitHub issue</a>
        <span v-i18n>or the</span> <a href="https://discord.com/channels/737945098695999559/742721510376210583" target="_blank"  v-i18n>#bug-reports Discord channel</a>
    </p>
    <textarea ref="textarea" readonly rows="6" cols = "50" v-model="message"></textarea>
    <div class="dialog-menu centered-content">
      <div>
        <button class="btn btn-lg btn-primary" @click="copyTextArea" v-i18n>Copy to Clipboard</button>
        <div :class="{ center: true, invisible: !showCopied }" v-i18n>Copied!</div>
      </div>
      <form method="dialog">
        <button class="btn btn-lg" v-i18n>Close</button>
      </form>
    </div>
  </dialog>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {showModal, windowHasHTMLDialogElement} from '@/client/components/HTMLDialogElementCompatibility';
import raw_settings from '@/genfiles/settings.json';
import {vueRoot} from '@/client/components/vueRoot';
import {getPreferences} from '../utils/PreferencesManager';

import dialogPolyfill from 'dialog-polyfill';
import {browserName, shareableUrl} from '@/client/utils/browserEnvironment';


type Refs = {
  dialog: HTMLDialogElement;
  textarea: HTMLTextAreaElement;
};

export default defineComponent({
  name: 'BugReportDialog',
  data() {
    return {
      message: '',
      showCopied: false,
    };
  },
  computed: {
    typedRefs(): Refs {
      return this.$refs as unknown as Refs;
    },
  },
  methods: {
    show() {
      showModal(this.typedRefs.dialog);
    },
    copyTextArea() {
      this.typedRefs.textarea.select();
      navigator.clipboard.writeText(this.typedRefs.textarea.value);
      this.showCopied = true;
    },
    setMessage() {
      const playerView = vueRoot(this).playerView;
      const content: Record<string, any> = {
        url: shareableUrl(playerView),
      };
      if (playerView !== undefined) {
        Object.assign(
          content,
          {
            color: playerView.thisPlayer.color,
            expansions: Object.entries(playerView.game.gameOptions.expansions)
              .filter(([_k, v]) => v === true)
              .map(([k, _v]) => k)
              .join(', '),
            step: playerView.game.step,
          });
      }
      if (playerView?.game?.turmoil) {
        content['party'] = playerView.game.turmoil.ruling ?? 'None';
      }
      Object.assign(content,
        {
          version: raw_settings.head,
          builtAt: raw_settings.builtAt,
          browser: browserName(),
          language: getPreferences().lang,
          experimental_ui: getPreferences().experimental_ui,
        });
      this.message = JSON.stringify(content, null, 2);
    },
  },
  mounted() {
    if (!windowHasHTMLDialogElement()) {
      dialogPolyfill.registerDialog(this.typedRefs.dialog);
    }
    this.setMessage();
  },
});
</script>
