/**
 * Ask the task-owned static server to exit before Playwright tears down its
 * command shell. Long WebGL runs can otherwise leave the child Node process
 * holding the reporter's output pipe open on Windows after every test passed.
 */
export default async function shutdownStaticServer(config) {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) return;
  try {
    await fetch(new URL("/__playwright_shutdown__", baseURL), {
      method: "POST",
      signal: AbortSignal.timeout(2_000),
    });
  } catch {
    // The managed server may already have exited; teardown remains successful.
  }
}
