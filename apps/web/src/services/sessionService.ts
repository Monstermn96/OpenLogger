import { apiFetch, apiBlobFetch } from './api';

export interface SessionSummary {
  id: number;
  vehicle_id: number | null;
  start_time: string;
  end_time: string | null;
  parameters: string[] | null;
  notes: string | null;
  log_count: number;
}

export interface DataLogEntry {
  timestamp: string;
  data: Record<string, number>;
}

export interface SessionDetail extends Omit<SessionSummary, 'log_count'> {
  logs: DataLogEntry[];
}

export interface SessionCreateInput {
  vehicle_id?: number | null;
  start_time: string;
  end_time?: string | null;
  parameters?: string[] | null;
  notes?: string | null;
}

export function listSessions(): Promise<SessionSummary[]> {
  return apiFetch<SessionSummary[]>('/sessions');
}

export function createSession(input: SessionCreateInput): Promise<SessionSummary> {
  return apiFetch<SessionSummary>('/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getSession(id: number): Promise<SessionDetail> {
  return apiFetch<SessionDetail>(`/sessions/${id}`);
}

export function updateSession(id: number, input: SessionCreateInput): Promise<SessionSummary> {
  return apiFetch<SessionSummary>(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteSession(id: number): Promise<void> {
  return apiFetch<void>(`/sessions/${id}`, { method: 'DELETE' });
}

export function bulkCreateLogs(
  sessionId: number,
  logs: DataLogEntry[],
): Promise<{ created: number }> {
  return apiFetch<{ created: number }>(`/sessions/${sessionId}/logs`, {
    method: 'POST',
    body: JSON.stringify({ logs }),
  });
}

export async function exportSessionCsv(sessionId: number): Promise<void> {
  const res = await apiBlobFetch(`/sessions/${sessionId}/export`);
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session_${sessionId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
