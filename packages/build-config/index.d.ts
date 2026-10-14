export declare const PORTS: { shell: number; reviewList: number; docViewer: number; api: number };

export interface SharedConfig {
  singleton?: boolean;
  requiredVersion?: string;
  strictVersion?: boolean;
}

export declare function sharedDependencies(
  names: readonly string[],
  overrides?: Record<string, SharedConfig>,
): Record<string, SharedConfig>;

export declare function apiProxy(): Record<string, { target: string; changeOrigin: boolean }>;

export declare function buildDefines(): { __DS_VERSION__: string; __BUILD_ID__: string };
