<template>
  <div v-if="warnings !== undefined">
    <div v-for="(warning, idx) in (warnings || [])" :key="idx" class="card-warning">
      {{ $t(descriptions[warning]) }}
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {Warning} from '@/common/cards/Warning';
import {WARNING_DESCRIPTIONS} from '@/client/components/warningDescriptions';

export default defineComponent({
  name: 'WarningsComponent',
  props: {
    warnings: {
      type: Array as () => ReadonlyArray<Warning>,
      default: () => {
        return [];
      },
    },
  },
  computed: {
    descriptions(): typeof WARNING_DESCRIPTIONS {
      return WARNING_DESCRIPTIONS;
    },
  },
});
</script>
