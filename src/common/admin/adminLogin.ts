/** Body of the admin login (POST api/admin/session) */
export type AdminLoginRequest = {
  serverId: string,
};

/** Answer of GET api/admin/session */
export type AdminSessionStatus = {
  admin: boolean,
};
