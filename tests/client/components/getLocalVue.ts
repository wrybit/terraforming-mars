import i18nPlugin from '@/client/plugins/i18n.plugin';

/*
 * Promote Vue runtime warnings (e.g. "Missing required prop") to test failures.
 *
 * PlayerInputFactory's typed registry catches most prop-contract drift at
 * compile time, but this is the runtime safety net for things the type system
 * can't reach (nested prop mismatches, late-bound dispatch, etc.).
 */
function failOnVueWarning(msg: string, _instance: unknown, trace: string): never {
  throw new Error(`Vue warning: ${msg}${trace}`);
}

export const globalConfig = {
  global: {
    plugins: [i18nPlugin],
    directives: {
      'trim-whitespace': {},
    },
    // Pure pass-through (Teleport into the tab box footer): render for real even with shallowMount,
    // otherwise the inputs' buttons are missing
    stubs: {
      TabPanelFooterSlot: false,
      teleport: false,
      // Header row whose lead slot carries the inputs' own buttons ("Select all")
      CardZoomBar: false,
    },
    config: {
      warnHandler: failOnVueWarning,
    },
  },
};
