/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "browser" on static deploys: the review API runs in the tab instead of behind /api. */
  readonly VITE_API_MODE?: 'browser';
}
