<template>
  <!-- Image setting: preview, address field and upload; the address goes into the .env like any other value -->
  <div class="server-setting-image">
    <div class="server-setting-image-preview">
      <img v-if="value !== '' && !broken" :src="value" alt="" @error="broken = true" @load="broken = false">
      <span v-else-if="value !== ''" class="server-setting-image-empty" v-i18n>Image not found</span>
      <span v-else class="server-setting-image-empty" v-i18n>No image</span>
    </div>
    <div class="server-settings-input">
      <input :id="inputId" type="text" :value="value" autocomplete="off"
        @input="update(($event.target as HTMLInputElement).value)">
      <button type="button" class="btn btn-sm btn-tone-quiet" :disabled="uploading" @click="pickFile" v-i18n>Upload</button>
      <input ref="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden @change="upload">
    </div>
    <span v-if="error !== ''" class="server-setting-image-error">{{ error }}</span>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

// The upload travels as base64 text (a third larger) and the server accepts at most 1 MB
const MAX_FILE_BYTES = 700 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export default defineComponent({
  name: 'ServerSettingImageField',
  props: {
    inputId: {type: String, required: true},
    value: {type: String, required: true},
  },
  emits: ['update'],
  data() {
    return {uploading: false, error: '', broken: false};
  },
  watch: {
    value(): void {
      this.broken = false;
    },
  },
  methods: {
    update(value: string): void {
      this.error = '';
      this.$emit('update', value);
    },
    pickFile(): void {
      (this.$refs.file as HTMLInputElement).click();
    },
    async upload(event: Event): Promise<void> {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      // Same file again must trigger a new change event
      input.value = '';
      if (file === undefined) {
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        this.error = translateTextWithParams('${0} is too large (${1} KB). Use an image of at most 700 KB, e.g. 512 px wide as WebP or PNG.',
          [file.name, String(Math.round(file.size / 1024))]);
        return;
      }
      this.uploading = true;
      try {
        const response = await fetch(paths.API_ADMIN_SERVER_LOGO, {method: 'POST', body: await readAsDataUrl(file)});
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const {address} = await response.json();
        this.update(address);
      } catch (error) {
        this.error = translateText('Could not upload the image:') + ' ' + (error instanceof Error ? error.message : '');
      } finally {
        this.uploading = false;
      }
    },
  },
});
</script>
