<template>
  <!-- Keyboard shortcuts ('?'): an information page; "Edit" lets the player choose own keys (stored on this device,
       export/import as a file). While keys are assigned twice, editing cannot be finished and the dialog stays open. -->
  <SidebarModal :open="open" :framed="true" @close="requestClose">
    <div class="dialog-frame hotkey-dialog">
      <div class="dialog-frame-head">
        <h2 class="dialog-frame-title hotkey-dialog__title"><span v-i18n>Keyboard Shortcuts</span><HotkeyKeys :fixed="['?']" always/></h2>
        <button v-if="!editing" type="button" class="btn btn-tone-quiet hotkey-dialog__button" data-test="hotkey-edit" @click="startEditing">
          <span v-i18n>Edit</span>
        </button>
        <button v-else type="button" :class="['btn', 'hotkey-dialog__button', blocked ? 'hotkey-dialog__button--blocked' : 'hotkey-dialog__button--cta']"
          :disabled="blocked" :title="blocked ? $t('Resolve the keys assigned twice first') : undefined"
          data-hotkey="confirm" data-test="hotkey-done" @click="finishEditing">
          <span v-i18n>Done</span><HotkeyKeys action="confirm" always/>
        </button>
        <button type="button" :class="['btn', 'hotkey-dialog__button', editing ? 'btn-tone-quiet' : 'hotkey-dialog__button--cta']"
          :aria-label="$t('Close')" data-test="hotkey-close" @click="requestClose">
          <span aria-hidden="true">✕</span><HotkeyKeys action="cancel" always/>
        </button>
      </div>
      <div class="dialog-frame-body">
        <HotkeyList :editing="editing" :capturing="capturing" :duplicates="duplicates" @capture="capturing = $event"/>
      </div>
      <div class="dialog-frame-foot hotkey-dialog__foot">
        <template v-if="editing">
          <span :class="['hotkey-dialog__message', {'hotkey-dialog__message--warning': warning}]">{{ message }}</span>
          <button type="button" class="btn btn-tone-quiet hotkey-dialog__button" @click="reset"><span v-i18n>Reset</span></button>
          <label class="btn btn-tone-quiet hotkey-dialog__button">
            <svg class="hotkey-dialog__icon" viewBox="0 0 24 24" aria-hidden="true">
              <mask id="hotkey-import-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><path :d="IMPORT_ARROW" stroke="#000" stroke-width="6"/></mask>
              <polygon mask="url(#hotkey-import-cut)" points="11.5,5.2 18.43,9.2 18.43,17.2 11.5,21.2 4.57,17.2 4.57,9.2"/><path :d="IMPORT_ARROW"/>
            </svg>
            <span v-i18n>Import</span>
            <input type="file" accept=".json,application/json" hidden @change="importFile">
          </label>
          <button type="button" class="btn btn-tone-quiet hotkey-dialog__button" @click="exportFile">
            <svg class="hotkey-dialog__icon" viewBox="0 0 24 24" aria-hidden="true">
              <mask id="hotkey-export-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/><path :d="EXPORT_ARROW" stroke="#000" stroke-width="6"/></mask>
              <polygon class="hotkey-dialog__icon-filled" mask="url(#hotkey-export-cut)" points="12.5,5.2 19.43,9.2 19.43,17.2 12.5,21.2 5.57,17.2 5.57,9.2"/><path :d="EXPORT_ARROW"/>
            </svg>
            <span v-i18n>Export</span>
          </button>
        </template>
        <template v-else>
          <ToggleSwitch :modelValue="hotkeyState.showHints" :label="$t('Show keys in the game')" @update:modelValue="setShowHints"/>
          <span class="hotkey-dialog__message hotkey-dialog__message--end">{{ message }}</span>
        </template>
      </div>
    </div>
  </SidebarModal>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from 'vue';
import SidebarModal from '@/client/components/SidebarModal.vue';
import ToggleSwitch from '@/client/components/common/ToggleSwitch.vue';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';
import HotkeyList from '@/client/components/hotkeys/HotkeyList.vue';
import {findHotkeyAction} from '@/client/hotkeys/hotkeyActions';
import {duplicateBindings, exportHotkeys, hotkeyState, importHotkeys, resetBindings, setBinding, setShowHints} from '@/client/hotkeys/hotkeyStore';
import {keysOfEvent} from '@/client/hotkeys/hotkeyEvents';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

