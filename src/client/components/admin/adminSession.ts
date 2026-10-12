import {paths} from '@/common/app/paths';
import {statusCode} from '@/common/http/statusCode';
import {AdminLoginRequest} from '@/common/admin/adminLogin';

/*
 * Admin login of this browser. The server keeps it in an HttpOnly cookie (adminCookie.ts):
 * the passphrase is sent once here and never appears in an address.
 */
export type AdminLoginState = 'admin' | 'guest' | 'unreachable';

export async function checkAdminLogin(): Promise<AdminLoginState> {
  try {
    const response = await fetch(paths.API_ADMIN_SESSION, {cache: 'no-store'});
    if (response.ok) {
      return 'admin';
    }
    return response.status === statusCode.forbidden ? 'guest' : 'unreachable';
  } catch {
    return 'unreachable';
  }
}

/** True when the server accepted the passphrase and set the login cookie. */
export async function logIn(serverId: string): Promise<boolean> {
  const body: AdminLoginRequest = {serverId};
  const response = await fetch(paths.API_ADMIN_SESSION, {method: 'POST', body: JSON.stringify(body)});
  return response.ok;
}

export async function logOut(): Promise<void> {
  await fetch(paths.API_ADMIN_LOGOUT, {method: 'POST'});
}
