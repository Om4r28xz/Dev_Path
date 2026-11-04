export interface Project {
  id: string;
  title: string;
  description: string;
  url: string | null;
  skillIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPage {
  items: Project[];
  nextCursor: string | null;
}

export interface ProjectDraft {
  title: string;
  description: string;
  url: string;
  skillIds: string[];
}

export const emptyProjectDraft = (): ProjectDraft => ({
  title: '',
  description: '',
  url: '',
  skillIds: [],
});

export const projectDraft = (project: Project): ProjectDraft => ({
  title: project.title,
  description: project.description,
  url: project.url ?? '',
  skillIds: [...project.skillIds],
});

export function validateProjectDraft(draft: ProjectDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.title.trim()) errors.title = 'Escribe un título.';
  if (!draft.description.trim()) errors.description = 'Describe tu participación en el proyecto.';
  if (draft.url.trim()) {
    try {
      const value = draft.url.trim();
      const hasUnsafeCharacter = [...value].some((character) => {
        const codePoint = character.codePointAt(0);
        return codePoint !== undefined && (codePoint <= 0x20 || codePoint === 0x7f);
      });
      const url = new URL(value);
      if (hasUnsafeCharacter || !['http:', 'https:'].includes(url.protocol))
        errors.url = 'Usa un enlace http o https sin espacios.';
    } catch {
      errors.url = 'Escribe un enlace completo, por ejemplo https://example.org.';
    }
  }
  if (new Set(draft.skillIds).size !== draft.skillIds.length)
    errors.skillIds = 'No repitas tecnologías.';
  if (draft.skillIds.length > 100) errors.skillIds = 'Selecciona como máximo 100 tecnologías.';
  return errors;
}

export function projectCommand(draft: ProjectDraft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    url: draft.url.trim() || null,
    skillIds: draft.skillIds,
  };
}
