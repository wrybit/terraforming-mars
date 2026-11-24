// Checks after starting that the server answers; otherwise a failure only shows in the browser.

export async function waitForServer(port, timeoutSeconds = 90) {
  const url = `http://localhost:${port}/`;
  const deadline = Date.now() + timeoutSeconds * 1000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(3000)});
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`The server does not answer on ${url} after ${timeoutSeconds} s.`);
}
