// Generated OpenAPI 1.1.0 is the public source of truth; extended for JSR-03/04 jsearch source.
import type {
  Analysis as PublicAnalysis,
  CreateAnalysisRequest as PublicAnalysisCommand,
} from '../../../../../packages/contracts/src/public/generated.js';

export type AnalysisSource =
  | PublicAnalysis['source']
  | {
      type: 'jsearch';
      title: string | null;
      providerId: string;
    };

export type Analysis = Omit<PublicAnalysis, 'source'> & {
  source: AnalysisSource;
};

export type AnalysisCommand =
  | PublicAnalysisCommand
  | {
      source: {
        type: 'jsearch';
        providerId: string;
      };
    };
