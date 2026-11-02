import type { AnalysisCommand } from './types.js';
export interface DraftErrors {
  title?: string;
  text?: string;
}
export function validateAnalysisDraft(title: string, text: string): DraftErrors {
  const errors: DraftErrors = {};
  if (title.length > 120) errors.title = 'El título admite hasta 120 caracteres.';
  if (!text.trim()) errors.text = 'Pega el texto de una vacante.';
  else if (text.length > 20000) errors.text = 'La vacante admite hasta 20 000 caracteres.';
  return errors;
}
export function analysisCommand(title: string, text: string): AnalysisCommand {
  if (Object.keys(validateAnalysisDraft(title, text)).length)
    throw new Error('Invalid analysis draft.');
  return { source: { type: 'text', ...(title.trim() ? { title: title.trim() } : {}), text } };
}
export class AnalysisAttempt {
  private current: { fingerprint: string; key: string } | null = null;
  constructor(private readonly newKey: () => string = () => crypto.randomUUID()) {}
  edited(): void {
    this.current = null;
  }
  prepare(title: string, text: string): { command: AnalysisCommand; key: string } {
    const command = analysisCommand(title, text);
    const fingerprint = JSON.stringify(command);
    if (!this.current || this.current.fingerprint !== fingerprint)
      this.current = { fingerprint, key: this.newKey() };
    return { command, key: this.current.key };
  }
}
