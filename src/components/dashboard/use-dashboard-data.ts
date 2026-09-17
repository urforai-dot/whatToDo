"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  // Ignore a response if a newer reload() started after it, or if we've
  // unmounted — otherwise two overlapping reloads (e.g. add-task fires one
  // while a background refresh is still in flight) can let the slower one
  // land last and overwrite fresher state with stale data.
  const requestSeq = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const [t, w, u] = await Promise.all([
        fetchJson<Task[]>("/api/tasks"),
        fetchJson<WorkloadEntry[]>("/api/workload"),
        fetchJson<Owner[]>("/api/users"),
      ]);
      if (!mounted.current || seq !== requestSeq.current) return;
      setTasks(t);
      setWorkload(w);
      setUsers(u);
    } catch (err) {
      if (!mounted.current || seq !== requestSeq.current) return;
      // Keep whatever data is already loaded — a transient error shouldn't
      // blank out a working view the user might be in the middle of.
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
    } finally {
      if (mounted.current && seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { tasks, workload, users, error, loading, reload };
}
