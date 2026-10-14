/** Failure drills, switched on with ?simulate=… so they can be shown in a demo or an E2E test. */
export type Simulation = 'viewer-crash' | 'remote-offline' | 'contract-mismatch';

const ALL: Simulation[] = ['viewer-crash', 'remote-offline', 'contract-mismatch'];

export function currentSimulation(): Simulation | null {
  const value = new URLSearchParams(window.location.search).get('simulate');
  return ALL.includes(value as Simulation) ? (value as Simulation) : null;
}
