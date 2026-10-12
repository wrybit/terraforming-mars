import {ref} from 'vue';
import {paths} from '@/common/app/paths';
import {AdminLoginRequest, AdminSessionStatus} from '@/common/admin/adminLogin';

/*
 * Admin login of this browser. The server keeps it in an HttpOnly cookie (adminCookie.ts):
 * the passphrase is sent once here and never appears in an address.
 */
export type AdminLoginState = 'admin' | 'guest' | 'unreachable';

/** Shared by all menus of the page: true once the server confirmed the login (the menu then offers the admin area) */
export const isAdmin = ref(false);

export async function checkAdminLogin(): Promise<AdminLoginState> {
  try {
    const response = await fetch(paths.API_ADMIN_SESSION, {cache: 'no-store'});
    if (!response.ok) {
      return 'unreachable';
    }
    const status: AdminSessionStatus = await response.json();
    isAdmin.value = status.admin;
    return status.admin ? 'admin' : 'guest';
  } catch {
    return 'unreachable';
  }
}

// Asked once per page load, however many menus there are
let firstCheck: Promise<AdminLoginState> | undefined;
export function checkAdminLoginOnce(): Promise<AdminLoginState> {
  firstCheck ??= checkAdminLogin();
  return firstCheck;
}

/** True when the server accepted the passphrase and set the login cookie. */
export async function logIn(serverId: string): Promise<boolean> {
  const body: AdminLoginRequest = {serverId};
  const response = await fetch(paths.API_ADMIN_SESSION, {method: 'POST', body: JSON.stringify(body)});
  isAdmin.value = response.ok;
  return response.ok;
}

export async function logOut(): Promise<void> {
  await fetch(paths.API_ADMIN_LOGOUT, {method: 'POST'});
  isAdmin.value = false;
}
