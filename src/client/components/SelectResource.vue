<template>
  <div class="wf-component wf-options">
    <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
    <!-- Resources as selectable tiles like cards and milestones; the selected one pulses in the CTA color -->
    <div class="resource-options choice-block" :style="choiceBlockStyle(playerinput.include.length)" role="radiogroup">
      <label v-for="included in playerinput.include" :key="included"
        :class="['resource-option', {'resource-option--selected': unit === included}]">
          <!-- Radio for keyboard and screen readers, the tile is what's visible -->
          <input type="radio" v-model="unit" :value="included" class="resource-option-input">
          <i :class="'resource_icon resource-option-icon resource_icon--' + included"></i>
          <span class="resource-option-name">{{ $t(included) }}</span>
      </label>
    </div>
    <TabPanelFooterSlot>
    <div v-if="showsave === true" class="nofloat">
        <!-- Disabled until a resource is selected -->
        <AppButton @click="saveData" :title="playerinput.buttonLabel" :disabled="unit === undefined" />
    </div>
    </TabPanelFooterSlot>
  </div>
</template>
<script lang="ts">
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {choiceBlockStyle} from '@/client/components/choiceBlock';
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {SelectResourceModel} from '@/common/models/PlayerInputModel';
import {SelectResourceResponse} from '@/common/inputs/InputResponse';
import {PlayerViewModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'SelectResource',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectResourceModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectResourceResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data(): {unit: SelectResourceModel['include'][number] | undefined} {
    return {
      unit: undefined,
    };
  },
  watch: {
    // Reports outward whether saving is allowed – OrOptions uses it to disable its own button
    unit: {
      handler() {
        this.$emit('validity', this.unit !== undefined);
      },
      immediate: true,
    },
  },
  components: {
    TabPanelFooterSlot,
    AppButton,
  },
  methods: {
    choiceBlockStyle,
    canSave() {
      return this.unit !== undefined;
    },
    saveData() {
      if (this.unit === undefined) {
        return;
      }
      this.onsave({type: 'resource', resource: this.unit});
    },
  },
});
</script>
