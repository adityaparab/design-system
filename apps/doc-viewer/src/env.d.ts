/// <reference types="vite/client" />

declare const __DS_VERSION__: string;
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  /** "browser" on static deploys: the review API runs in the tab instead of behind /api. */
  readonly VITE_API_MODE?: 'browser';
}
