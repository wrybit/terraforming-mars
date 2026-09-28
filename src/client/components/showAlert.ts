import {ComponentPublicInstance} from 'vue';
import {vueRoot} from '@/client/components/vueRoot';

// Meldung im gemeinsamen Dialog von App.vue (Stil in dialogs.less) statt im grauen Browser-alert().
// Ohne App als Wurzel (z. B. einzeln gemountete Komponenten in Tests) bleibt es beim Browser-alert.
export function showAlert(component: ComponentPublicInstance, title: string, message: string): void {
  const root = vueRoot(component);
  if (typeof root.showAlert === 'function') {
    root.showAlert(title, message);
  } else {
    alert(message);
  }
}
