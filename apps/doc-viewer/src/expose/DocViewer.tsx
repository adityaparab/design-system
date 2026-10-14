import { CONTRACT_VERSION, type DocViewerProps, type RemoteModule } from '@verity/contracts';
import { DocViewer } from '../DocViewer';

const remote: RemoteModule<DocViewerProps> = {
  meta: { contractVersion: CONTRACT_VERSION, designSystemVersion: __DS_VERSION__, buildId: __BUILD_ID__ },
  Component: DocViewer,
};

export default remote;
