<template>
  <!-- The .env file of the server, editable here: one tab per group, save and restart at the bottom.
       With "only" a single group as a page of its own (AI opponents), without the tab bar -->
  <div class="server-settings">
    <LoadingSpinner v-if="status === 'loading'" page />
    <div v-else-if="status === 'unreachable'" class="games-overview-card server-settings-group">
      <p class="games-overview-note" v-i18n>The server is not answering right now – probably it is just restarting.</p>
      <div class="server-settings-retry"><button type="button" class="btn btn-tone-quiet" @click="load" v-i18n>Try again</button></div>
    </div>
    <template v-else>
      <!-- One tab per group, like the tabs in the game (or_options_tabs.less): no long scrolling -->
      <div>
        <div v-if="only === undefined" class="or-tabs server-settings-tabs" role="tablist">
          <button v-for="group in groups" :key="group.name" type="button" role="tab"
            :aria-selected="group.name === selectedGroup"
            :class="['or-tab', 'or-tab--view', {'or-tab--active': group.name === selectedGroup}]"
            @click.prevent="selectedGroup = group.name">
            <span class="or-tab-title" v-i18n>{{ group.name }}</span>
            <!-- Unsaved or not yet active changes in this group -->
            <span v-if="groupMarker(group.settings) !== undefined" class="server-settings-tab-marker" :class="'server-settings-tab-marker--' + groupMarker(group.settings)" aria-hidden="true"></span>
          </button>
        </div>
        <div v-docked-tab :class="['server-settings-group', only === undefined ? 'or-tab-panel or-tab-panel--view' : 'games-overview-card']" :role="only === undefined ? 'tabpanel' : undefined">
          <!-- Chat filter: its own list with its own save, applied at once (no .env, no restart) -->
          <ChatWordsPanel v-if="selectedGroup === CHAT_TAB" />
          <!-- Push: every message of the server with a test, and what was sent lately (no .env) -->
          <PushPanel v-else-if="selectedGroup === PUSH_TAB" />
          <template v-else>
            <!-- AI tab: the live load of the machine first, over the full width, so threads and rollouts below are set
                 with the hardware in view -->
            <AiLoadGraph v-if="selectedGroup === AI_GROUP" @measured="processorCores = $event.cores" />
            <!-- Blocks in the main column, side settings (strength of the Rust AI) next to them; one column when narrow -->
            <div class="server-settings-columns" :class="{'server-settings-columns--two': columns[1].length > 0}">
              <template v-for="(sections, columnIndex) in columns" :key="columnIndex">
                <div v-if="sections.length > 0" class="server-settings-column">
                  <!-- A block per section (e.g. all waiting times together), its heading above it -->
                  <section v-for="section in sections" :key="section.title" class="server-settings-section">
                    <h3 v-if="section.title !== ''" class="server-settings-section-title" v-i18n>{{ section.title }}</h3>
                    <ServerSettingGrid v-if="section.grid.length > 0" :settings="section.grid" :values="values" :rowLimits="gridLimits" @update="setValue" />
                    <div v-for="setting in section.rows" :key="setting.key" class="server-settings-row">
                      <div class="server-settings-text">
                        <label :for="'server-setting-' + setting.key" class="server-settings-label" v-i18n>{{ setting.label }}</label>
                        <span class="server-settings-description" v-i18n>{{ setting.description }}</span>
                        <code class="server-settings-key">{{ setting.key }}</code>
                      </div>
                      <div class="server-settings-field">
                        <label v-if="setting.kind === 'toggle'" class="server-settings-toggle">
                          <input :id="'server-setting-' + setting.key" type="checkbox" :checked="isToggleOn(setting, values[setting.key])" @change="setToggle(setting, ($event.target as HTMLInputElement).checked)">
                        </label>
                        <SegmentedControl v-else-if="setting.kind === 'segmented'" class="server-settings-segmented"
                          :modelValue="values[setting.key] ?? ''" :options="segmentOptions(setting)" @update:modelValue="setValue(setting.key, String($event))" />
                        <ServerSettingImageField v-else-if="setting.kind === 'image'" :inputId="'server-setting-' + setting.key"
                          :value="values[setting.key] ?? ''" @update="setValue(setting.key, $event)" />
                        <ServerSettingQuotaField v-else-if="setting.kind === 'quota'" :inputId="'server-setting-' + setting.key"
                          :value="values[setting.key] ?? ''" @update="setValue(setting.key, $event)" />
                        <ServerSettingChoiceField v-else-if="setting.kind === 'choice'" :inputId="'server-setting-' + setting.key"
                          :value="values[setting.key] ?? ''" :choices="setting.choices ?? []"
                          :image="(choice: string) => setting.choiceImage?.(choice, values) ?? ''" @update="setValue(setting.key, $event)" />
                        <!-- The field shows the value that applies (the default when the .env has no line), never a grey
                         placeholder; settings with a sensible range get a slider beside it -->
                        <div v-else class="server-settings-input" :class="{'server-settings-input--slider': setting.slider !== undefined}">
                          <input v-if="setting.slider !== undefined" class="server-settings-slider" type="range"
                            :min="setting.slider.minimum" :max="setting.slider.maximum" :step="setting.slider.step" :value="shown(setting)"
                            :aria-label="$t(setting.label)" @input="change(setting, ($event.target as HTMLInputElement).value)">
                          <input :id="'server-setting-' + setting.key"
                            :type="inputType(setting)"
                            :inputmode="setting.kind === 'number' ? 'numeric' : undefined"
                            :value="shown(setting)"
                            autocomplete="off"
                            @input="change(setting, ($event.target as HTMLInputElement).value)">
                          <button v-if="setting.kind === 'secret'" type="button" class="btn btn-sm btn-tone-quiet" @click="toggleReveal(setting.key)" v-i18n>{{ revealed[setting.key] ? 'Hide' : 'Show' }}</button>
                        </div>
                        <!-- Saved in the .env file but not yet in effect: the server reads it at its next start -->
                        <span v-if="pendingRestart(setting.key)" class="server-settings-source">
                          <strong class="server-settings-pending" v-i18n>Active after restart</strong>
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </template>
            </div>
            <!-- Below the AI settings: what each AI program can play, so the engine is chosen knowingly -->
            <AiSupportOverview v-if="selectedGroup === AI_GROUP" />
            <!-- Below the export settings: the fixed receiver with its test, then what was shared so far -->
            <template v-if="selectedGroup === 'Export'">
              <TrainingShareReceiverRow />
              <TrainingShareStatusCard />
            </template>
            <!-- Cards of optional extensions (src/extensions/) for this tab -->
            <component v-for="(panel, index) in extensionPanels" :key="index" :is="panel.component" />
          </template>
        </div>
      </div>

      <!-- Save, then restart: changes only take effect in a new server process -->
      <section v-if="!OWN_SAVE_TABS.includes(selectedGroup)" class="games-overview-card server-settings-actions">
        <p class="server-settings-message" :class="{'server-settings-message--error': messageIsError}">{{ message }}</p>
        <button type="button" class="btn btn-tone-quiet" :disabled="!dirty || busy" @click="save" v-i18n>Save</button>
        <button type="button" class="btn btn-primary" :disabled="dirty || busy || !anyPending" @click="restart" v-i18n>Restart server</button>
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import LoadingSpinner from '@/client/components/common/LoadingSpinner.vue';
import {defineComponent} from 'vue';
import {isValidSettingValue} from '@/common/admin/isValidSettingValue';
import {paths} from '@/common/app/paths';
import {statusCode} from '@/common/http/statusCode';
import {logIn} from '@/client/components/admin/adminSession';
import {restartServer} from '@/client/components/admin/adminActions';
import {vDockedTab} from '@/client/directives/DockedTab';
import ServerSettingImageField from '@/client/components/admin/ServerSettingImageField.vue';
import ServerSettingChoiceField from '@/client/components/admin/ServerSettingChoiceField.vue';
import ServerSettingQuotaField from '@/client/components/admin/ServerSettingQuotaField.vue';
import SegmentedControl from '@/client/components/create/SegmentedControl.vue';
import ServerSettingGrid from '@/client/components/admin/ServerSettingGrid.vue';
import AiSupportOverview from '@/client/components/admin/AiSupportOverview.vue';
import AiLoadGraph from '@/client/components/admin/AiLoadGraph.vue';
import TrainingShareStatusCard from '@/client/components/admin/TrainingShareStatusCard.vue';
import TrainingShareReceiverRow from '@/client/components/admin/TrainingShareReceiverRow.vue';
import {CLIENT_EXTENSIONS} from '@/genfiles/extensionsClient';
import {ExtensionAdminPanel} from '@/client/extensions/ClientExtension';
import ChatWordsPanel from '@/client/components/admin/ChatWordsPanel.vue';
import PushPanel from '@/client/components/admin/push/PushPanel.vue';
import {GridRowLimit} from '@/client/components/admin/ServerSettingGrid.vue';
import {SegmentOption} from '@/client/components/create/createGameChoices';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {
  SERVER_SETTING_GROUPS, SERVER_SETTINGS, ServerSettingDefinition, ServerSettingState, ServerSettingsModel, ServerSettingsUpdate,
} from '@/common/admin/serverSettings';

