import {ref} from 'vue';

// Only one info box of the "Create game" page is open at a time: the link of the open one (InfoLink.vue)
export const openInfoHref = ref<string | undefined>(undefined);