// Arrows of the import/export icons, the same as on the "Create game" page (CreateGameForm.vue)
const IMPORT_ARROW = 'M5.44 2.7L11.75 13.63M12.33 10.89L11.75 13.63L9.09 12.77';
const EXPORT_ARROW = 'M12.25 13.63L18.56 2.7M15.9 3.56L18.56 2.7L19.15 5.44';
// Keys that keep their fixed meaning and cannot be given to another action
const RESERVED_KEYS = ['Enter', 'Escape', 'Tab', '?', 'ArrowLeft', 'ArrowRight', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const NOTE_DURATION = 2500;

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();

const editing = ref(false);
const capturing = ref<string | undefined>(undefined);
const note = ref<{text: string, warning: boolean} | undefined>(undefined);
let noteTimer: number | undefined;

const duplicates = computed(() => duplicateBindings());
const blocked = computed(() => editing.value && duplicates.value.size > 0);

const message = computed(() => {
  if (note.value !== undefined) {
    return note.value.text;
  }
  if (!editing.value) {
    return translateText(hotkeyState.showHints ? 'The keys are also shown at buttons, tabs and cards.' : 'Keys hidden in the game – the shortcuts still work.');
  }
  if (blocked.value) {
    const names = Array.from(duplicates.value).map((id) => translateText(findHotkeyAction(id)?.label ?? id)).join(', ');
    return translateTextWithParams('Assigned twice: ${0}. Resolve this first, then Done.', [names]);
  }
  return translateText('Click an entry, then press the new key. ⌫ removes it, Esc cancels. Dimmed keys are fixed.');
});
const warning = computed(() => note.value?.warning ?? blocked.value);

function showNote(text: string, isWarning = false): void {
  note.value = {text, warning: isWarning};
  window.clearTimeout(noteTimer);
  noteTimer = window.setTimeout(() => {
    note.value = undefined;
  }, NOTE_DURATION);
}

function startEditing(): void {
  editing.value = true;
  capturing.value = undefined;
}

function finishEditing(): void {
  if (blocked.value) {
    return;
  }
  editing.value = false;
  capturing.value = undefined;
}

function requestClose(): void {
  if (capturing.value !== undefined) {
    capturing.value = undefined;
    return;
  }
  if (blocked.value) {
    showNote(translateText('Resolve the keys assigned twice first'), true);
    return;
  }
  editing.value = false;
  emit('close');
}

function reset(): void {
  resetBindings();
  showNote(translateText('Default keys restored.'));
}

function exportFile(): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([exportHotkeys()], {type: 'application/json'}));
  link.download = 'terraforming-mars-hotkeys.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

function importFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file === undefined) {
    return;
  }
  file.text().then((text) => {
    const count = importHotkeys(text);
    showNote(translateTextWithParams('${0} shortcuts imported.', [String(count)]));
  }).catch(() => {
    showNote(translateText('This file is not an export of the keyboard shortcuts.'), true);
  });
}

// While waiting for a new key, the key belongs to this dialog alone: listening in the capture phase and stopping
// the event keeps Esc from closing the dialog and every other shortcut from firing
function onCaptureKey(event: KeyboardEvent): void {
  if (!props.open || !editing.value) {
    return;
  }
  if (capturing.value === undefined) {
    // In edit mode "?" must not close the dialog behind the player's back
    if (event.key === '?') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    return;
  }
  const keys = keysOfEvent(event);
  if (keys === undefined) {
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  const id = capturing.value;
  if (event.key === 'Escape') {
    capturing.value = undefined;
    return;
  }
  if (event.key === 'Backspace' || event.key === 'Delete') {
    setBinding(id, []);
    capturing.value = undefined;
    return;
  }
  if (keys.length === 1 && RESERVED_KEYS.includes(event.key)) {
    showNote(translateTextWithParams('"${0}" is a fixed key.', [event.key]), true);
    return;
  }
  setBinding(id, keys);
  capturing.value = undefined;
  // The row button keeps the focus after the click; Enter would start capturing again instead of "Done"
  (document.activeElement as HTMLElement | null)?.blur();
}

window.addEventListener('keydown', onCaptureKey, true);
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onCaptureKey, true);
  window.clearTimeout(noteTimer);
});

watch(() => props.open, (open) => {
  if (!open) {
    editing.value = false;
    capturing.value = undefined;
    note.value = undefined;
  }
});
</script>
