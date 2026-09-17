"use client";

import { useCallback, useEffect, useState } from "react";
import type { Owner, Task, WorkloadEntry } from "@/lib/dashboard-types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `요청에 실패했습니다 (${res.status})`);
  }
  return res.json();
}

export function useDashboardData() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [workload, setWorkload] = useState<WorkloadEntry[] | null>(null);
  const [users, setUsers] = useState<Owner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, w, u] = await Promise.all([
        fetchJson<Task[]>("/api/tasks"),
        fetchJson<WorkloadEntry[]>("/api/workload"),
        fetchJson<Owner[]>("/api/users"),
      ]);
      setTasks(t);
      setWorkload(w);
      setUsers(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount — state updates happen inside reload()'s
    // async continuation (after await), not synchronously in this effect
    // body, but the lint rule can't see through that indirection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { tasks, workload, users, error, loading, reload };
}
