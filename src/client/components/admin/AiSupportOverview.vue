<template>
  <section class="ai-support-overview">
    <h3 class="ai-support-overview-title" v-i18n>What the AI can play</h3>
    <!-- One column per program; the one that plays new games is marked (plain text, it is information) -->
    <div class="ai-support-overview-columns">
      <div v-for="column in columns" :key="column.engine" class="ai-support-overview-column">
        <h4 class="ai-support-overview-engine">
          <span>{{ column.name }}</span>
          <span v-if="column.active" class="ai-support-overview-active" v-i18n>active</span>
        </h4>
        <p v-if="column.note !== undefined" class="ai-support-overview-note">{{ column.note }}</p>
        <p v-if="column.empty" class="ai-support-overview-note" v-i18n>No bot or no rust-ai-support.json in its folder: the Rust AI plays nothing.</p>
        <template v-else>
          <div v-for="group in column.groups" :key="group.title" class="ai-support-overview-group">
            <span class="ai-support-overview-group-title" v-i18n>{{ group.title }}</span>
            <AiSettingChips :chips="group.chips" />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AiSettingChips from '@/client/components/create/AiSettingChips.vue';
import {AiBlockerChip, aiBlockerChip} from '@/client/components/create/aiBlockerChip';
import {AiSupport} from '@/common/ai/aiSupportContract';
import {AiEngineChoice} from '@/common/ai/aiCompatibility';
import {TYPESCRIPT_AI_SUPPORT} from '@/common/ai/typescript/typescriptAiSupport';
import {aiSupportInfo, loadAiSupport} from '@/client/utils/aiSupportState';
import {translateTextWithParams} from '@/client/directives/i18n';

type Group = {title: string, chips: Array<AiBlockerChip>};
type Column = {engine: AiEngineChoice, name: string, active: boolean, empty: boolean, note?: string, groups: Array<Group>};

// The base game is always part of what an AI plays; it is in no list
const BASE_GAME_CHIP: AiBlockerChip = {key: 'expansion:base', label: 'Base game', iconClass: 'create-game-expansion-icon expansion-icon-base'};

// No file in the bot folder gives the empty support: nothing to list, a message instead
function isEmpty(support: AiSupport): boolean {
  return support.botVersion === undefined && support.expansions.length === 0 && support.boards.length === 0 && support.options.length === 0;
}

function groupsOf(support: AiSupport): Array<Group> {
  const groups: Array<Group> = [
    {title: 'Expansions', chips: [BASE_GAME_CHIP, ...support.expansions.map((id) => aiBlockerChip({kind: 'expansion', id}))]},
    {title: 'Options', chips: support.options.map((id) => aiBlockerChip({kind: 'option', id}))},
    {title: 'Boards', chips: support.boards.map((id) => aiBlockerChip({kind: 'board', id}))},
    {title: 'Dune expansion', chips: support.duneModules.map((id) => aiBlockerChip({kind: 'duneModule', id}))},
  ];
  // Dune modules only where the game has them
  return groups.filter((group) => group.title !== 'Dune expansion' || group.chips.length > 0);
}

// Admin overview of the AI programs: which expansions, options, boards and Dune modules each can play (api/ai-support)
export default defineComponent({
  name: 'AiSupportOverview',
  components: {AiSettingChips},
  mounted() {
    void loadAiSupport();
  },
  computed: {
    columns(): Array<Column> {
      const info = aiSupportInfo.value;
      const rust = info?.rust;
      const rustNote = rust?.botVersion === undefined ? undefined :
        translateTextWithParams('Version ${0} · bot ${1} · file of ${2}', [rust.aiVersion ?? '–', rust.botVersion, rust.generated === undefined ? '–' : new Date(rust.generated).toLocaleString()]);
      return [
        {engine: 'typescript', name: 'TypeScript', active: info?.engine === 'typescript', empty: false, groups: groupsOf(TYPESCRIPT_AI_SUPPORT)},
        {engine: 'rust', name: 'Rust', active: info?.engine === 'rust', empty: rust === undefined || isEmpty(rust),
          note: rustNote, groups: rust === undefined ? [] : groupsOf(rust)},
      ];
    },
  },
});
</script>
