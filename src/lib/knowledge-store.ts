import { useSyncExternalStore } from "react";

export type ReviewStatus = "审核中" | "已通过" | "已驳回";
export type SourceType = "session" | "ticket";

export type KnowledgeEntry = {
  id: string; // entry id (knowledge id)
  sourceIds: string[]; // session/ticket ids
  sourceType: SourceType;
  category: string;
  categoryName: string;
  title: string;
  summary: string;
  content: string;
  tags: string;
  status: ReviewStatus;
  submittedAt: string;
  reviewedAt?: string;
};

let entries: KnowledgeEntry[] = [];
let seq = 90000;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => entries;

export function useKnowledgeStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addKnowledgeEntry(
  e: Omit<KnowledgeEntry, "id" | "status" | "submittedAt">,
) {
  const entry: KnowledgeEntry = {
    ...e,
    id: `K${++seq}`,
    status: "审核中",
    submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
  entries = [entry, ...entries];
  emit();
  return entry;
}

export function setEntryStatus(id: string, status: ReviewStatus) {
  entries = entries.map((e) =>
    e.id === id
      ? { ...e, status, reviewedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }
      : e,
  );
  emit();
}

/** Latest review status for a given source (session/ticket) id. */
export function statusForSource(
  sourceId: string,
  entries: KnowledgeEntry[],
): ReviewStatus | null {
  const order: ReviewStatus[] = ["已通过", "审核中", "已驳回"];
  const matched = entries.filter((e) => e.sourceIds.includes(sourceId));
  if (matched.length === 0) return null;
  for (const s of order) if (matched.some((m) => m.status === s)) return s;
  return null;
}