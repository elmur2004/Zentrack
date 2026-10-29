'use client';

/**
 * In-memory form draft store. Survives client-side navigation (including a language switch)
 * but is never written to localStorage, cookies or the URL. Files cannot be carried over.
 */
type Draft = Record<string, unknown>;

const drafts = new Map<string, Draft>();
const filesSelected = new Set<string>();

export function saveDraft(formId: string, values: Draft) {
  drafts.set(formId, { ...values });
}

export function loadDraft<T extends Draft>(formId: string): T | undefined {
  return drafts.get(formId) as T | undefined;
}

export function clearDraft(formId: string) {
  drafts.delete(formId);
  filesSelected.delete(formId);
}

export function setFilesSelected(formId: string, selected: boolean) {
  if (selected) filesSelected.add(formId);
  else filesSelected.delete(formId);
}

export function hasSelectedFiles(): boolean {
  return filesSelected.size > 0;
}
