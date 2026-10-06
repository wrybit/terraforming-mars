<template>
  <!-- Trading with a colony gets its own layout (pay → get), the rest the generic list of sub-inputs -->
  <TradeColony v-if="isTrade" ref="trade" :playerView="playerView" :playerinput="playerinput" :onsave="onsave" :showsave="showsave"/>
  <div v-else class='wf-options'>
    <div v-if="showtitle" class="wf-title">{{ $t(playerinput.title) }}</div>
    <PlayerInputFactory v-for="(option, idx) in (playerinput.options || [])"
      :key="idx"
      ref="childInputs"
      :playerView="playerView"
      :playerinput="option"
      :onsave="playerFactorySaved(idx)"
      :showsave="false"
      :showtitle="true" />
    <TabPanelFooterSlot>
    <div v-if="showsave" class="wf-action">
      <AppButton :title="playerinput.buttonLabel" type="submit" size="normal" @click="saveData" :disabled="!canSave()"/>
    </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">

import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import TradeColony from '@/client/components/colonies/TradeColony.vue';
import {tradeInput} from '@/client/components/colonies/tradeInput';
import {defineComponent} from 'vue';
import {showAlert} from '@/client/components/showAlert';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {AndOptionsModel} from '@/common/models/PlayerInputModel';
import AppButton from '@/client/components/common/AppButton.vue';
import {AndOptionsResponse, InputResponse} from '@/common/inputs/InputResponse';

interface DataModel {
  responded: Array<InputResponse | undefined>,
}

export default defineComponent({
  name: 'AndOptions',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => AndOptionsModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: AndOptionsResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  components: {
    TradeColony,
    TabPanelFooterSlot,
    AppButton,
  },
  data(): DataModel {
    return {
      responded: this.playerinput.options.map(() => undefined),
    };
  },
  computed: {
    isTrade(): boolean {
      return tradeInput(this.playerinput) !== undefined;
    },
  },
  methods: {
    playerFactorySaved(idx: number) {
      return (out: InputResponse) => {
        this.responded[idx] = out;
      };
    },
    canSave(): boolean {
      if (this.isTrade) {
        return (this.$refs.trade as {canSave: () => boolean} | undefined)?.canSave() ?? false;
      }
      const refs = this.$refs.childInputs as Array<{canSave?: () => boolean}> | undefined;
      if (!refs) {
        return true;
      }
      for (const child of refs) {
        if (child.canSave instanceof Function) {
          if (child.canSave() === false) {
            return false;
          }
        }
      }
      return true;
    },
    saveData() {
      if (this.isTrade) {
        (this.$refs.trade as {saveData: () => void} | undefined)?.saveData();
        return;
      }
      if (this.canSave() === false) {
        showAlert(this, 'Error with input', 'Not all options selected');
        return;
      }
      const refs = this.$refs.childInputs as Array<{saveData?: () => void}> | undefined;
      if (refs) {
        for (const child of refs) {
          if (child.saveData instanceof Function) {
            child.saveData();
          }
        }
      }
      this.onsave({
        type: 'and',
        responses: this.responded as Array<InputResponse>,
      });
    },
  },
});

</script>

