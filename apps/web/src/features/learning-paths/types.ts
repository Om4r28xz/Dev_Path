export interface LearningProgress {
  completed: number;
  percentage: number | null;
  total: number;
}

export interface LearningStep {
  activity: string;
  completedAt: string | null;
  id: string;
  projectId: string | null;
  reason: string;
  resourceUrl: string | null;
  skillIds: string[];
  status: 'pending' | 'in_progress' | 'completed';
  title: string;
}

export interface LearningPath {
  analysisId: string;
  createdAt: string;
  id: string;
  message: string | null;
  progress: LearningProgress;
  projectsRevision: number;
  steps: LearningStep[];
  updatedAt: string;
  versions: { catalog: string; content: string; generator: string };
}

export interface LearningPathList {
  items: LearningPath[];
  nextCursor: string | null;
}

export interface UpdateLearningStepRequest {
  status: LearningStep['status'];
}

export function safeExternalResource(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}
