<template>
  <section class="ai-support-overview">
    <h3 class="ai-support-overview-title" v-i18n>What the AI can play</h3>
    <!-- Which program plays new games (plain text, it is information) and the Rust bot's version -->
    <p class="ai-support-overview-note">
      <span>{{ activeName }}</span> <span v-i18n>active</span>
      <span v-if="rustNote !== undefined">{{ rustNote }}</span>
    </p>
    <p v-if="rustEmpty" class="ai-support-overview-note" v-i18n>No bot or no rust-ai-support.json in its folder: the Rust AI plays nothing.</p>
    <!-- One table per block, the blocks in two columns of about equal length: each program's logo green or red, a gap row in yellow -->
    <div class="ai-support-overview-columns">
      <div v-for="(column, index) in columns" :key="index" class="ai-support-overview-stack">
        <table v-for="group in column" :key="group.title" class="ai-support-overview-table">
          <thead>
            <tr>
              <th class="ai-support-overview-group-head">
                <span v-i18n>{{ group.title }}</span>
                <!-- Computed, not v-i18n: the directive translates once, the counts change when the Rust data arrives -->
                <span class="ai-support-overview-count">{{ countText(group) }}</span>
              </th>
              <th v-for="engine in engines" :key="engine.engine" class="ai-support-overview-engine" :class="{'ai-support-overview-engine--active': engine.active}">{{ engine.shortName }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in group.rows" :key="row.chip.key" class="ai-support-overview-row" :class="{'ai-support-overview-row--gap': !(row.typescript && row.rust)}">
              <td>
                <span class="ai-support-overview-setting">
                  <span class="ai-support-overview-icon"><AiSettingIcon :chip="row.chip" /></span>
                  <span :class="{capitalized: row.chip.capitalized}" v-i18n>{{ row.chip.label }}</span>
                </span>
              </td>
              <td v-for="engine in engines" :key="engine.engine" class="ai-support-overview-mark">
                <span class="ai-support-overview-logo" :class="['ai-support-overview-logo--' + engine.engine, row[engine.engine] ? 'ai-support-overview-logo--yes' : 'ai-support-overview-logo--no']"
                  role="img" :aria-label="$t(row[engine.engine] ? 'Plays it' : 'Does not play it')"></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AiSettingIcon from '@/client/components/create/AiSettingIcon.vue';
import {AiSupport} from '@/common/ai/aiSupportContract';
import {AiEngineChoice} from '@/common/ai/aiCompatibility';
import {TYPESCRIPT_AI_SUPPORT} from '@/common/ai/typescript/typescriptAiSupport';
import {aiSupportInfo, loadAiSupport} from '@/client/utils/aiSupportState';
import {translateTextWithParams} from '@/client/directives/i18n';
import {AiSupportMatrixGroup, aiSupportMatrix} from './aiSupportMatrix';

type Engine = {engine: AiEngineChoice, shortName: string, active: boolean};

// No file in the bot folder gives the empty support: the Rust AI plays nothing
function isEmpty(support: AiSupport): boolean {
  return support.botVersion === undefined && support.expansions.length === 0 && support.boards.length === 0 && support.options.length === 0;
}

// Admin overview of the AI programs: which expansions, options, boards and Dune modules each can play (api/ai-support), as one comparison table per block
export default defineComponent({
  name: 'AiSupportOverview',
  components: {AiSettingIcon},
  mounted() {
    void loadAiSupport();
  },
  methods: {
    countText(group: AiSupportMatrixGroup): string {
      return translateTextWithParams('${0}/${1} in both', [String(group.both), String(group.rows.length)]);
    },
  },
  computed: {
    rustEmpty(): boolean {
      const rust = aiSupportInfo.value?.rust;
      return rust === undefined || isEmpty(rust);
    },
    activeName(): string {
      return aiSupportInfo.value?.engine === 'rust' ? 'Rust' : 'TypeScript';
    },
    // Appended to the active line: " · Version … · bot … · file of …", named "Rust:" when TypeScript is the active one
    rustNote(): string | undefined {
      const rust = aiSupportInfo.value?.rust;
      if (rust?.botVersion === undefined) {
        return undefined;
      }
      const prefix = aiSupportInfo.value?.engine === 'rust' ? ' · ' : ' · Rust: ';
      return prefix + translateTextWithParams('Version ${0} · bot ${1} · file of ${2}', [rust.aiVersion ?? '–', rust.botVersion, rust.generated === undefined ? '–' : new Date(rust.generated).toLocaleString()]);
    },
    engines(): Array<Engine> {
      const engine = aiSupportInfo.value?.engine;
      return [
        {engine: 'typescript', shortName: 'TS', active: engine === 'typescript'},
        {engine: 'rust', shortName: 'Rust', active: engine === 'rust'},
      ];
    },
    // Left expansions and boards, right options and Dune: both columns about equally long
    columns(): Array<Array<AiSupportMatrixGroup>> {
      const matrix = aiSupportMatrix(TYPESCRIPT_AI_SUPPORT, this.rustEmpty ? undefined : aiSupportInfo.value?.rust);
      const right = [matrix.options];
      if (matrix.duneModules !== undefined) {
        right.push(matrix.duneModules);
      }
      return [[matrix.expansions, matrix.boards], right];
    },
  },
});
</script>
