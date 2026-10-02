import {ComponentPublicInstance} from 'vue';
import {vueRoot} from '@/client/components/vueRoot';

// Message in App.vue's shared dialog (style in dialogs.less) instead of the grey browser alert().
// Without App as the root (e.g. components mounted individually in tests) it falls back to the browser alert.
export function showAlert(component: ComponentPublicInstance, title: string, message: string): void {
  const root = vueRoot(component);
  if (typeof root.showAlert === 'function') {
    root.showAlert(title, message);
  } else {
    alert(message);
  }
}
