import type { DocViewerProps, ReviewListProps } from '@verity/contracts';
import { Panel, SplitLayout, StateMessage } from '@verity/design-system';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { prefetchRemote } from '../platform/remotes';
import { RemoteSlot } from '../platform/RemoteSlot';
import { usePlatformContext, useSession } from '../platform/session';

export function ReviewPage() {
  const { session } = useSession();
  const platform = usePlatformContext(session!);
  const { documentId = null } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();

  // The URL is the integration point between remotes: the list asks the shell
  // to open a document, the shell routes, the viewer reads the id from props.
  const openDocument = useCallback((id: string) => void navigate({ pathname: `/review/${id}`, search }), [navigate, search]);

  useEffect(() => prefetchRemote('docViewer'), []);

  const listProps = useMemo<ReviewListProps>(
    () => ({ platform, activeDocumentId: documentId, onOpenDocument: openDocument }),
    [platform, documentId, openDocument],
  );
  const viewerProps = useMemo<DocViewerProps | null>(() => (documentId ? { platform, documentId } : null), [platform, documentId]);

  return (
    <div className="shell-review">
      <h1 className="vds-visually-hidden">Document review</h1>
      <SplitLayout
        fixedPane="start"
        fixedWidth="clamp(480px, 46%, 720px)"
        collapseBelow="lg"
        start={<RemoteSlot id="reviewList" title="Document list" props={listProps} />}
        end={
          viewerProps ? (
            <RemoteSlot id="docViewer" title="Document viewer" props={viewerProps} resetKey={documentId ?? undefined} />
          ) : (
            <Panel title="Document viewer" fill>
              <StateMessage tone="empty" title="Select a document">
                <p>Click a row, or use ↑ ↓ and Enter in the list. Press ? for all shortcuts.</p>
              </StateMessage>
            </Panel>
          )
        }
      />
    </div>
  );
}
