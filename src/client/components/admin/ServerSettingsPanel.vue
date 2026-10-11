<template>
  <!-- Server settings instead of editing the .env file by hand: one card per group, save and restart at the bottom -->
  <div class="server-settings">
    <p v-if="status === 'loading'" class="games-overview-note" v-i18n>Loading…</p>
    <ServerIdPrompt v-else-if="status === 'missingId' || status === 'wrongId'" :wrong="status === 'wrongId'"/>
    <div v-else-if="status === 'unreachable'" class="games-overview-card server-id-prompt">
      <p class="server-id-prompt-text" v-i18n>The server is not answering right now – probably it is just restarting.</p>
      <div><button type="button" class="btn btn-tone-quiet" @click="load" v-i18n>Try again</button></div>
    </div>
    <template v-else>
      <section v-for="group in groups" :key="group.name" class="games-overview-card server-settings-group">
        <h2 v-i18n>{{ group.name }}</h2>
        <div v-for="setting in group.settings" :key="setting.key" class="server-settings-row">
          <div class="server-settings-text">
            <label :for="'server-setting-' + setting.key" class="server-settings-label" v-i18n>{{ setting.label }}</label>
            <span class="server-settings-description" v-i18n>{{ setting.description }}</span>
            <code class="server-settings-key">{{ setting.key }}</code>
          </div>
          <div class="server-settings-field">
            <label v-if="setting.kind === 'toggle'" class="server-settings-toggle">
              <input :id="'server-setting-' + setting.key" type="checkbox" :checked="isOn(values[setting.key])" @change="setValue(setting.key, ($event.target as HTMLInputElement).checked ? 'true' : '')">
            </label>
            <div v-else class="server-settings-input">
              <input :id="'server-setting-' + setting.key"
                :type="inputType(setting)"
                :inputmode="setting.kind === 'number' ? 'numeric' : undefined"
                :value="values[setting.key]"
                autocomplete="off"
                @input="setValue(setting.key, ($event.target as HTMLInputElement).value)">
              <button v-if="setting.kind === 'secret'" type="button" class="btn btn-sm btn-tone-quiet" @click="toggleReveal(setting.key)" v-i18n>{{ revealed[setting.key] ? 'Hide' : 'Show' }}</button>
            </div>
            <!-- Where the value comes from: the .env file, or changed here (then it can go back to the .env value) -->
            <span class="server-settings-source">
              <template v-if="isOverride(setting.key)">
                <span v-i18n>Set here</span> ·
                <button type="button" class="server-settings-reset" @click="resetToBase(setting.key)" v-i18n>Use .env value</button>
              </template>
              <span v-else-if="state(setting.key)?.base !== undefined" v-i18n>From .env</span>
              <span v-else v-i18n>Not set</span>
              <strong v-if="pendingRestart(setting.key)" class="server-settings-pending" v-i18n>Active after restart</strong>
            </span>
          </div>
        </div>
      </section>

      <!-- Save, then restart: changes only take effect in a new server process -->
      <section class="games-overview-card server-settings-actions">
        <p class="server-settings-message" :class="{'server-settings-message--error': messageIsError}">{{ message }}</p>
        <button type="button" class="btn btn-tone-quiet" :disabled="!dirty || busy" @click="save" v-i18n>Save</button>
        <button type="button" class="btn btn-primary" :disabled="dirty || busy || !anyPending" @click="restart" v-i18n>Restart server</button>
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {statusCode} from '@/common/http/statusCode';
import ServerIdPrompt from '@/client/components/admin/ServerIdPrompt.vue';
import {translateText} from '@/client/directives/i18n';
import {
  SERVER_SETTING_GROUPS, SERVER_SETTINGS, ServerSettingDefinition, ServerSettingState, ServerSettingsModel, ServerSettingsUpdate,
} from '@/common/admin/serverSettings';

type DataModel = {
  status: 'loading' | 'missingId' | 'wrongId' | 'unreachable' | 'done',
  states: ReadonlyArray<ServerSettingState>,
  // Values in the form; a key counts as changed when it differs from what is saved (or from the .env value)
  values: Record<string, string>,
  revealed: Record<string, boolean>,
  busy: boolean,
  message: string,
  messageIsError: boolean,
};

