import { CONTRACT_VERSION, type RemoteModule, type ReviewListProps } from '@verity/contracts';
import { ReviewList } from '../ReviewList';

const remote: RemoteModule<ReviewListProps> = {
  meta: { contractVersion: CONTRACT_VERSION, designSystemVersion: __DS_VERSION__, buildId: __BUILD_ID__ },
  Component: ReviewList,
};

export default remote;
