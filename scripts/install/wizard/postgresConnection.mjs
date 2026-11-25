// The server takes PostgreSQL as one connection string (POSTGRES_HOST); the wizard asks for its parts.
// Both directions live here, so asking and writing can't drift apart.

export const POSTGRES_DEFAULTS = {host: 'localhost', port: '5432', database: 'terraforming_mars', user: 'terraforming'};

/** Parts of an existing connection string, to offer them as defaults on an update. */
export function parseConnection(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port || POSTGRES_DEFAULTS.port,
      database: decodeURIComponent(url.pathname.replace(/^\//, '')),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  } catch {
    return {};
  }
}

/** Connection string from the parts; user and password are encoded, so special characters are safe. */
export function buildConnection({host, port, database, user, password}) {
  const credentials = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : encodeURIComponent(user);
  return `postgres://${credentials}@${host}:${port}/${encodeURIComponent(database)}`;
}