// Boolean settings: the server reads any of these as "on" (stringToBoolean, Boolean())
function isOnValue(value: string | undefined): boolean {
  return value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false';
}

export default defineComponent({
  name: 'ServerSettingsPanel',
  components: {ServerIdPrompt},
  props: {
    serverId: {type: String, required: true},
  },
  data(): DataModel {
    return {status: 'loading', states: [], values: {}, revealed: {}, busy: false, message: '', messageIsError: false};
  },
  computed: {
    groups(): Array<{name: string, settings: Array<ServerSettingDefinition>}> {
      return SERVER_SETTING_GROUPS.map((name) => ({name, settings: SERVER_SETTINGS.filter((setting) => setting.group === name)}));
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
    url(path: string): string {
      return `${path}?serverId=${encodeURIComponent(this.serverId)}`;
    },
    state(key: string): ServerSettingState | undefined {
      return this.states.find((state) => state.key === key);
    },
    // Value the next start uses: set here, otherwise from the .env file
    configured(key: string): string {
      const state = this.state(key);
      return state?.saved ?? state?.base ?? '';
    },
    isOverride(key: string): boolean {
      return this.state(key)?.saved !== undefined;
    },
    pendingRestart(key: string): boolean {
      const state = this.state(key);
      return state !== undefined && (state.saved ?? state.base ?? '') !== (state.running ?? '');
    },
    isOn(value: string | undefined): boolean {
      return isOnValue(value);
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
    setValue(key: string, value: string): void {
      this.values = {...this.values, [key]: value};
      this.message = '';
    },
    resetToBase(key: string): void {
      this.setValue(key, this.state(key)?.base ?? '');
    },
    apply(model: ServerSettingsModel): void {
      this.states = model.settings;
      this.values = Object.fromEntries(SERVER_SETTINGS.map(({key}) => [key, this.configured(key)]));
    },
    async load(): Promise<void> {
      if (this.serverId === '') {
        this.status = 'missingId';
        return;
      }
      this.status = 'loading';
      try {
        const response = await fetch(this.url(paths.API_ADMIN_SETTINGS));
        if (response.status === statusCode.forbidden) {
          this.status = 'wrongId';
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
      // Only changed keys; a value equal to the .env value is not stored here (the .env stays in charge)
      const update: ServerSettingsUpdate = {};
      for (const {key} of SERVER_SETTINGS) {
        if (this.values[key] !== this.configured(key)) {
          update[key] = this.values[key] === (this.state(key)?.base ?? '') ? null : this.values[key];
        }
      }
      this.busy = true;
      try {
        const response = await fetch(this.url(paths.API_ADMIN_SETTINGS), {method: 'POST', body: JSON.stringify(update)});
        if (!response.ok) {
          throw new Error(await response.text());
        }
        this.apply(await response.json());
        this.showMessage(translateText('Saved. Restart the server to apply the changes.'), false);
      } catch (error) {
        this.showMessage(translateText('Could not save:') + ' ' + (error instanceof Error ? error.message : ''), true);
      } finally {
        this.busy = false;
      }
    },
    async restart(): Promise<void> {
      this.busy = true;
      try {
        const response = await fetch(this.url(paths.API_ADMIN_RESTART), {method: 'POST'});
        if (!response.ok) {
          throw new Error(await response.text());
        }
        // A changed passphrase changes the address of this page: open it with the new one once the server is back
        const newServerId = this.values.SERVER_ID;
        this.showMessage(translateText('The server restarts and is back in a few seconds.'), false);
        window.setTimeout(() => this.waitForServer(newServerId !== '' ? newServerId : this.serverId), 10000);
      } catch (error) {
        this.busy = false;
        this.showMessage(translateText('Could not restart:') + ' ' + (error instanceof Error ? error.message : ''), true);
      }
    },
    async waitForServer(serverId: string): Promise<void> {
      try {
        const response = await fetch(paths.API_STATUS, {cache: 'no-store'});
        if (response.ok && (await response.json()).updating === false) {
          window.location.href = `${paths.ADMIN}?serverId=${encodeURIComponent(serverId)}`;
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