type DataModel = {
  status: 'loading' | 'unreachable' | 'done',
  states: ReadonlyArray<ServerSettingState>,
  // Values in the form; a key counts as changed when it differs from the .env file
  values: Record<string, string>,
  revealed: Record<string, boolean>,
  busy: boolean,
  message: string,
  messageIsError: boolean,
  selectedGroup: string,
  /** Cores of the server, from the live load (AI tab); the AI threads never go above them */
  processorCores: number | undefined,
};

/** A block of settings under one heading ('' = none): a table first (settings with a grid position), then rows. */
type SettingsSection = {title: string, grid: Array<ServerSettingDefinition>, rows: Array<ServerSettingDefinition>};

function settingsSections(settings: ReadonlyArray<ServerSettingDefinition>): Array<SettingsSection> {
  const sections: Array<SettingsSection> = [];
  for (const setting of settings) {
    const title = setting.section ?? '';
    let section = sections.find((candidate) => candidate.title === title);
    if (section === undefined) {
      section = {title, grid: [], rows: []};
      sections.push(section);
    }
    (setting.grid === undefined ? section.rows : section.grid).push(setting);
  }
  return sections;
}

// A tab of its own without .env settings: the words the lobby chat masks, after the limits (both keep players in check)
const CHAT_TAB = 'Chat filter';
// A tab of its own without .env settings: the push messages, before the technical settings
const PUSH_TAB = 'Push';
// Tabs with their own save (or none): no save and restart below them
const OWN_SAVE_TABS: ReadonlyArray<string> = [CHAT_TAB, PUSH_TAB];
// Has a page of its own in the admin menu (AdminAi.vue), so no tab here
export const AI_GROUP = 'AI opponents';

