import {createApp, defineAsyncComponent} from 'vue';
import {handleRenderError} from '@/client/utils/renderErrors';

import {trimEmptyTextNodes} from '@/client/directives/TrimWhitespace';
import App from '@/client/components/App.vue';
import {getPreferences} from '@/client/utils/PreferencesManager';

import i18nPlugin from '@/client/plugins/i18n.plugin';
import {startOauth} from '@/client/oauth';
import {installOverlayScrollbars} from '@/client/utils/overlayScrollbars';
const PlayerInputFactory = defineAsyncComponent(() => import(/* webpackChunkName: "player-input" */ '@/client/components/PlayerInputFactory.vue'));

declare global {
  interface Window {
    _translations: { [key: string]: string } | undefined;
  }
}

async function bootstrap() {
  const lang = getPreferences().lang;
  // Real language tag, so the browser hyphenates long words (CSS hyphens: auto) and reads text correctly
  const htmlLang: Record<string, string> = {cn: 'zh-Hans', br: 'pt-BR', jp: 'ja', ua: 'uk', ko: 'ko'};
  document.documentElement.lang = htmlLang[lang] ?? lang;

  // Also for English: src/locales/en/ holds optional overrides of single English texts
  try {
    window._translations = await fetch(`assets/locales/${lang}.json`).then((res) => res.json());
  } catch (err) {
    console.warn(`Cannot load ${lang} translations. See network for details.`);
  }

  const app = createApp(App);
  app.config.errorHandler = handleRenderError;

  app.use(i18nPlugin);

  app.component('PlayerInputFactory', PlayerInputFactory);

  app.directive('trim-whitespace', {
    mounted: trimEmptyTextNodes,
    updated: trimEmptyTextNodes,
  });

  if (window.isSecureContext && 'serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('sw.js').then(function(registration) {
        console.log('registered the service worker', registration);
      });
    });
  }

  app.mount('#app');
  installOverlayScrollbars();

  window.onload = startOauth;
}

bootstrap();
