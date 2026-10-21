import {reactive} from 'vue';

// The ware whose purchase tab is open (BazaarPurchaseIntro.vue): the bazaar board marks it as selected
// (BazaarBoard.vue), so board and action tab show the same choice
export const bazaarPurchase = reactive({ware: undefined as string | undefined});
