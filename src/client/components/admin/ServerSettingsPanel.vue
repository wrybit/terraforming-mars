<template>
  <!-- The .env file of the server, editable here: one card per group, save and restart at the bottom -->
  <div class="server-settings">
    <p v-if="status === 'loading'" class="games-overview-note" v-i18n>Loading…</p>
    <div v-else-if="status === 'unreachable'" class="games-overview-card server-settings-group">
      <p class="games-overview-note" v-i18n>The server is not answering right now – probably it is just restarting.</p>
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
            <!-- Saved in the .env file but not yet in effect: the server reads it at its next start -->
            <span v-if="pendingRestart(setting.key)" class="server-settings-source">
              <strong class="server-settings-pending" v-i18n>Active after restart</strong>
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
import {logIn} from '@/client/components/admin/adminSession';
import {translateText} from '@/client/directives/i18n';
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
};

// Boolean settings: the server reads any of these as "on" (stringToBoolean, Boolean())
function isOnValue(value: string | undefined): boolean {
  return value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false';
}

export default defineComponent({
  name: 'ServerSettingsPanel',
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
        const response = await fetch(paths.API_ADMIN_RESTART, {method: 'POST'});
        if (!response.ok) {
          throw new Error(await response.text());
        }
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
