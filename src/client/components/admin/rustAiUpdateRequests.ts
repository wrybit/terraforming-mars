import {paths} from '@/common/app/paths';
import {RustAiUpdateStatus} from '@/common/ai/rustAiUpdate';

// Requests of the Rust AI update (api/admin/rust-ai-update), shared by the settings page and the dashboard.

/** State of the last check; undefined without an answer. */
export async function loadRustAiUpdate(): Promise<RustAiUpdateStatus | undefined> {
  try {
    const response = await fetch(paths.API_ADMIN_RUST_AI_UPDATE);
    return response.ok ? await response.json() as RustAiUpdateStatus : undefined;
  } catch {
    return undefined;
  }
}

/** Checks now; with install = true it also installs a newer version. Undefined without an answer. */
export async function checkRustAiUpdate(install: boolean): Promise<RustAiUpdateStatus | undefined> {
  try {
    const response = await fetch(paths.API_ADMIN_RUST_AI_UPDATE, {method: 'POST', body: JSON.stringify({install})});
    return response.ok ? await response.json() as RustAiUpdateStatus : undefined;
  } catch {
    return undefined;
  }
}