// Boolean settings: the server reads any of these as "on" (stringToBoolean, Boolean())
function isOnValue(value: string | undefined): boolean {
  return value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false';
}

export default defineComponent({
  name: 'ServerSettingsPanel',
  components: {TrainingShareStatusCard, TrainingShareReceiverRow, LoadingSpinner, ServerSettingImageField, ServerSettingChoiceField, ServerSettingQuotaField, ServerSettingGrid, SegmentedControl, AiSupportOverview, AiLoadGraph, ChatWordsPanel, PushPanel},
  directives: {dockedTab: vDockedTab},
  props: {
    /** Show only this group, as a page of its own without tabs */
    only: {type: String, default: undefined},
    /** Tab that is open first (e.g. "Push" for the old address /admin-push) */
    initialTab: {type: String, default: undefined},
  },
  data(): DataModel {
    return {status: 'loading', states: [], values: {}, revealed: {}, busy: false, message: '', messageIsError: false,
      selectedGroup: this.only ?? this.initialTab ?? SERVER_SETTING_GROUPS[0], processorCores: undefined};
  },
  computed: {
    extensionPanels(): ReadonlyArray<ExtensionAdminPanel> {
      return CLIENT_EXTENSIONS.flatMap((extension) => extension.adminPanels ?? []).filter((panel) => panel.group === this.selectedGroup);
    },
    CHAT_TAB(): string {
      return CHAT_TAB;
    },
    PUSH_TAB(): string {
      return PUSH_TAB;
    },
    AI_GROUP(): string {
      return AI_GROUP;
    },
    OWN_SAVE_TABS(): ReadonlyArray<string> {
      return OWN_SAVE_TABS;
    },
    groups(): Array<{name: string, settings: Array<ServerSettingDefinition>}> {
      const groupOf = (name: string) => ({name, settings: SERVER_SETTINGS.filter((setting) => setting.group === name)});
      if (this.only !== undefined) {
        return [groupOf(this.only)];
      }
      const groups = SERVER_SETTING_GROUPS.filter((name) => name !== AI_GROUP).map(groupOf);
      groups.splice(groups.findIndex(({name}) => name === 'Limits') + 1, 0, {name: CHAT_TAB, settings: []});
      groups.splice(groups.findIndex(({name}) => name === 'Technical'), 0, {name: PUSH_TAB, settings: []});
      return groups;
    },
    // More threads than cores only make them wait for each other: the field allows no more (the server cuts it too)
    gridLimits(): Partial<Record<string, GridRowLimit>> {
      const cores = this.processorCores;
      if (cores === undefined) {
        return {};
      }
      return {threads: {maximum: cores, note: translateTextWithParams('This server has ${0} cores: at most ${0} threads.', [String(cores)])}};
    },
    // Main column and second column (side settings, e.g. the AI strength), each as blocks in the order of the list
    columns(): [Array<SettingsSection>, Array<SettingsSection>] {
      const settings = SERVER_SETTINGS.filter((setting) => setting.group === this.selectedGroup);
      return [settingsSections(settings.filter((setting) => setting.side !== true)), settingsSections(settings.filter((setting) => setting.side === true))];
    },
    dirty(): boolean {
      return SERVER_SETTINGS.some(({key}) => this.values[key] !== this.configured(key));
    },
    anyPending(): boolean {
      return SERVER_SETTINGS.some(({key}) => this.pendingRestart(key));
    },
  },
  mounted() {
    void this.load();
  },
  methods: {
    aboveMachineLimit(definition: ServerSettingDefinition, value: string | null): boolean {
      const limit = definition.grid === undefined ? undefined : this.gridLimits[definition.grid.row]?.maximum;
      return limit !== undefined && value !== null && value !== '' && Number(value) > limit;
    },
    // 'changed': edited here but not saved; 'pending': saved, active after the restart
    groupMarker(settings: ReadonlyArray<ServerSettingDefinition>): 'changed' | 'pending' | undefined {
      if (settings.some(({key}) => this.values[key] !== this.configured(key))) {
        return 'changed';
      }
      return settings.some(({key}) => this.pendingRestart(key)) ? 'pending' : undefined;
    },
    state(key: string): ServerSettingState | undefined {
      return this.states.find((state) => state.key === key);
    },
    // Value in the .env file (the next start uses it); empty: not set
    configured(key: string): string {
      return this.state(key)?.value ?? '';
    },
    pendingRestart(key: string): boolean {
      const state = this.state(key);
      return state !== undefined && (state.value ?? '') !== (state.running ?? '');
    },
    // A toggle with defaultOn is on while its line is missing
    isToggleOn(setting: ServerSettingDefinition, value: string | undefined): boolean {
      return (value === undefined || value === '') ? setting.defaultOn === true : isOnValue(value);
    },
    // The default state removes the line from the .env, the other one is written out
    setToggle(setting: ServerSettingDefinition, on: boolean): void {
      this.setValue(setting.key, on === (setting.defaultOn === true) ? '' : String(on));
    },
    // Choices are names of programs (TypeScript, Rust): the same in every language
    segmentOptions(setting: ServerSettingDefinition): Array<SegmentOption> {
      return (setting.choices ?? []).map((choice) => ({value: choice.value, label: choice.label, raw: true}));
    },
    inputType(setting: ServerSettingDefinition): string {
      if (setting.kind === 'secret' && this.revealed[setting.key] !== true) {
        return 'password';
      }
      return setting.kind === 'number' ? 'number' : 'text';
    },
    toggleReveal(key: string): void {
      this.revealed = {...this.revealed, [key]: this.revealed[key] !== true};
    },
    /** The value that applies: the one in the .env, otherwise the default */
    shown(setting: ServerSettingDefinition): string {
      const value = this.values[setting.key];
      return value === undefined || value === '' ? setting.placeholder ?? '' : value;
    },
    /** The default itself is stored as no line, so the field keeps following a changed default */
    change(setting: ServerSettingDefinition, value: string): void {
      this.setValue(setting.key, value === setting.placeholder ? '' : value);
    },
    setValue(key: string, value: string): void {
      this.values = {...this.values, [key]: value};
      this.message = '';
    },
    apply(model: ServerSettingsModel): void {
      this.states = model.settings;
      this.values = Object.fromEntries(SERVER_SETTINGS.map(({key}) => [key, this.configured(key)]));
    },
    async load(): Promise<void> {
      this.status = 'loading';
      try {
        const response = await fetch(paths.API_ADMIN_SETTINGS);
        if (response.status === statusCode.forbidden) {
          // Login ended meanwhile (e.g. passphrase changed): the page asks for it again
          window.location.reload();
          return;
        }
        if (!response.ok) {
          throw new Error(await response.text());
        }
        this.apply(await response.json());
        this.status = 'done';
      } catch {
        this.status = 'unreachable';
      }
    },
    async save(): Promise<void> {
      // Only changed keys; an empty field removes the line from the .env file (the default applies)
      const update: ServerSettingsUpdate = {};
      for (const {key} of SERVER_SETTINGS) {
        if (this.values[key] !== this.configured(key)) {
          update[key] = this.values[key] === '' ? null : this.values[key];
        }
      }
      // Same check as the server: name the fields right away instead of a technical error after saving
      const invalid = SERVER_SETTINGS.filter((definition) => definition.key in update &&
        (!isValidSettingValue(definition, update[definition.key]) || this.aboveMachineLimit(definition, update[definition.key])));
      if (invalid.length > 0) {
        this.showMessage(translateText('Invalid number:') + ' ' + invalid.map((definition) => translateText(definition.label)).join(', '), true);
        return;
      }
      this.busy = true;
      try {
        const response = await fetch(paths.API_ADMIN_SETTINGS, {method: 'POST', body: JSON.stringify(update)});
        if (!response.ok) {
          throw new Error(await response.text());
        }
        this.apply(await response.json());
        this.showMessage(translateText('Saved in the .env file. Restart the server to apply the changes.'), false);
      } catch (error) {
        this.showMessage(translateText('Could not save:') + ' ' + (error instanceof Error ? error.message : ''), true);
      } finally {
        this.busy = false;
      }
    },
    async restart(): Promise<void> {
      this.busy = true;
      try {
        await restartServer();
        // A changed passphrase ends the login: log in with the new one once the server is back
        const serverId = this.values.SERVER_ID;
        this.showMessage(translateText('The server restarts and is back in a few seconds.'), false);
        window.setTimeout(() => this.waitForServer(serverId), 10000);
      } catch (error) {
        this.busy = false;
        this.showMessage(translateText('Could not restart:') + ' ' + (error instanceof Error ? error.message : ''), true);
      }
    },
    async waitForServer(serverId: string): Promise<void> {
      try {
        const response = await fetch(paths.API_STATUS, {cache: 'no-store'});
        if (response.ok && (await response.json()).updating === false) {
          // Without a fixed passphrase (random at every start) the page asks for the new one
          if (serverId !== '') {
            await logIn(serverId);
          }
          window.location.reload();
          return;
        }
      } catch {
        // Still down: try again
      }
      window.setTimeout(() => this.waitForServer(serverId), 2000);
    },
    showMessage(text: string, isError: boolean): void {
      this.message = text;
      this.messageIsError = isError;
    },
  },
});
</script>
