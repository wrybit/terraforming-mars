<template>
    <div class="wf-component wf-component--select-global-event choice-block choice-block--natural">
        <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
        <label v-for="globalEventName in playerinput.globalEventNames" :key="globalEventName" class="cardBox">
          <input type="radio" v-model="selected" :value="globalEventName" >
          <GlobalEvent :globalEventName="globalEventName" type="distant"/>
        </label>
        <TabPanelFooterSlot>
        <div v-if="showsave === true" class="nofloat">
          <AppButton :disabled="selected === undefined" type="submit" @click="saveData" title="OK" />
        </div>
        </TabPanelFooterSlot>
    </div>
</template>

<script lang="ts">

import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import GlobalEvent from '@/client/components/turmoil/GlobalEvent.vue';
import {SelectGlobalEventModel} from '@/common/models/PlayerInputModel';
import {SelectGlobalEventResponse} from '@/common/inputs/InputResponse';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';

type DataModel = {
  selected: GlobalEventName | undefined;
};

export default defineComponent({
  name: 'SelectGlobalEvent',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectGlobalEventModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectGlobalEventResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
      required: false,
      default: false,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data(): DataModel {
    return {
      selected: undefined,
    };
  },
  components: {
    TabPanelFooterSlot,
    GlobalEvent,
    AppButton,
  },
  methods: {
    saveData() {
      if (this.selected === undefined) {
        throw new Error('Select a global event');
      }
      this.onsave({type: 'globalEvent', globalEventName: this.selected});
    },
  },
});

</script>
