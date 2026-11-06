// v-auto-grow on a textarea: grows with its text up to a few lines (autoGrow.ts). Also after changes from the code
// (sent and emptied, emoji inserted), since the directive runs on every update of its component
import {Directive} from 'vue';
import {autoGrow} from '@/client/utils/autoGrow';

const grow = (event: Event) => autoGrow(event.target as HTMLTextAreaElement);

export const vAutoGrow: Directive<HTMLTextAreaElement> = {
  mounted(field) {
    field.addEventListener('input', grow);
    autoGrow(field);
  },
  updated(field) {
    autoGrow(field);
  },
  unmounted(field) {
    field.removeEventListener('input', grow);
  },
};
