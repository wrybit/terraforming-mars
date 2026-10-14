import {ComponentPublicInstance, ref} from 'vue';

// A component that throws while drawing leaves Vue in a broken state: later updates fail with
// follow-up errors ("Cannot read properties of null (reading 'emitsOptions')") and the page stops
// reacting without any notice. Instead the first error is logged with the component that caused it
// and the page offers a reload (RenderErrorBanner.vue).

export const renderErrorOccurred = ref(false);

function componentName(instance: ComponentPublicInstance | null): string {
  return instance?.$options.name ?? instance?.$options.__name ?? 'unknown component';
}

/** For app.config.errorHandler. */
export function handleRenderError(error: unknown, instance: ComponentPublicInstance | null, info: string): void {
  console.error(`Error in ${componentName(instance)} (${info}):`, error);
  renderErrorOccurred.value = true;
}
