<template>
  <DialogFrame :title="$t('Settings')" :width="760" class="preferences-dialog" :data="syncPreferences()" @close="okClicked">
    <template #icon>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2.5l1.6 2.3 2.8-.6.6 2.8 2.3 1.6-1.1 2.6 1.1 2.6-2.3 1.6-.6 2.8-2.8-.6L12 21.5l-1.6-2.3-2.8.6-.6-2.8-2.3-1.6L5.8 12 4.7 9.4 7 7.8l.6-2.8 2.8.6z"/><path d="M12 8.6l2.9 1.7v3.4L12 15.4l-2.9-1.7v-3.4z"/></svg>
    </template>

    <div class="preferences-groups">
      <component
        :is="group.optional ? 'details' : 'section'"
        v-for="group in groups"
        :key="group.title"
        class="preferences-group"
        :class="{'preferences-group--optional': group.optional}">
        <component :is="group.optional ? 'summary' : 'div'" class="preferences-group-head">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path v-for="path in group.iconPaths" :key="path" :d="path"/></svg>
          <h3 class="preferences-group-title" v-i18n>{{ group.title }}</h3>
          <span v-if="group.optional" class="preferences-group-chevron" aria-hidden="true">›</span>
        </component>
        <!-- Whole row is clickable; switch on the right, text on the left, hint text instead of an ⓘ tooltip -->
        <label v-for="item in group.switches" :key="item.preference" class="preferences-switch">
          <span class="preferences-switch-text">
            <span class="preferences-switch-label" v-i18n>{{ item.label }}</span>
            <span v-if="item.hint" class="preferences-switch-hint">{{ $t(item.hint) }}</span>
          </span>
          <input type="checkbox" class="preferences-switch-input" @change="updatePreferences" v-model="prefs[item.preference]" :data-test="item.preference">
          <span class="preferences-switch-track" aria-hidden="true"></span>
        </label>
      </component>
    </div>

    <template #footer>
      <button type="button" class="btn btn-tone-quiet preferences-bug-button" @click="showBugDialog" v-i18n>Report a bug</button>
      <button type="button" class="btn btn-primary" @click="okClicked" v-i18n>Ok</button>
    </template>
    <BugReportDialog ref="bugDialog"/>
  </DialogFrame>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

import {getPreferences, PreferencesManager, Preference} from '@/client/utils/PreferencesManager';
import BugReportDialog from '@/client/components/BugReportDialog.vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import {PREFERENCE_GROUPS, PreferenceGroup} from '@/client/components/preferencesGroups';


type Refs = {
  bugDialog: InstanceType<typeof BugReportDialog>;
};

export default defineComponent({
  name: 'PreferencesDialog',
  props: {
    preferencesManager: {
      type: Object as () => PreferencesManager,
      required: true,
    },
  },
  components: {
    BugReportDialog,
    DialogFrame,
  },
  emits: ['okButtonClicked'],
  data() {
    return {
      prefs: {...this.preferencesManager.values()},
    };
  },
  methods: {
    showBugDialog() {
      this.typedRefs.bugDialog.show();
    },
    setBoolPreferencesCSS(
      target: HTMLElement,
      val: boolean,
      name: Preference,
    ): void {
      const cssClassSuffix = name;
      if (val) {
        target.classList.add('preferences_' + cssClassSuffix);
      } else {
        target.classList.remove('preferences_' + cssClassSuffix);
      }
    },
    updatePreferences(): void {
      for (const k of Object.keys(this.preferencesManager.values()) as Array<Preference>) {
        const val = this.prefs[k];
        this.preferencesManager.set(k, val, /* setOnChange */ true);
      }
    },
    syncPreferences(): void {
      const target = document.getElementById('ts-preferences-target');
      if (!target) {
        return;
      }

      for (const k of Object.keys(this.prefs) as Array<Preference>) {
        if (k === 'lang') {
          continue;
        }
        this.setBoolPreferencesCSS(target, this.prefs[k], k);
      }

      if (!target.classList.contains('language-' + this.prefs.lang)) {
        target.classList.add('language-' + this.prefs.lang);
      }
    },
    okClicked(): void {
      this.$emit('okButtonClicked');
    },
  },
  computed: {
    typedRefs(): Refs {
      return this.$refs as unknown as Refs;
    },
    groups(): ReadonlyArray<PreferenceGroup> {
      return PREFERENCE_GROUPS;
    },
    getPreferences(): typeof getPreferences {
      return getPreferences;
    },

  },
});
</script>
