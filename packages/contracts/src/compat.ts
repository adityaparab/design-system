export interface Compatibility {
  compatible: boolean;
  reason?: string;
}

const parse = (version: string) => {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
};

/**
 * Can the shell (providing `hostVersion` of the contract) render a remote built
 * against `remoteVersion`?
 *
 * - Different major: breaking change, refuse.
 * - Remote minor newer than host: the remote expects props/events the host does
 *   not provide yet, refuse (deploy the shell first).
 * - Remote minor older or equal: the host provides a superset, render.
 */
export function checkContractCompatibility(remoteVersion: string, hostVersion: string): Compatibility {
  const remote = parse(remoteVersion);
  const host = parse(hostVersion);
  if (!remote || !host) return { compatible: false, reason: `Unparseable contract version "${remoteVersion}"` };
  if (remote.major !== host.major) {
    return { compatible: false, reason: `Remote targets contract v${remote.major}.x, shell provides v${host.major}.x` };
  }
  if (remote.minor > host.minor) {
    return {
      compatible: false,
      reason: `Remote needs contract ${remoteVersion}, shell provides ${hostVersion}; deploy the shell first`,
    };
  }
  return { compatible: true };
}
