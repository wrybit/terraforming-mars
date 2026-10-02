<template>
      <div class="player-status">
        <div class="player-status-bottom">
          <div :class="getLabelAndTimerClasses()">
            <div v-if="showsLabel()" :class="getActionStatusClasses()"><span v-i18n>{{ actionLabel }}</span></div>
            <div class="player-status-timer" v-if="showTimer"><PlayerTimer :timer="timer" :live="liveTimer"/></div>
          </div>
        </div>
      </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import PlayerTimer from '@/client/components/overview/PlayerTimer.vue';
import {syncActiveBlinkAnimations} from '@/client/utils/syncActiveBlinkAnimations';
import {TimerModel} from '@/common/models/TimerModel';

export default defineComponent({
  name: 'PlayerStatus',
  props: {
    timer: {
      type: Object as () => TimerModel,
      required: true,
    },
    actionLabel: {
      type: String as () => ActionLabel,
      required: true,
    },
    showTimer: {
      type: Boolean,
    },
    liveTimer: {
      type: Boolean,
    },
  },
  components: {
    PlayerTimer,
  },
  // Newly rendered status blinks in the same rhythm as the other "current turn" markers
  mounted() {
    syncActiveBlinkAnimations();
  },
  updated() {
    syncActiveBlinkAnimations();
  },
  methods: {
    getLabelAndTimerClasses(): string {
      const classes = [];
      const baseClass = 'player-action-status-container';
      classes.push(baseClass);
      if (!this.showTimer) {
        classes.push('no-timer');
      }
      if (this.actionLabel === 'passed') {
        classes.push(`${baseClass}--passed`);
      } else if (this.actionLabel === 'active' || this.actionLabel === 'drafting' || this.actionLabel === 'researching') {
        classes.push(`${baseClass}--active`);
      }
      return classes.join(' ');
    },
    // "researching" doesn't fit in the player row; the blinking dot and timer show the state anyway.
    showsLabel(): boolean {
      return this.actionLabel !== 'researching';
    },
    getActionStatusClasses(): string {
      const classes: Array<string> = ['player-action-status'];
      if (this.actionLabel === 'none') {
        classes.push('visibility-hidden');
      }
      return classes.join(' ');
    },
  },
});

</script>

