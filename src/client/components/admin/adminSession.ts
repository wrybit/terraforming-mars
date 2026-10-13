import {ref} from 'vue';
import {paths} from '@/common/app/paths';
import {statusCode} from '@/common/http/statusCode';
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

/** Answer to a login attempt: logged in, wrong passphrase, or refused unchecked because of too many failures. */
export type LoginResult = {
  outcome: 'admin' | 'wrong' | 'locked',
  /** Seconds until the server accepts the next attempt (0 = right away) */
  retryAfterSeconds: number,
};

/** Sends the passphrase; on success the server has set the login cookie. */
export async function logIn(serverId: string): Promise<LoginResult> {
  const body: AdminLoginRequest = {serverId};
  const response = await fetch(paths.API_ADMIN_SESSION, {method: 'POST', body: JSON.stringify(body)});
  isAdmin.value = response.ok;
  if (response.ok) {
    return {outcome: 'admin', retryAfterSeconds: 0};
  }
  const retryAfterSeconds = Number(response.headers.get('Retry-After') ?? 0) || 0;
  return {outcome: response.status === statusCode.tooManyRequests ? 'locked' : 'wrong', retryAfterSeconds};
}

export async function logOut(): Promise<void> {
  await fetch(paths.API_ADMIN_LOGOUT, {method: 'POST'});
  isAdmin.value = false;
}
