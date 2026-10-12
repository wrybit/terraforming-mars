<template>
  <!-- One raw data source of the server (AdminRaw.vue): title and actions on top, the content right below -->
  <section class="games-overview-card raw-data-card">
    <header class="raw-data-head">
      <h2 v-i18n>{{ label }}</h2>
      <code class="raw-data-path">{{ path }}</code>
      <div class="raw-data-actions">
        <button v-if="kind !== 'download'" type="button" class="btn btn-sm btn-tone-quiet" :disabled="status === 'loading'" @click="load" v-i18n>Reload</button>
        <a class="btn btn-sm btn-tone-quiet" :href="path" target="_blank" rel="noopener" v-i18n>{{ kind === 'download' ? 'Download' : 'Open in new tab' }}</a>
      </div>
    </header>
    <p v-if="kind === 'download'" class="games-overview-note" v-i18n>Not shown here because the file is very large.</p>
    <p v-else-if="status === 'loading'" class="games-overview-note" v-i18n>Loading…</p>
    <p v-else-if="status === 'error'" class="games-overview-note games-overview-note--error">{{ errorText }}</p>
    <pre v-else class="raw-data-content">{{ content }}</pre>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';

// json: pretty-printed; text: as delivered (e.g. Prometheus metrics); download: only a link
export type RawDataKind = 'json' | 'text' | 'download';

/** JSON indented for reading; anything else unchanged */
export function formatRawData(text: string, kind: RawDataKind): string {
  if (kind !== 'json') {
    return text;
  }
  try {
    return JSON.stringify(JSON.parse(text), undefined, 2);
  } catch {
    return text;
  }
}

type DataModel = {
  status: 'loading' | 'error' | 'done',
  content: string,
  errorText: string,
};

export default defineComponent({
  name: 'RawDataCard',
  props: {
    label: {type: String, required: true},
    path: {type: String, required: true},
    kind: {type: String as PropType<RawDataKind>, required: true},
  },
  data(): DataModel {
    return {status: 'loading', content: '', errorText: ''};
  },
  mounted() {
    if (this.kind !== 'download') {
      void this.load();
    }
  },
  methods: {
    async load(): Promise<void> {
      this.status = 'loading';
      try {
        const response = await fetchOrFail(this.path, {cache: 'no-store'});
        this.content = formatRawData(await response.text(), this.kind);
        this.status = 'done';
      } catch (error) {
        this.errorText = describeFailure(failureOf(error));
        this.status = 'error';
      }
    },
  },
});
</script>
