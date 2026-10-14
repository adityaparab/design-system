// The shell answering is not enough: wait until the API and both remoteEntry files are served.
const READY = [
  'http://localhost:5180/api/health',
  'http://localhost:5174/remoteEntry.js',
  'http://localhost:5175/remoteEntry.js',
];

export default async function globalSetup() {
  const deadline = Date.now() + 120_000;
  for (const url of READY) {
    for (;;) {
      try {
        if ((await fetch(url)).ok) break;
      } catch {
        // not up yet
      }
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${url}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}
