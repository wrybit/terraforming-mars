<template>
  <div class="wf-component wf-options">
    <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
    <!-- Ressourcen als auswählbare Kacheln wie Karten und Meilensteine; die gewählte pulsiert in der CTA-Farbe -->
    <div class="resource-options" role="radiogroup">
      <label v-for="included in playerinput.include" :key="included"
        :class="['resource-option', {'resource-option--selected': unit === included}]">
          <!-- Radio für Tastatur und Screenreader, sichtbar ist die Kachel -->
          <input type="radio" v-model="unit" :value="included" class="resource-option-input">
          <i :class="'resource_icon resource-option-icon resource_icon--' + included"></i>
          <span class="resource-option-name">{{ $t(included) }}</span>
      </label>
    </div>
    <TabPanelFooterSlot>
    <div v-if="showsave === true" class="nofloat">
        <!-- Gesperrt, bis eine Ressource gewählt ist -->
        <AppButton @click="saveData" :title="playerinput.buttonLabel" :disabled="unit === undefined" />
    </div>
    </TabPanelFooterSlot>
  </div>
</template>
<script lang="ts">
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
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
    // Meldet nach außen, ob gespeichert werden darf – OrOptions sperrt damit seinen eigenen Button
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
