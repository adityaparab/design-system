/** Review API (backend-for-frontend) types shared by the mock server and the remotes. */

export type CodingDecision = 'responsive' | 'not-responsive' | 'needs-review';
export type ReviewStatus = 'uncoded' | CodingDecision;
export type DocumentKind = 'email' | 'attachment' | 'spreadsheet' | 'chat';
export type DocumentSortField = 'controlNumber' | 'sentAt' | 'relevance';

export interface DocumentSummary {
  id: string;
  controlNumber: string;
  kind: DocumentKind;
  subject: string;
  custodian: string;
  /** ISO 8601. */
  sentAt: string;
  /** Model-predicted relevance, 0..1. */
  relevance: number;
  status: ReviewStatus;
  privileged: boolean;
}

export interface Citation {
  id: string;
  /** Character offsets into DocumentDetail.body. */
  start: number;
  end: number;
  label: string;
}

export interface AiSuggestion {
  decision: CodingDecision;
  privilegeLikely: boolean;
  confidence: number;
  rationale: string;
  citations: Citation[];
  model: string;
}

export interface Coding {
  decision: CodingDecision | null;
  privileged: boolean;
  note: string;
  codedBy?: string;
  codedAt?: string;
}

export interface DocumentDetail extends DocumentSummary {
  from: string;
  to: string[];
  body: string;
  hitTerms: string[];
  aiSuggestion: AiSuggestion;
  coding: Coding;
}

export interface DocumentPage {
  total: number;
  offset: number;
  items: DocumentSummary[];
}

export type StatusCounts = Record<ReviewStatus | 'all', number>;

export interface DocumentQuery {
  offset: number;
  limit: number;
  sort: DocumentSortField;
  direction: 'asc' | 'desc';
  status: ReviewStatus | 'all';
  q: string;
}

export interface SaveCodingRequest {
  decision: CodingDecision;
  privileged: boolean;
  note: string;
}
