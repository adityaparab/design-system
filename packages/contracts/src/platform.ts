import type { ComponentType } from 'react';
import type { PlatformEvents } from './events';

/** Bump minor for additive changes (new optional prop, new event); major for anything else. */
export const CONTRACT_VERSION = '1.1.0';

export interface Session {
  userId: string;
  displayName: string;
  tenant: string;
  /** Opaque bearer token for the BFF. A stub here; real tokens come from the identity provider. */
  accessToken: string;
  roles: string[];
}

export interface Telemetry {
  error(error: unknown, context?: Record<string, unknown>): void;
  event(name: string, data?: Record<string, unknown>): void;
}

/** Everything the shell gives a remote. Remotes import nothing from the shell at runtime. */
export interface PlatformContext {
  session: Session;
  /** Base URL for the review API, e.g. "/api". */
  apiBaseUrl: string;
  navigate(to: string): void;
  events: PlatformEvents;
  telemetry: Telemetry;
}

export interface ReviewListProps {
  platform: PlatformContext;
  activeDocumentId: string | null;
  onOpenDocument(documentId: string): void;
}

export interface DocViewerProps {
  platform: PlatformContext;
  documentId: string;
}

export interface RemoteMeta {
  /** CONTRACT_VERSION the remote was built against. */
  contractVersion: string;
  /** @verity/design-system version the remote was built against. */
  designSystemVersion: string;
  /** Build identifier for incident triage. */
  buildId: string;
}

/** Shape of every exposed micro frontend module. */
export interface RemoteModule<P> {
  meta: RemoteMeta;
  Component: ComponentType<P>;
}
